import { getRelationshipTier, RELATIONSHIP_TIER_CONFIG, type CaerholdVisitorRelationship } from '@/types/caerhold';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface RelationshipMeterProps {
  relationship: CaerholdVisitorRelationship | null;
  compact?: boolean;
}

export function RelationshipMeter({ relationship, compact = false }: RelationshipMeterProps) {
  const score = relationship?.composite_score || 0;
  const tier = getRelationshipTier(score);
  const config = RELATIONSHIP_TIER_CONFIG[tier];

  // Progress within tier
  const tierRange = config.max - config.min;
  const progressInTier = tierRange > 0 ? Math.min(100, ((score - config.min) / tierRange) * 100) : 0;

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border border-border"
            style={{ color: config.color }}
          >
            <span>{config.icon}</span>
            <span>{tier}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-48">
          <DimensionBreakdown relationship={relationship} />
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium flex items-center gap-1" style={{ color: config.color }}>
          {config.icon} {tier}
        </span>
        <span className="text-[10px] text-muted-foreground">{Math.round(score)}/100</span>
      </div>
      <Progress value={progressInTier} className="h-1.5" />
      <DimensionBreakdown relationship={relationship} />
    </div>
  );
}

function DimensionBreakdown({ relationship }: { relationship: CaerholdVisitorRelationship | null }) {
  if (!relationship) return null;

  const dims = [
    { label: 'Affection', value: relationship.affection, color: 'hsl(350, 60%, 55%)' },
    { label: 'Trust', value: relationship.trust, color: 'hsl(200, 60%, 50%)' },
    { label: 'Comfort', value: relationship.comfort, color: 'hsl(122, 39%, 49%)' },
    { label: 'Respect', value: relationship.respect, color: 'hsl(45, 80%, 50%)' },
    { label: 'Compat.', value: relationship.compatibility, color: 'hsl(280, 50%, 55%)' },
  ];

  return (
    <div className="space-y-1 pt-1">
      {dims.map(d => (
        <div key={d.label} className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-14 shrink-0">{d.label}</span>
          <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(0, Math.min(100, d.value))}%`, backgroundColor: d.color }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground w-5 text-right">{Math.round(d.value)}</span>
        </div>
      ))}
    </div>
  );
}
