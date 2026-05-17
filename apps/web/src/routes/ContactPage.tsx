import { siteLinks } from "../data/site";

const supportItems = [
  {
    title: "동기화 문제",
    body: "크롬 확장 프로그램 상태와 프로그래머스 로그인 여부를 함께 남겨 주세요.",
  },
  {
    title: "배지 URL 문제",
    body: "배지 종류와 문제가 발생중인 배지 URL을 포함해 주세요.",
  },
  {
    title: "데이터 삭제 요청",
    body: "삭제할 배지 URL과 프로그래머스 ID 정보를 포함해 요청해 주세요.",
  },
];

export function ContactPage() {
  return (
    <main className="stack-page contact-page">
      <section className="contact-section">
        <div className="contact-copy">
          <span className="section-kicker">Contact</span>
          <h1>이슈는 Github Issues를 통해 등록해주세요.</h1>
          <p>
            Github 공개 이슈를 통해 재현 정보, 배지 URL 문제, 데이터 삭제 요청을
            확인합니다. 서비스 운영에 필요한 내용만 남겨 주세요.
          </p>
          <a className="button button-primary contact-action" href={siteLinks.githubIssues}>
            GitHub Issues로 이동
          </a>
        </div>

        <div className="contact-panel" aria-label="support request guide">
          {supportItems.map((item) => (
            <article className="support-item" key={item.title}>
              <span aria-hidden="true" />
              <div>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
