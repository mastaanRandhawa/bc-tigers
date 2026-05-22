import { Navigate } from 'react-router-dom';

/** Enforces tournament-first hierarchy — no global team/division/player directories */
export default function BlockedGlobalRoute() {
  return <Navigate to="/tournaments" replace />;
}
