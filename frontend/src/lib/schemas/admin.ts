import { z } from 'zod';

export const tournamentSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required'),
  description: z.string().optional(),
  location: z.string().min(2, 'Location is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  status: z.enum(['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  tournament_type: z.enum([
    'ROUND_ROBIN',
    'KNOCKOUT',
    'GROUP_STAGE_PLUS_KNOCKOUT',
    'LEAGUE',
    'HYBRID',
  ]),
});

export const divisionSchema = z.object({
  tournament_id: z.string().min(1, 'Tournament is required'),
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required'),
  age_group: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'MIXED']),
  max_teams: z.string().min(1),
  format: z.string().min(1),
  point_format_id: z.string().min(1, 'Point format is required'),
  primary_color: z.string().optional(),
  accent_color: z.string().optional(),
  schedule_only: z.boolean().optional(),
  groups_enabled: z.boolean().optional(),
  display_order: z.string().optional(),
});

const tiebreakerRuleSchema = z.enum([
  'HEAD_TO_HEAD',
  'GOALS_AGAINST',
  'GOALS_FOR',
  'GOAL_DIFFERENCE',
  'WINS',
  'PENALTY_KICKS',
  'COIN_TOSS',
]);

export const pointFormatSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required'),
  description: z.string().optional(),
  win: z.string().min(1),
  draw: z.string().min(1),
  loss: z.string().min(1),
  bonuses_enabled: z.boolean(),
  shutout_bonus: z.string().optional(),
  goal_bonus_per_goal: z.string().optional(),
  goal_bonus_cap: z.string().optional(),
  apply_bonuses_on_loss: z.boolean(),
  forfeit_win_score: z.string().min(1),
  forfeit_loss_score: z.string().min(1),
  forfeit_award_bonuses: z.boolean(),
  tiebreakers: z.array(tiebreakerRuleSchema).min(1),
});

export const teamSchema = z.object({
  division_id: z.string().min(1, 'Division is required'),
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required'),
  city: z.string().optional(),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  logo: z.string().optional(),
  coach_user_id: z.string().optional().nullable(),
  management_locked: z.boolean().optional(),
  contact_email: z.string().optional(),
  contact_phone: z.string().optional(),
});

export const playerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  jersey_number: z.string().optional(),
  preferred_position: z.string().optional(),
  profile_image: z.string().optional(),
});

export const matchSchema = z.object({
  tournament_id: z.string().min(1, 'Tournament is required'),
  division_id: z.string().min(1, 'Division is required'),
  home_team_id: z.string().min(1, 'Home team is required'),
  away_team_id: z.string().min(1, 'Away team is required'),
  venue_id: z.string().optional(),
  scheduled_start: z.string().min(1, 'Start time is required'),
  status: z.enum(['SCHEDULED', 'LIVE', 'HALFTIME', 'COMPLETED', 'DELAYED', 'POSTPONED', 'CANCELLED']),
  round: z.string().optional(),
});

export const matchScoreSchema = z.object({
  home_score: z.string().min(1),
  away_score: z.string().min(1),
  status: z.enum(['SCHEDULED', 'LIVE', 'HALFTIME', 'COMPLETED', 'DELAYED', 'POSTPONED', 'CANCELLED']).optional(),
});

export const venueSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required'),
  address: z.string().min(2, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  parking_info: z.string().optional(),
});

export const userRoleSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email(),
  phone: z.string().optional(),
});

export const userCreateSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
});

export type TournamentFormValues = z.infer<typeof tournamentSchema>;
export type DivisionFormValues = z.infer<typeof divisionSchema>;
export type PointFormatFormValues = z.infer<typeof pointFormatSchema>;
export type TeamFormValues = z.infer<typeof teamSchema>;
export type PlayerFormValues = z.infer<typeof playerSchema>;
export type MatchFormValues = z.infer<typeof matchSchema>;
export type MatchScoreFormValues = z.infer<typeof matchScoreSchema>;
export type VenueFormValues = z.infer<typeof venueSchema>;
export type UserRoleFormValues = z.infer<typeof userRoleSchema>;
export type UserCreateFormValues = z.infer<typeof userCreateSchema>;
