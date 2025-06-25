import './HowItWorks.css';

const steps = [
  {
    number: '01',
    title: 'アプリをダウンロード',
    description:
      'Windows、macOS、Linuxに対応。お使いのOSに合わせてダウンロードしてください。',
  },
  {
    number: '02',
    title: 'フォルダを設定',
    description:
      'VRChatのログフォルダと写真が保存されているフォルダを指定します。',
  },
  {
    number: '03',
    title: '自動で整理完了',
    description:
      'アプリが自動的にログを解析し、写真をワールドごとに整理します。',
  },
];

function HowItWorks() {
  return (
    <section className="how-it-works">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">使い方は簡単</h2>
          <p className="section-description">
            3つのステップで、あなたのVRChat写真が美しく整理されます
          </p>
        </div>
        <div className="steps">
          {steps.map((step, index) => (
            <div key={index} className="step">
              <div className="step-number">{step.number}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
              {index < steps.length - 1 && <div className="step-arrow">→</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
