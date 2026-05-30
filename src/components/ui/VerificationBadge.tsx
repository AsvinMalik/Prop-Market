import { BadgeCheck, Clock3, ScanSearch, ShieldAlert } from 'lucide-react';
import { ReactNode } from 'react';

type VerificationBadgeVariant =
  | 'unverified'
  | 'verified-user'
  | 'verified-property'
  | 'ai-checked'
  | 'pending';

interface VerificationBadgeProps {
  variant: VerificationBadgeVariant;
  children?: ReactNode;
  className?: string;
}

const badgeMap: Record<
  VerificationBadgeVariant,
  { label: string; className: string; icon: ReactNode }
> = {
  unverified: {
    label: 'Unverified',
    className: 'bg-slate-100 text-slate-600',
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
  },
  'verified-user': {
    label: 'Verified User',
    className: 'bg-emerald-100 text-emerald-700',
    icon: <BadgeCheck className="h-3.5 w-3.5" />,
  },
  'verified-property': {
    label: 'Verified Property',
    className: 'bg-blue-100 text-blue-700',
    icon: <BadgeCheck className="h-3.5 w-3.5" />,
  },
  'ai-checked': {
    label: 'AI-Checked',
    className: 'bg-violet-100 text-violet-700',
    icon: <ScanSearch className="h-3.5 w-3.5" />,
  },
  pending: {
    label: 'Pending Verification',
    className: 'bg-amber-100 text-amber-700',
    icon: <Clock3 className="h-3.5 w-3.5" />,
  },
};

const VerificationBadge = ({
  variant,
  children,
  className = '',
}: VerificationBadgeProps) => {
  const badge = badgeMap[variant];

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${badge.className} ${className}`}
    >
      {badge.icon}
      <span>{children || badge.label}</span>
    </div>
  );
};

export default VerificationBadge;
