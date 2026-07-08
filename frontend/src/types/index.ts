export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'COACH';

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

export type CoachTeamRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CoachTeamRequest {
  id: string;
  status: CoachTeamRequestStatus;
  created_at: string;
  team: {
    id: string;
    name: string;
    division?: { id: string; name: string };
  };
}

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
  coaching_request?: string | null;
  team_id?: string | null;
  team_ids?: string[];
  coached_teams?: { id: string; name: string; slug?: string; division?: { id: string; name: string } }[];
  team_requests?: CoachTeamRequest[];
  pending_team_requests?: CoachTeamRequest[];
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
  completed_at?: string | null;
  admin_editing_enabled?: boolean;
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

export type TiebreakerRule =
  | 'HEAD_TO_HEAD'
  | 'GOALS_AGAINST'
  | 'GOALS_FOR'
  | 'GOAL_DIFFERENCE'
  | 'WINS'
  | 'PENALTY_KICKS'
  | 'COIN_TOSS';

export interface PointFormat {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  is_system: boolean;
  win: number;
  draw: number;
  loss: number;
  bonuses_enabled: boolean;
  shutout_bonus: number;
  goal_bonus_per_goal: number;
  goal_bonus_cap: number;
  apply_bonuses_on_loss: boolean;
  forfeit_win_score: number;
  forfeit_loss_score: number;
  forfeit_award_bonuses: boolean;
  tiebreakers: TiebreakerRule[];
  _count?: { divisions: number };
  created_at?: string;
  updated_at?: string;
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
  point_format_id: string;
  point_format?: PointFormat;
  primary_color?: string;
  accent_color?: string;
  bracket_locked?: boolean;
  bracket_finalized?: boolean;
  schedule_only?: boolean;
  /** When true, this division is organized into groups (pools). */
  groups_enabled?: boolean;
  /** When true, standings highlight advancing and eliminated teams. */
  qualification_zones_enabled?: boolean;
  /** Top N teams advance (per pool when groups_enabled). */
  qualification_advance?: number;
  /** Bottom N teams are eliminated (per pool when groups_enabled). */
  qualification_eliminate?: number;
  /** Order this division appears in on the public site (ascending). */
  display_order?: number;
  teams?: Team[];
  groups?: Group[];
}

/** A group (pool) within a division, e.g. "Pool A". */
export interface Group {
  id: string;
  division_id: string;
  name: string;
  slug: string;
  order: number;
  teams?: Pick<Team, 'id' | 'name' | 'slug' | 'logo'>[];
  _count?: { teams: number; matches: number };
}

/** A team's registration in a specific division (pool slug, group, etc.). */
export interface TeamDivisionMembership {
  id?: string;
  team_id: string;
  division_id: string;
  group_id?: string | null;
  slug: string;
  division?: Pick<Division, 'id' | 'name' | 'slug' | 'tournament_id'>;
  group?: Pick<Group, 'id' | 'name' | 'slug' | 'order'> | null;
}

export interface Team {
  id: string;
  /** Primary / context division when listed in a division scope. */
  division_id: string;
  /** All divisions this team is registered in. */
  division_ids?: string[];
  divisions?: TeamDivisionMembership[];
  division?: Division;
  group_id?: string | null;
  group?: Pick<Group, 'id' | 'name' | 'slug' | 'order'> | null;
  name: string;
  slug: string;
  logo?: string | null;
  city?: string | null;
  founded_year?: number;
  primary_color?: string | null;
  secondary_color?: string | null;
  coach_user_id?: string | null;
  management_locked?: boolean;
  contact_email?: string | null;
  contact_phone?: string | null;
  coach?: Pick<User, 'id' | 'first_name' | 'last_name' | 'email'> | null;
  coach_management_locked?: boolean;
  can_edit?: boolean;
  max_players_per_team?: number;
  roster_count?: number;
  players?: Player[];
  officials?: TeamOfficial[];
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

export interface TeamOfficial {
  id: string;
  team_id: string;
  name: string;
  role: string;
  order?: number;
}

/** Which result of a source match feeds a placeholder slot. */
export type MatchSlotOutcome = 'WINNER' | 'LOSER';

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
  group_id?: string | null;
  group?: Pick<Group, 'id' | 'name' | 'slug' | 'order'> | null;
  home_team_id?: string | null;
  away_team_id?: string | null;
  /** Placeholder text shown when the team isn't known yet (e.g. "Winner of Match 11"). */
  home_label?: string | null;
  away_label?: string | null;
  /** Placeholder sources: a slot can point to the WINNER/LOSER of another match. */
  home_source_match_id?: string | null;
  home_source_outcome?: MatchSlotOutcome | null;
  away_source_match_id?: string | null;
  away_source_outcome?: MatchSlotOutcome | null;
  venue_id?: string | null;
  field_id?: string | null;
  stage_id?: string;
  scheduled_start: string;
  scheduled_end?: string;
  status: MatchStatus;
  round?: number;
  match_type?: string;
  home_score: number;
  away_score: number;
  home_penalties?: number | null;
  away_penalties?: number | null;
  tie_resolution?: 'DRAW' | 'PENALTIES' | null;
  stream_url?: string;
  home_team?: Team | null;
  away_team?: Team | null;
  venue?: Venue;
  field?: Pick<Field, 'id' | 'name'> | null;
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
  group_id?: string | null;
  group?: Pick<Group, 'id' | 'name' | 'slug' | 'order'> | null;
  team_id: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
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
  coach_lock_scheduled_at?: string | null;
  coach_lock_manual?: boolean;
  coach_lock_scheduled_pending?: boolean;
  coach_lock_scheduled_active?: boolean;
  coach_lock_effective?: boolean;
  rosters_public?: boolean;
  rosters_public_scheduled_at?: string | null;
  rosters_public_manual?: boolean;
  rosters_public_scheduled_pending?: boolean;
  rosters_public_scheduled_active?: boolean;
  rosters_public_effective?: boolean;
  max_players_per_team?: number;
}

export type PublicSiteSettings = Pick<
  SiteSettings,
  'site_name' | 'contact_email' | 'contact_phone' | 'contact_address'
> & {
  rosters_public?: boolean;
  rosters_available_at?: string | null;
};

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

