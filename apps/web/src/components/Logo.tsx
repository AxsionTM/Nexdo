'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/logo-tf.png"
      alt="TaskFlow"
      width={size}
      height={size}
      className={cn('shrink-0 object-contain', className)}
      priority
    />
  );
}
