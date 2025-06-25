import './Hero.css';

function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              VRChat Photo Journey
              <span className="hero-subtitle">
                VRChatの思い出を、美しく整理
              </span>
            </h1>
            <p className="hero-description">
              VRChatで撮影した大切な写真を、訪れたワールドごとに自動整理。
              いつ、どこで、誰と過ごした思い出なのか、すぐに見つけられます。
            </p>
            <div className="hero-cta">
              <a href="#download" className="btn btn-primary">
                無料でダウンロード
              </a>
              <a href="#features" className="btn btn-secondary">
                機能を見る
              </a>
            </div>
            <div className="hero-badges">
              <span className="badge">Windows対応</span>
              <span className="badge">macOS対応</span>
              <span className="badge">Linux対応</span>
            </div>
          </div>
          <div className="hero-image">
            <img
              src="/Screenshot.jpg"
              alt="VRChat Photo Journey スクリーンショット"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
