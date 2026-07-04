import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import type { Match } from "@/types";

const STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "LIVE", label: "Live" },
  { value: "COMPLETED", label: "Completed" },
  { value: "POSTPONED", label: "Postponed" },
  { value: "CANCELLED", label: "Cancelled" },
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
      status: "LIVE",
    },
  });

  const watchedHome = useWatch({ control: form.control, name: "home_score" });
  const watchedAway = useWatch({ control: form.control, name: "away_score" });
  const watchedStatus = useWatch({ control: form.control, name: "status" });

  const regulationTied =
    watchedHome !== undefined &&
    watchedAway !== undefined &&
    Number(watchedHome) === Number(watchedAway);
  const showPenalties = !!match?.is_elimination && regulationTied;

  useEffect(() => {
    if (!open || !match) return;
    form.reset({
      home_score: String(match.home_score),
      away_score: String(match.away_score),
      home_penalties:
        match.home_penalties != null ? String(match.home_penalties) : "",
      away_penalties:
        match.away_penalties != null ? String(match.away_penalties) : "",
      status: match.status,
    });
  }, [open, match, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!match) return;

    const home = Number(values.home_score);
    const away = Number(values.away_score);
    const homePenalties = parseOptionalPenalty(values.home_penalties);
    const awayPenalties = parseOptionalPenalty(values.away_penalties);

    if (
      match.is_elimination &&
      home === away &&
      values.status === "COMPLETED" &&
      (homePenalties == null ||
        awayPenalties == null ||
        homePenalties === awayPenalties)
    ) {
      form.setError("home_penalties", {
        message:
          "Enter unequal penalty shootout totals before completing this knockout match.",
      });
      return;
    }

    try {
      await scoreMutation.mutateAsync({
        id: match.id,
        home,
        away,
        home_penalties: home === away ? homePenalties : null,
        away_penalties: home === away ? awayPenalties : null,
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
      {showPenalties && (
        <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
          <p className="text-sm font-medium text-foreground">
            Penalty shootout
          </p>
          <p className="text-xs text-muted-foreground">
            Regulation ended level. Enter successful kicks for each team before
            marking completed.
          </p>
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
      {match.is_elimination &&
        regulationTied &&
        watchedStatus !== "COMPLETED" && (
          <p className="text-xs text-muted-foreground">
            Penalty shootout results are required when completing a tied
            knockout match.
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
