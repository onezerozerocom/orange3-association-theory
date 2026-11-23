/* =====================================================================
   ws.js · 문제 풀이 (app.js 다음, core.js 앞에서 불러옵니다)
   「연관 분석 학습지」의 문항을 단계마다 그대로 넣고, '저장하기'로 이 브라우저에 답을 저장합니다.
   ===================================================================== */

/* ---------- 답 ('저장하기'를 누르면 이 브라우저에 저장, 다음에 열면 이어서) ---------- */
const WS_KEY = 'association-theory-ws-answers-v2';
let WSA = {}, savedAt = null;
try { const d = JSON.parse(localStorage.getItem(WS_KEY) || 'null'); if (d && d.a) { WSA = d.a; savedAt = d.at || null; } } catch (e) {}
let savedSnap = JSON.stringify(WSA);

/* ---------- 입력 칸 만들기 ---------- */
const bl = (k, w = 6, lab = '빈칸') => `<span class="ws-bl">(<input class="ws-in" data-k="${k}" style="width:${w}em" aria-label="${lab}" autocomplete="off">)</span>`;
const bi = (k, w = 5, lab = '빈칸') => `<input class="ws-in" data-k="${k}" style="width:${w}em" aria-label="${lab}" autocomplete="off">`;
const ti = (k, lab = '칸', cls = '') => `<input class="ws-in ws-cell ${cls}" data-k="${k}" aria-label="${lab}" autocomplete="off">`;
const pick = (k, opts, lab = '') => `<span class="ws-pick" role="radiogroup"${lab ? ` aria-label="${lab}"` : ''}>${opts.map(o => `<label><input type="radio" name="${k}" data-k="${k}" value="${o}"><span>${o}</span></label>`).join('')}</span>`;
const ta = (k, rows = 3, lab = '답') => `<textarea class="ws-ta" data-k="${k}" rows="${rows}" aria-label="${lab}"></textarea>`;
const tbl = (head, rows, o = {}) => `<div class="tw"><table class="ws-t${o.cls ? ' ' + o.cls : ''}"><thead><tr>${head.map((h, i) => `<th class="${i === 0 ? 'l' : ''}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr${r.given ? ' class="ws-given"' : ''}>${(r.cells || r).map((c, i) => `<td class="${i === 0 ? 'l' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const wsCard = (title, body, o = {}) => `<section class="card wide ws${o.plain ? ' plain' : ''}"><div class="card-h"><h3 class="ws-h">${title}</h3>${o.sub ? `<p>${o.sub}</p>` : ''}</div>${body}</section>`;
const q = t => `<p class="ws-q">▣ ${t}</p>`;
const qn = t => `<p class="ws-q">${t}</p>`;   // ① ② 처럼 번호가 있는 문항은 ▣ 없이
const box = h => `<div class="ws-box">${h}</div>`;   // 답을 쓰는 문장 묶음
const L = t => `<p class="ws-l">${t}</p>`;
const R0 = STEPS.map(s => s.render);
// [표1]을 다시 볼 수 있는 접기 상자 (3~5단계)
const t1Ref = () => `<details class="guide t1ref"><summary><span>표1</span>편의점 거래 기록 다시 보기</summary>${txCards(T1, T1_ITEMS, [])}</details>`;

/* ---------- 문항에 쓰는 항목집합 · 규칙 (학습지 순서 그대로) ---------- */
const [CUP, KIM, HOT, SODA] = [0, 1, 2, 3];
const SETS = [[CUP], [KIM], [HOT], [SODA], [CUP, KIM], [CUP, HOT], [KIM, HOT], [CUP, SODA], [KIM, SODA], [HOT, SODA], [CUP, KIM, HOT], [CUP, KIM, SODA], [CUP, HOT, SODA], [KIM, HOT, SODA], [CUP, KIM, HOT, SODA]];
const T1S = s => setName(s, T1_ITEMS);
const RULES = [[CUP, KIM], [KIM, CUP], [KIM, SODA], [SODA, KIM]];
const RN = ([a, b]) => `${T1_ITEMS[a]} → ${T1_ITEMS[b]}`;

/* ---------- 문항 목록 (진행률 · 단계 완료에 씀) ---------- */
function FIELDS() {
  return [
    ['think', '생각 열기', 1], ...['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(x => ['s1_' + x, '개념 빈칸', 1]),
    ['is_N', '전체 거래 수', 2], ['is_1', '1-항목집합 개수', 2], ['is_2', '2-항목집합', 2], ['is_2c', '2-항목집합 개수', 2], ['is_3', '3-항목집합', 2], ['is_3c', '3-항목집합 개수', 2], ['is_4', '4-항목집합', 2], ['is_4c', '4-항목집합 개수', 2], ['is_tot', '전체 항목집합 수', 2],
    ...SETS.slice(1).map((s, j) => [['sc', 'so'].map(p => [p + (j + 1), T1S(s), 3])]).flat(2),
    ['mn', '최소 몇 건', 3],
    ...[1, 2].map(j => [['lfn' + j, `향상도 분자 ${j}`, 4], ['lfa' + j, `향상도 분모 앞 ${j}`, 4], ['lfb' + j, `향상도 분모 뒤 ${j}`, 4], ['lc' + j, `독립과 비교 ${j}`, 4]]).flat(), ['lwhy', '향상도가 더 낮은 까닭', 4],
    ...[1, 2, 3].map(j => ['cfn', 'cfd', 'cp'].map(p => [p + j, RN(RULES[j]), 5])).flat(), ['cwhy', '두 방향의 신뢰도', 5],
    ...[1, 2, 3].map(j => ['ts', 'tl', 'tc'].map(p => [p + j, RN(RULES[j]), 6])).flat(),
    ...[['pa', '① 지표 1'], ['pb', '① 지표 2'], ['pc', '① 더 볼 지표'], ['ka', '㉠ 항목 1'], ['kb', '㉠ 항목 2'], ['ks', '㉠ 지지도'], ['kl', '㉠ 향상도'], ['xa', '㉡ 사는 상품'], ['xb', '㉡ 할인 상품'], ['xc', '㉡ 신뢰도'], ['xr', '㉡ 반대 방향 신뢰도'], ['good', '처음 행사'], ['gwhy', '처음 행사 까닭']].map(([k, n]) => [k, n, 6])
  ];
}
const SEC_LIST = [[1, '개념', '오늘의 질문'], [2, '항목집합', '1단계'], [3, '지지도', '2단계'], [4, '향상도', '3단계'], [5, '신뢰도', '4단계'], [6, '종합', '5단계']];
const SEC_NAMES = Object.fromEntries(SEC_LIST.map(([n, t, s]) => [n, n === 1 ? '개념' : `${s} ${t}`]));
const filled = k => String(WSA[k] ?? '').trim() !== '';
const secFields = s => FIELDS().filter(f => f[2] === s);

/* ---------- 0. 먼저 알아보기 ---------- */
STEPS[0].goal = '연관 분석이 무엇인지, 이 앱에서 어떤 순서로 공부하는지 살펴보세요.';
STEPS[0].render = () => card('이 앱에서 할 일',
  `<p class="note">편의점 거래 기록을 보고 지지도 · 향상도 · 신뢰도를 직접 계산하여, 어떤 행사를 할지 정해 봅니다.&nbsp;각 단계의 빈칸과 질문에 답을 써 보세요.</p>` +
  `<ol class="proc">${SEC_LIST.map(([to, t, s]) => `<li><button type="button" data-act="go" data-step="${to}"><b>${t}</b><small>${s}</small></button></li>`).join('')}</ol>` +
  `<p class="note"><b>저장하기</b>를 누르면 이 브라우저에 저장되어, 다음에 다시 열어도 이어서 풀 수 있습니다.</p>`, { sub: '단계를 누르면 해당 단계로 이동합니다.' });

/* ---------- 1. 개념 ---------- */
STEPS[1].render = () =>
  wsCard('[생각 열기]',
    q('온라인 쇼핑몰에서 어떤 상품을 장바구니에 담았더니 다른 상품을 추천받은 적이 있는가?&nbsp;그때 어떤 상품을 담았고, 어떤 상품을 추천받았는지 써 보자.&nbsp;쇼핑몰은 무엇을 근거로 그 상품을 추천했을까?') + ta('think', 3, '생각 열기')) +
  wsCard('1. 연관 분석 모델의 개념',
    L(`- 연관 분석: 데이터 간의 유용한 규칙이나 패턴과 같이 일련의 ${bl('s1_a', 5)}을 찾아내는 분석 방법`) +
    L(`- 고객들의 상품 구매 데이터에서 품목 간의 연관성을 분석할 때 자주 사용하여 ${bl('s1_b', 6)} 분석이라고도 한다.`) +
    L(`- ${bl('s1_c', 6)}: ‘만약 A가 발생하면 B도 발생할 가능성이 높다.’로 만들어진다.&nbsp;(A → B)`) +
    L('- 활용 예시') +
    L(`&nbsp;&nbsp;① 판매를 촉진하는 ${bl('s1_d', 4)} 상품을 선정하여 진열 위치 변경`) +
    L('&nbsp;&nbsp;② 온라인 쇼핑몰의 고객 맞춤형 광고') +
    L('&nbsp;&nbsp;③ 인터넷 동영상 서비스(OTT)의 추천 알고리즘') +
    L(`- 유의미한 규칙을 찾으려면 ${bl('s1_e', 4)}, ${bl('s1_f', 4)}, ${bl('s1_g', 4)}를 측정한다.`) +
    `<p class="ws-l ws-goal">→ 오늘은 편의점 거래 기록으로 세 지표를 직접 계산하여, 어떤 행사를 할지 정해 본다.</p>`) +
  card('맥주는 왜 기저귀 옆에 있을까?',
    `<p class="note">미국의 한 드럭스토어가 고객들이 어떤 물건을 한 바구니에 함께 담는지 알아보려고 구매 내역 데이터를 분석했습니다.&nbsp;그 결과, 전혀 관련이 없어 보이는 맥주와 기저귀를 함께 사는 경우가 많다는 사실을 발견했습니다.&nbsp;퇴근길에 기저귀를 사러 들른 사람들이 맥주도 함께 사 가는 경우가 많았기 때문이라는 설명이 있습니다.&nbsp;이 결과를 보고 몇몇 마트에서는 맥주와 기저귀를 가까운 곳에 진열하기도 했습니다.</p><p class="hint">출처: [똑똑!빅데이터] ① 맥주는 왜 기저귀 옆에 있을까 (이데일리, 2017.01.21.)의 내용을 줄여 옮김</p>`,
    { pre: '<p class="eyebrow">데이터 이야기</p>' }) +
  card('편의점에서 ‘컵라면 + 삼각김밥’ 행사를 한다면, 무엇을 보고 정할까?',
    `<p class="note">① 묶음 상품(컵라면 + 삼각김밥 세트, 방향 없음)&nbsp;&nbsp;&nbsp;② 교차 할인(‘컵라면 사면 삼각김밥 반값’, 방향 있음)</p><p class="hint">1~4단계에서 지표를 계산한 뒤, 5단계에서 이 질문에 답합니다.</p>`,
    { pre: '<p class="eyebrow">오늘의 질문</p>' });

/* ---------- 2. [1단계] 항목집합 ---------- */
STEPS[2].render = () => R0[2]() +
  wsCard('[1단계] 항목집합 구하기',
    q('[표1]을 보고 작성 칸을 채워 보자.') +
    `<p class="ws-l ws-total">전체 거래 수 : ${ti('is_N', '전체 거래 수', 'sm')} 건</p>` +
    tbl(['확인할 내용', '항목집합', '개수'], [
      ['1-항목집합', '<span class="ws-ref">{컵라면}, {삼각김밥}, {핫바}, {탄산음료}</span>', ti('is_1', '1-항목집합 개수', 'sm')],
      ['2-항목집합', `<span class="ws-ref">{컵라면, 삼각김밥},</span>${ta('is_2', 2, '2-항목집합')}`, ti('is_2c', '2-항목집합 개수', 'sm')],
      ['3-항목집합', ta('is_3', 2, '3-항목집합'), ti('is_3c', '3-항목집합 개수', 'sm')],
      ['4-항목집합', ta('is_4', 1, '4-항목집합'), ti('is_4c', '4-항목집합 개수', 'sm')],
      ['전체 항목집합 수', '<span class="ws-dash">-</span>', ti('is_tot', '전체 항목집합 수', 'sm')]], { cls: 'is' }) +
    `<p class="ws-note">※ 전체 항목집합 수(공집합 제외) = 2<sup>n</sup> − 1&nbsp;&nbsp;(n = 서로 다른 항목의 수)<br>※ 2-항목집합 수 = <sub>n</sub>C<sub>2</sub> = n × (n − 1) ÷ 2</p>`);

/* ---------- 3. [2단계] 지지도와 빈발항목집합 ---------- */
// 소수 셋째 자리 반올림 (0.9375 → 0.938처럼, 컴퓨터 소수 오차 보정)
const r3 = x => (Math.round(x * 1000 + 1e-6) / 1000).toFixed(3);
// 계산식 · 지지도 칸: 학생이 쓴 '포함 거래 수'로 자동 작성 (비어 있으면 □)
function autoFormulas() {
  document.querySelectorAll('[data-auto]').forEach(el => {
    const v = String(WSA[el.dataset.auto] ?? '').trim(), num = v !== '' && isFinite(+v);
    el.textContent = el.dataset.kind === 'sup' ? (num ? r3(+v / 5) : '□') : `${v || '□'} ÷ 5`;
    el.classList.toggle('empty', el.dataset.kind === 'sup' ? !num : !v);
  });
  // 향상도 = 분자 ÷ (분모 앞 × 분모 뒤), 세 칸이 모두 숫자일 때만
  document.querySelectorAll('[data-lift]').forEach(el => {
    const j = el.dataset.lift, [n, a, b] = ['lfn', 'lfa', 'lfb'].map(p => String(WSA[p + j] ?? '').trim());
    const ok = [n, a, b].every(x => x !== '' && isFinite(+x)) && +a * +b !== 0;
    el.textContent = ok ? r3(+n / (+a * +b)) : '□';
    el.classList.toggle('empty', !ok);
  });
  // 신뢰도 = 앞 ÷ 뒤, 두 칸이 모두 숫자일 때만
  document.querySelectorAll('[data-conf]').forEach(el => {
    const j = el.dataset.conf, [n, d] = ['cfn', 'cfd'].map(p => String(WSA[p + j] ?? '').trim());
    const ok = [n, d].every(x => x !== '' && isFinite(+x)) && +d !== 0;
    el.textContent = ok ? r3(+n / +d) : '□';
    el.classList.toggle('empty', !ok);
  });
}
STEPS[3].render = () => R0[3]() +
  wsCard('[2단계] 지지도와 빈발항목집합 구하기',
    q('15개 항목집합의 지지도를 빠짐없이 구해 보자.&nbsp;(지지도(X) = X의 모든 항목을 포함한 거래 수 ÷ 5)') +
    L('&nbsp;&nbsp;&nbsp;포함 거래 수를 쓰면 ‘계산식’과 ‘지지도’는 자동으로 채워진다.&nbsp;최소 지지도인 0.4 이상이면 빈발에 O, 미만이면 X로 표시한다.') +
    tbl(['항목집합', '포함 거래 수', '계산식', '지지도', '빈발 O/X'], [
      { given: true, cells: [T1S(SETS[0]), '4', '4 ÷ 5', '0.800', 'O'] },
      ...SETS.slice(1).map((s, j) => [T1S(s), ti('sc' + (j + 1), `${T1S(s)} 포함 거래 수`, 'sm'), `<span class="ws-auto" data-auto="sc${j + 1}"></span>`, `<span class="ws-auto" data-auto="sc${j + 1}" data-kind="sup"></span>`, pick('so' + (j + 1), ['O', 'X'], `${T1S(s)} 빈발`)])
    ], { cls: 'sup' }) +
    SUP_READ +
    q('최소 몇 건 이상 포함되어야 빈발항목집합인가?') + ta('mn', 1, '최소 몇 건'));

/* ---------- 4. [3단계] 향상도 ---------- */
// 향상도 계산식: 분수 막대와 ×는 미리 그려 두고, 숫자(지지도) 세 개만 빈칸에 씀
const liftF = j => `<span class="ws-frac"><span class="num">${ti('lfn' + j, `향상도 분자 ${j}`, 'sm')}</span><span class="den">${ti('lfa' + j, `향상도 분모 앞 ${j}`, 'sm')}<span class="op">×</span>${ti('lfb' + j, `향상도 분모 뒤 ${j}`, 'sm')}</span></span>`;
STEPS[4].render = () => R0[4]() +
  wsCard('[3단계] 향상도로 연관성 분석하기',
    t1Ref() +
    q('2단계에서 구한 빈발 2-항목집합의 향상도를 구해 보자.&nbsp;(향상도는 두 항목의 순서를 바꾸어도 같다.)') +
    tbl(['빈발 2-항목집합', '향상도 계산식', '향상도', '두 항목이 서로 독립<br>(향상도 = 1)일 때와 비교'], [
      [T1S([CUP, KIM]), liftF(1), `<span class="ws-auto" data-lift="1"></span>`, pick('lc1', ['< 1', '= 1', '> 1'], '독립일 때와 비교')],
      [T1S([KIM, SODA]), liftF(2), `<span class="ws-auto" data-lift="2"></span>`, pick('lc2', ['< 1', '= 1', '> 1'], '독립일 때와 비교')]], { cls: 'lift' }) +
    LIFT_READ +
    q('{컵라면, 삼각김밥}은 함께 나온 거래가 3건으로 {삼각김밥, 탄산음료}의 2건보다 많다.&nbsp;그런데 향상도는 왜 더 낮을까?') + ta('lwhy', 3, '향상도가 더 낮은 까닭'));

/* ---------- 5. [4단계] 신뢰도 ---------- */
STEPS[5].render = () => R0[5]() +
  wsCard('[4단계] 방향별 신뢰도 구하기',
    t1Ref() +
    q('하나의 빈발 2-항목집합에서 방향을 바꾼 두 규칙의 신뢰도를 구해 보자.') +
    L('&nbsp;&nbsp;&nbsp;분모는 화살표 앞의 항목 A가 포함된 거래 수이다.') +
    tbl(['연관 규칙', '신뢰도 계산식', '신뢰도', '백분율'], [
      { given: true, cells: [RN(RULES[0]), '3 ÷ 4', '0.750', '75.0%'] },
      ...[1, 2, 3].map(j => [RN(RULES[j]), `<span class="ws-div">${ti('cfn' + j, `${RN(RULES[j])} 계산식 앞`, 'sm')}<span class="op">÷</span>${ti('cfd' + j, `${RN(RULES[j])} 계산식 뒤`, 'sm')}</span>`, `<span class="ws-auto" data-conf="${j}"></span>`, ti('cp' + j, `${RN(RULES[j])} 백분율`, 'sm')])
    ], { cls: 'conf' }) +
    CONF_READ +
    q('생각해 보기: 방향을 바꾸면 신뢰도는 왜 달라질 수 있을까?') + ta('cwhy', 3, '두 방향의 신뢰도'));

/* ---------- 6. [5단계] 종합과 활용 + 저장 ---------- */
// 세 지표 공식: 각각 네모 상자 (테두리는 정의 카드와 같은 색)
const sumBox = (k, h) => `<div class="sum-box ${k}">${MATH(h)}</div>`;
const sumF = sumBox('sup', mt('지지도(A, B)') + mo('=') + mf(nAB, mi('N'))) + sumBox('lift', mt('향상도(A, B)') + mo('=') + mf(PAB, P1('A') + mo('×') + P1('B'))) + sumBox('conf', mt('신뢰도(A → B)') + mo('=') + mf(nAB, mi('n') + mo('(') + mi('A') + mo(')')));
STEPS[6].render = () =>
  wsCard('[5단계] 결과를 종합하고 활용하기',
    `<p class="note">지표 하나만 보면 잘못된 규칙이 남는다.&nbsp;지지도(충분히 자주?)·향상도(우연 이상?)·신뢰도(이 방향으로 믿을 만한가?)를 모두 확인한 규칙만 활용한다.</p><div class="sum3">${sumF}</div>` +
    t1Ref() +
    q('앞에서 계산한 값을 옮겨 적고, 세 지표를 함께 보며 해석해 보자.') +
    tbl(['연관 규칙', '지지도', '향상도', '신뢰도'], [
      { given: true, cells: [RN(RULES[0]), '0.600', '0.938', '0.750'] },
      ...[1, 2, 3].map(j => [RN(RULES[j]), ti('ts' + j, `${RN(RULES[j])} 지지도`, 'sm'), ti('tl' + j, `${RN(RULES[j])} 향상도`, 'sm'), ti('tc' + j, `${RN(RULES[j])} 신뢰도`, 'sm')])
    ], { cls: 'sum' }) +
    qn('① [오늘의 질문] 편의점에서 ㉠ 묶음 상품(방향 없음) ㉡ 교차 할인(방향 있음) 행사를 한다면, 각각 어떤 지표를 근거로 고르겠는가?') +
    box(L(`묶음 상품과 교차 할인 모두 ${bl('pa', 5, '① 지표 1')}와 ${bl('pb', 5, '① 지표 2')}를 확인한다.&nbsp;교차 할인은 방향이 있으므로, 여기에 ${bl('pc', 5, '① 더 볼 지표')}를 더 보고 어느 상품을 기준으로 할지 정한다.&nbsp;단, 거래 수가 5건뿐이므로 더 많은 자료로 다시 확인을 한다.`)) +
    qn(`② ①의 기준에 따라 표의 값을 보고 행사를 정해 보자.&nbsp;또, 처음에 생각한 '컵라면 + 삼각김밥' 행사는 좋은 선택이었을까?`) +
    box(L(`㉠ 묶음 상품: {${bi('ka', 5, '㉠ 항목 1')}, ${bi('kb', 5, '㉠ 항목 2')}} 세트 → 지지도 ${bl('ks', 4, '㉠ 지지도')}, 향상도 ${bl('kl', 4, '㉠ 향상도')}`) +
    L(`㉡ 교차 할인: ${bl('xa', 5, '㉡ 사는 상품')}을/를 사면 ${bl('xb', 5, '㉡ 할인 상품')} 할인 → 신뢰도 ${bl('xc', 4, '㉡ 신뢰도')}, 반대 방향 신뢰도 ${bl('xr', 4, '㉡ 반대 방향 신뢰도')}`) +
    L('단, 거래 수가 5건뿐이므로 더 많은 자료로 다시 확인해야 한다.') +
    L(`처음의 ‘컵라면 + 삼각김밥’ 행사는 좋은 선택이 ${pick('good', ['맞다', '아니다'], '처음 행사')}.&nbsp;함께 산 거래는 3건으로 가장 많지만 향상도가 0.938 &lt; 1로, <span class="ws-fill">(<input class="ws-in" data-k="gwhy" aria-label="처음 행사 까닭" autocomplete="off">) 때문이다.</span>`))) +
  `<section class="card wide ws-submit"><div class="card-h"><p class="eyebrow ws-eye">저장</p><h3>답 저장하기</h3><p>답은 <b>저장하기</b>를 눌러야 이 브라우저에 저장됩니다.&nbsp;다음에 같은 컴퓨터·같은 브라우저로 열면 저장한 답이 그대로 나옵니다.</p></div>
    <div class="ws-left" id="leftList"></div>
    <div class="ws-row"><button type="button" class="btn primary" id="saveBtn2">저장하기</button><button type="button" class="btn danger" id="clearBtn">저장한 답 지우기</button><span class="ws-msg" id="saveMsg2" aria-live="polite"></span></div></section>`;
GROUPS[2] = '1~5단계';

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
APP.afterRender = () => { wsFill(); autoFormulas(); showSaved(); };
document.addEventListener('input', e => {
  const el = e.target.closest('[data-k]');
  if (!el) return;
  if (el.type === 'radio') { if (el.checked) WSA[el.dataset.k] = el.value; }
  else WSA[el.dataset.k] = el.value;
  if (/^(sc|lf|cf)/.test(el.dataset.k)) autoFormulas();
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
