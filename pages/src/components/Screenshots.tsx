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
    <section className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            スクリーンショット
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            実際のアプリケーションの画面をご覧ください
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {screenshots.map((screenshot) => (
            <div
              key={screenshot.src}
              className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-950 transition-all duration-250 hover:-translate-y-1 hover:shadow-xl group"
            >
              <img
                src={screenshot.src}
                alt={screenshot.alt}
                className="w-full h-auto block transition-transform duration-[350ms] group-hover:scale-105"
              />
              <p className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white px-4 py-6 text-sm font-medium">
                {screenshot.caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Screenshots;
