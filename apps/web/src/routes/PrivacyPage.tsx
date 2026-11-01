import { privacySections } from "../data/site";

export function PrivacyPage() {
  return (
    <main className="stack-page privacy-page">
      <section className="terms-hero">
        <div className="terms-copy">
          <span className="section-kicker">Privacy</span>
          <h1>배지와 선택형 GitHub 기록을 위한 데이터 이용 안내</h1>
          <p>
            PROGRAMMERS-BADGE-V2는 공개 배지 제공과 사용자가 선택한 GitHub 풀이 기록을 위해 데이터를
            처리합니다. 전송 항목과 서버, 공개 범위, 보관 및 삭제 기준을 아래에서 확인할 수
            있습니다.
          </p>
        </div>

        <aside className="terms-index" aria-label="개인정보 안내 목차">
          <span>문서 바로가기</span>
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
            <div className="terms-body">
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
