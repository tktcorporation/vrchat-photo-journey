# 作業計画
## α
* [x] log file の取得
    * log file dir を指定できる
    * log file dir から files を読み取って world id と timestamp を取り出す
* ボタンクリックで指定したフォルダ内に固定のファイルを生成できるように
* VRChat の写真 dir を取得できるように
* 指定した dir にファイル生成
* 月ごとに仕分けしてファイル生成できるように
* UI と導線整備

## β
* 今日はどこで何枚写真を撮った、を出す


# 動作確認済み開発環境
* GitHub Codespaces

# Installation

Clone this repo and install all dependencies  
`yarn` or `npm install`

## Development

`yarn dev` or `npm run dev`

* `port 6080` をブラウザで開き、password `vscode` を入力することで仮想ウィンドウが立ち上がる
* electron background 側の hotreload が効かないのでつらみ
* 下記のようなエラーが出るが起動はできる
```
[1] [45944:1014/104112.331635:ERROR:bus.cc(399)] Failed to connect to the bus: Could not parse server address: Unknown address type (examples of valid types are "tcp" and on UNIX "unix")
[1] [45944:1014/104112.331687:ERROR:bus.cc(399)] Failed to connect to the bus: Could not parse server address: Unknown address type (examples of valid types are "tcp" and on UNIX "unix")
[1] [45944:1014/104112.331701:ERROR:bus.cc(399)] Failed to connect to the bus: Could not parse server address: Unknown address type (examples of valid types are "tcp" and on UNIX "unix")
[1] [45944:1014/104112.331714:ERROR:bus.cc(399)] Failed to connect to the bus: Could not parse server address: Unknown address type (examples of valid types are "tcp" and on UNIX "unix")
[1] [45944:1014/104112.372187:ERROR:bus.cc(399)] Failed to connect to the bus: Could not parse server address: Unknown address type (examples of valid types are "tcp" and on UNIX "unix")
[1] [45944:1014/104112.385511:ERROR:object_proxy.cc(590)] Failed to call method: org.freedesktop.portal.Settings.Read: object_path= /org/freedesktop/portal/desktop: unknown error type: 
[1] [45974:1014/104112.477501:ERROR:gl_surface_egl.cc(320)] No suitable EGL configs found.
[1] [45974:1014/104112.477654:ERROR:gl_context_egl.cc(140)] eglGetConfigAttrib failed with error EGL_BAD_CONFIG
[1] [45974:1014/104112.478574:ERROR:gl_surface_egl.cc(320)] No suitable EGL configs found.
[1] [45974:1014/104112.478648:ERROR:gl_surface_egl.cc(1058)] eglCreatePbufferSurface failed with error EGL_BAD_CONFIG
[1] [45974:1014/104112.478721:ERROR:gpu_info_collector.cc(81)] gl::GLContext::CreateOffscreenGLSurface failed
[1] [45974:1014/104112.478881:ERROR:gpu_info_collector.cc(397)] Could not create surface for info collection.
[1] [45974:1014/104112.478955:ERROR:gpu_init.cc(90)] CollectGraphicsInfo failed.
[1] [45974:1014/104112.481748:ERROR:viz_main_impl.cc(186)] Exiting GPU process due to errors during initialization
[1] [45980:1014/104112.516961:ERROR:command_buffer_proxy_impl.cc(128)] ContextResult::kTransientFailure: Failed to send GpuControl.CreateCommandBuffer.
```

## Build

`yarn build` or `npm run build`

## Publish

`yarn dist` or `npm run dist`