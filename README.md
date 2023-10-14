# 作業計画
## α
* log file の取得
    * log file dir を指定できる
    * log file dir から files を読み取って world id と timestamp を取り出す
* ボタンクリックで指定したフォルダ内に固定のファイルを生成できるように
* VRChat の写真 dir を取得できるように
* 指定した dir にファイル生成
* 月ごとに仕分けしてファイル生成できるように
* UI と導線整備

# 動作確認済み開発環境
* GitHub Codespaces

# Installation

Clone this repo and install all dependencies  
`yarn` or `npm install`

## Development

`yarn dev` or `npm run dev`

* `port 6080` をブラウザで開き、password `vscode` を入力することで仮想ウィンドウが立ち上がる

## Build

`yarn build` or `npm run build`

## Publish

`yarn dist` or `npm run dist`