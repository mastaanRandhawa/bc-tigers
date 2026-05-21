import SectionBlock from '@/components/design-system/SectionBlock';
import SurfaceCard from '@/components/design-system/SurfaceCard';
import MetaChip from '@/components/design-system/MetaChip';
import { useDivisionRoute } from '@/context/DivisionContext';

export default function DivisionRulesPage() {
  const { division } = useDivisionRoute();

  return (
    <SectionBlock title="Division rules & format" variant="card">
      <div className="mb-4 flex flex-wrap gap-2">
        <MetaChip value={division.format} />
        {division.age_group && <MetaChip value={division.age_group} />}
        <MetaChip value={division.gender} />
      </div>
      <SurfaceCard variant="default" padding="md" className="bg-bauhaus-muted/30">
        <dl className="m-0 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-label">Format</dt>
            <dd className="mt-0.5 font-black uppercase tracking-tight text-foreground">{division.format}</dd>
          </div>
          {division.age_group && (
            <div>
              <dt className="text-label">Age group</dt>
              <dd className="mt-0.5 font-black uppercase tracking-tight text-foreground">{division.age_group}</dd>
            </div>
          )}
          <div>
            <dt className="text-label">Points (W / D / L)</dt>
            <dd className="mt-0.5 font-black tabular-nums text-foreground">
              {division.points_win} / {division.points_draw} / {division.points_loss}
            </dd>
          </div>
          <div>
            <dt className="text-label">Max teams</dt>
            <dd className="mt-0.5 font-black tabular-nums text-foreground">{division.max_teams}</dd>
          </div>
        </dl>
      </SurfaceCard>
    </SectionBlock>
  );
}
