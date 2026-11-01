const readRequiredViteEnv = (key: string): string => {
  const configuredValue = import.meta.env[key]?.trim();

  if (!configuredValue) {
    throw new Error(`${key} is required.`);
  }

  return configuredValue;
};

const apiBaseUrl = readRequiredViteEnv("VITE_API_BASE_URL").replace(/\/+$/, "");

export const siteLinks = {
  apiHealth: `${apiBaseUrl}/api/health`,
  githubConnection: `${apiBaseUrl}/api/github/connection`,
  githubConnect: `${apiBaseUrl}/api/github/connect`,
  chromeStore:
    "https://chromewebstore.google.com/detail/programmers-badge-v2/nfaknmfniiemabicmcbdkajapapdglaf?authuser=0&hl=ko",
  githubIssues: "https://github.com/JH8459/programmers-badge-v2/issues",
  programmersLesson: "https://school.programmers.co.kr/learn/courses",
};

export const flowSteps = [
  {
    title: "설치 및 프로그래머스 로그인",
    description:
      "Chrome Web Store에서 확장 프로그램을 설치하고, Chrome에서 프로그래머스에 로그인한 뒤 프로그래머스 탭을 엽니다.",
    meta: "Chrome Web Store",
  },
  {
    title: "팝업에서 지금 동기화",
    description:
      "프로그래머스 탭에서 확장 프로그램 팝업을 열고 ‘지금 동기화’를 누릅니다. 갱신할 때는 ‘다시 동기화’를 누르세요.",
    meta: "지금 동기화 / 다시 동기화",
  },
  {
    title: "배지 선택 및 복사",
    description:
      "표준(Standard) 또는 미니(Mini)를 선택하고, Badge URL이나 Markdown의 ‘복사’를 눌러 GitHub 프로필이나 README에 붙여 넣습니다.",
    meta: "배지 URL / Markdown 코드",
  },
];

export const privacySections = [
  {
    id: "privacy-policy",
    title: "개인정보 처리 방침",
    description: "공개 배지 제공과 선택형 GitHub 풀이 기록을 위한 데이터 처리 기준입니다.",
    updatedAt: "2026.11.01",
    clauses: [
      {
        title: "수집하는 정보",
        body: "배지 동기화 시 프로그래머스 사용자 식별자, 표시 이름, 푼 문제 수와 전체 문제 수, 스킬 레벨, 랭킹 점수와 순위, 배지 등급, 동기화 시각을 처리합니다. 이전 버전의 배지와 연결하기 위해 기존 식별자(legacyProgrammerHandle)가 함께 전송될 수 있습니다. GitHub 연결을 선택하면 GitHub 계정 ID와 로그인명, App 설치 ID, 선택한 저장소와 기본 브랜치·기록 경로를 처리합니다. 저장소 설정 이후 정답 제출 시 문제 번호·이름·URL·난이도·설명·제한 사항·입출력 예시, 사용 언어, 풀이 코드, 제출 식별자·시각, 제출 결과와 성능 요약을 처리합니다.",
      },
      {
        title: "수집하지 않는 정보",
        body: "Programmers 비밀번호·세션 쿠키, GitHub 비밀번호와 개인 access token, 결제 정보, 개인 메시지, 전체 브라우저 방문 기록은 수집하지 않습니다. GitHub App 설치 토큰은 API 서버가 요청 시 짧은 수명으로 발급하고 저장하거나 확장 프로그램에 보내지 않습니다. API는 연결 session token의 hash만 저장합니다.",
      },
      {
        title: "사용 목적",
        body: "표준(Standard)·미니(Mini) SVG 배지와 배지 URL·Markdown 코드를 제공합니다. GitHub를 연결하고 기록할 저장소 설정을 저장한 경우, 이후 정답 제출한 문제의 README와 풀이 코드를 해당 저장소의 기본 브랜치에 커밋합니다. 기록 경로 입력은 선택 사항입니다.",
      },
      {
        title: "전송 서버와 공개 범위",
        body: "배지 동기화 데이터는 서비스 API 서버(api.programmers-badge.jh8459.com)로 전송하여 저장합니다. 생성된 배지는 공개 URL로 제공되며 URL을 아는 누구나 배지에 표시된 이름과 풀이 현황을 조회할 수 있습니다. GitHub 기록을 설정하면 문제 정보와 풀이 코드도 API 서버로 전송한 뒤 GitHub API를 통해 선택한 저장소에 기록합니다. GitHub에 기록된 내용의 공개 여부는 해당 저장소의 공개 설정에 따릅니다.",
      },
      {
        title: "보관과 삭제",
        body: "배지 데이터와 생성된 SVG 파일은 갱신하여 보관하며 자동 만료되지 않습니다. 배지와 계정 데이터 삭제 요청은 GitHub Issues를 통해 접수합니다. GitHub 연결, 저장소 설정, 풀이 문제 정보와 기록 상태는 사용자가 연결을 해제할 때까지 보관합니다. 풀이 코드는 기록 처리 중 API에 보관하며, 실패하면 재시도를 위해 유지합니다. 저장에 성공하거나 중복 기록으로 건너뛰면 코드를 삭제하고, 연결을 해제하면 해당 GitHub 연결과 풀이 기록 데이터를 삭제합니다. GitHub에 이미 커밋된 파일은 연결 해제로 삭제되지 않으며 사용자가 GitHub에서 관리합니다. 삭제 문의에 비밀번호·토큰·풀이 코드 등 민감한 정보를 적지 마세요.",
      },
    ],
  },
  {
    id: "extension-permissions",
    title: "확장 프로그램 권한 안내",
    description: "Chrome 확장 프로그램이 사용하는 권한과 브라우저 세션 처리 기준입니다.",
    updatedAt: "2026.11.01",
    clauses: [
      {
        title: "사용 권한",
        body: "storage, activeTab, tabs, scripting 권한은 배지 동기화, 풀이 코드 수집, GitHub 설정과 팝업 표시 목적에만 사용합니다. Programmers 문제와 편집기 코드를 읽기 위한 사이트 접근 권한도 사용합니다. GitHub 연결은 API 서버를 통해 처리합니다.",
      },
      {
        title: "브라우저 세션 활용",
        body: "로그인된 Programmers 브라우저 세션으로 통계와 정답 제출 결과, 문제 설명, 편집기 코드를 읽습니다. Programmers 세션 토큰과 쿠키는 저장하지 않습니다.",
      },
      {
        title: "동기화 방식",
        body: "팝업의 ‘지금 동기화’ 또는 ‘다시 동기화’를 누르면 배지 통계를 API 서버로 전송합니다. 팝업에서 ‘자동 동기화’를 켜면 프로그래머스 문제 페이지에서 정답 제출을 감지한 뒤 배지를 갱신하고 결과를 알립니다. 자동 동기화는 팝업에서 켜거나 끌 수 있습니다. GitHub 연결 후 기록할 저장소 설정을 저장하면 이후 정답 제출한 문제 정보와 풀이 코드를 API 서버로 전송합니다. 배지 자동 동기화를 꺼도 GitHub 기록은 별도로 동작합니다. GitHub App 설치 토큰은 API 서버가 짧은 수명으로 발급하며 확장 프로그램에 보내지 않습니다.",
      },
      {
        title: "문의",
        body: "권한 사용, 배지 URL, 데이터 삭제 문의는 GitHub Issues를 통해 등록할 수 있습니다.",
      },
    ],
  },
];
