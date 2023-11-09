// opentype ライブラリをインポートする
import { app } from 'electron';
import * as opentype from 'opentype.js';
import path from 'path';

// 正しいフォントファイルのパスを指定する '../../assets/NotoSansCJKjp-Regular.ttf';
const fontfile = path.join(app.getAppPath(), 'assets', 'NotoSansCJKjp-Regular.ttf');

// フォントの読み込み、ローカルのフォントを読み込む
const font = opentype.loadSync(fontfile);

type TextOptions = {
  align?: 'left' | 'right' | 'center';
  color?: string;
  lines?: number;
};

const generateTextPath = (text: string, width: number, lineHight: number, textOptionsDefault?: TextOptions) => {
  // テキストオプションのデフォルト値を設定
  const textOptions = {
    align: textOptionsDefault?.align ?? 'left',
    color: textOptionsDefault?.color ?? '#000',
    lines: textOptionsDefault?.lines ?? 1
  };

  // opentype: 描画オプション
  const renderOptions: opentype.RenderOptions = {};

  const columns: string[] = [''];

  // STEP1: 改行位置を算出して行ごとに分解
  text.split('').forEach((char) => {
    // opentype: 改行位置を算出する為に長さを計測
    const measureWidth = font.getAdvanceWidth(columns[columns.length - 1] + char, lineHight, renderOptions);

    // 改行位置を超えている場合
    if (width < measureWidth) {
      // 次の行にする
      columns.push('');
    }

    // 現在行に1文字追加
    columns[columns.length - 1] += char;
  });

  const paths: opentype.Path[] = [];

  // STEP2: 行ごとにSVGパスを生成
  columns.forEach((column, i) => {
    // opentype: 1行の長さを計測
    const measureWidth = font.getAdvanceWidth(column, lineHight, renderOptions);

    const fontScale = (1 / font.unitsPerEm) * lineHight;
    const height = (font.ascender - font.descender) * fontScale;

    let offsetX = 0;

    // 揃える位置に応じてオフセットを算出
    if (textOptions.align === 'right') {
      offsetX = width - measureWidth;
    } else if (textOptions.align === 'center') {
      offsetX = (width - measureWidth) / 2;
    }

    // opentype: １行分の文字列をパスに変換
    const svgpath = font.getPath(column, offsetX, height * i + height, lineHight, renderOptions);

    // 文字色を指定
    svgpath.fill = textOptions.color;

    paths.push(svgpath);
  });

  // STEP3: 指定した行数を超えていれば制限する
  if (textOptions.lines < paths.length) {
    paths.length = textOptions.lines;
  }

  // STEP4: 複数行を結合
  return paths.map((svgpath) => svgpath.toSVG(2)).join();
};

export { generateTextPath };
