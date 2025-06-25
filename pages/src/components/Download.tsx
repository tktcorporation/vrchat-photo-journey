import { useEffect, useState } from 'react';
import './Download.css';

interface Release {
  tag_name: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

function Download() {
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      'https://api.github.com/repos/tktcorporation/vrchat-albums/releases/latest',
    )
      .then((res) => res.json())
      .then((data) => {
        setRelease(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const getDownloadLink = (platform: string) => {
    if (!release) return '#';

    const asset = release.assets.find((a) => {
      const name = a.name.toLowerCase();
      if (platform === 'windows' && name.endsWith('.exe')) return true;
      if (platform === 'mac' && name.endsWith('.dmg')) return true;
      if (platform === 'linux' && name.endsWith('.appimage')) return true;
      return false;
    });

    return asset?.browser_download_url || '#';
  };

  return (
    <section id="download" className="download">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">今すぐダウンロード</h2>
          <p className="section-description">
            完全無料・オープンソースのアプリケーションです
          </p>
          {release && (
            <p className="version-info">最新バージョン: {release.tag_name}</p>
          )}
        </div>

        <div className="download-options">
          <a
            href={getDownloadLink('windows')}
            className="download-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="os-icon">🪟</div>
            <h3>Windows</h3>
            <p>Windows 10/11</p>
            <span className="download-btn">ダウンロード (.exe)</span>
          </a>

          <a
            href={getDownloadLink('mac')}
            className="download-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="os-icon">🍎</div>
            <h3>macOS</h3>
            <p>macOS 10.15+</p>
            <span className="download-btn">ダウンロード (.dmg)</span>
          </a>

          <a
            href={getDownloadLink('linux')}
            className="download-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="os-icon">🐧</div>
            <h3>Linux</h3>
            <p>AppImage形式</p>
            <span className="download-btn">ダウンロード (.AppImage)</span>
          </a>
        </div>

        <div className="download-footer">
          <p>
            その他のダウンロード方法や過去のバージョンは
            <a
              href="https://github.com/tktcorporation/vrchat-albums/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHubのリリースページ
            </a>
            をご覧ください
          </p>
        </div>
      </div>
    </section>
  );
}

export default Download;
