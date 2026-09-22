# hwp-stats

[hwp-web-theta.vercel.app](https://hwp-web-theta.vercel.app) 의 **방문 통계만** 담는 저장소입니다.
사이트 소스 코드는 여기 없습니다.

## 왜 따로 있나

상황판(claude.ai 아티팩트)은 보안 정책상 바깥 주소를 직접 부를 수 없고,
갱신을 맡은 클라우드 예약작업도 `api.vercel.com` 과 `*.vercel.app` 으로 나가지 못합니다.
`raw.githubusercontent.com` 만 열려 있어서, 그 틈으로 숫자를 흘려보내기 위한 중계소입니다.

```
GitHub Actions (매일 09:05 KST)
  └─ Vercel Web Analytics API 조회 → stats.json 커밋
        └─ 클라우드 예약작업이 raw.githubusercontent.com 에서 읽음
              └─ 상황판 저장소에 기록 → 화면 즉시 갱신
```

## 담기는 것 / 담기지 않는 것

담기는 것은 방문자 수, 페이지뷰 수, 유입원 호스트명(예 `search.naver.com`)뿐입니다.
개인을 식별할 수 있는 값은 들어가지 않습니다. Vercel 토큰은 GitHub Secret 에만 두고
`stats.json` 에 쓰지 않습니다.

## 설정

저장소 Settings → Secrets and variables → Actions 에 `VERCEL_TOKEN` 하나가 필요합니다.
없으면 `stats.json` 의 `error.reason` 이 `no_token` 으로 남고, 이전 숫자는 건드리지 않습니다.

## 실패했을 때

수집에 실패해도 워크플로는 성공으로 끝나고, 실패 사실은 `stats.json` 안의 `error` 에 남습니다.
숫자를 추측해서 채우지 않습니다.
