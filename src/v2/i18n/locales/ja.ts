import type { Translations } from '../types';

const ja: Translations = {
  common: {
    settings: '設定',
    close: '閉じる',
    loading: '読み込み中...',
    noPhotosFound: '写真が見つかりませんでした',
    photos: '枚',
    refresh: '新しい写真を確認',
    search: {
      placeholder: '写真を検索...',
    },
  },
  settings: {
    tabs: {
      dataSource: 'データソース',
      system: 'システム',
      theme: 'テーマ',
      info: '情報',
      license: 'ライセンス情報',
    },
    system: {
      title: 'システム設定',
      startupLaunch: 'スタートアップ時に起動',
      startupDescription: 'ログイン時に自動的にアプリケーションを起動します',
      backgroundUpdate: 'バックグラウンド更新',
      backgroundDescription: 'バックグラウンドで新しい写真を確認します',
      updateInterval: '更新間隔',
      updateIntervalDescription: '新しい写真を確認する頻度',
      notifications: '通知を表示',
      notificationsDescription: '新しい写真が見つかった時に通知を表示します',
      interval: {
        '5min': '5分',
        '15min': '15分',
        '30min': '30分',
        '1hour': '1時間',
      },
    },
    theme: {
      title: 'テーマ設定',
      system: 'システム設定に従う',
      dark: 'ダークモード',
      light: 'ライトモード',
    },
    paths: {
      useDemo: 'デモデータを使用',
      useLocal: 'ローカルファイルを使用',
      photoDirectory: '写真ディレクトリ',
      logFile: 'ログファイル',
      browse: '参照',
      validate: 'パスの確認',
      validating: '確認中...',
      logFormat: {
        title: 'ログファイルの形式について',
        description:
          'ログファイルはJSONファイルで、以下の形式である必要があります：',
      },
    },
    info: {
      version: 'バージョン',
      name: '名前',
      dependencies: '主要な依存関係',
      licenses: {
        title: 'ライセンス情報',
        viewLicense: 'ライセンスを表示',
        suffix: 'ライセンス',
      },
    },
  },
  photoModal: {
    visitedWith: '一緒に訪れた人',
    tags: 'タグ',
    resolution: '解像度',
    lastVisited: '最終訪問',
    recommendedSeason: 'おすすめ時期',
  },
  pullToRefresh: {
    pull: '引っ張って更新',
    release: '指を離して更新',
    refreshing: '更新中...',
    checking: '新しい写真を確認中...',
  },
  yearlyVisitors: '年間来場者数',
};

export default ja;
