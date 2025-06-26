/**
 * VRChat インスタンスタイプを判定するユーティリティ
 */

/**
 * インスタンスIDからインスタンスタイプを取得する
 * @param instanceId インスタンスID文字列
 * @returns インスタンスタイプ
 */
export const getInstanceType = (instanceId: string | null): string | null => {
  if (!instanceId) return null;

  // インスタンスIDに~が含まれていない場合はPublicインスタンス
  if (!instanceId.includes('~')) {
    return 'public';
  }

  // ~以降の部分を取得
  const parts = instanceId.split('~');
  if (parts.length < 2) {
    return null;
  }

  const typePart = parts[1];

  // インスタンスタイプを判定
  if (typePart.startsWith('friends(')) return 'friends';
  if (typePart.startsWith('hidden(')) return 'friends+';
  if (typePart.startsWith('private(')) return 'invite';
  if (typePart.startsWith('group(')) return 'group';
  if (typePart.startsWith('groupPublic(')) return 'group-public';

  // リージョン情報のみの場合はPublic
  if (typePart.match(/^[a-z]{2}(\([a-z0-9]+\))?$/)) return 'public';

  // その他の場合
  return 'unknown';
};

/**
 * インスタンスタイプのラベルを取得する
 * @param instanceId インスタンスID文字列
 * @returns インスタンスタイプのラベル
 */
export const getInstanceTypeLabel = (instanceId: string | null): string => {
  const type = getInstanceType(instanceId);
  switch (type) {
    case 'public':
      return 'Public';
    case 'friends':
      return 'Friends';
    case 'friends+':
      return 'Friends+';
    case 'invite':
      return 'Invite';
    case 'group':
      return 'Group';
    case 'group-public':
      return 'Group Public';
    case 'unknown':
      return 'Unknown';
    default:
      return '';
  }
};

/**
 * インスタンスタイプの色を取得する（Tailwind CSS用）
 * @param instanceId インスタンスID文字列
 * @returns Tailwind CSSクラス
 */
export const getInstanceTypeColor = (instanceId: string | null): string => {
  const type = getInstanceType(instanceId);
  switch (type) {
    case 'public':
      return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30';
    case 'friends':
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30';
    case 'friends+':
      return 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30';
    case 'invite':
      return 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30';
    case 'group':
      return 'bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30';
    case 'group-public':
      return 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
    case 'unknown':
      return 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30';
    default:
      return 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30';
  }
};
