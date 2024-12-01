import { Badge } from '@/v1/components/ui/badge';
import React from 'react';

const sourceBadge = (data?: { path: string; storedPath: string | null }) => {
  if (data?.storedPath) {
    return <Badge variant="outline">カスタム</Badge>;
  }
  return <Badge variant="outline">デフォルト</Badge>;
};

export { sourceBadge };
