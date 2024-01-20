#!/bin/bash

# スクリプトがエラーに遭遇した場合に終了し、未定義の変数を参照した場合にも終了
set -eu

# 引数の解析
skip_confirmation=false
while getopts "y" opt; do
    case $opt in
        y)
            skip_confirmation=true
            ;;
        \?)
            echo "無効なオプション: -$OPTARG" >&2
            exit 1
            ;;
    esac
done

# スクリプトのディレクトリを取得
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

delete_file_path="$script_dir/photos"
delete_file_names=(
    "VRChat*wrld*.png"
    "VRChat_*x*.png"
)

# まず対象の確認
for delete_file_name in "${delete_file_names[@]}"; do
    find $delete_file_path -name $delete_file_name
done

# 確認
# -y がついていた場合は確認をスキップ
if [ "$skip_confirmation" = false ]; then
    read -p "削除しますか？ [y/N]: " yn
    case "$yn" in
        [yY]*) ;;
        *) echo "終了します" ; exit 1 ;;
    esac
fi

# 削除
for delete_file_name in "${delete_file_names[@]}"; do
    find $delete_file_path -name $delete_file_name -delete
done

echo "削除しました"
