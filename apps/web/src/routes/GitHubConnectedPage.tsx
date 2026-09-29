import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {
  githubConnectionResponseSchema,
  type GitHubConnectionResponse,
} from "@programmers-badge/shared-types";

import { siteLinks } from "../data/site";

export function GitHubConnectedPage() {
  const [searchParams] = useSearchParams();
  const isConnected = searchParams.get("status") === "connected";
  const [connection, setConnection] = useState<GitHubConnectionResponse | null>(null);
  const [connectionCheck, setConnectionCheck] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const controller = new AbortController();
    const loadConnection = async () => {
      try {
        const response = await fetch(siteLinks.githubConnection, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("GitHub 연결 정보를 조회하지 못했습니다.");
        }
        const result = githubConnectionResponseSchema.parse(await response.json());
        if (!controller.signal.aborted) {
          setConnection(result);
          setConnectionCheck("ready");
        }
      } catch {
        if (!controller.signal.aborted) {
          setConnectionCheck("error");
        }
      }
    };
    void loadConnection();

    return () => controller.abort();
  }, [isConnected]);

  const repository = connection?.connected ? connection.settings?.repository : null;
  const repositoryUrl = repository
    ? `https://github.com/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`
    : null;

  return (
    <main className="stack-page github-connected-page">
      <section className="github-connected-panel">
        <span className="section-kicker">GitHub App</span>
        <h1>
          {isConnected ? "GitHub 연결을 완료했습니다." : "GitHub 연결을 완료하지 못했습니다."}
        </h1>
        <p className="github-connected-lead">
          {isConnected
            ? "이 탭을 닫고 브라우저 도구 모음에서 확장 프로그램을 열어 풀이 기록 저장소를 확인해 주세요."
            : "확장 프로그램에서 다시 연결을 시작하거나 아래 버튼으로 GitHub App 설치를 재시도해 주세요."}
        </p>

        {isConnected && (
          <div className="github-connected-details" aria-live="polite">
            {connectionCheck === "loading" && <p>연결 정보를 확인하고 있습니다.</p>}
            {connectionCheck === "error" && (
              <p>연결 정보를 불러오지 못했습니다. 확장 프로그램에서 연결 상태를 확인해 주세요.</p>
            )}
            {connectionCheck === "ready" && !connection?.connected && (
              <p>연결된 계정을 확인하지 못했습니다. 확장 프로그램에서 연결 상태를 확인해 주세요.</p>
            )}
            {connection?.connected && (
              <>
                <div className="github-connected-detail">
                  <span>연결된 GitHub 계정</span>
                  <strong>@{connection.accountLogin}</strong>
                </div>
                <div className="github-connected-detail">
                  <span>풀이 기록 대상</span>
                  {repositoryUrl ? (
                    <a href={repositoryUrl} target="_blank" rel="noreferrer">
                      {repository?.fullName}
                    </a>
                  ) : (
                    <strong>아직 설정되지 않았습니다.</strong>
                  )}
                </div>
                <p>
                  {repositoryUrl
                    ? "이 저장소가 풀이 기록 대상으로 저장되어 있습니다. 변경하려면 확장 프로그램에서 다시 선택해 주세요."
                    : "GitHub App에 접근 권한을 준 저장소와 풀이 기록 대상은 별개입니다. 확장 프로그램에서 저장소를 선택하고 설정을 저장해 주세요."}
                </p>
              </>
            )}
          </div>
        )}

        <div className="github-connected-actions">
          {isConnected ? (
            <button className="button button-primary" type="button" onClick={() => window.close()}>
              이 탭 닫기
            </button>
          ) : (
            <a className="button button-primary" href={siteLinks.githubConnect}>
              GitHub 다시 연결하기
            </a>
          )}
          <a className="github-connected-secondary" href={siteLinks.chromeStore}>
            확장 프로그램 정보 보기
          </a>
        </div>
      </section>
    </main>
  );
}
