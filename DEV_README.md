# vrchat-join-recorder

## 確認済み 開発環境
* Ubuntu focal (GitHub Codespaces)
  * https://github.com/features/codespaces
  * ref: [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json)
    * linux
    * nodejs

## 環境構築
### 使用ツールの準備
* `@antfu/ni`: https://github.com/antfu/ni
```bash
npm i -g @antfu/ni
```

### 依存関係のインストール
```bash
ni
```

## Dev サーバーの起動
```bash
nr dev
```

### GitHub Codespaces

- **仮想デスクトップへのアクセス**

GitHub Codespacesを使用して開発する場合、通常デスクトップ環境にはアクセスできない。
このプロジェクトでは、DesktopLiteを使用して仮想デスクトップ環境にアクセスできるようにしている。
ブラウザで`localhost:6080`を開き、パスワード`vscode`を使用して仮想デスクトップにアクセスできる。

### 注意
* electron background 側の hotreload が効かない

## Release
* 自動タグ付け
  * [.github/workflows/tag-on-push.yml](.github/workflows/tag-on-push.yml)
* タグ付けにhookしてリリース
  * [.github/workflows/upload-build-files.yml](.github/workflows/upload-build-files.yml)
