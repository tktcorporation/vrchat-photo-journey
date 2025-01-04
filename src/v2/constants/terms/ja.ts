import { TERMS_VERSION } from './version';

export const terms = {
  version: TERMS_VERSION,
  sections: {
    termsOfService: {
      title: '利用規約',
      content: `
最終更新日：2025年01月09日 制定

1. サービスの利用について
本アプリケーション（以下「本サービス」）は、以下の利用規約（以下「本規約」）を
ご確認いただき、同意された場合のみご利用ください。

2. 禁止事項
本サービスの利用に際し、ユーザーは以下の行為を行ってはなりません。
- 法令または公序良俗に反する行為
- 当社または第三者の権利や利益を侵害する行為
- サーバーやネットワークに過度の負担をかける行為
- その他、当社が不適切と判断する行為

3. 免責事項
3.1 データの保存について
本サービスで保存されたデータについて、予期せぬ事態によるデータの損失や破損に関して
開発者は一切の責任を負いかねます。重要なデータについては、定期的なバックアップを推奨いたします。

3.2 サービスについて
本サービスは VRChat の非公式ツールです。VRChat および関連するサービスとの互換性や
動作について、完全な保証はできかねます。VRChat 側の仕様変更等により本サービスが
利用できなくなる場合がありますが、当社はこれに関する責任を負いません。

4. サービスの変更および中断・終了
当社は、ユーザーへの事前の通知なく、本サービスの内容を変更または提供を中断・終了する場合があります。

5. 規約の変更
当社は、必要と判断した場合、本規約を変更することができます。
`,
    },
    privacyPolicy: {
      title: 'プライバシーポリシー',
      content: `
最終更新日：2025年01月09日 制定

1. 取得する情報

ユーザーが本アプリケーションを利用するにあたり、以下の情報を取得する場合があります。

1.1 Cookie などから生成された識別情報
- 本アプリケーション利用時に自動的に取得される Cookie・セッションID 等

1.2 端末情報・OS に関する情報
- OS の種類・バージョン、ブラウザの種類・バージョン、デバイス種別・機種など

1.3 閲覧・行動履歴・利用履歴
- 当アプリケーション上での閲覧履歴、入力履歴
- 本アプリケーションの起動状況、入力内容、操作ログ、API コール数、画面遷移回数など

1.4 エラーログや利用状況データ
- Sentry 等のエラートラッキングツールを用いて収集されるクラッシュレポート、スタックトレース、操作状況
- 障害解析や品質改善を目的としたアクセス解析情報

2. 利用目的

取得した情報を、以下の目的のために利用します。

2.1 本アプリケーションの提供・運営・改善
- ユーザーとの契約・利用規約に基づくサービス提供
- 本アプリケーションの機能改善や品質向上
- 障害発生時の原因調査・修正、およびユーザーサポート

2.2 認証・セキュリティ向上
- アカウント認証や不正行為防止、システムの安全性確保

2.3 お問い合わせ・サポート対応
- ユーザーからの問い合わせ対応、サポート・トラブルシューティング

3. 外部送信に関する方針

3.1 外部送信の目的
- 本アプリケーションの品質向上、障害解析、サービス改善のため
- ユーザーの利用状況を統計的に分析し、利便性向上やサービス機能追加を検討するため

3.2 外部送信される情報
- アプリケーションの動作環境、OS・ブラウザのバージョン、エラーログ、スタックトレースなど
- ユーザー操作の一部（画面遷移、API コール数、ボタンクリック等の操作履歴）
- 個人を特定しない形の利用データ・統計データ

4. プライバシーポリシーの改定
当社は、必要と判断した場合、本ポリシーを改定することができます。

5. お問い合わせ

プライバシーポリシーに関するご質問・苦情等は、以下の連絡先までお問い合わせください。
E-mail: tktcorporation.go@gmail.com`,
    },
  },
};
