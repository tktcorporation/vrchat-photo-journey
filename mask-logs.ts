#!/usr/bin/env npx tsx

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const LOGS_DIR = './debug/logs';
const OUTPUT_DIR = './debug/logs-masked';

// ユーザーIDとマスク情報のマッピングを保持
interface MaskedUser {
  id: string;
  name: string;
}

const idToMaskedUser = new Map<string, MaskedUser>();
const nameToMaskedName = new Map<string, string>(); // IDが取得できない場合の名前マッピング

// 仮名生成用の名前リスト
const firstNames = [
  'Alex',
  'Sam',
  'Jordan',
  'Taylor',
  'Morgan',
  'Casey',
  'Riley',
  'Jamie',
  'Avery',
  'Quinn',
  'Skyler',
  'Drew',
  'Blake',
  'Cameron',
  'Dakota',
  'Emerson',
  'Finley',
  'Hayden',
  'Kendall',
  'Parker',
  'Reese',
  'Sage',
  'Sydney',
  'River',
  'Phoenix',
  'Rowan',
  'Aspen',
  'Ocean',
  'Storm',
  'Rain',
  'Kai',
  'Leo',
  'Max',
  'Nova',
  'Luna',
  'Ember',
  'Zara',
  'Atlas',
  'Orion',
  'Echo',
];

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Anderson',
  'Taylor',
  'Thomas',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Thompson',
  'White',
  'Harris',
  'Clark',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
  'King',
  'Wright',
  'Hill',
  'Green',
  'Baker',
  'Nelson',
  'Carter',
  'Mitchell',
  'Roberts',
  'Turner',
  'Phillips',
  'Campbell',
  'Parker',
  'Evans',
  'Edwards',
];

const usernamePrefixes = [
  'Cool',
  'Dark',
  'Light',
  'Fire',
  'Ice',
  'Wind',
  'Storm',
  'Star',
  'Moon',
  'Sun',
  'Shadow',
  'Crystal',
  'Golden',
  'Silver',
  'Mystic',
  'Cyber',
  'Neo',
  'Quantum',
  'Digital',
  'Virtual',
  'Neon',
  'Cosmic',
  'Stellar',
  'Lunar',
  'Solar',
  'Astral',
  'Ethereal',
  'Infinity',
  'Eternal',
  'Phoenix',
];

const usernameSuffixes = [
  'Wolf',
  'Dragon',
  'Phoenix',
  'Tiger',
  'Eagle',
  'Hawk',
  'Bear',
  'Fox',
  'Lion',
  'Panda',
  'Knight',
  'Warrior',
  'Mage',
  'Wizard',
  'Ninja',
  'Samurai',
  'Ranger',
  'Guardian',
  'Seeker',
  'Hunter',
  'Gamer',
  'Player',
  'Master',
  'Lord',
  'King',
  'Queen',
  'Prince',
  'Princess',
  'Hero',
  'Legend',
];

// 一貫性のある偽名を生成
function generateFakeName(seed: string): string {
  // シードから一貫性のあるインデックスを生成
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  const num1 = Number.parseInt(hash.substring(0, 8), 16);
  const num2 = Number.parseInt(hash.substring(8, 16), 16);
  const num3 = Number.parseInt(hash.substring(16, 24), 16);

  // ランダムだが一貫性のある選択
  const formatType = num1 % 4;

  switch (formatType) {
    case 0: {
      // フルネーム形式: "FirstName LastName"
      const firstName = firstNames[num2 % firstNames.length];
      const lastName = lastNames[num3 % lastNames.length];
      return `${firstName} ${lastName}`;
    }
    case 1: {
      // ユーザー名形式: "PrefixSuffix"
      const prefix = usernamePrefixes[num2 % usernamePrefixes.length];
      const suffix = usernameSuffixes[num3 % usernameSuffixes.length];
      return `${prefix}${suffix}`;
    }
    case 2: {
      // 日本風ユーザー名: "Name_JP" + 番号
      const firstName = firstNames[num2 % firstNames.length];
      const number = (num3 % 9999).toString().padStart(4, '0');
      return `${firstName}_JP${number}`;
    }
    default: {
      // ゲーマータグ形式: "xXNameXx"
      const name = firstNames[num2 % firstNames.length];
      const number = num3 % 100;
      return `xX${name}Xx${number}`;
    }
  }
}

