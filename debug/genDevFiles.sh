#!/bin/bash

# スクリプトがエラーに遭遇した場合に終了し、未定義の変数を参照した場合にも終了
set -eu

# スクリプトのディレクトリを取得
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

# コピー元のファイル（スクリプトの場所からの相対パス）
source_file="$script_dir/VRChat_2023-10-01_03-01-18.551_2560x1440_sample.png"

# 月ごとの枚数を指定
declare -A month_counts=(
    ["2023-01"]=3
    ["2023-02"]=4
    ["2023-03"]=6
    ["2023-04"]=8
    ["2023-05"]=9
    ["2023-06"]=4
    ["2023-07"]=6
    ["2023-08"]=5
    ["2023-09"]=10
    ["2023-10"]=7
    ["2023-11"]=2
    ["2023-12"]=3
    ["2024-02"]=12
)

# ファイル名の生成関数
generate_random_filename() {
    local month_year=$1
    local month=${month_year:5:2}
    local year=${month_year:0:4}
    local day
    local hour
    local minute
    local second
    local millisecond

    # ランダムな日、時間、分、秒、ミリ秒を生成
    day=$(printf "%02d" $((RANDOM % 28 + 1)))
    hour=$(printf "%02d" $((RANDOM % 24)))
    minute=$(printf "%02d" $((RANDOM % 60)))
    second=$(printf "%02d" $((RANDOM % 60)))
    millisecond=$(printf "%03d" $((RANDOM % 1000)))

    echo "./debug/photos/VRChat/${month_year}/VRChat_${year}-${month}-${day}_${hour}-${minute}-${second}.${millisecond}_2560x1440.png"
}

# コピー先のファイル名の配列（ランダムに生成）
destination_files=()
for month_year in "${!month_counts[@]}"; do
    count=${month_counts[$month_year]}
    for ((i=0; i<count; i++)); do
        destination_files+=("$(generate_random_filename $month_year)")
    done
done

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
