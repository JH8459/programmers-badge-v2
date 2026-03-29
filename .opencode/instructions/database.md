# Database Guide

## 데이터 소유권

- persistence는 `apps/api`에서만 수행한다.
- `apps/extension`은 DB 연결, ORM, SQL, storage SDK를 직접 다루지 않는다.
- `packages/badge-core`와 `packages/shared-types`는 DB 구현에 의존하지 않는다.

## 저장 원칙

- 저장 대상은 public badge delivery와 sync에 필요한 정규화된 데이터로 제한한다.
- raw HTML, 브라우저 세션 정보, raw credential은 기본적으로 저장하지 않는다.
- public badge를 위해 필요한 식별자와 badge 상태만 최소한으로 유지한다.
- 추후 data retention 정책이 필요하면 문서에 남긴다.

## sync 처리 규칙

- sync payload는 공유 contract와 서버 validation을 모두 통과해야 한다.
- extension 전송 데이터와 서버 내부 저장 모델을 분리한다.
- 여러 엔터티를 함께 갱신할 때는 트랜잭션 또는 이에 준하는 원자성 보장을 사용한다.
- source 데이터가 불완전할 때의 fallback 규칙을 명시한다.

## 스키마 설계 가이드

- badge 렌더링에 직접 필요한 필드와 메타데이터를 구분한다.
- public slug, badge snapshot, 마지막 sync 시각 같은 운영 필드는 명확히 분리한다.
- nullable 필드는 왜 nullable인지 설명 가능해야 한다.
- storage 기술 선택은 구현체에 맡기되, adapter/service 경계는 유지한다.

## 보안과 공개 범위

- public badge endpoint에서 email, 내부 ID, 민감 메타데이터를 노출하지 않는다.
- 서버 비밀 값은 환경 변수에만 둔다.
- 임시 조회나 관리용 로직을 public endpoint와 섞지 않는다.

## 에러 처리와 검증

- 의미 있는 HTTP 상태 코드와 오류 메시지를 반환한다.
- 사용자 입력과 외부 수집 데이터는 서버에서 검증/정규화한다.
- build 이전 단계라도 schema 변경이 있으면 migration 전략 또는 수동 적용 계획을 기록한다.
