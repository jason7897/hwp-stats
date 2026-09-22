// hwp-web-theta.vercel.app 의 방문 통계를 Vercel Web Analytics REST API에서 읽어
// stats.json 으로 저장한다. GitHub Actions 안에서만 실행된다.
//
// 토큰은 GitHub Secret(VERCEL_TOKEN)으로만 들어오고, stats.json 에는 절대 쓰지 않는다.
//
// 조회에 실패하면 이전 숫자를 그대로 두고 error 필드만 갱신한다.
// 값을 추측해서 채우지 않는다 — 틀린 숫자를 보여주는 것이 빈칸보다 나쁘다.

const fs = require("fs");

const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.PROJECT_ID;
const TEAM_ID = process.env.TEAM_ID;
const SITE_START = "2026-09-21T00:00:00.000Z";
const OUT = "stats.json";

function readPrevious() {
  try {
    return JSON.parse(fs.readFileSync(OUT, "utf8"));
  } catch {
    return null;
  }
}

function write(obj) {
  fs.writeFileSync(OUT, JSON.stringify(obj, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(obj, null, 2));
}

function fail(reason, detail) {
  const prev = readPrevious();
  const out = prev && prev.ok ? { ...prev } : { ok: false };
  out.error = { reason, detail: detail || null, at: new Date().toISOString() };
  out.checkedAt = new Date().toISOString();
  write(out);
  // Action 자체는 성공으로 끝낸다. 실패 사실은 stats.json 안에 남는다.
}

async function call(path, params) {
  const url = new URL("https://api.vercel.com" + path);
  url.searchParams.set("projectId", PROJECT_ID);
  if (TEAM_ID) url.searchParams.set("teamId", TEAM_ID);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach((one) => url.searchParams.append(k, one));
    else url.searchParams.set(k, v);
  }
  const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  const text = await r.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 300) };
  }
  if (!r.ok) {
    const msg = (body && body.error && (body.error.message || body.error.code)) || body.raw || "";
    throw new Error(`HTTP ${r.status}${msg ? " — " + msg : ""}`);
  }
  return body;
}

// aggregate 응답의 행 모양이 문서에 확정돼 있지 않아 후보 키를 모두 훑는다.
function rowHost(row) {
  const v = row.referrerHostname ?? row.referrer ?? row.key ?? row.value ?? null;
  if (v === null || v === "" || v === "null") return null;
  return String(v);
}
function rowViews(row) {
  return Number(row.count ?? row.pageviews ?? row.total ?? 0) || 0;
}
function rowVisitors(row) {
  return Number(row.visitors ?? row.uniques ?? 0) || 0;
}
function bucket(host) {
  if (!host) return "direct";
  const h = host.toLowerCase();
  if (h.includes("naver.")) return "naver";
  if (h.includes("google.")) return "google";
  if (h.includes("daum.") || h.includes("kakao.")) return "daum";
  if (h.includes("bing.")) return "bing";
  return "etc";
}

async function main() {
  if (!TOKEN) return fail("no_token", "VERCEL_TOKEN 시크릿이 설정되지 않았습니다.");
  if (!PROJECT_ID) return fail("no_project", "PROJECT_ID 환경변수가 없습니다.");

  const until = new Date().toISOString();
  let count, byReferrer;
  try {
    [count, byReferrer] = await Promise.all([
      call("/v1/query/web-analytics/visits/count", { since: SITE_START, until }),
      call("/v1/query/web-analytics/visits/aggregate", {
        by: ["referrerHostname"],
        since: SITE_START,
        until,
        limit: "50",
      }),
    ]);
  } catch (e) {
    return fail("vercel_api_failed", String(e.message || e));
  }

  const rows = Array.isArray(byReferrer && byReferrer.data) ? byReferrer.data : [];
  const sources = { direct: 0, naver: 0, google: 0, daum: 0, bing: 0, etc: 0 };
  const referrers = [];
  for (const row of rows) {
    const host = rowHost(row);
    const views = rowViews(row);
    sources[bucket(host)] += views;
    referrers.push({ host: host || "(직접 유입)", pageviews: views, visitors: rowVisitors(row) });
  }
  referrers.sort((a, b) => b.pageviews - a.pageviews);

  write({
    ok: true,
    checkedAt: until,
    since: SITE_START,
    total: {
      visitors: Number((count && count.data && count.data.visitors) || 0),
      pageviews: Number((count && count.data && count.data.pageviews) || 0),
    },
    sources,
    referrers: referrers.slice(0, 12),
    // 실제 유입이 생기기 전에는 위 매핑이 맞는지 확인할 길이 없다.
    // 원본 행을 몇 개 남겨두고, 숫자가 붙기 시작하면 이걸 보고 확정한다.
    rawReferrerRows: rows.slice(0, 5),
  });
}

main().catch((e) => fail("unexpected", String((e && e.message) || e)));
