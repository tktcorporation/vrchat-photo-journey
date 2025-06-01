# コントリビューションガイド

このプロジェクトへのコントリビューションを歓迎します！バグ報告、機能提案、プルリクエストなど、どのような形でも貢献いただけます。

## 開発環境セットアップ

**確認済み 開発環境:**

*   Ubuntu focal (GitHub Codespaces)
    *   [https://github.com/features/codespaces](https://github.com/features/codespaces)
    *   ref: [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json)
        *   linux
        *   nodejs (Node.js 20 が必須です)

1.  **リポジトリのクローン**:
    ```bash
    git clone https://github.com/tktcorporation/vrchat-albums.git
    cd vrchat-albums
    ```

2.  **使用ツールの準備 (任意)**:
    プロジェクトでは `@antfu/ni` を使用して、`yarn`, `npm`, `pnpm` などのパッケージマネージャコマンドを統一的に扱えるようにしています。グローバルにインストールしておくと便利です。
    ```bash
    npm i -g @antfu/ni
    ```
    `ni` を使用する場合、以降の `yarn install` は `ni`、`yarn dev` は `nr dev` のように読み替えてください。

3.  **依存関係のインストール**:
    プロジェクトルートで以下のコマンドを実行し、必要なパッケージをインストールします。
    ```bash
    yarn install
    # または ni を使用する場合
    # ni
    ```
    プロジェクトでは `yarn` (バージョン4) を使用しています。特別な理由がない限り、`yarn` コマンドを使用してください。

4.  **ネイティブモジュールのリビルド** (必要な場合):
    特定のネイティブモジュール（例: `clip-filepaths`）で問題が発生した場合は、以下のコマンドでリビルドを試みてください。
    ```bash
    yarn rebuild-native
    ```

## 開発ワークフロー

1.  変更を加えます。
2.  `yarn lint:fix` を実行して、フォーマットの問題を自動修正します。
3.  `yarn lint` を実行して、残りのリンティングエラーや型エラーがないことを確認します。
4.  `yarn test` を実行して、すべてのテストがパスすることを確認します。
5.  上記の手順がすべて成功した場合にのみ、プルリクエストを作成または更新してください。

コミット前には、 pre-commit フックによって `yarn lint` が自動的に実行されます。
すべての変更は、マージされる前に CI チェックをパスする必要があります。

## 主要な開発コマンド

-   **開発モードでの起動**:
    レンダラープロセスとメインプロセスの両方を開発モードで起動し、ホットリロードを有効にします。
    ```bash
    yarn dev
    # または nr dev
    ```
    **注意**: 現状、Electron のメインプロセス (background 側) のホットリロードは完全には機能しない場合があります。変更が反映されない場合は、手動で再起動してください。

-   **ビルド**:
    アプリケーションのプロダクションビルドを生成します。
    ```bash
    yarn build
    ```

-   **リンティングとフォーマット**:
    コードの静的解析とフォーマットを実行します。
    ```bash
    # Biome を使用したチェック
    yarn lint:biome
    # TypeScript の型チェック (tsc)
    yarn lint:type-check:tsc 
    # TypeScript の型チェック (tsgo - より高速なRust製チェッカー)
    yarn lint:type-check:tsgo
    # Actionlint による GitHub Actions ワークフローのチェック
    yarn lint:actionlint

    # 上記すべてを実行
    yarn lint 
    ```
    自動修正可能な問題を修正するには:
    ```bash
    nr lint:fix 
    ```
    または
    ```bash
    biome check --apply-unsafe .
    ```

-   **テスト**:
    ユニットテストおよびインテグレーションテストを実行します。
    ```bash
    yarn test
    ```
    個別のテストスイートを実行することも可能です:
    ```bash
    yarn test:web       # レンダラープロセスのテスト (Vitest)
    yarn test:electron  # メインプロセスのテスト (Vitest)
    yarn test:playwright # E2E テスト (Playwright)
    ```

-   **デバッグ用データの生成**:
    開発中に使用するデバッグ用の写真やログデータを生成します。
    ```bash
    yarn generate:debug-data
    ```

-   **未使用コードの検出**:
    `ts-prune` を使用して、エクスポートされているが使用されていないコードを検出します。
    ```bash
    yarn find-deadcode
    ```

-   **ライセンス情報の生成と確認**:
    プロジェクトで使用しているライブラリのライセンス情報を生成し、許可されていないライセンスがないか確認します。
    ```bash
    yarn license-check:generate
    yarn license-check:validate
    ```

## GitHub Codespaces での開発

このプロジェクトは GitHub Codespaces での開発をサポートしています。

-   **仮想デスクトップへのアクセス**:
    GitHub Codespaces を使用して開発する場合、通常デスクトップ環境にはアクセスできません。
    このプロジェクトでは、`DesktopLite` を使用して仮想デスクトップ環境にアクセスできるように設定されています。
    ブラウザで `localhost:6080?resize=scale` を開き、パスワード `vscode` を使用して仮想デスクトップにアクセスできます。これにより、Electron アプリケーションの GUI を確認しながら開発を進めることが可能です。

## コーディングスタイルと規約

-   プロジェクトでは [Biome](https://biomejs.dev/) を使用してコードのフォーマットとリンティングを行っています。コミット前に `yarn lint:fix` を実行して、コードスタイルを統一してください。
    主要なルールは `biome.json` で設定されています。
-   TypeScript の strict モードが有効になっています。
-   Sequelize モデルでは TypeScript のデコレーターが使用されています。

## ブランチ戦略

-   `main`: 最新のリリースバージョンです。
-   `develop`: 次期リリースのための開発ブランチです。
-   フィーチャーブランチ: `feature/issue-number-description` (例: `feature/123-add-new-button`)
-   バグフィックスブランチ: `fix/issue-number-description` (例: `fix/456-fix-login-error`)

プルリクエストは `develop` ブランチに対して作成してください。

## Issue トラッキング

バグ報告や機能要望は GitHub Issues を使用してください。Issue を作成する際には、可能な限り詳細な情報を提供してください。

## プルリクエスト

1.  リポジトリをフォークし、ローカルにクローンします。
2.  新しいブランチを作成します (`git checkout -b feature/my-new-feature`)。
3.  変更をコミットします (`git commit -am 'Add some feature'`)。
4.  フォークしたリポジトリにプッシュします (`git push origin feature/my-new-feature`)。
5.  プルリクエストを作成します。

プルリクエストには、変更内容の概要と関連する Issue 番号を記載してください。

## リリースプロセス

このプロジェクトでは、以下の GitHub Actions ワークフローによってリリースプロセスの一部が自動化されています。

-   **自動タグ付け**: `main` ブランチへのプッシュ時に、`package.json` のバージョンに基づいたタグが自動的に作成されます。
    -   参照: [.github/workflows/tag-on-push.yml](.github/workflows/tag-on-push.yml)
-   **ビルドとリリース**: 新しいタグがプッシュされると、アプリケーションがビルドされ、GitHub Releases に成果物がアップロードされます。
    -   参照: [.github/workflows/upload-build-files.yml](.github/workflows/upload-build-files.yml)

詳細なリリース手順や手動での操作が必要な場合は、別途ドキュメントを参照してください。

## その他

不明な点があれば、Issue で気軽に質問してください。 
