'use client';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const glowClass = score >= 70
    ? 'border-accent-green text-accent-green glow-green'
    : score >= 40
      ? 'border-accent-yellow text-accent-yellow glow-yellow'
      : 'border-accent-red text-accent-red glow-red';

  const sizeClasses = {
    sm: 'w-11 h-11 text-sm',
    md: 'w-16 h-16 text-xl',
    lg: 'w-22 h-22 text-3xl',
  };

  return (
    <div className="relative">
      <div
        className={`${sizeClasses[size]} ${glowClass} border-2 rounded-full flex items-center justify-center font-bold font-mono transition-all duration-500 pulse-ring`}
      >
        {score}
      </div>
    </div>
  );
}
