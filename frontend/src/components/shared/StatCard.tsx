/**
 * StatCard — thin wrapper around MetricCard kept for backwards compatibility.
 * Prefer using MetricCard directly in new code.
 */
import MetricCard, { type MetricCardProps } from '@/components/shared/MetricCard';

export type { MetricCardProps as StatCardProps };
export default MetricCard;
