import screenshotImage from "../../../extension/store-assets/screenshot-background-1280x800.png";

import { PageIntro } from "../components/PageIntro";
import { guideSteps, siteLinks } from "../data/site";

export function GuidePage() {
  return (
    <main className="stack-page">
      <PageIntro
        kicker="Guide"
        title="동기화하고, 선택하고, 복사하세요."
        description="extension popup에서 standard/mini badge를 확인한 뒤 URL 또는 Markdown snippet을 복사하는 흐름을 기준으로 안내합니다."
      />

      <section className="guide-layout">
        <img src={screenshotImage} alt="Chrome extension badge sync guide visual" />
        <div className="guide-steps">
          {guideSteps.map((step) => (
            <article className="guide-step" key={step.title}>
              <span>{step.meta}</span>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="code-panel">
        <span className="section-kicker">Markdown</span>
        <code>![Programmers Badge]({siteLinks.badgeExample})</code>
      </section>
    </main>
  );
}