// ユーザーIDに対するマスク情報を取得または生成
function getOrCreateMaskedUser(originalId: string): MaskedUser {
  // tkt_のIDを特定（元のログファイルのIDと一致）
  if (originalId === 'usr_3ba2a992-724c-4463-bc75-7e9f6674e8e0') {
    return { id: originalId, name: 'tkt_' }; // tkt_のIDはそのまま
  }

  if (!idToMaskedUser.has(originalId)) {
    // マスクIDを生成（最初の8文字を "00000000" にして、マスクされたIDだと分かるようにする）
    const hash = crypto.createHash('md5').update(originalId).digest('hex');
    // usr_00000000-xxxx-xxxx-xxxx-xxxxxxxxxxxx の形式にする（正規表現に準拠）
    const maskedId = `usr_00000000-${hash.substring(0, 4)}-${hash.substring(
      4,
      8,
    )}-${hash.substring(8, 12)}-${hash.substring(12, 24)}`;
    const maskedName = generateFakeName(originalId);

    idToMaskedUser.set(originalId, { id: maskedId, name: maskedName });
  }

  const maskedUser = idToMaskedUser.get(originalId);
  if (!maskedUser) {
    throw new Error(`Masked user not found for ID: ${originalId}`);
  }
  return maskedUser;
}

// IDからマスク名を取得
function getMaskedNameByUserId(originalId: string): string {
  const maskedUser = getOrCreateMaskedUser(originalId);
  return maskedUser.name;
}

// 名前のみの場合のマスク名を取得（IDとの関連付けを考慮）
function getMaskedNameByName(
  originalName: string,
  knownNameToId: Map<string, string>,
): string {
  if (originalName === 'tkt_') {
    return originalName;
  }

  // まず、この名前に対応するIDが既知か確認
  if (knownNameToId.has(originalName)) {
    const userId = knownNameToId.get(originalName);
    if (!userId) {
      throw new Error(`User ID not found for name: ${originalName}`);
    }
    return getMaskedNameByUserId(userId);
  }

  // IDが不明な場合は、名前ベースのマッピングを使用
  if (!nameToMaskedName.has(originalName)) {
    const fakeName = generateFakeName(originalName);
    nameToMaskedName.set(originalName, fakeName);
  }

  const maskedName = nameToMaskedName.get(originalName);
  if (!maskedName) {
    throw new Error(`Masked name not found for: ${originalName}`);
  }
  return maskedName;
}

// マスキング関数
function maskLogs(content: string): string {
  let masked = content;

  // まず、OnPlayerJoined/OnPlayerJoinComplete/OnPlayerLeft の行からID-名前の関係を学習
  const lines = content.split('\n');
  const nameToId = new Map<string, string>();

  // 第1パス: ID付きのOnPlayerJoined行から名前-IDマッピングを作成
  for (const line of lines) {
    const joinMatch = line.match(
      /(OnPlayer(?:Joined|JoinComplete|Left))\s+(.+?)\s+\(usr_([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\)/,
    );
    if (joinMatch) {
      const [, , name, id] = joinMatch;
      const fullId = `usr_${id}`;
      // tkt_のIDを除外（特定のIDを保持）
      if (fullId !== 'usr_3ba2a992-724c-4463-bc75-7e9f6674e8e0') {
        nameToId.set(name.trim(), fullId);
      }
    }
  }

  // 第2パス: Initialized PlayerAPI行から名前を補完
  for (const line of lines) {
    const playerMatch = line.match(/Initialized PlayerAPI "(.+?)" is/);
    if (playerMatch) {
      const name = playerMatch[1];
      if (name !== 'tkt_' && nameToId.has(name)) {
      }
    }
  }

  // usr_XXXXX 形式のユーザーIDをマスク
  masked = masked.replace(
    /usr_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g,
    (match) => {
      const maskedUser = getOrCreateMaskedUser(match);
      return maskedUser.id;
    },
  );

  // OnPlayerJoined/OnPlayerJoinComplete/OnPlayerLeft の名前をIDに基づいてマスク
  masked = masked.replace(
    /(OnPlayer(?:Joined|JoinComplete|Left))\s+(.+?)(\s+\(usr_|\s*$)/gm,
    (match, prefix, name, suffix) => {
      const trimmedName = name.trim();
      if (trimmedName === 'tkt_') {
        return match; // tkt_はそのまま
      }

      // この行にユーザーIDがある場合は、そのIDに対応するマスク名を使用
      const idMatch = match.match(
        /\(usr_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\)/,
      );
      if (idMatch) {
        const userId = idMatch[0].slice(1, -1); // 括弧を削除
        const maskedName = getMaskedNameByUserId(userId);
        return `${prefix} ${maskedName}${suffix}`;
      }

      // IDがない場合は名前ベースのマッピングを使用
      const maskedName = getMaskedNameByName(trimmedName, nameToId);
      return `${prefix} ${maskedName}${suffix}`;
    },
  );

  // Removed player パターン（実際のプレイヤー名を含む）
  masked = masked.replace(
    /(\[Always\]\s+Removed player\s+)(.+)/g,
    (match, prefix, name) => {
      const trimmedName = name.trim();
      if (trimmedName === 'tkt_') {
        return match;
      }
      // 名前ベースのマッピングを使用
      const maskedName = getMaskedNameByName(trimmedName, nameToId);
      return `${prefix}${maskedName}`;
    },
  );

  // displayName やその他のユーザー名パターンをマスク
  masked = masked.replace(/displayName:\s*"([^"]+)"/g, (match, name) => {
    if (name === 'tkt_') {
      return match;
    }
    const maskedName = generateFakeName(name);
    return `displayName: "${maskedName}"`;
  });

  // User joining/left パターン
  masked = masked.replace(
    /(User\s+(?:joining|left):\s+)([^\s,]+)/g,
    (match, prefix, name) => {
      if (name === 'tkt_') {
        return match;
      }
      const maskedName = generateFakeName(name);
      return `${prefix}${maskedName}`;
    },
  );

  // Initialized PlayerAPI パターン
  masked = masked.replace(
    /(\[Behaviour\]\s+Initialized PlayerAPI\s+")(.+?)("\s+is\s+(?:local|remote))/g,
    (match, prefix, name, suffix) => {
      if (name === 'tkt_') {
        return match;
      }
      const maskedName = getMaskedNameByName(name, nameToId);
      return `${prefix}${maskedName}${suffix}`;
    },
  );

  // User Authenticated パターン
  masked = masked.replace(
    /(User Authenticated:\s+)([^\s]+)(\s+\(usr_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\))/g,
    (match, prefix, name, idPart) => {
      if (name === 'tkt_') {
        return match;
      }
      const userId = idPart.match(
        /usr_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/,
      )?.[0];
      if (userId) {
        const maskedName = getMaskedNameByUserId(userId);
        return `${prefix}${maskedName}${idPart}`;
      }
      return match;
    },
  );

  return masked;
}

