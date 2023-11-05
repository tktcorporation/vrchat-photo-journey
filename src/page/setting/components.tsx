import React from 'react';
import { Badge } from '@/components/ui/badge';

const sourceBadge = (data?: { path: string; storedPath: string | null }) => {
  if (data?.storedPath) {
    return <Badge variant="outline">カスタム</Badge>;
  }
  return <Badge variant="outline">デフォルト</Badge>;
};

export { sourceBadge };
