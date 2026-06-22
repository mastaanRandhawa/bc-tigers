import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, TextareaField, FormError } from '@/components/admin/form-fields';
import { pointFormatSchema, type PointFormatFormValues } from '@/lib/schemas/admin';
import { useCreatePointFormat, useUpdatePointFormat } from '@/hooks/usePointFormats';
import { slugify } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import type { PointFormat } from '@/types';
import { Label } from '@/components/ui/label';

const DEFAULT_TIEBREAKERS: PointFormatFormValues['tiebreakers'] = [
  'GOAL_DIFFERENCE',
  'GOALS_FOR',
  'HEAD_TO_HEAD',
  'FAIR_PLAY',
  'COIN_TOSS',
];

function maxPointsPerMatch(values: PointFormatFormValues) {
  const win = Number(values.win) || 0;
  if (!values.bonuses_enabled) return win;
  const shutout = Number(values.shutout_bonus) || 0;
  const goalCap = Number(values.goal_bonus_cap) || 0;
  return win + shutout + goalCap;
}

interface PointFormatFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  format?: PointFormat | null;
}

export default function PointFormatFormDialog({
  open,
  onOpenChange,
  format,
}: PointFormatFormDialogProps) {
  const createMutation = useCreatePointFormat();
  const updateMutation = useUpdatePointFormat();
  const isEditing = !!format;

  const form = useForm<PointFormatFormValues>({
    resolver: zodResolver(pointFormatSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      win: '3',
      draw: '1',
      loss: '0',
      bonuses_enabled: false,
      shutout_bonus: '0',
      goal_bonus_per_goal: '0',
      goal_bonus_cap: '0',
      apply_bonuses_on_loss: false,
      forfeit_win_score: '2',
      forfeit_loss_score: '0',
      forfeit_award_bonuses: false,
      tiebreakers: DEFAULT_TIEBREAKERS,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (format) {
      form.reset({
        name: format.name,
        slug: format.slug,
        description: format.description ?? '',
        win: String(format.win),
        draw: String(format.draw),
        loss: String(format.loss),
        bonuses_enabled: format.bonuses_enabled,
        shutout_bonus: String(format.shutout_bonus),
        goal_bonus_per_goal: String(format.goal_bonus_per_goal),
        goal_bonus_cap: String(format.goal_bonus_cap),
        apply_bonuses_on_loss: format.apply_bonuses_on_loss,
        forfeit_win_score: String(format.forfeit_win_score),
        forfeit_loss_score: String(format.forfeit_loss_score),
        forfeit_award_bonuses: format.forfeit_award_bonuses,
        tiebreakers: format.tiebreakers?.length ? format.tiebreakers : DEFAULT_TIEBREAKERS,
      });
    } else {
      form.reset({
        name: '',
        slug: '',
        description: '',
        win: '3',
        draw: '1',
        loss: '0',
        bonuses_enabled: false,
        shutout_bonus: '0',
        goal_bonus_per_goal: '0',
        goal_bonus_cap: '0',
        apply_bonuses_on_loss: false,
        forfeit_win_score: '2',
        forfeit_loss_score: '0',
        forfeit_award_bonuses: false,
        tiebreakers: DEFAULT_TIEBREAKERS,
      });
    }
  }, [open, format, form]);

  const name = form.watch('name');
  useEffect(() => {
    if (!isEditing && name) form.setValue('slug', slugify(name));
  }, [name, isEditing, form]);

  const watched = form.watch();
  const summary = useMemo(() => {
    const max = maxPointsPerMatch(watched);
    const base = `${watched.win}/${watched.draw}/${watched.loss} base`;
    const bonus = watched.bonuses_enabled
      ? ` · bonuses on${watched.apply_bonuses_on_loss ? ' (incl. losses)' : ''}`
      : '';
    return `Max per match: ${max} pts (${base}${bonus})`;
  }, [watched]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        win: Number(values.win),
        draw: Number(values.draw),
        loss: Number(values.loss),
        bonuses_enabled: values.bonuses_enabled,
        shutout_bonus: Number(values.shutout_bonus || 0),
        goal_bonus_per_goal: Number(values.goal_bonus_per_goal || 0),
        goal_bonus_cap: Number(values.goal_bonus_cap || 0),
        apply_bonuses_on_loss: values.apply_bonuses_on_loss,
        forfeit_win_score: Number(values.forfeit_win_score),
        forfeit_loss_score: Number(values.forfeit_loss_score),
        forfeit_award_bonuses: values.forfeit_award_bonuses,
        tiebreakers: values.tiebreakers,
      };
      if (isEditing && format) {
        await updateMutation.mutateAsync({ id: format.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) });
    }
  });

  const bonusesEnabled = form.watch('bonuses_enabled');

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Point Format' : 'Create Point Format'}
      onSubmit={onSubmit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
    >
      <FormError message={form.formState.errors.root?.message} />
      <TextInputField control={form.control} name="name" label="Name" />
      <TextInputField control={form.control} name="slug" label="Slug" />
      <TextareaField control={form.control} name="description" label="Description" />

      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">
        Base points
      </p>
      <div className="grid grid-cols-3 gap-3">
        <TextInputField control={form.control} name="win" label="Win" type="number" />
        <TextInputField control={form.control} name="draw" label="Draw" type="number" />
        <TextInputField control={form.control} name="loss" label="Loss" type="number" />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Controller
          control={form.control}
          name="bonuses_enabled"
          render={({ field }) => (
            <input
              id="bonuses_enabled"
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Label htmlFor="bonuses_enabled">Enable bonus points</Label>
      </div>

      {bonusesEnabled && (
        <div className="grid grid-cols-2 gap-3 pl-1">
          <TextInputField control={form.control} name="shutout_bonus" label="Shutout bonus" type="number" />
          <TextInputField control={form.control} name="goal_bonus_per_goal" label="Per goal" type="number" />
          <TextInputField control={form.control} name="goal_bonus_cap" label="Goal bonus cap" type="number" />
          <div className="flex items-center gap-2 self-end pb-2">
            <Controller
              control={form.control}
              name="apply_bonuses_on_loss"
              render={({ field }) => (
                <input
                  id="apply_bonuses_on_loss"
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
            <Label htmlFor="apply_bonuses_on_loss">Bonuses on losses</Label>
          </div>
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">
        Forfeit
      </p>
      <div className="grid grid-cols-2 gap-3">
        <TextInputField control={form.control} name="forfeit_win_score" label="Winner score" type="number" />
        <TextInputField control={form.control} name="forfeit_loss_score" label="Loser score" type="number" />
      </div>
      <div className="flex items-center gap-2">
        <Controller
          control={form.control}
          name="forfeit_award_bonuses"
          render={({ field }) => (
            <input
              id="forfeit_award_bonuses"
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Label htmlFor="forfeit_award_bonuses">Award bonuses on forfeit</Label>
      </div>

      <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">{summary}</p>
    </FormDialog>
  );
}
