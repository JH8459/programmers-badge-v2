import { Link } from "react-router";

import { siteLinks } from "../data/site";

const supportItems = [
  {
    title: "수동·자동 동기화 문제",
    body: "Chrome과 확장 프로그램 버전, 수동·자동 동기화 중 어느 경우인지, 발생 시각, 팝업의 오류 문구와 재현 순서를 남겨 주세요. 자동 동기화라면 정답 제출 후 어떤 결과가 표시됐는지도 알려 주세요.",
  },
  {
    title: "배지 URL 문제",
    body: "표준(Standard)·미니(Mini) 중 문제가 생긴 배지 종류와 증상을 알려 주세요. URL 직접 접속과 GitHub README 중 어디에서 발생하는지, 마지막 동기화 시각도 함께 남겨 주세요. 배지 URL은 공개해도 되는 경우에만 첨부해 주세요.",
  },
  {
    title: "GitHub 연결·풀이 기록 문제",
    body: "연결, 저장소 목록 조회, 설정 저장, 정답 제출 후 기록 중 어느 단계에서 문제가 생기는지 알려 주세요. 문제 URL과 사용 언어, 팝업의 오류 문구, ‘재시도’ 결과를 함께 남겨 주세요. 비공개 저장소 주소와 풀이 코드는 첨부하지 않아도 됩니다.",
  },
  {
    title: "데이터 삭제 요청",
    body: "배지 데이터 삭제인지 GitHub 연결·기록 데이터 삭제인지 범위를 알려 주세요. GitHub 연결·기록 데이터는 팝업의 ‘연결 해제’로 삭제할 수 있지만, 배지와 GitHub에 이미 커밋된 파일은 삭제되지 않습니다. 배지 삭제는 공개 가능한 배지 URL과 함께 요청하되 프로그래머스 ID 등 추가 개인정보는 적지 마세요.",
  },
];

export function ContactPage() {
  return (
    <main className="stack-page contact-page">
      <section className="contact-section">
        <div className="contact-copy">
          <span className="section-kicker">Contact</span>
          <h1>사용 중 겪은 문제나 개선 의견을 알려 주세요.</h1>
          <p>
            배지 동기화, 배지 URL, 선택형 GitHub 풀이 기록, 데이터 삭제 문의를 GitHub Issues로
            접수합니다. 기존 이슈에 같은 문제가 있는지 먼저 확인하고, 새 문의를 작성할 때는 기대한
            동작과 실제 결과를 함께 남겨 주세요. 이슈 작성에는 GitHub 로그인이 필요합니다.
          </p>
          <a className="button button-primary contact-action" href={siteLinks.githubIssues}>
            GitHub Issues로 이동
          </a>
        </div>

        <div className="contact-panel" aria-label="문의 유형별 작성 안내">
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

      <section className="notice-panel" aria-labelledby="contact-check-title">
        <h2 id="contact-check-title">문의 전에 확인해 주세요</h2>
        <ul className="contact-checklist">
          <li>
            동기화가 안 되면 Chrome에서 프로그래머스에 로그인하고, 프로그래머스 탭에서 팝업의 ‘지금
            동기화’ 또는 ‘다시 동기화’를 눌러 보세요. 자동 갱신은 ‘자동 동기화’를 켠 뒤 정답 제출이
            감지되어야 동작합니다.
          </li>
          <li>
            GitHub 연결 후에는 기록할 저장소를 선택하고 ‘저장소 설정 저장’을 눌러야 합니다. 기록
            경로 입력은 선택 사항입니다. 저장소가 목록에 없으면 GitHub App의 저장소 접근 권한을
            확인한 뒤 ‘저장소 목록 새로고침’을 눌러 보세요.
          </li>
          <li>
            GitHub 기록은 설정 이후 정답 제출부터 동작하며 배지 자동 동기화 설정과 별개입니다.
            실패한 풀이가 팝업에 남아 있으면 원인을 해결한 뒤 ‘재시도’를 누를 수 있습니다.
          </li>
        </ul>
      </section>

      <section className="notice-panel" aria-labelledby="contact-public-title">
        <h2 id="contact-public-title">GitHub Issues는 공개된 공간입니다</h2>
        <p>
          작성한 내용과 첨부 이미지는 누구나 볼 수 있습니다. 비밀번호, 세션 쿠키, 토큰, 비공개
          저장소 정보, 풀이 코드 등 민감한 정보는 올리지 마세요. 화면을 첨부할 때도 개인정보를 가려
          주세요. 배지 URL 역시 공개하면 누구나 배지에 표시된 이름과 풀이 현황을 확인할 수 있으므로
          공개 가능한 범위의 정보만 남겨 주세요.
        </p>
        <Link to="/privacy">데이터 처리·보관·삭제 기준 확인하기</Link>
      </section>
    </main>
  );
}
