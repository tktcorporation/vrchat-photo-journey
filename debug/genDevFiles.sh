#!/bin/bash

# スクリプトがエラーに遭遇した場合に終了し、未定義の変数を参照した場合にも終了
set -eu

# スクリプトのディレクトリを取得
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

# 縦横のパターンと色の定義を追加
declare -A width_height_patterns=(
    [1280x720]=1
    [1920x1080]=2
    [2560x1440]=3
    # たて長
    [1280x1920]=4
    [1440x2560]=5
)

# ランダムな色を生成する関数
generate_random_color() {
    printf "%06x" $((RANDOM % 16777215))
}

# ファイル名の生成関数を更新
generate_random_filename() {
    local month_year=$1
    local month=${month_year:5:2}
    local year=${month_year:0:4}
    
    local day=$(printf "%02d" $((RANDOM % 28 + 1)))
    local hour=$(printf "%02d" $((RANDOM % 24)))
    local minute=$(printf "%02d" $((RANDOM % 60)))
    local second=$(printf "%02d" $((RANDOM % 60)))
    local millisecond=$(printf "%03d" $((RANDOM % 1000)))
    
    # ランダムに解像度を選択
    local resolutions=("1280x720" "1920x1080" "2560x1440" "1280x1920" "1440x2560")
    local resolution=${resolutions[$((RANDOM % ${#resolutions[@]}))]}
    
    local filename="./debug/photos/VRChat/${month_year}/VRChat_${year}-${month}-${day}_${hour}-${minute}-${second}.${millisecond}_${resolution}.png"
    local dimensions=(${resolution//x/ })
    local width=${dimensions[0]}
    local height=${dimensions[1]}
    
    echo "${filename}|${width}|${height}"
}

# 月ごとの枚数の定義は変更なし
declare -A month_counts=(
    ["2023-01"]=3
    ["2023-02"]=4
    ["2023-03"]=6
    ["2023-04"]=10
    ["2023-05"]=9
    ["2023-06"]=23
    ["2023-07"]=9
    ["2023-08"]=5
    ["2023-09"]=10
    ["2023-10"]=7
    ["2023-11"]=20
    ["2023-12"]=3
    ["2024-02"]=12
)

# ファイルの生成処理を更新
for month_year in "${!month_counts[@]}"; do
    count=${month_counts[$month_year]}
    echo "処理中の月: $month_year, 枚数: $count"
    
    for ((i=0; i<count; i++)); do
        IFS='|' read -r dest_file width height <<< "$(generate_random_filename $month_year)"
        
        if [ ! -f "$dest_file" ]; then
            mkdir -p "$(dirname "$dest_file")"
            
            # ランダムな背景色とテキスト色を生成
            bg_color=$(generate_random_color)
            text_color=$(generate_random_color)
            
            # placehold.jpを使用して画像を生成
            curl -s "https://placehold.jp/${text_color}/${bg_color}/${width}x${height}.png" -o "$dest_file"
            echo "作成完了: $dest_file (${width}x${height})"
        else
            echo "既に存在します: $dest_file, スキップします"
        fi
    done
done
