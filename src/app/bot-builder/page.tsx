'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BotBuilderPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/bot-builder');
  }, [router]);
  return null;
}
