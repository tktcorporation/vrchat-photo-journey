# Changelog

All notable changes to this project will be documented in this file.

## [unreleased]

### 🚀 Features

- Context-menu で写真の操作を行えるようにする (#176)

## [0.3.0-alpha.1] - 2025-01-05

### 🚀 Features

- Add button to manually apply updates (#131)
- Migrate は window が作成されてからにする (#135)
- データベース同期のエラーハンドリングを強化 (#143)
- 開発者ツールを常時表示に変更し、データベース同期エラーの調査を容易に (#144)
- LocationGroupHeaderにプレイヤー情報表示を実装 (#147)
- 設定画面にappログを開くためのボタンを追加 (#148)
- LocationGroupHeader のクエリ発行を画面内に入るまで遅延させる (#149)
- Sentry導入のための設定 (#152)
- Photoのグルーピング処理を徐々に行うように変更 (#154)
- 写真を撮っていない時でもJoin記録を表示するように (#164)
- 写真を撮っていないjoin記録を表示するかの切り替えフィルタを実装 (#165)
- ワールドJoinのグルーピング処理を調整 (#166)
- 利用規約の同意をせずにアプリケーションを利用できないようにする (#167)
- ワールドリンクを外部リンクで開けるように (#170)
- ワールド名での検索機能実装 (#172)

### 🐛 Bug Fixes

- 本番でエラーが出たので devtools 削除

### 📚 Documentation

- Update changelog

### ⚙️ Miscellaneous Tasks

- Sentryの導入 (#151)

### Change

- ウィンドウ表示周りでバグがある可能性があるので処理を簡略化 (#137)
- ウィンドウ表示周りでバグがある可能性があるので処理を簡略化 (#138)

### Fest

- UI を中心に大幅に構成変更 (#132)
- Log.erro時にsentry呼び出し, bg更新処理追加 (#153)

## [0.2.0-alpha.7] - 2024-11-10

### 🚀 Features

- ログの記録方法変更. ログファイルを簡単に開けるようにする (#127)
- アップデート処理の修正 (#128)

## [0.2.0-alpha.6] - 2024-11-10

### 🚀 Features

- アップデート機能の調整 (#125)

## [0.2.0-alpha.5] - 2024-10-21

### 🚀 Features

- 自動アップデートの仮実装 (#119)
- 写真サイズの拡大縮小機能WIP (#121)

### 🚜 Refactor

- Use UUIDv7 for primarykey (#120)

### 📚 Documentation

- Update CHANGELOG.md (#111)

### ⚙️ Miscellaneous Tasks

- Use `create-pull-request@v7` to update CHANGELOG.md (#107)
- Changelog 更新に必要な権限を追加 (#108)
- Update changelog action (#110)
- AppVersion の取得方法変更 (#112)
- Use `ni` instead of `nci` (#117)

### Build

- `skipLibCheck`, `esModuleInterop` (#116)
- `yarn` の使用に戻す (#118)

### Release

- `v0.2.0-alpha.5` (#122)

## [0.2.0-alpha.4] - 2024-09-21

### ⚙️ Miscellaneous Tasks

- Fix github actions (#105)
- Fix update a changelog action (#106)

## [0.2.0-alpha.3] - 2024-09-21

### ⚙️ Miscellaneous Tasks

- CHANGELOG.md, upload draft artifacts (#98)
- Use bash shell (#99)
- Fix uploader (#100)
- Changelog settings (#101)
- Exeファイルが gh release できない (#102)

### Release

- V0.2.0-alpha.3 (#103)

## [0.2.0-alpha.2] - 2024-09-21

### 🐛 Bug Fixes

- .github/workflows/upload-build-files.yml
- Upload-build-files.yml
- Upload-build-files.yml

### ⚙️ Miscellaneous Tasks

- Update build processes
- `changelog.md` を生成するように (#90)
- Changelog のci設定修正 (#91)
- Release ci の修正 (#92)
- バージョンが上がったら `v*` を push (#93)
- `v*` のtag push (#94)
- 修正 (#95)
- 修正 (#96)
- 修正 (#97)

### Build

- Release ビルドの方法を変更

## [0.2.0-alpha.1] - 2024-09-15

### 🚀 Features

- 月ごとに仕分けしてファイル生成できるように
- デザイン整備, refactor
- AppBar title to VRC Photo Tag
- 生成前に dialog で確認させる
- Join 情報を画面上に出す準備
- Add exif metadata to OGP image creation
- Refactor SideBar and PhotoList components
- Add navigation links and update sidebar layout
- CreateOGPImage add join date to image
- ScrollArea component to PhotoList sidebar
- Add error logging with electron-log
- Update AppBar styling
- Update routes and navigation components
- オンボでファイル作成のプレビューを出せるように
- Add error handling for uncaught exceptions
- 写真をグルーピングして表示するプレビューを実装
- Trpc error が発生した場合にエラーが記録されるようにする
- 作成、プレビューする画像のサイズを可変に
- 写真一覧画面でのエラーハンドリング強化
- 作成画面のUX改善
- HOME を変更
- エラーハンドリング強化
- Error を使ってエラー追跡できるように
- エラーハンドリングの強化
- App log を直接開くボタンを設置
- Phpto click で写真を開く
- Service に同一worldへのjoinを記録しないオプションを追加
- 重複削除のフラグをstoreから取得するように
- ワールド名の表示機能
- PhotoListでworld名表示
- Join log と photo をまとめて表示する
- ワールド名をリンク化
- 細かいスタイル修正
- バックグラウンド処理を有効化
- リンクホバーでunderline
- Http or httpsのリンクをクリックしたときにデフォルトブラウザで開く
- Background作成用の処理を書くためのTODOコメント
- リンククリックでデフォルトブラウザを開く
- バックグラウンド設定用のボタンとページを追加
- バックグラウンド設定ページのUI実装
- バックグラウンド処理切り替えUIの中身実装
- ファイルが既に存在していたら作成しない
- バックグラウンドでjoin log 作成処理
- ファイル作成ページとJoinListページを統合
- Use noto sans jp as default font
- Add a sr-only guide
- Change app icon
- バックグラウンド処理が複数は知らないようにしたい
- アプリ名変更
- 状態の持ち方を整備
- ファイル作成後にリロードする
- UIデザイン修正
- 画面内に入った時にロード処理を行う
- JoinList のUIアップデート
- Toastでのエラーメッセージ表示を詳細にする
- PC起動時のautoStart設定
- バージョン情報の表記を追加
- 使用ライブラリのライセンス情報を記載
- 設定画面のUIアップデート
- Join 情報がない場合も unknown として表示する
- Join List の並び順を降順に統一
- WorldJoin と playerJoin の抽出
- Log file への書き込み service 実装
- Migration reset の仕組みを作る
- Log の仮保存まで
- Player と world の join 情報ログに絞って取得する
- LoadIndex の controller 作成
- LoadIndex の処理を追加(うまく動いていない)
- JoinInfoLogList の表示UI実装
- 選択した写真の撮影worldを返す仮実装
- 写真を撮ったワールドの詳細情報を取得して表示
- Resetdb に確認ボタンを付ける(いらないかも)
- Sequelize で db 処理を記述 local起動成功
- Db sync が必要かどうかを確認してから実行するように
- Player情報を出すUI wip
- 初回起動時にのみマイグレーション処理
- デザイン調整
- 起動時に log の書き込みと index 読み込みを行う
- 起動時に未設定の項目があったら設定画面へ誘導する
- ワールド情報表示のmvp制作wip
- (wip) sheet で settings を開く
- Update the app design [wip]
- Scroll いい感じ wip
- Fontsize 調整
- 葉にないだけスクロールするように
- 設定画面のスタイル微調整
- 色味 wip
- 選択したphotoの情報を url に保持
- 写真一覧の取得と表示、その他UI調整
- 同じjoin内で撮影した写真も表示
- 写真が描画範囲に入ったときだけロードする
- Virtual scroll を使う
- 写真リストのUI改善
- 写真リストのUI改善
- ダミー写真ファイルの生成ロジック変更
- 写真の描画を改善
- 写真一覧ui改善
- 写真領域の縦幅を調整, 写真が存在しないときのhook を仮作成
- Validate not found vrcPhotoPath
- バーチャルスクロールの動きを直す
- バーチャルスクロール微調整
- Virtualscrollの縦幅を可変、日付を入れる
- Join 記録の表示を追加
- ワールド名表示のUI調整
- グルーピング修正
- Shadcn-ui@latest add context-menu
- 写真のコピー機能実装

### 🐛 Bug Fixes

- Lint
- Type-check errors
- Ci permission errors
- Build ci
- Add permissions
- Release processes
- Release ci
- Release ci
- Release ci
- Release ci
- Release process
- Release ci
- Release ci
- Release
- Whiteout renderer
- Release ci
- Typo
- Release ci
- Ci
- Revert
- Ci
- Ci
- VRChat log and photo directory default
- Handle new month photo dir log
- Buildsettings
- Fix font file path in infoFile/lib.ts
- サムネイル画像のtimezone を正す
- Lint command
- Date変換の修正とさらなるlogging
- Timezone
- Logfile が長い場合に Maximum call stack size exceeded. が起こる問題を修正
- レンダリングループ
- Failed tests
- Failed tests
- 同じ写真が出てくる問題を key を変更して解決できるかどうか
- PhotoList は上の方が新しい物が来る
- PhotoList の key を unique にする
- Key指定の間違いを修正
- 表示のタイムゾーンを修正
- Fix setup script
- Yarn lint:fix
- Use yarn v4
- Playwrite test
- Playwrite test
- Playwrite test
- Playwrite test
- Playwrite test
- Playwrite test
- Playwrite
- Playwrite
- Playwrite
- Fix typo [playerite -> playwright]
- バックグラウンドプロセスの動きを修正
- `Object has been destroyed` の抑止
- 無限レンダリングを抑制
- 初期表示時の状態の持ち方を改善
- バックグラウンドファイル作成時に数が実態より多く出ていた問題
- New Join List の並びを日時の降順
- 何故か描画時にswitch が切り替わるが、整合性はとれるように
- 複数バックグラウンドプロセスが立ち上がらないようにしたい
- ウィンドウを開く度にtrayが作成されていた問題を修正
- 並び順の修正
- Fix command
- App version を package.json から取得する
- バージョン情報を package.json から取得
- Build ci
- Fix erros
- Errors
- Errors
- Tests
- LoadIndex の処理を修正
- Prisma client を prod で使うための設定
- Build設定を変えることでエラー解決を試みる
- Window を出す前に migrate を走らせない
- 起動時にmigrateを走らせる
- Db path の組み立て方を変更
- Wondows の場合 file url は `file///` で始める
- 環境変数の渡し方を変更
- `node_modules/.bin/prisma` が存在するかを確認して実行
- コマンドの実行結果をUTF-8エンコードして戻す
- エラーをutf8で上げ直す
- Sjis の encode
- Encoding
- Debug
- Tsconfig の修正
- Test修正
- Test修正
- PackageJsonPath の取得方法変更
- AppVersion の取得方法を変更
- AppVersion の取得方法変更
- PlayerJoin の記録が行えるように修正
- プレイヤー情報を取得できるように
- Dirpath の validation を無効化
- JoinLog に重複があったときにエラーになるバグを修正
- 範囲内の写真だけ出てくるように

### 🚜 Refactor

- Some
- 型アップデート
- Remove unused code and dependencies.
- Use trpc to clear settings
- Use shadcn button
- VRChat photo directory path.
- Biome init and lint
- Lint:fix
- Composables でリファクタ
- SettingStoreの呼び出し箇所を限定
- 使用する store を外部から差し込み可能に
- Router path の取得ができなかった場合に例外
- Package 構成変更
- Rename a func
- Refactor joinInfoLogFileRouter
- 不要関数の削除
- 処理をまとめる
- 関数移動
- Rm unused lines
- JoinList のコンポーネントを分割
- 使用されていない export をいくつか削除
- Module structure
- テストが落ちてしまったので応急措置
- RdbClient を singleton 化
- Move dirs
- 未使用ファイルの削除
- DbRest 時の logging 形式を変更
- 不要な prisma 関連を削除
- Use hooks
- Remove an useMemo
- Hooks の整理
- 描画調整
- Hooks の整理

### 📚 Documentation

- Update readme
- Update checkbox
- Update readme
- Update
- Add a note
- Note 更新
- Release にスクリーンショットを含めたい
- やることやりたいこと
- Unused export を怒りたい
- Fix lint error and add onboarding UI
- README の開発手順を update
- Update README
- Update README
- Screenshot
- Screenshot
- Update screenshots
- スクショ更新
- スクショ更新
- Update screenshots
- Update screenshots
- Readme に利用説明を追加
- Fix readme
- Update readme
- Delete readme

### ⚡ Performance

- 削除して問題なさそうな useMemo

### 🎨 Styling

- プレビューの回り込みとスクロール
- Navbar を固定
- 中央寄せ
- `function-declaration` -> `arrow-function`
- 戻る -> もどる
- Lint fix with biome
- Upgrade biome and lint files
- Fix format settings
- Remove unused lines

### 🧪 Testing

- 検証用
- 解読不能なテストを削除
- テストの修正
- Test 修正
- Playwrite の実行、スクショに成功
- Fix
- Fix tests
- Fix tests
- テスト修正

### ⚙️ Miscellaneous Tasks

- Change dir and more
- Add release workflows
- Update hooks
- Update ci
- .gitignore
- Github extension 追加
- Add screen shot ui
- 少し trpc に処理を移行
- Add GitHub Actions workflow for AI PR reviewer
- Use tRPC
- 何故か分からないが desktop-lite でも動くように
- Pre-commit hook to run lint without fixing
- Add VRChat debug photos to .gitignore
- Biome lint
- Biome lint
- Fix formatting issues in code
- Biome lint
- Update yarnm.lock
- Addtest to ci
- Precommit command の変更
- Update eslintrc
- Lint実行の順番を変更
- CompilerOptions の変更
- デバッグ用にログ追加
- Gen sourcemap
- Debug log
- Error log
- Logging
- Logging trpc error
- Error handling update
- Npx shadcn-ui@latest add tooltip
- Add `@antfu/ni`
- パフォーマンス調査用
- Nodeversion の指定に package.json を使う
- デバッグ用のファイル生成はスクリプトで行う
- デバッグファイル削除用のコマンド
- Use bun
- Use antfu/ni
- Fix https://github.com/vitejs/vite/issues/15714
- Trust simple-git-hooks
- Use antfu/ni
- Use yarn v4
- Add vscode-conventional-commits
- Https://github.blog/2024-02-12-get-started-with-v4-of-github-actions-artifacts/
- Update vscode extensions
- Remove eslint settings
- Pr 作成時にスクショをコメントする
- Update plawwrite test
- Remove configs for eslint
- Pr issue linker
- `nr lint` で type-check も行う
- Update the issue link style
- Upgrade tailwindcss
- Upgrade electron-builder
- Rm `node-html-to-image`
- Ci でライセンスチェック
- V0.4.0
- Vx.x.x の tag が作られた時だけ正式リリース
- Update ci dependencies
- パッケージのバージョン固定, upgrade
- Github actions の ubuntu version を固定
- Logging の種類を info -> debug
- Logging 設定を変更
- Add shadcn drawer
- Production で debug log は流さない
- Update dependencies
- Debug 用script の修正
- Bump version 0.2.0

### Add

- Log dir の選択と worldid, timestamp の取得、表示
- Error boundary の追加
- ファイルの存在チェック処理を追加

### Build

- ビルド結果に app version を含める
- *(deps)* Bump ip from 2.0.0 to 2.0.1
- Set product name

### Change

- Refactor and move AppBar
- UI を少し整え
- World名も取得する
- Refactor router paths and add constants file

### Clean

- Some fix
- Rm unused lines
- 使わなさそうなファイルの削除

### Debug

- Raw log

### Delete

- License

### Feeat

- 写真をグルーピングする処理を書いた(動いていなさそう)

### Fefactor

- 型 update

### Note

- Todo記述

### Update

- Vrchat photo dir が正しく設定されているかチェック
- Iroiro
- Handle ENOENT

### Wip

- Setup project
- Setup electron
- Ugoitakamo?
- No styled shadcn button

<!-- generated by git-cliff -->
