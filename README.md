# add-metadata-to-vrc-photo

`add-metadata-to-vrc-photo` は、Vite、React、Electron、TypeScriptなどの技術を使用して、バーチャルリアリティチャット(VRC)の写真にメタデータを追加するためのデスクトップアプリケーションです。このプロジェクトは、`tktcorporation`によって開発・維持されており、VRCの写真に意味のあるコンテキストを追加するためのシームレスなインターフェースを提供することを目指しています。

## はじめに

### 動作確認済み 開発環境
* OS
  * Ubuntu focal (GitHub Codespaces)
* ツール
  * Node.js（バージョン20）

### インストール

1. **リポジトリのクローン**

```bash
git clone https://github.com/tktcorporation/add-world-name-to-vrc-photo
```

2. **依存関係のインストール**

```bash
yarn
```

### 開発

1. **ローカルファイルのセットアップ**
* ローカルで写真表示するためのデータを用意するコマンド

```bash
yarn setup:debug
```

2. **開発サーバーの起動**

```bash
yarn dev
```

### GitHub Codespaces

- **仮想デスクトップへのアクセス**

GitHub Codespacesを使用して開発する場合、通常デスクトップ環境にアクセスできない。
が、このプロジェクトでは、DesktopLite を使用することで、仮想デスクトップ環境にアクセスできるようになっている。
ブラウザで`port 6080`を開き、パスワード`vscode`を使用して仮想デスクトップにアクセスできる。

#### 注意
* electron background 側の hotreload が効かないのでつらみ

### ビルドと公開
- **アプリケーションのビルド**

```bash
yarn build
```

- **Release**
1. `main` ブランチへの PullRequest を作成する
1. merge
1. GitHub Actionsが自動的にタグ付けを行いリリースが作成される
