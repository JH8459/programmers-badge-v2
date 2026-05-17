export const siteLinks = {
  apiHealth: "https://api.programmers-badge.jh8459.com/api/health",
  chromeStore: "#",
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
      "문제 풀이 페이지에서 자동 동기화가 실행되거나 직접 동기화를 실행합니다.",
    meta: "Manual / Auto Sync",
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
    updatedAt: "2026.05.17",
    clauses: [
      {
        title: "수집하는 정보",
        body: "프로필 식별자, 표시 이름, 풀이 수, 스킬 레벨, 랭킹 정보, 동기화 시각을 처리합니다.",
      },
      {
        title: "수집하지 않는 정보",
        body: "비밀번호, 세션 토큰, 쿠키, 결제 정보, 개인 메시지, 전체 브라우저 방문 기록은 저장하지 않습니다.",
      },
      {
        title: "사용 목적",
        body: "표준/미니 SVG 배지와 Markdown snippet을 생성하고 정적 파일 형태로 제공하는 데 사용합니다.",
      },
      {
        title: "보관과 삭제",
        body: "배지 URL 제공을 위해 데이터를 보관하며, 삭제 요청은 Github Issues를 통해 접수합니다.",
      },
    ],
  },
  {
    id: "extension-permissions",
    title: "확장 프로그램 권한 안내",
    description: "크롬 확장 프로그램이 사용하는 권한과 브라우저 세션 처리 기준입니다.",
    updatedAt: "2026.05.17",
    clauses: [
      {
        title: "사용 권한",
        body: "storage, activeTab, tabs, scripting 권한은 배지 동기화와 popup 표시 목적에만 사용합니다.",
      },
      {
        title: "브라우저 세션 활용",
        body: "로그인된 Programmers 브라우저 세션으로 풀이 기록을 확인하되, 세션 토큰은 저장하지 않습니다.",
      },
      {
        title: "동기화 방식",
        body: "제출 시그널 또는 직접 동기화 요청이 있을 때 필요한 최소 데이터만 API로 전송합니다.",
      },
      {
        title: "문의",
        body: "권한 사용, 배지 URL, 데이터 삭제 문의는 Github Issues를 통해 등록할 수 있습니다.",
      },
    ],
  },
];
