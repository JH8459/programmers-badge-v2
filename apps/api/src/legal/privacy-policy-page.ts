export const PRIVACY_POLICY_HTML = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PROGRAMMERS-BADGE-V2 개인정보처리방침</title>
    <meta
      name="description"
      content="PROGRAMMERS-BADGE-V2 Chrome extension and hosted badge privacy policy."
    />
    <style>
      :root {
        color-scheme: dark;
        --bg: #05091d;
        --panel: rgba(8, 18, 54, 0.82);
        --panel-strong: rgba(10, 22, 70, 0.94);
        --line: rgba(127, 156, 255, 0.18);
        --text: #f2f6ff;
        --muted: #a9b7d7;
        --accent: #7f9cff;
        --accent-2: #2ed8ff;
        --warn: #ffd34f;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at 20% 0%, rgba(46, 216, 255, 0.18), transparent 32rem),
          radial-gradient(circle at 78% 12%, rgba(20, 39, 131, 0.32), transparent 28rem),
          linear-gradient(135deg, #020512 0%, var(--bg) 48%, #06133c 100%);
        color: var(--text);
        font-family:
          "Pretendard",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          system-ui,
          sans-serif;
        line-height: 1.72;
      }

      main {
        width: min(1040px, calc(100% - 32px));
        margin: 0 auto;
        padding: 64px 0;
      }

      .hero {
        position: relative;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 32px;
        padding: clamp(32px, 6vw, 72px);
        background:
          linear-gradient(145deg, rgba(13, 27, 75, 0.94), rgba(3, 12, 38, 0.88)),
          repeating-linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0,
            rgba(255, 255, 255, 0.03) 1px,
            transparent 1px,
            transparent 40px
          );
        box-shadow: 0 32px 90px rgba(0, 0, 0, 0.42);
      }

      .hero::after {
        position: absolute;
        inset: auto -120px -180px auto;
        width: 360px;
        height: 360px;
        border-radius: 999px;
        background: rgba(20, 39, 131, 0.24);
        filter: blur(24px);
        content: "";
      }

      .eyebrow {
        display: inline-flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 18px;
        border: 1px solid rgba(127, 156, 255, 0.34);
        border-radius: 999px;
        padding: 7px 13px;
        color: var(--accent);
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      h1,
      h2 {
        margin: 0;
        line-height: 1.2;
      }

      h1 {
        max-width: 760px;
        font-size: clamp(2.35rem, 7vw, 5.2rem);
        letter-spacing: -0.08em;
      }

      .lead {
        max-width: 720px;
        margin: 24px 0 0;
        color: var(--muted);
        font-size: clamp(1rem, 2vw, 1.16rem);
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 28px;
      }

      .pill {
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 999px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.04);
        color: var(--muted);
        font-size: 0.92rem;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
        margin-top: 22px;
      }

      section {
        border: 1px solid var(--line);
        border-radius: 26px;
        padding: 28px;
        background: var(--panel);
        backdrop-filter: blur(18px);
      }

      section.wide {
        grid-column: 1 / -1;
      }

      h2 {
        margin-bottom: 14px;
        color: #f6f9ff;
        font-size: 1.16rem;
        letter-spacing: -0.03em;
      }

      p,
      ul {
        margin: 0;
        color: var(--muted);
      }

      ul {
        padding-left: 1.1rem;
      }

      li + li {
        margin-top: 8px;
      }

      strong {
        color: var(--text);
      }

      a {
        color: var(--accent-2);
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      .callout {
        border-color: rgba(255, 211, 79, 0.26);
        background:
          linear-gradient(135deg, rgba(255, 211, 79, 0.1), rgba(20, 39, 131, 0.08)),
          var(--panel-strong);
      }

      .footer {
        margin-top: 28px;
        color: rgba(242, 246, 255, 0.58);
        font-size: 0.92rem;
        text-align: center;
      }

      @media (max-width: 760px) {
        main {
          padding: 24px 0;
        }

        .hero,
        section {
          border-radius: 22px;
        }

        .grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <article class="hero">
        <span class="eyebrow">Privacy Policy</span>
        <h1>PROGRAMMERS-BADGE-V2 개인정보처리방침</h1>
        <p class="lead">
          PROGRAMMERS-BADGE-V2는 사용자의 Programmers 활동 데이터를 동기화해 공개 badge URL과
          Markdown snippet을 제공하는 hosted badge 서비스입니다. 이 문서는 Chrome 확장 프로그램과 API
          서버가 어떤 데이터를 처리하고, 왜 처리하는지 설명합니다.
        </p>
        <div class="meta" aria-label="policy metadata">
          <span class="pill">시행일: 2026년 5월 13일</span>
          <span class="pill">서비스: Chrome Extension + Hosted Badge API</span>
          <span class="pill">도메인: api.programmers-badge.jh8459.com</span>
        </div>
      </article>

      <div class="grid">
        <section>
          <h2>1. 수집하는 정보</h2>
          <ul>
            <li>Programmers badge 생성에 필요한 프로필 식별자, 표시 이름, 풀이 수, 스킬 레벨, 랭킹 정보</li>
            <li>동기화 시각과 public badge URL 생성을 위한 공개 slug</li>
            <li>서비스 안정성 확인에 필요한 서버 요청 로그(IP 주소, user-agent, 요청 시각이 포함될 수 있음)</li>
          </ul>
        </section>

        <section>
          <h2>2. 수집하지 않는 정보</h2>
          <ul>
            <li>Programmers 비밀번호, 세션 토큰, 쿠키 같은 인증 정보</li>
            <li>결제 정보, 건강 정보, 개인 메시지, 브라우저 방문 기록 전체</li>
            <li>광고 타게팅이나 사용자 추적을 위한 데이터</li>
          </ul>
        </section>

        <section>
          <h2>3. 사용 목적</h2>
          <p>
            수집된 데이터는 사용자가 요청한 public badge SVG, mini badge SVG, badge URL, Markdown snippet을
            생성하고 제공하는 데만 사용합니다. 사용자의 데이터를 맞춤형 광고, 신용 평가, 대출 판단,
            서비스 목적과 무관한 분석에 사용하지 않습니다.
          </p>
        </section>

        <section>
          <h2>4. 저장과 보관</h2>
          <p>
            API 서버는 public badge 제공에 필요한 최소 snapshot만 저장합니다. 저장된 데이터는 badge URL이
            동작하는 동안 보관될 수 있으며, 삭제 요청이 접수되거나 운영상 더 이상 필요하지 않은 경우 삭제할
            수 있습니다. 서버 요청 로그는 보안 사고 대응과 장애 분석에 필요한 기간 동안만 보관합니다.
          </p>
        </section>

        <section>
          <h2>5. 제3자 제공</h2>
          <p>
            PROGRAMMERS-BADGE-V2는 사용자 데이터를 판매하지 않습니다. 법적 의무 이행, 보안 사고 대응,
            서비스 제공에 필요한 인프라 운영을 제외하고 사용자 데이터를 제3자에게 제공하지 않습니다.
          </p>
        </section>

        <section>
          <h2>6. 보안</h2>
          <p>
            확장 프로그램과 API 서버 간 통신은 HTTPS를 사용합니다. 서버 접근 권한은 운영에 필요한 범위로
            제한하며, raw credential을 저장하지 않는 구조를 기본값으로 유지합니다.
          </p>
        </section>

        <section class="wide callout">
          <h2>7. Chrome Extension 권한 사용</h2>
          <p>
            확장 프로그램은 badge 동기화와 popup 표시를 위해 <strong>storage</strong>,
            <strong>activeTab</strong>, <strong>tabs</strong>, <strong>scripting</strong> 권한과
            <strong>api.programmers-badge.jh8459.com</strong> 호스트 권한을 사용합니다. 이 권한은 사용자가
            동기화를 실행하거나 Programmers 문제 페이지에서 성공 신호를 감지해 badge 데이터를 갱신하는
            목적에 한정됩니다.
          </p>
        </section>

        <section>
          <h2>8. 사용자 권리</h2>
          <p>
            사용자는 저장된 badge 데이터의 삭제를 요청할 수 있습니다. 삭제가 완료되면 기존 public badge URL은
            더 이상 정상적으로 제공되지 않을 수 있습니다.
          </p>
        </section>

        <section>
          <h2>9. 문의</h2>
          <p>
            개인정보처리방침, 데이터 삭제, 서비스 운영 관련 문의는
            <a href="https://github.com/JH8459/programmers-badge-v2/issues" rel="noreferrer">
              GitHub Issues
            </a>
            로 접수할 수 있습니다.
          </p>
        </section>

        <section class="wide">
          <h2>10. 변경</h2>
          <p>
            본 개인정보처리방침은 서비스 기능, 운영 방식, 관련 정책 변경에 따라 업데이트될 수 있습니다.
            중요한 변경이 있는 경우 이 페이지의 시행일과 내용을 갱신합니다.
          </p>
        </section>
      </div>

      <p class="footer">PROGRAMMERS-BADGE-V2 · Hosted badge for Programmers profiles</p>
    </main>
  </body>
</html>`;
