/* =====================================================================
   ws.js · 문제 풀이 합치기 (app.js 다음, core.js 앞에서 불러옵니다)
   각 단계에 문제 칸을 넣고, '저장하기'로 이 브라우저에 답을 저장합니다.
   app.js는 연관 분석 이론 시뮬레이션이고, 문제 칸과 관련된 내용은 모두 이 파일에 있습니다.
   ===================================================================== */

/* ---------- 시뮬레이션 저장 키 · 기본값 ---------- */
APP.key = 'association-theory-ws-v1';                    // 원래 이론 앱과 저장 공간을 나눔
const _init0 = APP.init;
APP.init = () => ({ ..._init0(), A: 2, B: 5, eA: 0, eB: 2 });   // 문제로 푸는 '삼각김밥 → 사이다'가 처음부터 보이지 않게

/* ---------- 답 ('저장하기'를 누르면 이 브라우저에 저장, 다음에 열면 이어서) ---------- */
const WS_KEY = 'association-theory-ws-answers-v1';
let WSA = {}, savedAt = null;
try { const d = JSON.parse(localStorage.getItem(WS_KEY) || 'null'); if (d && d.a) { WSA = d.a; savedAt = d.at || null; } } catch (e) {}
let savedSnap = JSON.stringify(WSA);

/* ---------- 입력 칸 만들기 ---------- */
const bl = (k, w = 6, lab = '빈칸') => `<span class="ws-bl">(<input class="ws-in" data-k="${k}" style="width:${w}em" aria-label="${lab}" autocomplete="off">)</span>`;
const ti = (k, lab = '칸', cls = '') => `<input class="ws-in ws-cell ${cls}" data-k="${k}" aria-label="${lab}" autocomplete="off">`;
const pick = (k, opts, lab = '') => `<span class="ws-pick" role="radiogroup"${lab ? ` aria-label="${lab}"` : ''}>${opts.map(o => `<label><input type="radio" name="${k}" data-k="${k}" value="${o}"><span>${o}</span></label>`).join('')}</span>`;
const ta = (k, rows = 3, lab = '답') => `<textarea class="ws-ta" data-k="${k}" rows="${rows}" aria-label="${lab}"></textarea>`;
const tbl = (head, rows, o = {}) => `<div class="tw"><table class="ws-t${o.cls ? ' ' + o.cls : ''}"><thead><tr>${head.map((h, i) => `<th class="${i === 0 ? 'l' : ''}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${i === 0 ? 'l' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const wsCard = (title, body, o = {}) => `<section class="card wide ws${o.plain ? ' plain' : ''}"><div class="card-h"><h3 class="ws-h">${title}</h3>${o.sub ? `<p>${o.sub}</p>` : ''}</div>${body}</section>`;
const q = t => `<p class="ws-q">▣ ${t}</p>`;
const L = t => `<p class="ws-l">${t}</p>`;

