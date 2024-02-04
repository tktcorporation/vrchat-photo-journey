# 動作確認済み開発環境
* GitHub Codespaces

## Development
* install all dependencies  
```bash
$ yarn
```

* generate files for local debug
```bash
$ yarn setup:debug
```

start development server
```bash
$ yarn dev
```

* Codespaces を利用している場合
  * `port 6080` をブラウザで開き、password `vscode` を入力することで仮想ウィンドウが立ち上がる

### Note
* electron background 側の hotreload が効かないのでつらみ

## Build

`yarn build`

## Publish

PullRequest を作成して main に merge されると、GitHubActions が動いて Releases にファイルがアップロードされる
