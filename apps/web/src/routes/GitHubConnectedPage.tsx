import { useSearchParams } from "react-router";

import { siteLinks } from "../data/site";

export function GitHubConnectedPage() {
  const [searchParams] = useSearchParams();
  const isConnected = searchParams.get("status") === "connected";

  return (
    <main className="stack-page">
      <section className="terms-hero">
        <div className="terms-copy">
          <span className="section-kicker">GitHub</span>
          <h1>{isConnected ? "GitHub 저장소 연결을 완료했습니다." : "GitHub 연결을 완료하지 못했습니다."}</h1>
          <p>
            {isConnected
              ? "확장 프로그램 popup으로 돌아가 저장소와 브랜치, 풀이 기록 경로를 설정해 주세요."
              : "확장 프로그램 popup에서 다시 연결을 시작하고 GitHub App 설치와 권한 승인을 마쳐 주세요."}
          </p>
          <a className="button button-primary" href={siteLinks.chromeStore}>
            확장 프로그램 안내 보기
          </a>
        </div>
      </section>
    </main>
  );
}
