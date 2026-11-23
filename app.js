/* =====================================================================
   연관 분석 모델 · 시뮬레이션 (문제 칸은 ws.js가 더합니다)
   단계는 「연관 분석 학습지」와 같습니다:
   개념 → 1단계 항목집합 → 2단계 지지도·빈발항목집합 → 3단계 향상도 → 4단계 신뢰도 → 5단계 종합
   - 문제는 [표1] 편의점 거래 기록(5건)으로 풉니다.
     ([표1]의 숫자는 거의 모두 문제의 답이라, 값을 계산해 보여 주지 않고 거래를 강조하는 도구만 둡니다.)
   ===================================================================== */

/* ---------- 데이터 ---------- */
// [표1] 편의점 거래 기록 (문제용)
const T1_ITEMS = ['컵라면', '삼각김밥', '핫바', '탄산음료'];
const T1 = [[0, 1], [0, 2], [1, 3], [0, 1, 3], [0, 1]];
// 거래마다 손님 (나이, 성별) · 상품 이모지
const T1_WHO = [[17, '남'], [24, '남'], [15, '여'], [19, '남'], [32, '여']];
const EMO = { 컵라면: '🍜', 삼각김밥: '🍙', 핫바: '🌭', 탄산음료: '🥤' };
const emo = n => `<span class="emo" aria-hidden="true">${EMO[n] || ''}</span>${n}`;
const whoOf = (orders, k) => { const w = (orders === T1 ? T1_WHO : [])[k]; return w ? `<span class="who">${w[0] < 20 ? (w[1] === '여' ? '👧' : '👦') : (w[1] === '여' ? '👩' : '👨')} ${w[0]}세 ${w[1]}자</span>` : ''; };

const APP = {
  key: 'association-theory-ws-v2',
  init: () => ({ pick: [] }),
  resetStep(i) { const d = APP.init(), a = S.app; ({ 2: ['pick'], 3: ['pick'] }[i] || []).forEach(k => a[k] = d[k]); }
};

/* ---------- 항목집합 이름 ---------- */
const setName = (set, names) => `{${set.map(i => names[i]).join(', ')}}`;

/* ---------- 문제 칸 · 시뮬레이션이 같이 쓰는 그림 조각 ---------- */
const VIEWS = {};
const MISSIONS = {};
const QUIZ = {};
const chipList = (o, names, on = []) => o.map(i => `<span class="item ${on.includes(i) ? 'on-a' : ''}">${emo(names[i])}</span>`).join('');
// 거래 카드: set의 항목을 모두 포함한 거래는 초록 테두리
function txCards(orders, names, set, label = '거래') {
  return `<div class="orders">${orders.map((o, k) => {
    const has = set.length && set.every(i => o.includes(i));
    return `<div class="order ${set.length ? (has ? 'ab' : 'dim') : ''}"><h4><span>${label} ${k + 1} ${whoOf(orders, k)}</span></h4><div class="items">${chipList(o, names, set)}</div></div>`;
  }).join('')}</div>`;
}

