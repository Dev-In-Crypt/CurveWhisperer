'use client';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const color = score >= 70
    ? 'border-accent-green text-accent-green'
    : score >= 40
      ? 'border-accent-yellow text-accent-yellow'
      : 'border-accent-red text-accent-red';

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-lg',
    lg: 'w-20 h-20 text-2xl',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${color} border-2 rounded-full flex items-center justify-center font-bold transition-all duration-300`}
    >
      {score}
    </div>
  );
}
