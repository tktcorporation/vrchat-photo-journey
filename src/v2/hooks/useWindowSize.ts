import { useEffect, useState } from 'react';

interface WindowSize {
  width?: number;
  height?: number;
}

/**
 * 画面幅に応じたレイアウト計算で利用するウィンドウサイズ取得フック。
 * useVirtualGrid などから参照される。
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState<WindowSize>({});

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}
