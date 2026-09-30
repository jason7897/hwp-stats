# hwp-stats

[HWP 뷰어](https://hwp-web-theta.vercel.app) — 설치 없이 브라우저에서 한글파일(hwp·hwpx)을 열고 PDF·Word로 바꾸는 사이트 — 의 **방문 통계 중계소**입니다.

숫자만 오갑니다. 사이트 소스도, 방문자 개인정보도 여기 없습니다.

## 하는 일

GitHub Actions가 하루 두 번(09:05·18:05 KST) Vercel Web Analytics를 읽어 `stats.json`으로 커밋합니다. 그 파일을 상황판이 읽어 갱신합니다.

왜 이렇게 도는지 — 곧장 가는 경로 세 개가 전부 막혀 있었습니다.

| 시도한 경로 | 결과 |
|---|---|
| 상황판이 사이트를 직접 호출 | 보안 정책이 외부 요청 차단 |
| 예약작업이 사이트를 호출 | 송신 프록시 차단 (`EGRESS_BLOCKED`) |
| 예약작업이 Vercel API 직접 호출 | 응답 `000` |
| **`raw.githubusercontent.com`** | **`301` — 유일하게 열려 있음** |

그래서 GitHub를 중계소로 끼웠습니다.

## 파일

| 파일 | 하는 일 |
|---|---|
| `collect.js` | Vercel Analytics를 읽어 `stats.json`을 씁니다 |
| `.github/workflows/collect.yml` | 하루 두 번 실행, 값이 바뀐 경우에만 커밋 |
| `stats.json` | 현재 수치 |

수집이 실패하면 **이전 숫자를 그대로 두고** `error` 필드만 채웁니다. 추측한 숫자를 넣지 않습니다 — 틀린 숫자를 보여주는 것이 빈칸보다 나쁘기 때문입니다.

## 설정

Actions 시크릿 `VERCEL_TOKEN` 하나가 필요합니다. 스코프는 해당 프로젝트 하나로 제한합니다.

## 본체

사이트는 여기에 있습니다 → **<https://hwp-web-theta.vercel.app>**

한글 문서를 다루는 방법을 정리한 가이드도 함께 있습니다.

- [맥북에서 한글파일(hwp) 여는 법](https://hwp-web-theta.vercel.app/guide/mac/)
- [hwpx 파일이 안 열릴 때](https://hwp-web-theta.vercel.app/guide/hwpx/)
- [한글파일 PDF 변환](https://hwp-web-theta.vercel.app/guide/pdf/)
- [가이드 전체 보기](https://hwp-web-theta.vercel.app/guide/)

파일은 서버로 전송되지 않습니다. 변환은 전부 브라우저 안에서 일어납니다.
