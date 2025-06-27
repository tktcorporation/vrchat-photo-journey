function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 pb-6">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="lg:col-span-1">
            <h3 className="text-xl font-semibold mb-4">VRChat Albums</h3>
            <p className="text-sm leading-relaxed opacity-80 mb-6">
              VRChatの思い出を美しく整理するオープンソースアプリケーション
            </p>
            <div className="flex items-center gap-2 text-sm">
              <a
                href="https://github.com/tktcorporation/vrchat-albums"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white no-underline opacity-80 hover:opacity-100 transition-opacity duration-150"
              >
                GitHub
              </a>
              <span className="opacity-30">•</span>
              <a
                href="https://github.com/tktcorporation/vrchat-albums/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white no-underline opacity-80 hover:opacity-100 transition-opacity duration-150"
              >
                MIT License
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-base font-semibold mb-4 opacity-90">
              リソース
            </h4>
            <ul className="list-none text-sm space-y-2">
              <li>
                <a
                  href="https://github.com/tktcorporation/vrchat-albums/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white no-underline opacity-80 hover:opacity-100 transition-opacity duration-150"
                >
                  リリースノート
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/tktcorporation/vrchat-albums/blob/main/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white no-underline opacity-80 hover:opacity-100 transition-opacity duration-150"
                >
                  ドキュメント
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/tktcorporation/vrchat-albums/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white no-underline opacity-80 hover:opacity-100 transition-opacity duration-150"
                >
                  不具合報告
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold mb-4 opacity-90">開発者</h4>
            <ul className="list-none text-sm space-y-2">
              <li>
                <a
                  href="https://github.com/tktcorporation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white no-underline opacity-80 hover:opacity-100 transition-opacity duration-150"
                >
                  @tktcorporation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/tktcorporation/vrchat-albums/graphs/contributors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white no-underline opacity-80 hover:opacity-100 transition-opacity duration-150"
                >
                  コントリビューター一覧
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold mb-4 opacity-90">
              サポート
            </h4>
            <p className="text-sm leading-relaxed opacity-80 mb-4">
              質問や要望がある場合は、GitHubのIssuesまたはDiscussionsでお知らせください。
            </p>
            <a
              href="https://github.com/tktcorporation/vrchat-albums/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-gray-900 px-6 py-2 rounded-full no-underline text-sm font-medium transition-all duration-250 hover:-translate-y-0.5 hover:shadow-md"
            >
              Discussionsを開く
            </a>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center text-sm opacity-60">
          <p>
            © 2023-{new Date().getFullYear()} VRChat Albums. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
