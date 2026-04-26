import { SKILL_CHECK_IMAGE_BASE64 } from "./skill-check-image";

interface BadgeColor {
  start: string;
  middle: string;
  end: string;
}

export interface BadgeUserData {
  name: string;
  skillCheck?: {
    level?: number;
  };
  ranking: {
    score: number;
    rank: number;
  };
  codingTest: {
    solved: number;
    total: number;
  };
}

export interface ProgrammersBadgeModel {
  displayName: string;
  solvedCount: number;
  solvedTotal: number;
  skillLevel: number;
  rankingScore: number;
  rankingRank: number;
}

const BADGE_COLORS: BadgeColor[] = [
  { start: "#F49347;", middle: "#984400;", end: "#492000;" },
  { start: "#939195;", middle: "#6B7E91;", end: "#1F354A;" },
  { start: "#FFC944;", middle: "#FFAF44;", end: "#FF9632;" },
  { start: "#8CC584;", middle: "#45B2D3;", end: "#51A795;" },
  { start: "#96B8DC;", middle: "#3EA5DB;", end: "#4D6399;" },
  { start: "#E45B62;", middle: "#E14476;", end: "#CA0059;" },
];

const clampSkillLevel = (skillLevel: number): number => {
  if (!Number.isFinite(skillLevel)) {
    return 0;
  }

  return Math.min(Math.max(Math.trunc(skillLevel), 0), BADGE_COLORS.length - 1);
};

export const renderBadgeSvg = (userData: BadgeUserData): string => {
  const colors = BADGE_COLORS[clampSkillLevel(userData.skillCheck?.level ?? 0)]!;

  return `<?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="350px" height="170px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" xmlns:xlink="http://www.w3.org/1999/xlink">

        <!-- CSS -->
        <style>
            .title_no {
                font-size: 3rem;
                font-weight: 1000;
                font-family: 'Noto Sans KR', sans-serif;
            }

            .title_id {
                font-size: 1.3rem;
                font-weight: 1000;
                font-family: 'Noto Sans KR', sans-serif;
            }

            .sub_title {
                font-size: 1rem;
                font-weight: 700;
                font-family: 'Noto Sans KR', sans-serif;
            }

            .value {
                font-size: 1rem;
                font-weight: 500;
                font-family: 'Noto Sans KR', sans-serif;
            }

            .group {
                animation: delayFadeIn 2s ease-in-out forwards
            }

            @keyframes delayFadeIn {
                0% { opacity: 0; }
                80% { opacity: 0; }
                100% { opacity: 1; }
            }
        </style>

        <!-- 그라데이션 색상 -->
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="35%">
                <stop offset="10%" style="stop-color: ${colors.start}stop-opacity:1">
                    <animate attributeName="stop-opacity" values="0.7; 0.73; 0.9 ; 0.97; 1; 0.97; 0.9; 0.73; 0.7;" dur="4s" repeatCount="indefinite" repeatDur="01:00"/>
                </stop>
                <stop offset="55%" style="stop-color: ${colors.middle}stop-opacity:1">
                    <animate attributeName="stop-opacity" values="1; 0.95; 0.93; 0.95; 1;" dur="4s" repeatCount="indefinite" repeatDur="01:00"/>
                </stop>
                <stop offset="100%" style="stop-color: ${colors.end}stop-opacity:1">
                    <animate attributeName="stop-opacity" values="1; 0.97; 0.9; 0.83; 0.8; 0.83; 0.9; 0.97; 1;" dur="4s" repeatCount="indefinite" repeatDur="01:00"/>
                </stop>
            </linearGradient>
        </defs>
        <rect width="350" height="170" rx="10" ry="10" fill="url(#grad)"/>

        <!-- LINE -->
        <line x1="34" y1="60" x2="34" y2="115" stroke-width="2" stroke="white">
            <animate attributeName="y2" dur="0.8s" fill="freeze" calcMode="spline" keyTimes="0 ; 0.675 ; 1" keySplines="0 0 1 1 ; 0.5 0 0.5 1" values="60 ; 60 ; 115"/>
        </line>

        <line x1="34" y1="115" x2="67" y2="135" stroke-width="2" stroke="white">
            <animate attributeName="x2" dur="1s" fill="freeze" calcMode="spline" keyTimes="0 ; 0.8 ; 1" keySplines="0 0 1 1 ; 0.5 0 0.5 1" values="34 ; 34 ; 67"/>
            <animate attributeName="y2" dur="1s" fill="freeze" calcMode="spline" keyTimes="0 ; 0.8 ; 1" keySplines="0 0 1 1 ; 0.5 0 0.5 1" values="115 ; 115 ; 135"/>
        </line>

        <line x1="67" y1="135" x2="100" y2="115" stroke-width="2" stroke="white">
            <animate attributeName="x2" dur="1.2s" fill="freeze" calcMode="spline" keyTimes="0 ; 0.83333 ; 1" keySplines="0 0 1 1 ; 0.5 0 0.5 1" values="67 ; 67 ; 100"/>
            <animate attributeName="y2" dur="1.2s" fill="freeze" calcMode="spline" keyTimes="0 ; 0.83333 ; 1" keySplines="0 0 1 1 ; 0.5 0 0.5 1" values="135 ; 135 ; 115"/>
        </line>

        <line x1="100" y1="115" x2="100" y2="60" stroke-width="2" stroke="white">
            <animate attributeName="y2" dur="1.5s" fill="freeze" calcMode="spline" keyTimes="0 ; 0.8 ; 1" keySplines="0 0 1 1 ; 0.5 0 0.5 1" values="115 ; 115 ; 60"/>
        </line>

        <line x1="67" y1="140" x2="34" y2="120" stroke-width="2" stroke="white">
            <animate attributeName="x2" dur="1.9s" fill="freeze" calcMode="spline" keyTimes="0 ; 0.78947; 1" keySplines="0 0 1 1 ; 0.5 0 0.5 1" values="67 ; 67 ; 34"/>
            <animate attributeName="y2" dur="1.9s" fill="freeze" calcMode="spline" keyTimes="0 ; 0.78947 ; 1" keySplines="0 0 1 1 ; 0.5 0 0.5 1" values="140 ; 140 ; 120"/>
        </line>

        <line x1="67" y1="140" x2="100" y2="120" stroke-width="2" stroke="white">
            <animate attributeName="x2" dur="1.9s" fill="freeze" calcMode="spline" keyTimes="0 ; 0.78947 ; 1" keySplines="0 0 1 1 ; 0.5 0 0.5 1" values="67 ; 67 ; 100"/>
            <animate attributeName="y2" dur="1.9s" fill="freeze" calcMode="spline" keyTimes="0 ; 0.78947 ; 1" keySplines="0 0 1 1 ; 0.5 0 0.5 1" values="140 ; 140 ; 120"/>
        </line>

        <g class="group">
            <image href="data:image/png;base64,${SKILL_CHECK_IMAGE_BASE64}" x="15" y="15" height="50px" width="100px"/>

            <text text-anchor="middle" dominant-baseline="middle" x="66.5" y="95" class="title_no" style="fill:#ffffff;">${userData.skillCheck?.level ?? 0}</text>

            <text text-anchor="start" x="160" y="55" class="title_id" style="fill:#ffffff;">${userData.name}</text>
        </g>

        <g class="group">
            <text text-anchor="start" x="160" y="95" class="sub_title" style="fill:#ffffff;">Score</text>

            <text text-anchor="start" x="250" y="95" class="value" style="fill:#ffffff;">${userData.ranking.score.toLocaleString()}</text>
        </g>

        <g class="group">
            <text text-anchor="start" x="160" y="115" class="sub_title" style="fill:#ffffff;">Solved</text>

            <text text-anchor="start" x="250" y="115" class="value" style="fill:#ffffff;">${userData.codingTest.solved.toLocaleString()}</text>
        </g>

        <g class="group">
            <text text-anchor="start" x="160" y="135" class="sub_title" style="fill:#ffffff;">Rank</text>

            <text text-anchor="start" x="250" y="135" class="value" style="fill:#ffffff;">${userData.ranking.rank.toLocaleString()}</text>
        </g>

        </svg>
        `;
};

