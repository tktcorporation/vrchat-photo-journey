import './Features.css';

const features = [
  {
    icon: '🗂️',
    title: '自動整理',
    description:
      'VRChatのログファイルを解析し、写真を撮影したワールドごとに自動的に分類します。手動での整理は不要です。',
  },
  {
    icon: '📅',
    title: '時系列表示',
    description:
      '訪れた日時順に写真を表示。特定の日の思い出をすぐに見つけることができます。',
  },
  {
    icon: '👥',
    title: '一緒にいた人を記録',
    description:
      '写真を撮影した時に同じワールドにいたフレンドの情報も自動的に記録されます。',
  },
  {
    icon: '🔍',
    title: '高度な検索',
    description:
      'ワールド名、日付、一緒にいた人など、様々な条件で写真を検索できます。',
  },
  {
    icon: '💾',
    title: 'データのエクスポート',
    description:
      '整理したデータをJSON形式でエクスポート。バックアップや他のツールとの連携が可能です。',
  },
  {
    icon: '🎨',
    title: '美しいUI',
    description:
      'Google Photosライクな洗練されたインターフェースで、快適に写真を閲覧できます。',
  },
];

function Features() {
  return (
    <section id="features" className="features">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">主な機能</h2>
          <p className="section-description">
            VRChat Photo
            Journeyは、あなたのVRChat体験をより豊かにする様々な機能を提供します
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