/* ---------- 원래 화면 고치기 (정답이 바로 보이는 부분 숨김) ---------- */
function dom(h, fn) { const t = document.createElement('template'); t.innerHTML = h; fn(t.content); return t.innerHTML; }
const splitCards = h => h.split(/(?=<section class="card)/).filter(x => x.trim());
const R0 = STEPS.map(s => s.render);
STEPS.forEach(s => { delete s.quiz; delete s.page; });    // 바로 채점하는 연습문제는 문제 칸으로 대신함, 쪽 표시 없앰
Object.keys(MISSIONS).forEach(k => delete MISSIONS[k]);   // 도전 과제 대신 문제 칸으로 진행률을 셈

// 2~4단계에서 직접 계산하는 규칙: 주문 6건의 '삼각김밥 → 사이다' (반대 방향 포함)
const isWS = (s, a, b) => ((a === 3 && b === 2) || (a === 2 && b === 3)) && s.N === 6 && s.nA === 4 && s.nB === 4 && s.nAB === 3;
// 지지도 · 신뢰도 · 향상도 상자: 향상도의 뜻(4단계 빈칸의 정답)은 빼고 '향상도 > 1' 같은 표시만 남김
const _mBox = mBox;
mBox = (k, s, a, b) => dom(_mBox(k, s, a, b), r => {
  const lift = r.querySelector('.mbox.lift small'), bd = lift?.querySelector('.badge');
  if (lift && bd) { bd.className = 'badge ' + (bd.classList.contains('pos') ? 'gt1' : bd.classList.contains('neg') ? 'lt1' : ''); lift.innerHTML = bd.outerHTML; }   // 향상도 1 기준 색: 지지도·신뢰도 색과 겹치지 않게
  if (!isWS(s, a, b)) return;
  r.querySelectorAll('.mbox').forEach(m => {
    const f = m.querySelector('.frac'); if (f) f.innerHTML = f.innerHTML.split('<br>')[0] + '<br>= ?';
    const v = m.querySelector('.val'); if (v) v.textContent = '?';
    if (m.classList.contains('lift')) m.querySelector('small')?.remove();
  });
});
// 2~4단계 시뮬레이션: 직접 계산하는 규칙이면 건수 · 확률 · 막대를 가림
['sup', 'conf', 'lift'].forEach(k => {
  const f0 = VIEWS[k];
  VIEWS[k] = () => {
    const a = A().A, b = A().B, h = f0();
    if (a === b || !isWS(stats(BOOK, a, b), a, b)) return h;
    return dom(h.replace(/ \(\d+건\)/g, '').replace(/A∩B: \d+건/, 'A∩B')
      .replace(/<div class="mbox lbars">[\s\S]*?<\/svg>/, '<div class="mbox lbars"><h4>신뢰도와 P(B) 비교</h4><p class="note">이 규칙은 막대를 가렸습니다.</p>'), r => {
      // 계산 흐름: '무엇을 구할까?'는 남기고 계산과 결과는 ?로
      r.querySelectorAll('.mflow .frac').forEach(f => { f.innerHTML = '<p class="mf-hidden">?</p>'; });
      r.querySelectorAll('.mflow .val').forEach(v => { v.textContent = '?'; });
    }) + '<p class="note">이 규칙의 값은 아래 [직접 계산하기]에서 구해 보세요.&nbsp;다른 상품을 고르면 값이 다시 보입니다.</p>';
  };
});
// 2~4단계: 계산에 쓰는 숫자가 1단계 동시 구매표의 어느 칸인지 보여 줌
// 숫자는 미리 적어 둔 칸만 보이고, 나머지는 학생이 1단계에서 쓴 값(없으면 ?)을 보여 줌 → 정답이 새로 드러나지 않음
// 처음에는 접혀 있고, 화살표를 누르면 펼쳐짐 (시뮬레이션을 다시 그려도 펼친 상태를 기억)
let ML_OPEN = false;
document.addEventListener('toggle', e => { if (e.target.matches?.('details.ml')) ML_OPEN = e.target.open; }, true);
const LINK_ROLE = { sup: ['ab'], conf: ['ab', 'a'], lift: ['ab', 'a', 'b'] };
function mtxLink(k) {
  const a = A().A, b = A().B; if (a === b) return '';
  const key = (r, c) => r >= c ? [r, c] : [c, r];
  const [abR, abC] = key(a, b), roles = LINK_ROLE[k];
  const role = (r, c) => r === abR && c === abC && roles.includes('ab') ? 'ab' : r === a && c === a && roles.includes('a') ? 'a' : r === b && c === b && roles.includes('b') ? 'b' : '';
  const cellV = (r, c) => GIVEN.has(`${r},${c}`) ? `<b>${BOOKM[r][c]}</b>` : filled(`m${r}${c}`) ? `<span class="ml-mine">${esc(String(WSA[`m${r}${c}`]).trim())}</span>` : '<span class="ml-q">?</span>';
  const tag = { ab: 'A∩B', a: 'A', b: 'B' };
  const table = `<div class="tw mtx ml-t"><table><thead><tr><th></th>${ITEMS.map(n => `<th>${n}</th>`).join('')}</tr></thead><tbody>${ITEMS.map((rn, r) => `<tr><th class="l">${rn}</th>${ITEMS.map((_, c) => {
    if (c > r) return '<td class="dash">-</td>';
    const ro = role(r, c);
    return `<td class="${ro ? 'ml-on ml-' + ro : 'ml-off'}">${ro ? `<i class="ml-tag">${tag[ro]}</i>` : ''}${cellV(r, c)}</td>`;
  }).join('')}</tr>`).join('')}</tbody></table></div>`;
  const rows = [
    ['ab', `(${ITEMS[abR]}, ${ITEMS[abC]}) 칸`, 'A와 B가 함께 들어 있는 주문 수', 'P(A∩B)'],
    ['a', `(${ITEMS[a]}, ${ITEMS[a]}) 칸`, 'A가 들어 있는 주문 수', 'P(A)'],
    ['b', `(${ITEMS[b]}, ${ITEMS[b]}) 칸`, 'B가 들어 있는 주문 수', 'P(B)']
  ].filter(x => roles.includes(x[0]));
  return `<details class="ml"${ML_OPEN ? ' open' : ''}><summary class="ml-h"><b>동시 구매표에서 읽기</b><span>누르면 1단계에서 만든 동시 구매표의 어느 칸이 이 계산에 쓰이는지 보입니다.</span></summary><div class="ml-body">${table}<ul class="ml-list">${rows.map(([ro, where, what, p]) => `<li><i class="ml-tag ml-${ro}">${tag[ro]}</i><span><b>${where}</b><br>${what} → ${p}의 분자</span></li>`).join('')}<li><i class="ml-tag ml-n">전체</i><span><b>전체 거래 수</b><br>주문 내역의 주문 수 → 모든 P( )의 분모</span></li></ul></div><p class="hint">굵은 숫자는 미리 적어 둔 칸, 파란 숫자는 내가 1단계에서 쓴 값, ?는 아직 비어 있는 칸입니다.</p></details>`;
}
['sup', 'conf', 'lift'].forEach(k => { const f1 = VIEWS[k]; VIEWS[k] = () => f1() + mtxLink(k); });
// 연관 규칙 찾기: '좋은 규칙 n개' 숫자는 빼고, 표의 초록 줄을 보고 직접 세게 함
const _rules = VIEWS.rules;
VIEWS.rules = () => dom(_rules().replace(/<div class="tw scroll"/, `<div class="rule-sort"><span>표 정렬</span>${seg('sort', [['lift', '향상도순'], ['conf', '신뢰도순'], ['sup', '지지도순']], A().sort)}</div><div class="tw scroll"`), r => r.querySelectorAll('.fact').forEach(f => { if (f.querySelector('span')?.textContent.trim() === '좋은 규칙') f.remove(); }));
// 1단계: 굵은 숫자 칸만 눌러서 주문을 확인 (빈칸은 직접 셈)
VIEWS.hotinfo = () => {
  const c = A().cell;
  if (!c || !GIVEN.has(c)) return '<p class="note">굵은 숫자 칸을 누르면 위의 주문 내역에서 그 칸에 해당하는 주문이 강조됩니다.</p>';
  const [r, k] = c.split(',').map(Number), ids = BOOK.map((o, i) => [o, i]).filter(([o]) => o.includes(r) && o.includes(k)).map(([, i]) => i + 1);
  return `<p class="note"><b>(${ITEMS[r]}, ${ITEMS[k]})</b> ${r === k ? `: ${ITEMS[r]}이(가) 들어 있는 주문` : ': 두 품목이 함께 들어 있는 주문'} → 주문 ${ids.join(', ') || '없음'} · <b>${ids.length}번</b></p>`;
};
const _book1 = VIEWS.book1;
VIEWS.book1 = () => { const c = A().cell; return c && !GIVEN.has(c) ? orderCards(BOOK, -1, -1) : _book1(); };
function mtxWS() {
  return `<div class="tw mtx"><table><thead><tr><th></th>${ITEMS.map(n => `<th>${n}</th>`).join('')}</tr></thead><tbody>${ITEMS.map((rn, r) => `<tr><th class="l">${rn}</th>${ITEMS.map((cn, c) =>
    c > r ? '<td class="dash">-</td>'
      : GIVEN.has(`${r},${c}`) ? `<td class="given ${A().cell === `${r},${c}` ? 'hot' : ''}"><button type="button" class="opt" style="padding:0 8px;border:0;background:none" data-act="cell" data-v="${r},${c}">${BOOKM[r][c]}</button></td>`
        : `<td>${ti(`m${r}${c}`, `${rn} × ${cn}`)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

/* ---------- 문항 목록 ---------- */
function FIELDS() {
  return [
    ['s1_a', '1-빈칸 (일련의 ○○○)', 1], ['s1_b', '1-빈칸 (○○○ 분석)', 1], ['s1_c', '1-빈칸 (같은 주문에서 ○○)', 1], ['s1_d', '1-빈칸 (판매된 ○○)', 1],
    ...BLANKS.map(([r, c]) => [`m${r}${c}`, `1-동시 구매표 ${ITEMS[r]} × ${ITEMS[c]}`, 1]),
    ['hi_a', '1-▣ 가장 많이 함께 팔린 품목 1', 1], ['hi_b', '1-▣ 가장 많이 함께 팔린 품목 2', 1], ['hi_n', '1-▣ 함께 판매된 횟수', 1],
    ['c_N', '2-전체 거래 수', 2], ['c_nAB', '2-함께 들어 있는 주문 수', 2], ['c_sup', '2-지지도', 2], ['sw1', '2-O/X 지지도', 2],
    ['c_nA', '3-삼각김밥 주문 수', 3], ['c_conf', '3-신뢰도', 3], ['c_m1', '3-신뢰도의 뜻 (○건 중)', 3], ['c_m2', '3-신뢰도의 뜻 (○건에서)', 3], ['sw2', '3-O/X 신뢰도', 3],
    ['c_nB', '4-사이다 주문 수', 4], ['c_pB', '4-P(사이다)', 4], ['c_lift', '4-향상도', 4], ['sw3', '4-O/X 향상도', 4],
    ['lb1', '4-▣ 신뢰도 막대가 더 길 때', 4], ['lb2', '4-▣ 두 막대가 같을 때', 4], ['lb3', '4-▣ 신뢰도 막대가 더 짧을 때', 4],
    ['s3_a', '4-빈칸 (향상도 > 1)', 4], ['s3_b', '4-빈칸 (향상도 = 1)', 4], ['s3_c', '4-빈칸 (향상도 < 1)', 4],
    ['r_n', '5-▣ 좋은 규칙의 수', 5], ['r_a', '5-▣ 향상도가 가장 높은 규칙 A', 5], ['r_b', '5-▣ 향상도가 가장 높은 규칙 B', 5],
    ['r_sup', '5-▣ 그 규칙의 지지도', 5], ['r_conf', '5-▣ 그 규칙의 신뢰도', 5], ['r_lift', '5-▣ 그 규칙의 향상도', 5],
    ['r_why', '5-▣ 지지도가 낮은 규칙을 걸러 내는 까닭', 5], ['r_use', '5-▣ 규칙을 활용하는 방법', 5],
    ...[1, 2, 3, 4, 5].map(i => ['mc' + i, `6-[${i}]`, 6])
  ];
}
const SEC_LIST = [[1, '동시 구매표', '1번'], [2, '지지도', '2번'], [3, '신뢰도', '3번'], [4, '향상도', '4번'], [5, '연관 규칙 찾기', '5번'], [6, '종합 연습', '6번']];
const SEC_NAMES = Object.fromEntries(SEC_LIST.map(([n, t]) => [n, `${n}. ${t}`]));
const filled = k => String(WSA[k] ?? '').trim() !== '';
const secFields = s => FIELDS().filter(f => f[2] === s);

/* ---------- 0. 먼저 알아보기 ---------- */
STEPS[0].goal = '인터넷 쇼핑몰이나 편의점이 어떻게 함께 팔리는 상품을 찾아내는지 생각해 보고, 이 앱에서 어떤 시뮬레이션을 하게 되는지 살펴보세요.';
STEPS[0].concept = '';
STEPS[0].render = () => R0[0]() +
  card('단계별 순서', `<ol class="proc">${SEC_LIST.map(([to, t, s]) => `<li><button type="button" data-act="go" data-step="${to}"><b>${t}</b><small>${s}</small></button></li>`).join('')}</ol><p class="note">각 단계의 시뮬레이션을 살펴보면서 빈칸과 질문에 직접 답을 써 보세요. <b>저장하기</b>를 누르면 이 브라우저에 저장되어, 다음에 다시 열어도 이어서 풀 수 있습니다.</p>`, { sub: '단계를 누르면 해당 단계로 이동합니다.' });

/* ---------- 1. 동시 구매표 ---------- */
STEPS[1].concept = '';
STEPS[1].render = () => {
  const [ordCard] = splitCards(R0[1]());
  return wsCard('1. 연관 분석과 동시 구매표',
    L(`- 연관 분석: 데이터 간의 유용한 규칙이나 패턴과 같이 일련의 ${bl('s1_a', 5)}을 찾아내는 분석 방법`) +
    L(`- 고객들의 상품 구매 데이터에서 판매되는 품목 간의 연관성을 분석할 때 자주 사용하여 ${bl('s1_b', 6)} 분석이라고도 한다.`) +
    L(`- 동시 구매표: 두 품목이 같은 주문에서 ${bl('s1_c', 5)} 판매된 횟수를 정리한 표`) +
    L(`- 같은 품목끼리 만나는 칸에는 그 품목이 판매된 ${bl('s1_d', 4)}를 적는다.`)) +
    ordCard.replace(/<p>[^<]*👁[^<]*<\/p>/, '<p>어느 편의점의 주문 6건입니다.&nbsp;아래 동시 구매표를 채울 때 살펴보세요.</p>') +
    wsCard('[동시 구매표 만들기]',
      q('위의 주문 6건을 보고 동시 구매표의 빈칸을 채워 보자.&nbsp;굵은 숫자는 미리 적어 둔 칸이다.') +
      mtxWS() + slot('hotinfo') +
      `<div class="ws-row">${L(`→ 같은 품목끼리 만나는 칸을 빼면, 함께 판매된 횟수가 가장 많은 두 품목은 ${bl('hi_a', 5)}와 ${bl('hi_b', 5)}이고, ${bl('hi_n', 2)}번 함께 판매되었다.`)}</div>`, { plain: true });
};

/* ---------- 2~4. 지지도 · 신뢰도 · 향상도 (같은 규칙 '삼각김밥 → 사이다'를 한 단계씩) ---------- */
// 4단계 [생각해 보기]: 위 시뮬레이션의 막대만 다시 보여 줌 (여기서도 A, B를 바꿀 수 있음)
VIEWS.lbars2 = () => {
  const a = A().A, b = A().B;
  if (a === b) return '<p class="fb bad">A와 B에 서로 다른 상품을 골라 주세요.</p>';
  const s = stats(BOOK, a, b);
  if (isWS(s, a, b)) return '<p class="note">삼각김밥과 사이다는 아래 [직접 계산하기]에서 구하므로 막대를 가렸습니다.&nbsp;다른 상품을 골라 보세요.</p>';
  return `<div class="measure">${liftBars(s, a, b)}</div>`;
};
const LB_OPT = ['1보다 크다', '1이다', '1보다 작다'];
const RULE_Q = '주문 6건에서 ‘만약 삼각김밥을 구매하면 사이다도 구매할 가능성이 높다.’라는 규칙의';
const swapQ = (k, what) => q(`위의 시뮬레이션에서 다른 상품을 고르고 <b>⇄ A와 B 바꾸기</b>를 눌러 보자.&nbsp;A와 B의 순서를 바꾸어도 ${what}가 늘 같으면 O, 달라질 수 있으면 X 해 보자.`) +
  `<div class="ws-row">${L(`${what}:`)}${pick(k, ['O', 'X'], `${what} O/X`)}</div>`;
[2, 3, 4].forEach(i => { STEPS[i].concept = ''; });
STEPS[2].render = () => R0[2]() +
  wsCard('[직접 계산하기] 삼각김밥 → 사이다의 지지도',
    q(`${RULE_Q} 지지도를 구해 보자.&nbsp;(분수 또는 소수)`) +
    tbl(['구하는 값', '답'], [
      ['전체 거래 수', ti('c_N', '전체 거래 수')],
      ['삼각김밥과 사이다가 함께 들어 있는 주문 수', ti('c_nAB', '함께 들어 있는 주문 수')],
      ['<b>지지도</b> = P(A∩B)', ti('c_sup', '지지도')]]) +
    swapQ('sw1', '지지도'));
STEPS[3].render = () => R0[3]() +
  wsCard('[직접 계산하기] 삼각김밥 → 사이다의 신뢰도',
    q(`${RULE_Q} 신뢰도를 구해 보자.&nbsp;(분수 또는 소수)`) +
    tbl(['구하는 값', '답'], [
      ['삼각김밥이 들어 있는 주문 수', ti('c_nA', '삼각김밥 주문 수')],
      ['<b>신뢰도</b> = 지지도 ÷ P(A)', ti('c_conf', '신뢰도')]]) +
    L(`→ 신뢰도는 삼각김밥을 산 주문 ${bl('c_m1', 2)}건 중 ${bl('c_m2', 2)}건에서 사이다도 샀다는 뜻이다.`) +
    swapQ('sw2', '신뢰도'));
// 4단계 순서: 시뮬레이션 → [생각해 보기] 두 막대로 향상도 읽기 → [직접 계산하기] (맨 끝)
STEPS[4].render = () => R0[4]() +
  wsCard('[생각해 보기] 두 막대로 향상도 읽기',
    `<div class="lb-sim">${pairCtl()}${slot('lbars2')}</div>` +
    q('위의 막대를 보자.&nbsp;A, B를 여러 가지로 바꾸어 가며 두 막대의 길이를 비교하고, 향상도가 어떻게 되는지 골라 보자.&nbsp;그리고 그때 향상도 값의 의미를 써 보자.') +
    tbl(['두 막대의 길이', '향상도', '향상도 값의 의미'], [
      ['신뢰도 막대가 P(B) 막대보다 <b>길다</b>', pick('lb1', LB_OPT, '신뢰도 막대가 더 길 때 향상도'),
        `A를 산 사람이 B를 더 많이 산다.<br>두 항목 A, B의 구매가 서로 ${bl('s3_a', 5)}이 있다.`],
      ['두 막대의 길이가 <b>같다</b>', pick('lb2', LB_OPT, '두 막대가 같을 때 향상도'),
        `A를 샀는지와 관계없이 B를 사는 비율이 같다.<br>두 항목은 서로 ${bl('s3_b', 5)}이다.`],
      ['신뢰도 막대가 P(B) 막대보다 <b>짧다</b>', pick('lb3', LB_OPT, '신뢰도 막대가 더 짧을 때 향상도'),
        `A를 산 사람이 B를 덜 산다.<br>A의 구매가 B의 구매를 ${bl('s3_c', 4)}한다.&nbsp;(음의 상관관계)`]], { cls: 'lb' }), { plain: true }) +
  wsCard('[직접 계산하기] 삼각김밥 → 사이다의 향상도',
    q(`${RULE_Q} 향상도를 구해 보자.&nbsp;(분수 또는 소수)`) +
    tbl(['구하는 값', '답'], [
      ['사이다가 들어 있는 주문 수', ti('c_nB', '사이다 주문 수')],
      ['P(B) = P(사이다)', ti('c_pB', 'P(사이다)')],
      ['<b>향상도</b> = 신뢰도 ÷ P(B)', ti('c_lift', '향상도')]]) +
    swapQ('sw3', '향상도'));

/* ---------- 5. 연관 규칙 찾기 ---------- */
STEPS[5].concept = '';
STEPS[5].render = () => {
  const [ruleCard] = splitCards(R0[5]());
  return ruleCard.replace(/<div class="seg"[^>]*>(?:<button[^>]*data-act="sort"[^>]*>[^<]*<\/button>)+<\/div>/, '').replace(' 초록 줄이 표시된 행이 좋은 규칙입니다.', ' 초록 줄이 표시된 행은 최소 지지도 · 최소 신뢰도를 만족하고 향상도가 1보다 큰 규칙입니다.') +
    wsCard('[연관 규칙 찾기] 편의점 주문 40건',
      q('위의 탐색기에서 데이터를 <b>편의점 주문 40건 (가상)</b>으로 바꾸고, 최소 지지도를 0.2, 최소 신뢰도를 0.6으로 맞춘 뒤 답해 보자.') +
      L(`① 최소 지지도와 최소 신뢰도를 만족하면서 향상도가 1보다 큰 규칙은 ${bl('r_n', 3)}개이다.`) +
      L(`② 그중 향상도가 가장 높은 규칙은 ‘만약 ${bl('r_a', 5)}을(를) 구매하면 ${bl('r_b', 5)}도 구매할 가능성이 높다.’이다.&nbsp;(향상도가 같은 규칙이 여럿이면 하나만 쓴다.)`) +
      tbl(['②의 규칙', '지지도', '신뢰도', '향상도'], [['값 (소수 셋째 자리까지)', ti('r_sup', '지지도'), ti('r_conf', '신뢰도'), ti('r_lift', '향상도')]]) +
      q('③ 데이터를 <b>편의점 주문 6건</b>으로 바꾸어 보자.&nbsp;‘커피 → 껌’은 신뢰도가 1이고 향상도도 높지만, 커피가 들어 있는 주문은 1건뿐이다.&nbsp;최소 지지도를 0.2로 올리면 이 규칙은 어떻게 되는지 확인하고, 지지도가 낮은 규칙을 걸러 내는 까닭을 써 보자.') + ta('r_why', 3, '지지도가 낮은 규칙을 걸러 내는 까닭') +
      q('④ ②에서 찾은 규칙을 편의점에서 어떻게 활용할 수 있을지 써 보자.') + ta('r_use', 3, '규칙을 활용하는 방법'));
};

/* ---------- 6. 종합 연습문제 + 저장 ---------- */
const MC = [
  ['연관 분석에 대한 설명으로 옳은 것은?', ['정답(레이블)이 있는 데이터로 결과값을 예측하는 방법이다.', '비슷한 데이터끼리 같은 군집으로 묶는 방법이다.', '데이터 간의 유용한 규칙이나 패턴과 같은 연관성을 찾아내는 방법이다.', '두 변수 사이의 관계를 직선으로 나타내는 방법이다.', '연관 규칙은 ‘A가 커지면 B는 작아진다.’의 형태로 만들어진다.']],
  ['주문 10건 중 A가 들어 있는 주문이 5건, B가 들어 있는 주문이 4건, A와 B가 함께 들어 있는 주문이 2건이다.&nbsp;‘A → B’의 신뢰도는?', ['0.2', '0.4', '0.5', '0.8', '1']],
  ['[2]의 주문 10건에서 ‘A → B’ 규칙에 대한 설명으로 옳은 것은?', ['지지도는 0.4이다.', '향상도는 1보다 크다.', '향상도가 1이므로 A와 B의 구매는 연관성이 없다.', 'A의 구매가 B의 구매를 억제한다.', '‘B → A’의 신뢰도도 0.4이다.']],
  ['연관 규칙이 의미가 있는지 확인할 때 계산하는 순서로 알맞은 것은?', ['향상도 → 신뢰도 → 지지도', '지지도 → 향상도 → 신뢰도', '신뢰도 → 지지도 → 향상도', '지지도 → 신뢰도 → 향상도', '향상도 → 지지도 → 신뢰도']],
  ['연관 분석 결과를 활용하는 방법으로 알맞지 <u>않은</u> 것은?', ['함께 잘 팔리는 상품을 가까이 진열한다.', '함께 잘 팔리는 상품으로 묶음 상품을 구성한다.', '연관 상품의 할인 쿠폰을 발행한다.', '온라인 쇼핑몰에서 함께 살 만한 상품을 추천한다.', '학생의 공부 시간으로 시험 점수를 예측한다.']]
];
STEPS.push({
  title: '종합 연습', short: '종합 연습',
  goal: '앞에서 배운 내용을 객관식으로 확인하고, 답을 저장합니다.',
  concept: '',
  render: () => wsCard('6. 종합 연습문제',
    MC.map(([t, os], i) => `<div class="ws-mc"><p class="ws-q">[${i + 1}] ${t}</p><div class="ws-mc-o" role="radiogroup" aria-label="${i + 1}번 답">${os.map((o, k) => `<label><input type="radio" name="mc${i + 1}" data-k="mc${i + 1}" value="${k + 1}"><span>${CIRC[k]} ${o}</span></label>`).join('')}</div></div>`).join('')) +
    `<section class="card wide ws-submit"><div class="card-h"><p class="eyebrow ws-eye">저장</p><h3>답 저장하기</h3><p>답은 <b>저장하기</b>를 눌러야 이 브라우저에 저장됩니다.&nbsp;다음에 같은 컴퓨터·같은 브라우저로 열면 저장한 답이 그대로 나옵니다.</p></div>
      <div class="ws-left" id="leftList"></div>
      <div class="ws-row"><button type="button" class="btn primary" id="saveBtn2">저장하기</button><button type="button" class="btn danger" id="clearBtn">저장한 답 지우기</button><span class="ws-msg" id="saveMsg2" aria-live="polite"></span></div></section>`
});
GROUPS[6] = '정리';

/* ---------- 단계 완료 · 진행률 · 위쪽 흐름 ---------- */
APP.stepDone = i => i === 0 ? S.seen.has(0) : secFields(i).every(f => filled(f[0]));
APP.progress = () => {
  const F = FIELDS(), n = F.filter(f => filled(f[0])).length;
  return { title: '풀이 진행률', pct: Math.round(n / F.length * 100), label: `작성한 칸 ${n} / ${F.length}` };
};
FLOW = function () {
  return SEC_LIST.map(([st, l, s]) => {
    const fs = secFields(st), n = fs.filter(f => filled(f[0])).length;
    return { steps: st === 1 ? [1, 0] : [st], l, b: `${n} / ${fs.length}`, s, d: n === fs.length, wait: n === 0 };
  });
};

/* ---------- 입력 채우기 · 저장 ---------- */
function wsFill() {
  document.querySelectorAll('[data-k]').forEach(el => {
    const v = WSA[el.dataset.k];
    if (el.type === 'radio') el.checked = v === el.value;
    else if (el !== document.activeElement) el.value = v ?? '';
  });
  const ll = $('#leftList');
  if (ll) {
    const left = Object.keys(SEC_NAMES).map(s => [s, secFields(+s).filter(f => !filled(f[0])).length]).filter(([, n]) => n);
    ll.innerHTML = left.length ? `<p class="note">아직 비어 있는 칸: ${left.map(([s, n]) => `${SEC_NAMES[s]} <b>${n}칸</b>`).join(', ')}</p>` : '<p class="note">모든 칸을 채웠어요.</p>';
  }
}
APP.afterRender = () => { wsFill(); showSaved(); };
document.addEventListener('input', e => {
  const el = e.target.closest('[data-k]');
  if (!el) return;
  if (el.type === 'radio') { if (el.checked) WSA[el.dataset.k] = el.value; }
  else WSA[el.dataset.k] = el.value;
  renderRail(); renderFlow(); showSaved();
  if ($('#leftList')) wsFill();
});

/* ---------- 저장하기 (이 브라우저에만 저장) ---------- */
function showSaved(msg, cls) {
  const dirty = JSON.stringify(WSA) !== savedSnap;
  const t = savedAt ? new Date(savedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const fab = $('#saveBtn'), m2 = $('#saveMsg2');
  if (fab) { fab.textContent = dirty ? '저장하기' : savedAt ? '✓ 저장됨' : '저장하기'; fab.className = 'fab-btn' + (dirty ? (savedAt ? ' warn' : '') : savedAt ? ' ok' : ''); }
  const text = msg || (dirty ? (savedAt ? `${t}에 저장한 뒤 고친 내용이 있어요.` : '아직 저장하지 않았어요.') : savedAt ? `✓ ${t}에 저장했어요.` : '');
  const c = cls || (dirty ? 'warn' : 'ok');
  if (m2) { m2.textContent = text; m2.className = 'ws-msg ' + c; }
  return { text, c };
}
let fabTimer = null;
function flash(t, cls = '') { const el = $('#fabMsg'); el.textContent = t; el.className = 'fab-msg ' + cls; clearTimeout(fabTimer); fabTimer = setTimeout(() => { el.textContent = ''; }, cls === 'warn' ? 6000 : 3000); }
function saveAll() {
  try {
    const at = Date.now();
    localStorage.setItem(WS_KEY, JSON.stringify({ at, a: WSA }));
    savedAt = at; savedSnap = JSON.stringify(WSA);
    const r = showSaved(); flash('✓ 이 브라우저에 저장했어요.', 'ok'); return r;
  } catch (e) { flash('저장하지 못했어요. 브라우저 설정에서 사이트 데이터 저장을 허용했는지 확인해 주세요.', 'warn'); showSaved('저장하지 못했어요.', 'warn'); }
}
document.addEventListener('click', e => { if (e.target.closest('#saveBtn, #saveBtn2')) saveAll(); });
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveAll(); } });
let clearArmed = null;
document.addEventListener('click', e => {
  const b = e.target.closest('#clearBtn'); if (!b) return;
  if (!clearArmed) { b.textContent = '정말 지울까요? 한 번 더 누르기'; b.classList.add('arm'); clearArmed = setTimeout(() => { clearArmed = null; b.textContent = '저장한 답 지우기'; b.classList.remove('arm'); }, 3000); return; }
  clearTimeout(clearArmed); clearArmed = null;
  try { localStorage.removeItem(WS_KEY); } catch (err) {}
  WSA = {}; savedAt = null; savedSnap = JSON.stringify(WSA);
  renderStep(); flash('저장한 답을 지웠어요.', 'ok');
});
// 저장하지 않은 답이 있으면 탭을 닫기 전에 한 번 묻기
window.addEventListener('beforeunload', e => { if (JSON.stringify(WSA) !== savedSnap) { e.preventDefault(); e.returnValue = ''; } });
setTimeout(() => { wsFill(); showSaved(); }, 0);
