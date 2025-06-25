import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">VRChat Photo Journey</h3>
            <p className="footer-description">
              VRChatの思い出を美しく整理するオープンソースアプリケーション
            </p>
            <div className="footer-links">
              <a
                href="https://github.com/tktcorporation/vrchat-albums"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                GitHub
              </a>
              <span className="separator">•</span>
              <a
                href="https://github.com/tktcorporation/vrchat-albums/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                MIT License
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-subtitle">リソース</h4>
            <ul className="footer-list">
              <li>
                <a
                  href="https://github.com/tktcorporation/vrchat-albums/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  リリースノート
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/tktcorporation/vrchat-albums/blob/main/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ドキュメント
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/tktcorporation/vrchat-albums/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  不具合報告
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-subtitle">開発者</h4>
            <ul className="footer-list">
              <li>
                <a
                  href="https://github.com/tktcorporation"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @tktcorporation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/tktcorporation/vrchat-albums/graphs/contributors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  コントリビューター一覧
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-subtitle">サポート</h4>
            <p className="footer-text">
              質問や要望がある場合は、GitHubのIssuesまたはDiscussionsでお知らせください。
            </p>
            <a
              href="https://github.com/tktcorporation/vrchat-albums/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-cta"
            >
              Discussionsを開く
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © 2023-{new Date().getFullYear()} VRChat Photo Journey. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
