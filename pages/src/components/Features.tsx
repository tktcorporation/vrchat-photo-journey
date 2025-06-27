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
    <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            主な機能
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            VRChat Photo
            Journeyは、あなたのVRChat体験をより豊かにする様々な機能を提供します
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-950 p-8 rounded-lg text-center transition-all duration-250 border border-gray-200 dark:border-gray-700 hover:-translate-y-1 hover:shadow-lg hover:border-[#5865F2]"
            >
              <div className="text-5xl mb-6 inline-block">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {feature.title}
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
