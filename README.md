# 作業計画
## α
* [x] log file の取得
    * log file dir を指定できる
    * log file dir から files を読み取って world id と timestamp を取り出す
* [x] ボタンクリックで指定したフォルダ内に固定のファイルを生成できるように
* [x] VRChat の写真 dir を取得できるように
* [x] 指定した dir にファイル生成
* [x] 月ごとに仕分けしてファイル生成できるように
* [x] package アップグレード
* [x] unused export を怒る lint
* UI と導線整備
  * [ ] わかりやすいオンボーディング
* E2E テスト

## β
* [x] VRChatLog のライフサイクルを調べる
  * ログはいつ消えるの？
* 定期実行できるようにする

## やらなくてもいいかも
* 今日はどこで何枚写真を撮った、を出す？


# 動作確認済み開発環境
* GitHub Codespaces

# Installation

Clone this repo and install all dependencies  
`yarn` or `npm install`

## Development

`yarn dev` or `npm run dev`

* `port 6080` をブラウザで開き、password `vscode` を入力することで仮想ウィンドウが立ち上がる
* electron background 側の hotreload が効かないのでつらみ

## Build

`yarn build` or `npm run build`

## Publish

PullRequest を作成して main に merge されると、GitHubActions が動いて Releases にファイルがアップロードされる
