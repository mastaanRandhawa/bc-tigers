export type UserRole = 'ADMIN' | 'COACH';

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
  approved?: boolean;
  active?: boolean;
  team_id?: string | null;
  coached_team?: { id: string; name: string } | null;
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
  // Soft-delete / lifecycle (admin)
  is_deleted?: boolean;
  record_status?: RecordStatus;
  deleted_at?: string;
  deleted_by?: string;
}

export type RecordStatus = 'ACTIVE' | 'ARCHIVED' | 'DECOMMISSIONED';
export type RecordScope = 'active' | 'deleted' | 'all';

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
  bracket_finalized?: boolean;
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
  coach_user_id?: string | null;
  management_locked?: boolean;
  contact_email?: string;
  contact_phone?: string;
  coach?: Pick<User, 'id' | 'first_name' | 'last_name' | 'email'> | null;
  coach_management_locked?: boolean;
  can_edit?: boolean;
  players?: Player[];
  // Soft-delete / lifecycle (admin)
  is_deleted?: boolean;
  record_status?: RecordStatus;
  deleted_at?: string;
  deleted_by?: string;
}

export interface Player {
  id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  slug: string;
  dob?: string;
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

export type BracketNodeStatus =
  | 'PENDING'
  | 'READY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'AUTO_ADVANCED'
  | 'INVALID';

export interface BracketNode {
  id: string;
  division_id: string;
  stage: BracketStage;
  position: number;
  home_team_id?: string;
  away_team_id?: string;
  winner_id?: string;
  match_id?: string;
  status?: BracketNodeStatus;
  next_node_id?: string | null;
  next_slot?: 'home' | 'away' | null;
  loser_next_node_id?: string | null;
  loser_next_slot?: 'home' | 'away' | null;
  auto_advanced?: boolean;
  completed_at?: string | null;
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
  timezone?: string;
  coach_management_locked?: boolean;
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
  previous_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  source?: string;
  notes?: string;
  user?: Pick<User, 'id' | 'first_name' | 'last_name' | 'email'>;
}

/** Immutable per-record version (history entry). */
export interface RecordVersion {
  id: string;
  entity_type: string;
  entity_id: string;
  version: number;
  previous_version_id?: string | null;
  action: string;
  changed_fields: string[];
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  user_id?: string | null;
  created_at: string;
  user?: Pick<User, 'id' | 'first_name' | 'last_name' | 'email'> | null;
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

