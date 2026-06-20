export type UserRole = 'ADMIN';

export type TournamentType =
  | 'ROUND_ROBIN'
  | 'KNOCKOUT'
  | 'GROUP_STAGE_PLUS_KNOCKOUT'
  | 'LEAGUE'
  | 'HYBRID';

export type TournamentStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type MatchStatus =
  | 'SCHEDULED'
  | 'LIVE'
  | 'HALFTIME'
  | 'COMPLETED'
  | 'DELAYED'
  | 'POSTPONED'
  | 'CANCELLED';

export type MatchEventType =
  | 'GOAL'
  | 'OWN_GOAL'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'SUBSTITUTION'
  | 'PENALTY'
  | 'ASSIST';

export type Gender = 'MALE' | 'FEMALE' | 'MIXED';

export type BracketStage = 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL' | 'THIRD_PLACE';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  profile_image?: string;
  created_at: string;
  updated_at?: string;
}

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: string;
  status: TournamentStatus;
  tournament_type: TournamentType;
  logo?: string;
  rules?: string;
  created_by: string;
  divisions?: Division[];
}

export interface Division {
  id: string;
  tournament_id: string;
  tournament?: Tournament;
  name: string;
  slug: string;
  age_group?: string;
  gender: Gender;
  max_teams: number;
  format: string;
  points_win: number;
  points_draw: number;
  points_loss: number;
  primary_color?: string;
  accent_color?: string;
  bracket_locked?: boolean;
  teams?: Team[];
}

export interface Team {
  id: string;
  division_id: string;
  division?: Division;
  name: string;
  slug: string;
  logo?: string;
  city?: string;
  founded_year?: number;
  primary_color?: string;
  secondary_color?: string;
  players?: Player[];
}

export interface Player {
  id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  slug: string;
  dob?: string;
  nationality?: string;
  jersey_number?: number;
  preferred_position?: string;
  profile_image?: string;
  active?: boolean;
  team?: Team;
}

export interface MatchOfficial {
  id: string;
  match_id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  parking_info?: string;
  photos?: string[];
  fields?: Field[];
  matches?: Match[];
}

export interface Field {
  id: string;
  venue_id: string;
  name: string;
  surface?: string;
  capacity?: number;
}

export interface Match {
  id: string;
  tournament_id: string;
  division_id: string;
  home_team_id: string;
  away_team_id: string;
  venue_id?: string;
  stage_id?: string;
  scheduled_start: string;
  scheduled_end?: string;
  status: MatchStatus;
  round?: number;
  match_type?: string;
  home_score: number;
  away_score: number;
  stream_url?: string;
  home_team?: Team;
  away_team?: Team;
  venue?: Venue;
  officials?: MatchOfficial[];
  events?: MatchEvent[];
  tournament?: Tournament;
  division?: Division;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  player_id?: string;
  team_id: string;
  type: MatchEventType;
  minute: number;
  extra_time?: number;
  player?: Player;
  team?: Team;
}

export interface Standing {
  id: string;
  division_id: string;
  team_id: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  fair_play?: number;
  rank: number;
  team?: Team;
  form?: ('W' | 'D' | 'L')[];
}

export interface BracketNode {
  id: string;
  division_id: string;
  stage: BracketStage;
  position: number;
  home_team_id?: string;
  away_team_id?: string;
  winner_id?: string;
  match_id?: string;
  home_team?: Team;
  away_team?: Team;
  winner?: Team;
  match?: Match;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  tournament_id?: string | null;
  created_at: string;
  tournament?: Pick<Tournament, 'id' | 'name' | 'slug'>;
}

export interface SiteSettings {
  id: string;
  site_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_address?: string;
}

export type PublicSiteSettings = Pick<
  SiteSettings,
  'site_name' | 'contact_email' | 'contact_phone' | 'contact_address'
>;

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  user?: Pick<User, 'id' | 'first_name' | 'last_name' | 'email'>;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface ApiError {
  statusCode: number;
  message: string;
}

export interface TournamentOverview {
  tournament: Tournament;
  live_matches: Match[];
  recent_matches: Match[];
  upcoming_matches: Match[];
  standings_preview: Standing[];
}

