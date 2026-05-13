import marqueeImage from "../../../extension/store-assets/promo-marquee-1400x560.png";

import { BadgePreview } from "../components/BadgePreview";
import { guideSteps, siteLinks } from "../data/site";

export function LandingPage() {
  return (
    <main>
      <section className="hero-layout">
        <div className="hero-copy">
          <span className="section-kicker">Hosted Badge for Programmers</span>
          <h1>풀이 기록을 README에서 바로 보이는 badge로 바꿉니다.</h1>
          <p>
            Chrome 확장 프로그램으로 Programmers 활동 데이터를 동기화하고, 공개 Badge URL과
            Markdown snippet을 복사해 GitHub README에 표시합니다.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="/guide">
              사용 방법 보기
            </a>
            <a className="button button-secondary" href={siteLinks.apiHealth}>
              API 상태 확인
            </a>
          </div>
        </div>
        <BadgePreview />
      </section>

      <section className="marquee-card" aria-label="product visual">
        <img src={marqueeImage} alt="Programmers badge sync product illustration" />
      </section>

      <section className="flow-section">
        <div>
          <span className="section-kicker">Flow</span>
          <h2>설치부터 README 반영까지 세 단계입니다.</h2>
        </div>
        <div className="step-grid">
          {guideSteps.map((step, index) => (
            <article className="step-card" key={step.title}>
              <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
              <small>{step.meta}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
