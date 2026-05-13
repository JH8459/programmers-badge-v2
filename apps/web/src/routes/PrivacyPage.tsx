import { PageIntro } from "../components/PageIntro";
import { privacySections, siteLinks } from "../data/site";

export function PrivacyPage() {
  return (
    <main className="stack-page">
      <PageIntro
        kicker="Privacy"
        title="Badge 제공에 필요한 최소 데이터만 처리합니다."
        description="PROGRAMMERS-BADGE-V2는 사용자의 Programmers 활동 데이터를 공개 badge URL과 Markdown snippet으로 제공하기 위한 범위에서만 처리합니다."
      />

      <section className="privacy-list">
        {privacySections.map((section) => (
          <article className="privacy-item" key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </article>
        ))}
      </section>

      <section className="notice-panel">
        <h2>Chrome Extension 권한</h2>
        <p>
          확장 프로그램은 storage, activeTab, tabs, scripting 권한과 hosted API host 권한을
          badge 동기화와 popup 표시 목적에 한정해 사용합니다.
        </p>
        <a href={siteLinks.githubIssues}>삭제 또는 개인정보 문의하기</a>
      </section>
    </main>
  );
}
