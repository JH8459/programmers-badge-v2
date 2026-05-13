import { PageIntro } from "../components/PageIntro";
import { siteLinks } from "../data/site";

const supportItems = [
  {
    title: "설치 또는 동기화 문제",
    body: "Chrome extension popup 상태와 Programmers 로그인 여부를 함께 적어 주세요.",
  },
  {
    title: "Badge URL 문제",
    body: "standard/mini 중 어떤 badge인지와 사용 중인 public URL을 알려 주세요.",
  },
  {
    title: "데이터 삭제 요청",
    body: "삭제할 public badge URL 또는 programmer handle을 포함해 요청해 주세요.",
  },
];

export function ContactPage() {
  return (
    <main className="stack-page">
      <PageIntro
        kicker="Contact"
        title="문의는 GitHub Issues에서 받습니다."
        description="초기 운영 단계에서는 별도 contact form을 두지 않고, 공개 이슈로 재현 정보와 삭제 요청을 관리합니다."
      />

      <section className="support-grid">
        {supportItems.map((item) => (
          <article className="support-card" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </section>

      <a className="button button-primary wide-action" href={siteLinks.githubIssues}>
        GitHub Issues로 이동
      </a>
    </main>
  );
}