export const renderMiniBadgeSvg = (userData: BadgeUserData): string => {
  const colors = BADGE_COLORS[clampSkillLevel(userData.skillCheck?.level ?? 0)]!;

  return `<?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="20" width="110" version="1.1" xml:space="preserve">

        <!-- CSS -->
        <style>
            <![CDATA[
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=block');
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap');
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes rateBarAnimation {
                    from {
                        stroke-dashoffset: 57.95;
                    }
                    to {
                        stroke-dashoffset: 35;
                    }
                }
                .background {
                    fill: url(#grad1);
                }
                text {
                    fill: white;
                    font-family: 'Noto Sans KR', sans-serif;
                    font-size: 0.7em;
                }
                .gray-area {
                    fill: #555555;
                }
                .tier {
                    font-weight: 700;
                    font-size: 0.78em;
                }
            ]]>
        </style>

        <!-- 그라데이션 색상 -->
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="35%">
                <stop offset="10%" style="stop-color: ${colors.start}stop-opacity:1"/>
                <stop offset="55%" style="stop-color: ${colors.middle}stop-opacity:1"/>
                <stop offset="100%" style="stop-color: ${colors.end}stop-opacity:1"/>
            </linearGradient>
            <clipPath id="round-corner">
                <rect x="0" y="0" width="110" height="20" rx="3" ry="3"/>
            </clipPath>
        </defs>

        <rect width="40" height="20" x="70" y="0" rx="3" ry="3" class="background"/>
        <rect width="75" height="20" clip-path="url(#round-corner)" class="gray-area"/>

        <text text-anchor="middle" alignment-baseline="middle" dominant-baseline="middle" transform="translate(37.5, 11)">programmers</text>
        <text class="tier" text-anchor="middle" alignment-baseline="middle" dominant-baseline="middle" transform="translate(92, 11)">Lv.${userData.skillCheck?.level ?? 0}</text>
    </svg>
    `;
};

export const createProgrammersBadgeRenderModel = ({
  displayName,
  solvedCount,
  solvedTotal,
  skillLevel,
  rankingScore,
  rankingRank,
}: ProgrammersBadgeModel): BadgeUserData => ({
  name: displayName,
  skillCheck: {
    level: clampSkillLevel(skillLevel),
  },
  ranking: {
    score: rankingScore,
    rank: rankingRank,
  },
  codingTest: {
    solved: solvedCount,
    total: solvedTotal,
  },
});
