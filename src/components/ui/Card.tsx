import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  children: ReactNode;
}

export function Card({ hover, className, children, ...rest }: CardProps) {
  return (
    <div
      className={classNames(
        'surface rounded-2xl shadow-card',
        hover && 'transition-all duration-300 hover:shadow-glow hover:-translate-y-0.5',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={classNames('p-6 pb-0', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={classNames('p-6', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={classNames('font-display text-lg font-700 text-ink-900 dark:text-white', className)} {...rest}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={classNames('text-muted mt-1 text-sm', className)} {...rest}>
      {children}
    </p>
  );
}
