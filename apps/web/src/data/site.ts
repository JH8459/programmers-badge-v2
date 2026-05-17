export const siteLinks = {
  apiHealth: "https://api.programmers-badge.jh8459.com/api/health",
  badgeExample: "https://api.programmers-badge.jh8459.com/badge/{slug}.svg",
  chromeStore: "#",
  githubIssues: "https://github.com/JH8459/programmers-badge-v2/issues",
  programmersLesson: "https://school.programmers.co.kr/learn/courses",
};

export const guideSteps = [
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
    title: "수집하는 정보",
    body: "Programmers badge 생성에 필요한 프로필 식별자, 표시 이름, 풀이 수, 스킬 레벨, 랭킹 정보와 동기화 시각을 처리합니다.",
  },
  {
    title: "수집하지 않는 정보",
    body: "Programmers 비밀번호, 세션 토큰, 쿠키, 결제 정보, 개인 메시지, 브라우저 방문 기록 전체는 저장하지 않습니다.",
  },
  {
    title: "사용 목적",
    body: "public badge SVG, mini badge SVG, Badge URL, Markdown snippet을 생성하고 제공하는 목적에 한정합니다.",
  },
  {
    title: "문의와 삭제 요청",
    body: "저장된 badge 데이터 삭제나 개인정보처리방침 문의는 GitHub Issues를 통해 접수할 수 있습니다.",
  },
];
