import { privacySections } from "../data/site";

export function PrivacyPage() {
  return (
    <main className="stack-page privacy-page">
      <section className="terms-hero">
        <div className="terms-copy">
          <span className="section-kicker">Privacy</span>
          <h1>배지 제공에 필요한 최소 데이터만 처리합니다.</h1>
          <p>
            PROGRAMMERS-BADGE-V2는 프로그래머스 풀이 기록을 공개 배지 URL 링크 형태로
            제공하기 위한 범위에서만 데이터를 취급합니다.
          </p>
        </div>

        <aside className="terms-index" aria-label="terms categories">
          <span>약관 종류</span>
          {privacySections.map((section) => (
            <a href={`#${section.id}`} key={section.id}>
              {section.title}
            </a>
          ))}
        </aside>
      </section>

      <section className="terms-documents">
        {privacySections.map((section) => (
          <article className="terms-document" id={section.id} key={section.id}>
            <header>
              <div>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </div>
            </header>
            <div className="terms-scroll">
              {section.clauses.map((clause, index) => (
                <section className="terms-clause" key={clause.title}>
                  <h3>
                    {index + 1}. {clause.title}
                  </h3>
                  <p>{clause.body}</p>
                </section>
              ))}
            </div>
            <footer>최종 수정일자 {section.updatedAt}</footer>
          </article>
        ))}
      </section>
    </main>
  );
}
