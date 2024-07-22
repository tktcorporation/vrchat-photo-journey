#!/bin/bash

# スクリプトがエラーに遭遇した場合に終了し、未定義の変数を参照した場合にも終了
set -eu

# スクリプトのディレクトリを取得
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

# コピー元のファイル（スクリプトの場所からの相対パス）
source_file="$script_dir/VRChat_2023-10-01_03-01-18.551_2560x1440_sample.png"

# コピー先のファイル名の配列（スクリプトの場所からの相対パス）
destination_files=(
    "./debug/photos/VRChat/2023-08/VRChat_2023-08-08_08-21-44.163_2560x1440.png"
    "./debug/photos/VRChat/2023-08/VRChat_2023-08-08_01-19-50.163_2560x1440.png"
    "./debug/photos/VRChat/2023-08/VRChat_2023-08-08_01-01-18.551_2560x1440.png"
    "./debug/photos/VRChat/2023-08/VRChat_2023-08-08_08-21-47.163_2560x1440.png"
    "./debug/photos/VRChat/2023-08/VRChat_2023-08-08_08-21-45.163_2560x1440.png"
    "./debug/photos/VRChat/2023-08/VRChat_2023-08-08_01-22-50.163_2560x1440.png"
    "./debug/photos/VRChat/2023-08/VRChat_2023-08-08_08-21-41.163_2560x1440.png"
    "./debug/photos/VRChat/2023-08/VRChat_2023-08-08_02-01-18.551_2560x1440.png"
    "./debug/photos/VRChat/2023-08/VRChat_2023-08-08_00-01-18.551_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.163_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.164_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.165_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.166_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.167_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.168_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.169_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.170_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.171_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.172_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.173_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.174_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.175_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.176_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.177_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.178_2560x1440.png"
    "./debug/photos/VRChat/2023-09/VRChat_2023-09-08_08-21-44.179_2560x1440.png"
    "./debug/photos/VRChat/2023-10/VRChat_2023-10-08_08-21-44.163_2560x1440.png"
    "./debug/photos/VRChat/2023-10/VRChat_2023-10-08_01-19-50.163_2560x1440.png"
    "./debug/photos/VRChat/2023-10/VRChat_2023-10-08_01-01-18.551_2560x1440.png"
    "./debug/photos/VRChat/2023-10/VRChat_2023-10-08_08-21-47.163_2560x1440.png"
    "./debug/photos/VRChat/2023-10/VRChat_2023-10-08_08-21-45.163_2560x1440.png"
    "./debug/photos/VRChat/2023-10/VRChat_2023-10-08_01-22-50.163_2560x1440.png"
    "./debug/photos/VRChat/2023-10/VRChat_2023-10-08_08-21-41.163_2560x1440.png"
    "./debug/photos/VRChat/2023-10/VRChat_2023-10-08_02-01-18.551_2560x1440.png"
    "./debug/photos/VRChat/2023-10/VRChat_2023-10-08_00-01-18.551_2560x1440.png"
    "./debug/photos/VRChat/2023-10/VRChat_2023-10-01_03-01-18.551_2560x1440.png"
    "./debug/photos/VRChat/2023-10/VRChat_2023-10-08_08-21-46.163_2560x1440.png"
    "./debug/photos/VRChat/2023-10/VRChat_2023-10-08_08-21-40.163_2560x1440.png"
    "./debug/photos/VRChat/2023-10/VRChat_2023-10-08_01-21-50.163_2560x1440.png"
    "./debug/photos/VRChat/2023-10/VRChat_2023-10-08_08-21-43.163_2560x1440.png"
    "./debug/photos/VRChat/2023-10/VRChat_2023-10-08_08-21-42.163_2560x1440.png"
    "./debug/photos/VRChat/2023-11/VRChat_2023-11-08_15-11-42.163_2560x1440.png"
    "./debug/photos/VRChat/2023-11/VRChat_2023-11-08_15-12-11.163_2560x1440.png"
)

# 各ファイルにコピー
for dest_file in "${destination_files[@]}"
do
  # ファイルが既に存在する場合はスキップ
  if [ ! -f "$dest_file" ]; then
    mkdir -p "$(dirname "$dest_file")"
    cp "$source_file" "$dest_file"
    echo "File $dest_file created."
  else
    echo "File $dest_file already exists, skipping."
  fi
done


