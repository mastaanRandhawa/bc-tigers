import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

interface EntityCardProps {
  to: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export default function EntityCard({
  to,
  title,
  subtitle,
  badge,
  icon,
  footer,
  className,
}: EntityCardProps) {
  return (
    <Link to={to} className={cn('group block h-full', className)}>
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between gap-3 mb-3">
            {icon && <div className="shrink-0">{icon}</div>}
            {badge}
          </div>
          <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1 flex-1">{subtitle}</p>
          )}
          {footer && (
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              {footer}
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
