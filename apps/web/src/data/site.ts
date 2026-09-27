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
  chromeStore:
    "https://chromewebstore.google.com/detail/programmers-badge-v2/nfaknmfniiemabicmcbdkajapapdglaf?authuser=0&hl=ko",
  githubIssues: "https://github.com/JH8459/programmers-badge-v2/issues",
  programmersLesson: "https://school.programmers.co.kr/learn/courses",
};

export const flowSteps = [
  {
    title: "확장 프로그램 설치",
    description:
      "크롬 확장 프로그램을 설치한 뒤 프로그래머스에 로그인된 브라우저 세션을 유지합니다.",
    meta: "Chrome Extension",
  },
  {
    title: "풀이 기록 동기화",
    description:
      "정답 제출 후 배지 통계를 갱신하고, 연결한 GitHub 저장소에 문제 README와 풀이 코드를 기록합니다.",
    meta: "Badge / GitHub",
  },
  {
    title: "Badge URL 복사",
    description:
      "표준 혹은 미니 버전의 배지를 선택하고 하단의 URL을 복사하여 활용합니다.",
    meta: "Standard / Mini",
  },
];

export const privacySections = [
  {
    id: "privacy-policy",
    title: "개인정보 처리 방침",
    description: "배지 생성과 공개 URL 제공에 필요한 데이터 처리 기준입니다.",
    updatedAt: "2026.09.27",
    clauses: [
      {
        title: "수집하는 정보",
        body: "프로필 식별자, 표시 이름, 풀이 수, 스킬 레벨, 랭킹 정보, 동기화 시각을 처리합니다. GitHub 연결을 선택하면 GitHub 계정 ID와 로그인명, App 설치 ID, 선택한 저장소·브랜치·기록 경로, 정답 제출한 문제 정보와 풀이 코드를 처리합니다.",
      },
      {
        title: "수집하지 않는 정보",
        body: "Programmers 비밀번호·세션 쿠키, GitHub 비밀번호와 개인 access token, 결제 정보, 개인 메시지, 전체 브라우저 방문 기록은 수집하지 않습니다. GitHub App 설치 토큰은 API 서버가 요청 시 짧은 수명으로 발급하고 저장하거나 확장 프로그램에 보내지 않습니다. API는 연결 session token의 hash만 저장합니다.",
      },
      {
        title: "사용 목적",
        body: "표준/미니 SVG 배지와 Markdown snippet을 생성하고 정적 파일 형태로 제공합니다. GitHub를 연결한 경우 사용자가 선택한 저장소에 정답 제출한 문제의 README와 풀이 파일을 커밋합니다.",
      },
      {
        title: "보관과 삭제",
        body: "GitHub 연결, 저장소 설정, 풀이 문제 정보와 기록 상태는 사용자가 연결을 해제할 때까지 보관합니다. 풀이 코드는 GitHub 저장에 실패한 동안에만 재시도 목적으로 API에 보관하고, 저장에 성공하거나 연결을 해제하면 삭제합니다. GitHub에 커밋된 파일은 사용자가 GitHub에서 관리합니다. 배지와 계정 데이터 삭제 요청은 GitHub Issues를 통해 접수합니다.",
      },
    ],
  },
  {
    id: "extension-permissions",
    title: "확장 프로그램 권한 안내",
    description: "크롬 확장 프로그램이 사용하는 권한과 브라우저 세션 처리 기준입니다.",
    updatedAt: "2026.09.27",
    clauses: [
      {
        title: "사용 권한",
        body: "storage, activeTab, tabs, scripting 권한은 배지 동기화, 풀이 코드 수집, GitHub 설정과 popup 표시 목적에만 사용합니다. Programmers 문제와 편집기 코드를 읽기 위한 사이트 접근 권한도 사용합니다. GitHub 연결은 API 서버를 통해 처리합니다.",
      },
      {
        title: "브라우저 세션 활용",
        body: "로그인된 Programmers 브라우저 세션으로 통계와 정답 제출 결과, 문제 설명, 편집기 코드를 읽습니다. Programmers 세션 토큰과 쿠키는 저장하지 않습니다.",
      },
      {
        title: "동기화 방식",
        body: "배지 자동 동기화 또는 직접 동기화가 요청될 때 배지 통계를 전송합니다. GitHub를 연결한 경우 정답 제출 후 문제 정보와 풀이 코드를 선택한 저장소에 기록하도록 API에 전송합니다. GitHub App 설치 토큰은 API 서버가 짧은 수명으로 발급하며 확장 프로그램에 보내지 않습니다.",
      },
      {
        title: "문의",
        body: "권한 사용, 배지 URL, 데이터 삭제 문의는 GitHub Issues를 통해 등록할 수 있습니다.",
      },
    ],
  },
];
