import { useEffect } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormDialog from "@/components/admin/FormDialog";
import {
  TextInputField,
  SelectField,
  FormError,
} from "@/components/admin/form-fields";
import {
  matchScoreSchema,
  type MatchScoreFormValues,
} from "@/lib/schemas/admin";
import { useUpdateMatchScore, useUpdateMatch } from "@/hooks/useMatches";
import { getApiErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type { Match } from "@/types";

const STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "LIVE", label: "Live" },
  { value: "COMPLETED", label: "Completed" },
  { value: "POSTPONED", label: "Postponed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const TIE_OPTIONS = [
  {
    value: "DRAW" as const,
    label: "Record as a Draw",
    description: "Both teams share the points. No penalty shootout.",
  },
  {
    value: "PENALTIES" as const,
    label: "Break Tie with Penalty Shootout",
    description: "Regulation score stays level; enter shootout kicks to decide the winner.",
  },
];

interface MatchScoreFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: Match | null;
}

function parseOptionalPenalty(value: string | undefined): number | null {
  if (value == null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function inferTieResolution(match: Match): "DRAW" | "PENALTIES" | undefined {
  if (match.tie_resolution) return match.tie_resolution;
  if (
    match.home_score === match.away_score &&
    match.home_penalties != null &&
    match.away_penalties != null
  ) {
    return "PENALTIES";
  }
  return undefined;
}

export default function MatchScoreFormDialog({
  open,
  onOpenChange,
  match,
}: MatchScoreFormDialogProps) {
  const scoreMutation = useUpdateMatchScore();
  const updateMutation = useUpdateMatch();

  const form = useForm<MatchScoreFormValues>({
    resolver: zodResolver(matchScoreSchema),
    defaultValues: {
      home_score: "0",
      away_score: "0",
      home_penalties: "",
      away_penalties: "",
      tie_resolution: undefined,
      status: "LIVE",
    },
  });

  const watchedHome = useWatch({ control: form.control, name: "home_score" });
  const watchedAway = useWatch({ control: form.control, name: "away_score" });
  const watchedStatus = useWatch({ control: form.control, name: "status" });
  const watchedTieResolution = useWatch({
    control: form.control,
    name: "tie_resolution",
  });

  const regulationTied =
    watchedHome !== undefined &&
    watchedAway !== undefined &&
    Number(watchedHome) === Number(watchedAway);
  const showPenalties = regulationTied && watchedTieResolution === "PENALTIES";

  useEffect(() => {
    if (!open || !match) return;
    form.reset({
      home_score: String(match.home_score),
      away_score: String(match.away_score),
      home_penalties:
        match.home_penalties != null ? String(match.home_penalties) : "",
      away_penalties:
        match.away_penalties != null ? String(match.away_penalties) : "",
      tie_resolution: inferTieResolution(match),
      status: match.status,
    });
  }, [open, match, form]);

  useEffect(() => {
    if (!regulationTied && watchedTieResolution) {
      form.setValue("tie_resolution", undefined);
      form.setValue("home_penalties", "");
      form.setValue("away_penalties", "");
    }
  }, [regulationTied, watchedTieResolution, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!match) return;

    const home = Number(values.home_score);
    const away = Number(values.away_score);
    const tied = home === away;
    const tieResolution = tied ? values.tie_resolution : null;
    const homePenalties = parseOptionalPenalty(values.home_penalties);
    const awayPenalties = parseOptionalPenalty(values.away_penalties);

    if (tied && values.status === "COMPLETED" && !tieResolution) {
      form.setError("tie_resolution", {
        message: "Choose how to handle the tied score before completing the match.",
      });
      return;
    }

    if (
      tied &&
      tieResolution === "PENALTIES" &&
      values.status === "COMPLETED" &&
      (homePenalties == null ||
        awayPenalties == null ||
        homePenalties === awayPenalties)
    ) {
      form.setError("home_penalties", {
        message: "Enter unequal penalty shootout totals before completing.",
      });
      return;
    }

    try {
      await scoreMutation.mutateAsync({
        id: match.id,
        home,
        away,
        tie_resolution: tied ? (tieResolution ?? null) : null,
        home_penalties:
          tied && tieResolution === "PENALTIES" ? homePenalties : null,
        away_penalties:
          tied && tieResolution === "PENALTIES" ? awayPenalties : null,
      });
      if (values.status && values.status !== match.status) {
        await updateMutation.mutateAsync({
          id: match.id,
          data: { status: values.status },
        });
      }
      onOpenChange(false);
    } catch (err) {
      form.setError("root", { message: getApiErrorMessage(err) });
    }
  });

  if (!match) return null;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Update Live Score"
      description={`${match.home_team?.name ?? "Home"} vs ${match.away_team?.name ?? "Away"}`}
      onSubmit={onSubmit}
      isSubmitting={scoreMutation.isPending || updateMutation.isPending}
      submitLabel="Update Score"
    >
      <FormError message={form.formState.errors.root?.message} />
      <div className="grid grid-cols-2 gap-3">
        <TextInputField
          control={form.control}
          name="home_score"
          label={match.home_team?.name ?? "Home"}
          type="number"
        />
        <TextInputField
          control={form.control}
          name="away_score"
          label={match.away_team?.name ?? "Away"}
          type="number"
        />
      </div>

      {regulationTied && (
        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-3">
          <div>
            <p className="text-sm font-medium text-foreground">Tied score</p>
            <p className="text-xs text-muted-foreground">
              Regulation ended level. Choose how this result should be recorded.
            </p>
          </div>
          <Controller
            control={form.control}
            name="tie_resolution"
            render={({ field }) => (
              <fieldset className="space-y-2">
                <legend className="sr-only">Tied score resolution</legend>
                {TIE_OPTIONS.map((option) => {
                  const selected = field.value === option.value;
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-md border p-3 transition-colors",
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border/60 hover:bg-muted/50",
                      )}
                    >
                      <input
                        type="radio"
                        name="tie_resolution"
                        value={option.value}
                        checked={selected}
                        onChange={() => {
                          field.onChange(option.value);
                          if (option.value === "DRAW") {
                            form.setValue("home_penalties", "");
                            form.setValue("away_penalties", "");
                            form.clearErrors("home_penalties");
                          }
                        }}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block text-sm font-medium text-foreground">
                          {option.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            )}
          />
          {form.formState.errors.tie_resolution?.message && (
            <p className="text-xs text-destructive">
              {form.formState.errors.tie_resolution.message}
            </p>
          )}
        </div>
      )}

      {showPenalties && (
        <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
          <p className="text-sm font-medium text-foreground">Penalty shootout</p>
          <div className="grid grid-cols-2 gap-3">
            <TextInputField
              control={form.control}
              name="home_penalties"
              label={`${match.home_team?.name ?? "Home"} (pens)`}
              type="number"
            />
            <TextInputField
              control={form.control}
              name="away_penalties"
              label={`${match.away_team?.name ?? "Away"} (pens)`}
              type="number"
            />
          </div>
          {form.formState.errors.home_penalties?.message && (
            <p className="text-xs text-destructive">
              {form.formState.errors.home_penalties.message}
            </p>
          )}
        </div>
      )}

      {regulationTied && watchedStatus === "COMPLETED" && !watchedTieResolution && (
        <p className="text-xs text-muted-foreground">
          Select draw or penalty shootout before marking this match completed.
        </p>
      )}

      <SelectField
        control={form.control}
        name="status"
        label="Match Status"
        options={STATUS_OPTIONS}
      />
    </FormDialog>
  );
}
