export interface DragState {
  teamId: string;
  teamName: string;
  from?: { nodeId: string; slot: 'home' | 'away' };
}

export type TeamFilter = 'all' | 'assigned' | 'unassigned';
export type TeamSort = 'name' | 'unassigned' | 'city';
