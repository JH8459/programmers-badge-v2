import { useState } from "react";
import { Link } from "react-router";

import { BadgePreview } from "../components/BadgePreview";
import { flowSteps, siteLinks } from "../data/site";

type ApiHealthStatus = "idle" | "checking" | "healthy" | "warning" | "error";

interface ApiHealthState {
  status: ApiHealthStatus;
  label: string;
  description: string;
}

const initialApiHealthState: ApiHealthState = {
  status: "idle",
  label: "상태 확인 전",
  description: "현재 서비스 상태를 확인할 수 있습니다.",
};

export function LandingPage() {
  const [apiHealthState, setApiHealthState] = useState<ApiHealthState>(initialApiHealthState);

  const checkApiHealth = async () => {
    setApiHealthState({
      status: "checking",
      label: "확인 중",
      description: "현재 서비스 상태를 확인하고 있습니다.",
    });

    try {
      const response = await fetch(siteLinks.apiHealth, {
        cache: "no-store",
      });

      if (!response.ok) {
        setApiHealthState({
          status: "warning",
          label: `응답 확인 필요 (${response.status})`,
          description: "현재 서비스 응답 상태를 확인해야 합니다.",
        });
        return;
      }

      const payload = (await response.json()) as { status?: unknown; database?: unknown };
      const isHealthy = payload.status === "ok" && payload.database === "ok";

      setApiHealthState({
        status: isHealthy ? "healthy" : "warning",
        label: isHealthy ? "정상" : "응답 확인 필요",
        description: isHealthy
          ? "현재 서비스가 정상적으로 운영중입니다."
          : "현재 서비스 일부 상태를 확인해야 합니다.",
      });
    } catch {
      setApiHealthState({
        status: "error",
        label: "연결 실패",
        description: "현재 서비스 상태를 확인하지 못했습니다.",
      });
    }
  };

  return (
    <main className="stack-page">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="section-kicker">Chrome Web Store Published</span>
          <h1>프로그래머스 풀이 현황을 배지로 공유하세요.</h1>
          <p>
            프로그래머스 풀이 현황을 배지로 만들어 GitHub 프로필이나 README에 표시하세요. Chrome에서
            로그인한 프로그래머스 계정의 풀이 현황을 동기화하고, 표준·미니 배지의 URL이나 Markdown
            코드를 복사해 사용할 수 있습니다.
          </p>
          <div className="hero-actions">
            <a
              className="button button-primary"
              href={siteLinks.chromeStore}
              target="_blank"
              rel="noreferrer"
            >
              Chrome Web Store에서 설치
            </a>
            <button className="button button-secondary" type="button" onClick={checkApiHealth}>
              API 상태 확인
            </button>
          </div>
          <p className="service-disclaimer">
            프로그래머스 공식 서비스가 아니며, 프로그래머스와 제휴하거나 승인을 받은 도구가
            아닙니다.
          </p>
          <div className={`api-health-panel is-${apiHealthState.status}`} role="status">
            <span className="api-health-light" aria-hidden="true" />
            <div>
              <strong>{apiHealthState.label}</strong>
              <p>{apiHealthState.description}</p>
            </div>
          </div>
        </div>
        <aside className="hero-preview" aria-label="service preview">
          <BadgePreview />
        </aside>
      </section>

      <section className="flow-section">
        <div>
          <span className="section-kicker">Flow</span>
          <h2>설치부터 배지 복사까지</h2>
          <p className="flow-description">
            처음에는 팝업에서 직접 동기화하세요. 배지가 생성되면 원하는 형식으로 복사해 사용할 수
            있습니다.
          </p>
          <a
            className="flow-store-link"
            href={siteLinks.chromeStore}
            target="_blank"
            rel="noreferrer"
          >
            확장 프로그램 설치 페이지 열기
          </a>
        </div>
        <div className="step-grid">
          {flowSteps.map((step, index) => (
            <article className="step-card" key={step.title}>
              <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
              <small>{step.meta}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="usage-notes" aria-label="자동 동기화와 GitHub 풀이 기록 안내">
        <article>
          <h2>배지 자동 동기화</h2>
          <p>
            팝업의 ‘자동 동기화’를 켜면 프로그래머스 문제 페이지에서 정답 제출을 감지한 뒤 배지를
            갱신하고 결과를 알립니다. 팝업에서 언제든 켜거나 끌 수 있습니다.
          </p>
        </article>
        <article>
          <h2>선택형 GitHub 풀이 기록</h2>
          <p>
            팝업에서 GitHub를 연결한 뒤 기록할 저장소를 선택하고 설정을 저장하세요. GitHub App에
            접근 권한을 주는 것과 기록할 저장소를 설정하는 것은 별개입니다. 기록 경로는 선택
            사항이며, 비우면 저장소 루트를 기준으로 기록합니다. 설정 이후 정답 제출한 문제의
            README와 풀이 코드가 저장소의 기본 브랜치에 기록됩니다. 배지 자동 동기화를 꺼도 GitHub
            기록은 별도로 동작합니다.
          </p>
        </article>
      </section>

      <section className="notice-panel" aria-labelledby="data-notice-title">
        <h2 id="data-notice-title">설치 전 데이터 이용 안내</h2>
        <p>
          배지 생성과 갱신에 필요한 사용자 식별자, 표시 이름, 풀이 수, 스킬 레벨, 랭킹 정보 등을
          서비스 API 서버(api.programmers-badge.jh8459.com)로 전송합니다. 배지는 공개 URL로 제공되어
          URL을 아는 누구나 조회할 수 있습니다. GitHub 기록을 설정하면 문제 정보와 풀이 코드도 API를
          거쳐 선택한 저장소에 기록되며, 공개 여부는 저장소의 공개 설정에 따릅니다.
        </p>
        <Link to="/privacy">개인정보 처리 방침과 권한 안내 보기</Link>
      </section>
    </main>
  );
}
