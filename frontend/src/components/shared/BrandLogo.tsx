import { Link } from 'react-router-dom';
import logoUrl from '@/assets/logo.webp';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  compact?: boolean;
  className?: string;
  imageClassName?: string;
  linkToHome?: boolean;
}

export default function BrandLogo({
  compact = false,
  className,
  imageClassName,
  linkToHome = true,
}: BrandLogoProps) {
  const img = (
    <img
      src={logoUrl}
      alt="BC Tigers FC"
      className={cn(
        'w-auto object-contain',
        compact ? 'h-8' : 'h-9 md:h-10',
        imageClassName,
      )}
    />
  );

  if (!linkToHome) {
    return <span className={cn('inline-flex shrink-0 items-center', className)}>{img}</span>;
  }

  return (
    <Link to="/" className={cn('inline-flex shrink-0 items-center', className)}>
      {img}
    </Link>
  );
}
