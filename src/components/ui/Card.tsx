import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const Card = ({ children, className = '', ...props }: CardProps) => {
  return (
    <div
      className={`surface-gradient shadow-soft rounded-[28px] border border-white/70 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
