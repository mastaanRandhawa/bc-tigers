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
  primary_color: z.string().optional(),
  accent_color: z.string().optional(),
  points_win: z.string().optional(),
  points_draw: z.string().optional(),
  points_loss: z.string().optional(),
});

export const teamSchema = z.object({
  division_id: z.string().min(1, 'Division is required'),
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required'),
  city: z.string().optional(),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  logo: z.string().optional(),
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
export type TeamFormValues = z.infer<typeof teamSchema>;
export type PlayerFormValues = z.infer<typeof playerSchema>;
export type MatchFormValues = z.infer<typeof matchSchema>;
export type MatchScoreFormValues = z.infer<typeof matchScoreSchema>;
export type VenueFormValues = z.infer<typeof venueSchema>;
export type UserRoleFormValues = z.infer<typeof userRoleSchema>;
export type UserCreateFormValues = z.infer<typeof userCreateSchema>;
