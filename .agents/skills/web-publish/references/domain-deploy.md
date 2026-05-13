# Domain And Deploy Reference

## 목표 도메인 분리

```text
programmers-badge.jh8459.com      -> apps/web public UI
api.programmers-badge.jh8459.com  -> apps/api API + /badge/*.svg
```

초기 public badge URL은 운영 단순성을 위해 아래 형태를 기본으로 둔다.

```text
https://api.programmers-badge.jh8459.com/badge/{slug}.svg
https://api.programmers-badge.jh8459.com/badge/{slug}-mini.svg
```

## Route 53 기준

- parent domain hosted zone이 Route 53에 있으면 같은 hosted zone에 `api.programmers-badge.jh8459.com` record를 추가하는 방식이 기본이다.
- NAS나 reverse proxy가 고정 IP를 가지면 `A` record를 사용한다.
- 다른 hostname으로 위임하거나 CDN/ALB 같은 AWS resource를 쓰면 `CNAME` 또는 alias record를 검토한다.
- 별도 hosted zone을 만들어 subdomain을 위임하는 방식은 더 강한 분리가 필요할 때만 사용한다.

공식 레퍼런스:

- Route 53 records: https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/rrsets-working-with.html
- Route 53 supported record types: https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ResourceRecordTypes.html
- Route 53 subdomain routing: https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-routing-traffic-for-subdomains.html

## Reverse Proxy 기준

도메인 분리 시 proxy는 host 기준으로 분리한다.

```text
Host: programmers-badge.jh8459.com
  -> web upstream

Host: api.programmers-badge.jh8459.com
  -> api upstream
```

API host에서는 아래 route를 유지한다.

```text
/api/health
/api/sync
/api/badge/:slug.svg
/api/badge/:slug/mini.svg
/badge/:slug.svg
/badge/:slug-mini.svg
```

## 변경 체크리스트

- Route 53에 `api` record 추가
- NAS/reverse proxy host routing 추가
- API `PUBLIC_BASE_URL=https://api.programmers-badge.jh8459.com`
- `deploy-web.yml`이 web image만 배포하고 `web` service만 재시작하는지 확인
- extension API base/manifest `host_permissions` 갱신
- CORS allowlist에 필요한 web origin과 extension origin 확인
- Chrome Web Store 개인정보처리방침 URL은 `https://programmers-badge.jh8459.com/privacy`
- 기존 `https://programmers-badge.jh8459.com/api/*` 소비자가 있으면 redirect 또는 migration 기간 결정
