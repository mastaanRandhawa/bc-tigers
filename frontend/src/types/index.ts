// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'TOURNAMENT_ADMIN' | 'COACH' | 'REFEREE' | 'PLAYER' | 'VIEWER';

export type TournamentType =
  | 'ROUND_ROBIN'
  | 'KNOCKOUT'
  | 'GROUP_STAGE_PLUS_KNOCKOUT'
  | 'LEAGUE'
  | 'HYBRID';

export type TournamentStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'POSTPONED' | 'CANCELLED';

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

export type MediaType = 'PHOTO' | 'VIDEO' | 'DOCUMENT';

// ─── Entities ────────────────────────────────────────────────────────────────

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
  player?: Player & {
    rosters?: Array<{ id: string; team?: Team; active: boolean }>;
  };
  coach?: Coach & {
    team_coaches?: Array<{ id: string; role?: string; team?: Team }>;
  };
  referee?: Referee & {
    match_referees?: Array<{ id: string; role: string; match?: Match }>;
  };
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
  rosters?: TeamRoster[];
}

export interface Player {
  id: string;
  first_name: string;
  last_name: string;
  slug: string;
  dob?: string;
  nationality?: string;
  jersey_number?: number;
  preferred_position?: string;
  profile_image?: string;
  team?: Team;
  rosters?: TeamRoster[];
  player_stats?: PlayerStat[];
}

export interface TeamRoster {
  id: string;
  team_id: string;
  player_id: string;
  season?: string;
  active: boolean;
  joined_at: string;
  player?: Player;
  team?: Team;
}

export interface TeamCoach {
  id: string;
  team_id: string;
  coach_id: string;
  role?: string;
  joined_at: string;
  coach?: Coach;
  team?: Team;
}

export interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  profile_image?: string;
  user_id?: string;
  team_coaches?: TeamCoach[];
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

export interface Referee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  certification?: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  division_id: string;
  home_team_id: string;
  away_team_id: string;
  venue_id?: string;
  referee_id?: string;
  stage_id?: string;
  scheduled_start: string;
  scheduled_end?: string;
  status: MatchStatus;
  round?: number;
  match_type?: string;
  home_score: number;
  away_score: number;
  home_team?: Team;
  away_team?: Team;
  venue?: Venue;
  referee?: Referee;
  referees?: Array<{
    id: string;
    referee_id: string;
    role: string;
    referee?: Referee;
  }>;
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
  rank: number;
  team?: Team;
  form?: ('W' | 'D' | 'L')[];
}

export interface PlayerStat {
  id: string;
  player_id: string;
  tournament_id: string;
  division_id?: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  matches_played: number;
  player?: Player;
  team?: Team;
  /** Rank position returned by the top-scorers / stats endpoints */
  rank?: number;
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
  match?: Match;
}

export interface Notification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface Media {
  id: string;
  tournament_id?: string;
  division_id?: string;
  match_id?: string;
  type: MediaType;
  url: string;
  title?: string;
  description?: string;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  site_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_address?: string;
  timezone: string;
  registration_open: boolean;
  notifications_enabled: boolean;
  live_score_updates: boolean;
  max_teams_per_division: number;
  points_win: number;
  points_draw: number;
  points_loss: number;
  updated_at?: string;
}

export interface PublicSiteSettings {
  site_name: string;
}

export interface StatsSummary {
  tournaments: number;
  teams: number;
  players: number;
  matches: number;
  venues: number;
  coaches: number;
  live_matches: number;
  top_scorer: { name: string; goals: number } | null;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
