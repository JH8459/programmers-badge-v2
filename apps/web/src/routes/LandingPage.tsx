import { useState } from "react";

import { BadgePreview } from "../components/BadgePreview";
import { guideSteps, siteLinks } from "../data/site";

type ApiHealthStatus = "idle" | "checking" | "healthy" | "warning" | "error";

interface ApiHealthState {
  status: ApiHealthStatus;
  label: string;
  description: string;
}

const initialApiHealthState: ApiHealthState = {
  status: "idle",
  label: "상태 확인 전",
  description: "API 상태 확인을 누르면 health endpoint 응답을 검사합니다.",
};

export function LandingPage() {
  const [apiHealthState, setApiHealthState] = useState<ApiHealthState>(initialApiHealthState);

  const checkApiHealth = async () => {
    setApiHealthState({
      status: "checking",
      label: "확인 중",
      description: "health endpoint 응답을 기다리고 있습니다.",
    });

    try {
      const response = await fetch(siteLinks.apiHealth, {
        cache: "no-store",
      });

      if (!response.ok) {
        setApiHealthState({
          status: "warning",
          label: `응답 확인 필요 (${response.status})`,
          description: "API가 응답했지만 정상 상태 코드가 아닙니다.",
        });
        return;
      }

      const payload = (await response.json()) as { status?: unknown; database?: unknown };
      const isHealthy = payload.status === "ok" && payload.database === "ok";

      setApiHealthState({
        status: isHealthy ? "healthy" : "warning",
        label: isHealthy ? "정상" : "응답 확인 필요",
        description: isHealthy
          ? "API와 database health check가 정상입니다."
          : "API는 응답했지만 health payload의 일부 상태를 확인해야 합니다.",
      });
    } catch {
      setApiHealthState({
        status: "error",
        label: "연결 실패",
        description: "API health endpoint에 연결하지 못했습니다.",
      });
    }
  };

  return (
    <main>
      <section className="hero-layout">
        <div className="hero-copy">
          <span className="section-kicker">Hosted Badge for Programmers</span>
          <h1>프로그래머스 풀이 기록을 토대로 프로필 배지를 생성합니다.</h1>
          <p>
            현재 로그인된 프로그래머스 로그인 세션을 활용해 풀이 기록 정보를 동기화합니다.
            배지 생성에 필요한 최소 정보만 처리하며, 미리 제공된 API를 통해 SVG 배지를 생성한
            뒤 정적 파일 형태로 제공합니다. 비밀번호나 세션 토큰 같은 개인정보는 별도로
            수집하거나 저장하지 않습니다.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="/guide">
              사용 방법 보기
            </a>
            <button className="button button-secondary" type="button" onClick={checkApiHealth}>
              API 상태 확인
            </button>
          </div>
          <div className={`api-health-panel is-${apiHealthState.status}`} role="status">
            <span className="api-health-light" aria-hidden="true" />
            <div>
              <strong>{apiHealthState.label}</strong>
              <p>{apiHealthState.description}</p>
            </div>
          </div>
        </div>
        <BadgePreview />
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
