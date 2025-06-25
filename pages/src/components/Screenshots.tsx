import './Screenshots.css';

const screenshots = [
  {
    src: '/new-join-list.jpg',
    alt: 'ワールド別表示',
    caption: 'ワールドごとに写真を整理',
  },
  {
    src: '/join-list.jpg',
    alt: 'ワールドリスト',
    caption: '訪れたワールドの一覧',
  },
  {
    src: '/google-photo-screenshot.jpg',
    alt: 'ギャラリービュー',
    caption: 'Google Photosライクな表示',
  },
  {
    src: '/explorer-result.jpg',
    alt: 'エクスプローラー統合',
    caption: 'ファイルエクスプローラーから直接開く',
  },
];

function Screenshots() {
  return (
    <section className="screenshots">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">スクリーンショット</h2>
          <p className="section-description">
            実際のアプリケーションの画面をご覧ください
          </p>
        </div>
        <div className="screenshots-grid">
          {screenshots.map((screenshot, index) => (
            <div key={index} className="screenshot-item">
              <img src={screenshot.src} alt={screenshot.alt} />
              <p className="screenshot-caption">{screenshot.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Screenshots;