/* ---------- 지표 정의 카드 (지지도 초록 · 향상도 하늘 · 신뢰도 분홍) ---------- */
const mt = t => `<mtext>${t}</mtext>`, mo = t => `<mo>${t}</mo>`, mi = t => `<mi>${t}</mi>`;
const mf = (n, d) => `<mfrac><mrow><mstyle displaystyle="true">${n}</mstyle></mrow><mrow><mstyle displaystyle="true">${d}</mstyle></mrow></mfrac>`;
const MATH = h => `<math display="block">${h}</math>`;
const nAB = mi('n') + mo('(') + mi('A') + mo('∩') + mi('B') + mo(')');
const PAB = mi('P') + mo('(') + mi('A') + mo('∩') + mi('B') + mo(')');
const P1 = x => mi('P') + mo('(') + mi(x) + mo(')');
const MNAME = { sup: '지지도', lift: '향상도', conf: '신뢰도' };
const DEF = {
  sup: ['<span class="mdef-key">한두 번 함께 나온 조합은 근거가 너무 적어 믿기 어렵다.</span>&nbsp;지지도(支持度: 뒷받침하는 정도)로 충분히 자주 나타난 조합만 남긴다.<br>빈발항목집합은 지지도가 정한 기준(최소 지지도) 이상인 항목집합이다.',
    mt('지지도(A, B)') + mo('=') + mf(nAB, mi('N')) + mo('=') + mf(mt('A와 B를 모두 포함한 거래 수'), mt('전체 거래 수'))],
  lift: ['<span class="mdef-key">각자 인기가 많은 항목은 서로 무관해도 우연히 자주 겹친다.</span>&nbsp;향상도(向上度)는 ‘실제로 함께 나타난 비율’이 ‘서로 무관할 때 기대되는 비율’의 몇 배인지 보고(1보다 크면 기대 이상, 작으면 기대 이하) 우연히 겹친 것인지, 정말 함께 나타나는 경향인지 판단한다.',
    mt('향상도(A, B)') + mo('=') + mf(PAB, P1('A') + mo('×') + P1('B')) + mo('=') + mf(mt('A와 B가 함께 나타난 비율'), mt('A 비율 × B 비율')) + mo('=') + mf(mt('지지도({A, B})'), mt('지지도({A}) × 지지도({B})'))],
  conf: ['<span class="mdef-key">향상도는 방향이 없다.</span>&nbsp;추천·진열은 ‘A를 고른 사람에게 B를 권할까?’처럼 방향이 있으므로, A가 있을 때 B도 있는 비율(신뢰도)을 방향별로 구한다.',
    mt('신뢰도(A → B)') + mo('=') + mf(nAB, mi('n') + mo('(') + mi('A') + mo(')')) + mo('=') + mf(mt('A와 B를 모두 포함한 거래 수'), mt('A를 포함한 거래 수')) + mo('=') + mf(mt('지지도({A, B})'), mt('지지도({A})'))]
};
const defCard = k => `<section class="card wide mdef ${k}"><div class="mdef-name">${MNAME[k]}</div><div class="mdef-body"><p>${DEF[k][0]}</p><div class="mdef-f">${MATH(DEF[k][1])}</div></div></section>`;

/* ---------- 1단계 · 2단계: [표1]에서 항목을 골라 거래 강조 (숫자는 보여 주지 않음) ---------- */
VIEWS.t1 = () => {
  const p = A().pick.slice().sort((a, b) => a - b);
  const head = p.length ? `<div class="big-eq" style="font-family:var(--sans)">고른 항목집합: ${setName(p, T1_ITEMS)} · ${p.length}-항목집합</div>` : '<p class="note">위에서 항목을 눌러 고르면, 고른 항목을 <b>모두</b> 포함한 거래가 초록 테두리로 표시됩니다.</p>';
  return head + txCards(T1, T1_ITEMS, p);
};
const t1Picker = () => `<div class="ctls"><span class="note">항목 고르기</span><div class="btns">${T1_ITEMS.map((n, i) => `<button type="button" class="item ${A().pick.includes(i) ? 'on-a' : 'off'}" data-act="pk" data-i="${i}" aria-pressed="${A().pick.includes(i)}">${emo(n)}</button>`).join('')}${btn('pk0', '모두 지우기')}</div></div>`;
VIEWS.t1pick = t1Picker;

/* ---------- 입력 · 동작 ---------- */
const IN = {};
const ACT = {
  pk: d => { const i = +d.i, p = A().pick, k = p.indexOf(i); if (k >= 0) p.splice(k, 1); else p.push(i); },
  pk0: () => { A().pick = []; }
};
const DRAG = {}, CLICK = {}, PICK = {};