// メイン処理
async function main() {
  console.log('Starting log masking process...');
  console.log('This will create consistent masked IDs for the same users.');
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  // ログディレクトリの存在確認
  if (!fs.existsSync(LOGS_DIR)) {
    console.error(`Directory ${LOGS_DIR} does not exist`);
    process.exit(1);
  }

  // 出力ディレクトリの作成
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  // ログファイルを取得
  const files = fs.readdirSync(LOGS_DIR).filter((f) => f.endsWith('.txt'));

  console.log(`Found ${files.length} log files to process\n`);

  // 各ファイルを処理
  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const inputPath = path.join(LOGS_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);
    console.log(`Processing: ${file}`);

    try {
      // ファイル読み込み
      const content = fs.readFileSync(inputPath, 'utf8');

      // マスキング処理
      const maskedContent = maskLogs(content);

      // マスクされた内容を出力ディレクトリに書き込み
      fs.writeFileSync(outputPath, maskedContent, 'utf8');

      console.log(`✓ Masked: ${file} -> ${path.join(OUTPUT_DIR, file)}`);
      successCount++;
    } catch (error) {
      console.error(
        `✗ Error processing ${file}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      errorCount++;
    }
  }

  console.log('\n=== Masking Summary ===');
  console.log(`Successfully processed: ${successCount} files`);
  console.log(`Errors: ${errorCount} files`);
  console.log(`Total unique users with IDs masked: ${idToMaskedUser.size}`);
  console.log(
    `Total unique users without IDs masked: ${nameToMaskedName.size}`,
  );
  console.log('tkt_ entries preserved: YES');
  console.log(
    '\nNote: User names and IDs are consistently mapped - same user always gets same masked ID/name.',
  );
  console.log(
    'Masked user IDs use consistent hash-based format to maintain anonymity.',
  );

  console.log('\n=== Output Location ===');
  console.log(`Masked files are saved in: ${OUTPUT_DIR}`);
  console.log('\n=== Next Steps ===');
  console.log('1. Review the masked files:');
  console.log(`   - cd ${OUTPUT_DIR}`);
  console.log('   - Review the files to ensure proper masking');
  console.log('2. If satisfied, replace original files:');
  console.log(`   - cp -r ${OUTPUT_DIR}/* ${LOGS_DIR}/`);
  console.log('3. Use BFG Repo-Cleaner to clean Git history:');
  console.log('   - Download BFG: https://rtyley.github.io/bfg-repo-cleaner/');
  console.log(
    '   - Run: java -jar bfg.jar --delete-files "*.txt" --no-blob-protection debug/logs',
  );
  console.log('4. Add debug/logs to .gitignore');
  console.log(
    '\nNote: Masked IDs maintain the original format for application compatibility.',
  );
}

// 実行
main().catch(console.error);