/* ---------- 단계 (시뮬레이션 카드만; 문제 칸은 ws.js) ---------- */
const T1_NOTE = '[표1]은 문제를 푸는 데이터입니다.&nbsp;항목을 고르면 그 항목을 모두 포함한 거래가 강조됩니다.&nbsp;개수는 직접 세어 보세요.';
// 지지도 수치 읽는 법 ([표1]에서 나올 수 없는 0.35로 예시) · ws.js의 2단계 표 아래에 넣음
const SUP_READ = `<div class="lift-box"><h4>지지도 수치는 이렇게 읽어요</h4><ul class="lift-read">
  <li>지지도는 <b>0부터 1</b> 사이의 값이다.&nbsp;1에 가까울수록 전체 거래 중 그 항목집합이 <b>자주</b> 나타난다.</li>
  <li><b>지지도 0.35</b> → 전체 거래의 <b>35%</b>에 그 항목들이 모두 들어 있다.&nbsp;거래가 100건이면 약 35건이다.</li>
  <li class="warn">지지도가 높다고 두 항목이 서로 관련이 있다는 뜻은 아니다.&nbsp;각자 인기가 많으면 함께 나타나는 횟수도 많아진다.&nbsp;(→ 3단계 향상도로 확인)</li>
</ul></div>`;
// 신뢰도 수치 읽는 법 ([표1] 답이 아닌 0.65로 예시) · ws.js의 4단계 표 아래에 넣음
const CONF_READ = `<div class="lift-box"><h4>신뢰도 수치는 이렇게 읽어요</h4><ul class="lift-read">
  <li>신뢰도는 <b>0부터 1</b> 사이의 값이다.&nbsp;1에 가까울수록 A가 있는 거래에 B도 <b>함께</b> 있는 경우가 많다.</li>
  <li><b>신뢰도(A → B) 0.65</b> → A가 들어 있는 거래 중 <b>65%</b>에 B도 들어 있다.&nbsp;A를 산 손님이 100명이면 약 65명이 B도 샀다.</li>
  <li class="warn">신뢰도가 높아도 B가 원래 누구나 많이 사는 상품이라서일 수 있다.&nbsp;또 ‘A 때문에 B를 산다’는 뜻도 아니다.&nbsp;(→ 향상도도 함께 확인)</li>
</ul></div>`;
// 향상도 수치 읽는 법 ([표1] 답이 아닌 1.27로 예시) · ws.js의 3단계 두 문항 사이에 넣음
const LIFT_READ = `<div class="lift-box"><h4>향상도 수치는 이렇게 읽어요</h4><ul class="lift-read">
  <li><b>= 1</b> 기대한 만큼 함께 나타남 (서로 무관, 독립)&nbsp;&nbsp;·&nbsp;&nbsp;<b>&gt; 1</b> 기대보다 자주 함께 나타남&nbsp;&nbsp;·&nbsp;&nbsp;<b>&lt; 1</b> 기대보다 덜 함께 나타남</li>
  <li><b>향상도 1.27</b> → 두 항목이 실제로 함께 나타난 비율이, 서로 무관할 때 기대되는 비율의 <b>1.27배</b>이다.&nbsp;곧 우연히 겹칠 때보다 <b>27% 더 자주</b> 함께 나타난다.</li>
  <li class="warn">‘관련이 1.27배 강하다’, ‘A 때문에 B를 산다’는 뜻은 아니다.&nbsp;향상도는 함께 나타나는 <b>빈도</b>를 기대와 비교한 값일 뿐이다.</li>
</ul></div>`;
const STEPS = [
  { title: '연관 분석 모델 미리 보기', short: '먼저 알아보기', goal: '', concept: '', render: () => '' },
  { title: '연관 분석 모델의 개념', short: '개념', goal: '연관 분석이 무엇인지 알아보고, 오늘 풀어 볼 질문을 확인합니다.', concept: '', render: () => '' },
  { title: '[1단계] 항목집합 구하기', short: '1단계 항목집합', goal: '[표1]에 나오는 항목으로 만들 수 있는 항목집합을 모두 찾아봅니다.', concept: '',
    render: () => card('[표1] 편의점 거래 기록', `${slot('t1pick')}${slot('t1')}`, { sub: T1_NOTE }) },
  { title: '[2단계] 지지도와 빈발항목집합 구하기', short: '2단계 지지도', goal: '항목집합마다 지지도를 구하고, 최소 지지도 이상인 빈발항목집합을 골라냅니다.', concept: '',
    render: () => defCard('sup') +
      card('[표1] 편의점 거래 기록', `${slot('t1pick')}${slot('t1')}`, { sub: T1_NOTE }) },
  { title: '[3단계] 향상도로 연관성 분석하기', short: '3단계 향상도', goal: '실제로 함께 나타난 비율과 서로 무관할 때 기대되는 비율을 비교해 향상도를 구합니다.', concept: '',
    render: () => defCard('lift') },
  { title: '[4단계] 방향별 신뢰도 구하기', short: '4단계 신뢰도', goal: 'A가 있을 때 B도 있는 비율(신뢰도)을 방향을 바꿔 가며 구합니다.', concept: '',
    render: () => defCard('conf') },
  { title: '[5단계] 결과를 종합하고 활용하기', short: '5단계 종합', goal: '지지도 · 향상도 · 신뢰도를 함께 보며 규칙을 해석하고, 편의점 행사를 정해 봅니다.', concept: '', render: () => '' }
];
const GROUPS = { 0: '시작', 1: '연관 분석 모델' };
function FLOW() { return []; }                // ws.js가 문제 칸 진행 상황으로 다시 정의
const KEYNOTE = '';
