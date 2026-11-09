/* =====================================================================
   연관 분석 모델 · 이론 시뮬레이션 (ws.js가 문제 칸을 더합니다)
   ===================================================================== */
const ITEMS=['껌','커피','사이다','삼각김밥','소화제','아이스크림'];
// 편의점의 상품 주문 내역 6건 (상품 번호는 ITEMS의 순서)
const BOOK=[[3,2,0],[0,1],[3,5,2],[2,5],[4,2,3],[3]];
const APP={key:'association-theory-v1',
  init:()=>({fill:{},checked:false,cell:null,
    A:3,B:2,ans:{},ansChecked:false,visited:[],
    orders:BOOK.map(o=>o.slice()),eA:3,eB:2,
    ds:'book',minSup:.15,minConf:.5,sort:'lift',sel:null}),
  resetStep(i){const d=APP.init(),a=S.app;
    ({1:['fill','checked','cell'],2:['A','B','ans','ansChecked','visited'],3:['A','B','visited'],4:['A','B','visited'],5:['ds','minSup','minConf','sort','sel']}[i]||[]).forEach(k=>a[k]=d[k])}
};

/* ---------- 계산 ---------- */
const gcd=(a,b)=>b?gcd(b,a%b):a;
const frac=(n,d)=>{if(!d)return'—';const g=gcd(n,d)||1;return d/g===1?String(n/g):`${n/g}/${d/g}`};
const fr=(n,d)=>`${n}/${d}${frac(n,d)!==`${n}/${d}`?` = ${frac(n,d)}`:''}`;
function stats(orders,a,b){const N=orders.length,nA=orders.filter(o=>o.includes(a)).length,nB=orders.filter(o=>o.includes(b)).length,nAB=orders.filter(o=>o.includes(a)&&o.includes(b)).length;
  return{N,nA,nB,nAB,sup:N?nAB/N:0,conf:nA?nAB/nA:0,lift:nA&&nB?nAB*N/(nA*nB):0,pA:N?nA/N:0,pB:N?nB/N:0}}
const liftWord=l=>Math.abs(l-1)<1e-12?['= 1','연관성이 없다 (독립적)','']:l>1?['> 1','서로 연관성이 있다','pos']:['< 1','A의 구매가 B의 구매를 억제한다','neg'];
function cooc(orders,n){const m=[...Array(n)].map(()=>Array(n).fill(0));orders.forEach(o=>o.forEach(i=>o.forEach(j=>m[i][j]++)));return m}
// 큰 데이터셋: 편의점 하루 주문 40건 (규칙이 숨어 있는 가상의 데이터)
const ITEMS2=[...ITEMS,'컵라면','빵','우유'];
const BIG=(()=>{const r=rng(2024),out=[];for(let k=0;k<40;k++){const o=new Set();const ramen=r()<.35,kim=ramen?r()<.8:r()<.3,bread=r()<.33,milk=bread?r()<.7:r()<.18,coffee=bread?r()<.5:r()<.22,soda=kim?r()<.5:r()<.3,ice=soda?r()<.12:r()<.32;
  if(ramen)o.add(6);if(kim)o.add(3);if(bread)o.add(7);if(milk)o.add(8);if(coffee)o.add(1);if(soda)o.add(2);if(ice)o.add(5);if(r()<.14)o.add(0);if(r()<.06)o.add(4);if(!o.size)o.add(2);out.push([...o].sort((a,b)=>a-b))}return out})();
const DSETS={book:{t:'편의점 주문 6건',items:ITEMS},big:{t:'편의점 주문 40건 (가상)',items:ITEMS2}};
const dsOrders=ds=>ds==='book'?BOOK:ds==='mine'?A().orders:BIG;
function rulesOf(orders,n){const out=[];for(let a=0;a<n;a++)for(let b=0;b<n;b++){if(a===b)continue;const s=stats(orders,a,b);if(s.nAB>0)out.push({a,b,...s})}return out}

/* ---------- 동시 구매표 빈칸 ---------- */
const BOOKM=cooc(BOOK,6);
// 미리 적어 둔 칸: 껌-껌, 커피-껌, 커피-커피, 사이다-껌, 사이다-커피, 사이다-사이다
const GIVEN=new Set(['0,0','1,0','1,1','2,0','2,1','2,2']);
const BLANKS=[];for(let r=0;r<6;r++)for(let c=0;c<=r;c++)if(!GIVEN.has(`${r},${c}`))BLANKS.push([r,c]);
const fillOk=(r,c)=>String(A().fill[`${r},${c}`]??'').trim()===String(BOOKM[r][c]);
function markFill(){BLANKS.forEach(([r,c])=>{const el=document.querySelector(`[data-in="f${r}_${c}"]`);if(!el)return;el.classList.remove('ok','bad');if(A().checked&&String(A().fill[`${r},${c}`]??'').trim()!=='')el.classList.add(fillOk(r,c)?'ok':'bad')})}
// 2단계 직접 계산 (삼각김밥 → 사이다)
const BOOK_SC=stats(BOOK,3,2);
const ANS={sup:BOOK_SC.sup,conf:BOOK_SC.conf,lift:BOOK_SC.lift};
const parseNum=v=>{v=String(v||'').trim().replace(/\s/g,'');if(!v)return NaN;if(v.includes('/')){const [a,b]=v.split('/').map(Number);return b?a/b:NaN}return Number(v)};
const ansOk=k=>Math.abs(parseNum(A().ans[k])-ANS[k])<1e-3;
function markAns(){['sup','conf','lift'].forEach(k=>{const el=document.querySelector(`[data-in="ans_${k}"]`);if(!el)return;el.classList.remove('ok','bad');if(A().ansChecked&&String(A().ans[k]||'').trim())el.classList.add(ansOk(k)?'ok':'bad')})}

/* ---------- 도전 과제 ---------- */
const bigBest=()=>{const rs=rulesOf(BIG,ITEMS2.length).filter(r=>r.sup>=.1);return rs.reduce((m,r)=>r.lift>m.lift?r:m)};
const MISSIONS={
  fill:{step:1,t:'동시 구매표의 빈칸 15개를 모두 바르게 채우기',ok:()=>BLANKS.every(([r,c])=>fillOk(r,c))},
  hot:{step:1,t:'같은 품목을 뺀 칸 중 수치가 가장 높은 칸을 눌러 어느 주문인지 확인하기',ok:()=>A().cell==='3,2'||A().cell==='2,3'},
  calc:{step:2,t:'‘삼각김밥 → 사이다’의 지지도, 신뢰도, 향상도를 직접 계산해 입력하기',ok:()=>['sup','conf','lift'].every(ansOk)},
  dir:{step:2,t:'A와 B의 순서를 바꾸면 신뢰도가 달라지는 두 품목 찾기 (A → B, B → A 둘 다 확인)',ok:()=>A().visited.some(v=>{const [a,b]=v.split(',').map(Number);return A().visited.includes(`${b},${a}`)&&Math.abs(stats(BOOK,a,b).conf-stats(BOOK,b,a).conf)>1e-9})},
  lt1:{step:3,t:'주문 내역을 바꿔 선택한 규칙의 향상도를 1보다 작게 만들기',ok:()=>{const s=stats(A().orders,A().eA,A().eB);return s.nAB>0&&s.lift<1-1e-12}},
  eq1:{step:3,t:'주문 내역을 바꿔 향상도를 정확히 1로 만들기 (두 품목이 독립)',ok:()=>{const s=stats(A().orders,A().eA,A().eB);return s.nAB>0&&s.nAB*s.N===s.nA*s.nB}},
  add:{step:3,t:'새 주문을 추가해 전체 거래 수가 바뀌면 값이 어떻게 달라지는지 확인하기',ok:()=>A().orders.length>6},
  best:{step:4,t:'‘편의점 주문 40건’에서 지지도 0.1 이상인 규칙 중 향상도가 가장 높은 규칙을 눌러 선택하기',ok:()=>{const b=bigBest(),s=A().sel;return A().ds==='big'&&s&&s[0]===b.a&&s[1]===b.b}},
  good:{step:4,t:'‘편의점 주문 40건’에서 최소 지지도와 최소 신뢰도를 조절해 좋은 규칙을 3개 이하로 줄이기',ok:()=>A().ds==='big'&&goodRules().length>0&&goodRules().length<=3}
};

/* ---------- 연습문제 ---------- */
const QUIZ={
  a1:{title:'연관 분석과 동시 구매표',intro:'1단계 시뮬레이션을 떠올리며 알맞은 답을 고르세요.',items:[
    {q:'연관 분석을 ‘장바구니 분석’이라고도 부르는 까닭은 무엇인가요?',o:['장바구니의 크기를 분석하기 때문','고객의 상품 구매 데이터에서 품목 간 연관성을 분석할 때 자주 쓰기 때문','장바구니 가격을 예측하기 때문','고객을 비슷한 그룹으로 묶기 때문'],a:2,e:'연관 분석은 고객들의 상품 구매 데이터에서 판매되는 품목 간의 연관성을 분석할 때 자주 사용합니다.\n그래서 장바구니 분석이라고도 합니다.'},
    {q:'동시 구매표에서 (삼각김밥, 사이다) 칸의 값 3은 무엇을 뜻하나요?',o:['삼각김밥이 3개 팔렸다','사이다가 3개 팔렸다','삼각김밥과 사이다가 함께 판매된 주문이 3건이다','3번 주문에서 함께 팔렸다'],a:3,e:'주문 1, 3, 5번에 삼각김밥과 사이다가 함께 들어 있습니다.\n그래서 동시 구매 횟수는 3입니다.'},
    {q:'연관 규칙은 어떤 형태로 만들어지나요?',o:['A와 B는 같은 군집이다','A가 커지면 B는 작아진다','A는 B의 평균이다','만약 A가 발생하면 B도 발생할 가능성이 높다'],a:4,e:'연관 규칙은 ‘만약 A가 발생하면 B도 발생할 가능성이 높다.’로 만들어집니다.\n예: 삼각김밥을 구매하면 사이다를 구매할 가능성이 높다.'}]},
  a2:{title:'지지도 · 신뢰도 · 향상도 계산',intro:'2단계 시뮬레이션의 결과를 보고 알맞은 답을 고르세요.',items:[
    {q:'6건의 주문에서 ‘삼각김밥 → 사이다’의 지지도는 얼마인가요?',o:['0.5','0.75','1.125','0.67'],a:1,e:'삼각김밥과 사이다가 동시에 포함된 거래는 3건이므로 지지도 = 3/6 = 0.5입니다.\n전체 거래의 50%에서 두 상품을 함께 구매했습니다.'},
    {q:'‘삼각김밥 → 사이다’의 신뢰도 0.75가 뜻하는 것은 무엇인가요?',o:['전체 주문의 75%에 사이다가 있다','사이다를 산 사람의 75%가 삼각김밥을 샀다','삼각김밥을 산 사람들 중 75%가 사이다를 샀다','두 상품의 매출이 75% 늘었다'],a:3,e:'신뢰도 = P(A∩B) ÷ P(A) = (3/6) ÷ (4/6) = 3/4입니다.\n삼각김밥을 구매한 4건 중 3건에서 사이다도 구매했습니다.'},
    {q:'연관 규칙이 의미가 있는지 확인할 때의 계산 순서로 알맞은 것은 무엇인가요?',o:['향상도 → 신뢰도 → 지지도','지지도 → 신뢰도 → 향상도','신뢰도 → 지지도 → 향상도','향상도만 계산한다'],a:2,e:'지지도 → 신뢰도 → 향상도 순서로 계산하여 향상도가 1보다 큰지 확인해야 합니다.\n신뢰도는 지지도를, 향상도는 신뢰도를 이용해 구합니다.'}]},
  a3:{title:'향상도의 의미',intro:'3단계 시뮬레이션의 결과를 보고 알맞은 답을 고르세요.',items:[
    {q:'‘삼각김밥 → 사이다’의 향상도가 1.125일 때 알맞은 해석은 무엇인가요?',o:['두 상품의 구매가 서로 연관성이 있다','두 상품은 독립적이다','삼각김밥 구매가 사이다 구매를 억제한다','알 수 없다'],a:1,e:'향상도가 1보다 크므로 삼각김밥의 구매와 사이다의 구매가 서로 연관성이 있습니다.\n이를 바탕으로 함께 진열하거나 묶음 상품을 만들 수 있습니다.'},
    {q:'향상도가 정확히 1이라면 두 항목의 관계는 어떤가요?',o:['강한 연관성이 있다','A의 구매가 B를 억제한다','연관성이 없다 (독립적)','신뢰도가 1이다'],a:3,e:'향상도 = 1이면 A를 샀는지와 관계없이 B를 살 확률이 같습니다.\n즉 두 항목의 구매는 연관성이 없는 독립적인 관계입니다.'},
    {q:'향상도가 1보다 작을 때 알맞은 해석은 무엇인가요?',o:['A의 구매가 B의 구매를 억제한다 (음의 상관관계)','두 항목은 항상 함께 팔린다','지지도가 0이다','좋은 연관 규칙이다'],a:1,e:'향상도 < 1이면 A를 산 사람은 오히려 B를 덜 사는 경향이 있습니다.\nA의 구매가 B의 구매를 억제하는 음의 상관관계입니다.'}]},
  a4:{title:'연관 규칙 찾기',intro:'4단계 시뮬레이션의 결과를 보고 알맞은 답을 고르세요.',items:[
    {q:'좋은 연관 규칙의 조건으로 알맞은 것은 무엇인가요?',o:['지지도만 높으면 된다','향상도가 1보다 작아야 한다','신뢰도가 0이어야 한다','최소 지지도를 만족하고, 신뢰도가 높으며, 향상도가 1보다 크다'],a:4,e:'찾은 연관성이 최소 지지도를 만족하고, 높은 신뢰성을 가지면서 1보다 큰 향상도를 만족하면 좋은 결과를 얻었다고 할 수 있습니다.\n시뮬레이션에서 초록 표시가 이 조건을 만족하는 규칙입니다.'},
    {q:'‘커피 → 껌’은 신뢰도가 1이지만 주문 1건에서만 나타났습니다. 이 규칙을 조심해야 하는 까닭은 무엇인가요?',o:['향상도가 1보다 작아서','지지도가 낮아 우연히 나타났을 수 있어서','신뢰도는 1을 넘을 수 없어서','껌은 분석할 수 없어서'],a:2,e:'지지도가 낮으면 그 규칙이 나타난 거래 수가 너무 적어서 우연일 수 있습니다.\n그래서 최소 지지도 조건으로 이런 규칙을 걸러 냅니다.'},
    {q:'연관 분석 결과를 활용하는 방법으로 알맞지 <u>않은</u> 것은 무엇인가요?',o:['함께 잘 팔리는 상품을 가까이 진열한다','묶음 상품을 구성한다','연관 상품의 쿠폰을 발행한다','고객의 키와 몸무게를 예측한다'],a:4,e:'연관 분석은 상품의 진열, 쿠폰 발행, 묶음 상품 구성, 맞춤형 광고, 동영상 추천 등에 활용합니다.\n키와 몸무게처럼 수치를 예측하는 것은 회귀 분석에 가깝습니다.'}]}
};

/* ---------- 화면 조각 ---------- */
const VIEWS={};
const itemChip=(i,a,b,names=ITEMS)=>`<span class="item ${i===a?'on-a':i===b?'on-b':''}">${names[i]}</span>`;
function orderCards(orders,a,b,o={}){return`<div class="orders">${orders.map((od,k)=>{const ha=od.includes(a),hb=od.includes(b),cls=ha&&hb?'ab':ha?'a':hb?'b':'';
  return`<div class="order ${cls} ${o.dim&&!(ha||hb)||o.dimA&&!ha?'dim':''}"><h4><span>주문 ${k+1}</span><span>${ha&&hb?'A · B 모두':ha?'A만':hb?'B만':''}</span></h4><div class="items">${o.edit?ITEMS.map((n,i)=>`<button type="button" class="item ${od.includes(i)?(i===a?'on-a':i===b?'on-b':''):'off'}" data-act="tog" data-o="${k}" data-i="${i}" aria-pressed="${od.includes(i)}">${n}</button>`).join(''):od.map(i=>itemChip(i,a,b)).join('')}</div></div>`}).join('')}</div>`}
// 벤 다이어그램: 각 영역에 주문 번호를 표시합니다
function venn(orders,a,b,f=''){
  const ids=k=>orders.map((o,i)=>[o,i]).filter(([o])=>k(o)).map(([,i])=>i+1);
  const onlyA=ids(o=>o.includes(a)&&!o.includes(b)),both=ids(o=>o.includes(a)&&o.includes(b)),onlyB=ids(o=>!o.includes(a)&&o.includes(b)),none=ids(o=>!o.includes(a)&&!o.includes(b));
  const list=(xs,x,y)=>xs.map((n,k)=>`<text class="lbl-b" x="${x}" y="${y+k*22-((xs.length-1)*22)/2}" text-anchor="middle">주문 ${n}</text>`).join('');
  return`<svg class="chart" viewBox="0 0 440 290" style="max-width:460px" role="img" aria-label="A와 B를 포함한 주문의 벤 다이어그램">
  <defs><clipPath id="vennA"><circle cx="165" cy="150" r="92"/></clipPath></defs>
  <rect x="2" y="2" width="436" height="286" rx="12" style="fill:none;stroke:${f==='sup'||f==='lift'?'var(--ink)':'var(--line-2)'};stroke-width:${f==='sup'||f==='lift'?2.5:1}"/><text class="leg" x="14" y="24">전체 거래 ${orders.length}건</text>
  <circle cx="165" cy="150" r="92" style="fill:color-mix(in oklab,var(--s1) 15%,transparent);stroke:var(--s1)" stroke-width="${f==='conf'?4.5:2}"/>
  <circle cx="275" cy="150" r="92" style="fill:color-mix(in oklab,var(--s2) ${f==='lift'?32:15}%,transparent);stroke:var(--s2)" stroke-width="${f==='lift'?4.5:2}"/>
  ${f==='sup'||f==='conf'?`<circle cx="275" cy="150" r="92" clip-path="url(#vennA)" style="fill:color-mix(in oklab,var(--pos) 40%,transparent)"/>`:''}
  <text class="lbl-b" x="120" y="50" text-anchor="middle" style="fill:var(--s1)">A: ${ITEMS[a]} (${onlyA.length+both.length}건)</text><text class="lbl-b" x="320" y="50" text-anchor="middle" style="fill:var(--s2)">B: ${ITEMS[b]} (${onlyB.length+both.length}건)</text>
  ${list(onlyA,118,154)}${list(both,220,154)}${list(onlyB,322,154)}
  <text class="leg" x="220" y="272" text-anchor="middle">A∩B: ${both.length}건${none.length?` · 둘 다 없음: 주문 ${none.join(', ')}`:''}</text><\/svg>`;
}
function mBox(k,s,a,b){const lw=liftWord(s.lift),trim=v=>fx(v,3).replace(/0+$/,'').replace(/\.$/,'');
  if(k==='sup')return`<div class="mbox sup"><h4>지지도 (support)</h4><div class="frac">P(A∩B) = A, B 동시 판매 건 ÷ 전체 판매 건<br>= ${fr(s.nAB,s.N)}</div><div class="val">${trim(s.sup)}</div><small class="hint">전체 거래에서 두 상품이 동시에 판매된 비율</small></div>`;
  if(k==='conf')return`<div class="mbox conf"><h4>신뢰도 (confidence)</h4><div class="frac">P(B|A) = 지지도 ÷ P(A)<br>= (${frac(s.nAB,s.N)}) ÷ (${frac(s.nA,s.N)}) = ${s.nA?frac(s.nAB,s.nA):'—'}</div><div class="val">${s.nA?trim(s.conf):'—'}</div><small class="hint">${ITEMS[a]}을(를) 산 주문 중 ${ITEMS[b]}도 산 비율</small></div>`;
  return`<div class="mbox lift"><h4>향상도 (lift)</h4><div class="frac">신뢰도 ÷ P(B)<br>= (${s.nA?frac(s.nAB,s.nA):'—'}) ÷ (${frac(s.nB,s.N)}) = ${s.nA&&s.nB?frac(s.nAB*s.N,s.nA*s.nB):'—'}</div><div class="val">${s.nA&&s.nB?trim(s.lift):'—'}</div><small class="hint"><span class="badge ${lw[2]}">향상도 ${lw[0]}</span> ${lw[1]}</small></div>`}
function measureBoxes(s,a,b){return`<div class="measure">${['sup','conf','lift'].map(k=>mBox(k,s,a,b)).join('')}</div>`}
// 향상도 단계: 전체 중 B의 비율 P(B)와 A를 산 주문 중 B의 비율(신뢰도)을 막대로 비교
function liftBars(s,a,b){const W=360,BW=290,num=v=>fx(v,3).replace(/0+$/,'').replace(/\.$/,''),
  // 이름과 설명은 막대 위 한 줄에, 막대는 그 아래 전체 너비로 (글자와 막대가 겹치지 않게)
  row=(y,t,sub,v,col)=>`<text x="0" y="${y+13}"><tspan class="lbl-b">${t}</tspan><tspan class="tick" dx="8">${sub}</tspan></text><rect x="0" y="${y+21}" width="${BW}" height="20" rx="4" style="fill:var(--surface-2)"/><rect x="0" y="${y+21}" width="${Math.max(0,Math.min(1,v))*BW}" height="20" rx="4" style="fill:${col}"/><text class="lbl-b" x="${BW+8}" y="${y+36}">${num(v)}</text>`;
  return`<div class="mbox lbars"><h4>신뢰도와 P(B) 비교</h4><svg class="chart lbars" viewBox="0 0 ${W} 108" role="img" aria-label="P(B)와 신뢰도 비교">${row(2,'신뢰도',`${ITEMS[a]} 산 주문 중 ${ITEMS[b]}`,s.conf,'var(--neg)')}${row(56,'P(B)',`전체 주문 중 ${ITEMS[b]}`,s.pB,'var(--s2)')}<\/svg><small class="hint">향상도 = 위 막대(신뢰도) ÷ 아래 막대(P(B))</small></div>`}
// 1단계: 동시 구매표
VIEWS.book1=()=>orderCards(BOOK,A().cell?+A().cell.split(',')[0]:-1,A().cell?+A().cell.split(',')[1]:-1,{dim:!!A().cell});
VIEWS.hotinfo=()=>{markFill();const c=A().cell;if(!c)return`<p class="note">표의 굵은 숫자 칸을 누르면 위의 주문 내역에서 해당 주문이 강조됩니다.</p>`;
  const [r,k]=c.split(',').map(Number),ids=BOOK.map((o,i)=>[o,i]).filter(([o])=>o.includes(r)&&o.includes(k)).map(([,i])=>i+1);
  return`<p class="note"><b>(${ITEMS[r]}, ${ITEMS[k]})</b> ${r===k?`: ${ITEMS[r]}이(가) 들어 있는 주문`:': 두 품목이 함께 들어 있는 주문'} → 주문 ${ids.join(', ')||'없음'} · <b>${ids.length}번</b>${r!==k&&ids.length===3?' · 같은 품목을 뺀 칸 중 가장 높은 값이에요!':''}</p>`};
// 2~4단계: 지지도 · 신뢰도 · 향상도를 따로 살펴봄 (상품 A, B 고르기는 세 단계가 같이 씀)
const MNAME={sup:'지지도',conf:'신뢰도',lift:'향상도'};
// MathML 조각: 분수, 글자, 기약분수
const mt=t=>`<mtext>${t}</mtext>`,mo=t=>`<mo>${t}</mo>`,mi=t=>`<mi>${t}</mi>`;
const mf=(n,d)=>`<mfrac><mrow><mstyle displaystyle="true">${n}</mstyle></mrow><mrow><mstyle displaystyle="true">${d}</mstyle></mrow></mfrac>`;
const mq=(n,d)=>{if(!d)return mt('—');const g=gcd(n,d)||1;return d/g===1?`<mn>${n/g}</mn>`:mf(`<mn>${n/g}</mn>`,`<mn>${d/g}</mn>`)};
const mr=(n,d)=>{const g=gcd(n,d)||1;return g>1&&n?mf(`<mn>${n}</mn>`,`<mn>${d}</mn>`)+mo('=')+mq(n,d):mq(n,d)};   // 3/6 = 1/2 처럼 약분 과정까지
const MATH=h=>`<math display="block">${h}</math>`;
const PM=(x)=>mi('P')+mo('(')+x+mo(')');
const AB=mi('A')+mo('∩')+mi('B');
// 정의 카드: 개념 설명 + 공식
const DEF={
  sup:['전체 거래에서 두 항목 A, B를 모두 포함하는 확률입니다.&nbsp;지지도가 클수록 A와 B를 함께 포함하는 거래가 많습니다.',
    mt('(A → B) 지지도')+mo('=')+PM(AB)+mo('=')+mf(mt('A와 B가 동시에 포함된 거래 수'),mt('전체 거래 수'))],
  conf:['항목 A를 구매한 경우 B도 같이 구매할 확률입니다.&nbsp;신뢰도가 클수록 A를 구매한 경우 B도 많이 구매합니다.',
    mt('(A → B) 신뢰도')+mo('=')+mi('P')+mo('(')+mi('B')+mo('|')+mi('A')+mo(')')+mo('=')+mf(PM(AB),PM(mi('A')))+mo('=')+mf(mt('지지도'),PM(mi('A')))],
  lift:['A를 구매한 경우 B를 구매하는 비율(신뢰도)을, 전체에서 B를 구매하는 비율 P(B)와 비교합니다.&nbsp;B의 구매가 A와 관련이 있는지 확인할 수 있습니다.',
    mt('(A → B) 향상도')+mo('=')+mf(mi('P')+mo('(')+mi('B')+mo('|')+mi('A')+mo(')'),PM(mi('B')))+mo('=')+mf(PM(AB),PM(mi('A'))+PM(mi('B')))+mo('=')+mf(mt('신뢰도'),PM(mi('B')))]};
const defCard=k=>`<section class="card wide mdef ${k}"><div class="mdef-name">${MNAME[k]}</div><div class="mdef-body"><p>${DEF[k][0]}</p><div class="mdef-f">${MATH(DEF[k][1])}</div></div></section>`;
// 계산 흐름: 무엇을 구하는지 → 고른 A, B로 계산 → 결과
function flowBox(k,s,a,b){const A_=ITEMS[a],B_=ITEMS[b],trim=v=>fx(v,3).replace(/0+$/,'').replace(/\.$/,''),rule=mt(`(${A_} → ${B_})`);
  const desc={sup:`전체 거래에서 <b>${A_}</b>과(와) <b>${B_}</b>이(가) 동시에 판매된 비율`,
    conf:`${A_}의 판매 대비 두 상품의 동시 판매(지지도), 즉 <b>${A_}</b>을(를) 구매한 사람들이 <b>${B_}</b>을(를) 구매한 비율`,
    lift:`<b>${A_}</b>을(를) 구매한 사람들이 <b>${B_}</b>을(를) 구매한 비율(신뢰도)이 전체에서 ${B_}을(를) 구매한 비율보다 얼마나 높은지`}[k];
  const calc={sup:MATH(mi('P')+rule+mo('=')+mr(s.nAB,s.N)),
    conf:MATH(rule+mt(' 지지도')+mo('=')+mq(s.nAB,s.N)+mo(','))+MATH(PM(mt(A_))+mo('=')+mr(s.nA,s.N)+mt(' 이므로'))+MATH(mf(mq(s.nAB,s.N),mq(s.nA,s.N))+mo('=')+mq(s.nAB,s.nA)),
    lift:MATH(rule+mt(' 신뢰도')+mo('=')+mq(s.nAB,s.nA)+mo(','))+MATH(PM(mt(B_))+mo('=')+mr(s.nB,s.N)+mt(' 이므로'))+MATH(mf(mq(s.nAB,s.nA),mq(s.nB,s.N))+mo('=')+mq(s.nAB*s.N,s.nA*s.nB))}[k];
  const v={sup:s.sup,conf:s.conf,lift:s.lift}[k];
  return`<div class="mflow ${k}"><div class="mf-desc"><span class="mf-tag">무엇을 구할까?</span><p>${desc}</p></div><div class="mf-arrow" aria-hidden="true">➜</div><div class="mf-calc"><span class="mf-tag">계산하기</span><div class="frac">${calc}</div></div><div class="mf-arrow" aria-hidden="true">➜</div><div class="mf-res"><span>${MNAME[k]}</span><div class="val">${trim(v)}</div></div></div>`}
const VCAP={sup:'굵은 사각형 = 전체 거래, 초록 = A와 B가 겹친 부분',conf:'굵은 원 = A가 들어 있는 주문, 초록 = 그중 B도 들어 있는 부분',lift:'굵은 사각형 = 전체 거래, 진한 원 = B가 들어 있는 주문'};
function pairView(k){const a=A().A,b=A().B;if(a===b)return`<p class="fb bad">A와 B에 서로 다른 상품을 골라 주세요.</p>`;const s=stats(BOOK,a,b);
  return`<div class="sim2"><div>${orderCards(BOOK,a,b,{dimA:k==='conf'})}</div><div>${venn(BOOK,a,b,k)}<p class="hint">${VCAP[k]}</p></div></div><div class="big-eq">규칙: 만약 <em>${ITEMS[a]}</em>을(를) 구매하면 <em>${ITEMS[b]}</em>도 구매할 가능성이 높다</div>${flowBox(k,s,a,b)}${k==='lift'?`<div class="measure">${liftBars(s,a,b)}</div>`:''}`}
VIEWS.sup=()=>pairView('sup');VIEWS.conf=()=>pairView('conf');VIEWS.lift=()=>pairView('lift');
// (예전 향상도 실험 화면: 지금은 단계에서 빠져 있음)
VIEWS.edit=()=>{const a=A().eA,b=A().eB;if(a===b)return`<p class="fb bad">A와 B에 서로 다른 상품을 골라 주세요.</p>`;const o=A().orders,s=stats(o,a,b),lw=liftWord(s.lift);
  const W=520,H=96,max=3,X=v=>20+Math.min(v,max)/max*(W-40);
  const gauge=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="향상도 위치"><rect x="${X(0)}" y="52" width="${X(1)-X(0)}" height="16" style="fill:color-mix(in oklab,var(--lt1) 30%,var(--surface))"/><rect x="${X(1)}" y="52" width="${X(max)-X(1)}" height="16" style="fill:color-mix(in oklab,var(--gt1) 26%,var(--surface))"/><line x1="${X(1)}" x2="${X(1)}" y1="44" y2="76" style="stroke:var(--ink)" stroke-width="2"/>
    ${[0,.5,1,1.5,2,2.5,3].map(v=>`<text class="tick" x="${X(v)}" y="90" text-anchor="middle">${v}${v===3?'+':''}</text>`).join('')}<text class="leg" x="${(X(0)+X(1))/2}" y="12" text-anchor="middle">억제 (&lt; 1)</text><text class="leg" x="${(X(1)+X(max))/2}" y="12" text-anchor="middle">연관 (&gt; 1)</text>
    ${s.nA&&s.nB?`<path d="M${X(s.lift)} 50l-7 -11h14z" style="fill:var(--accent)"/><text class="lbl-b" x="${Math.min(Math.max(X(s.lift),24),W-24)}" y="32" text-anchor="middle">${fx(s.lift,3)}</text>`:''}<\/svg>`;
  return`<div class="btns">${btn('addo','＋ 주문 추가')}${btn('delo','− 마지막 주문 삭제',{dis:o.length<=1})}${btn('booko','처음 주문으로 되돌리기')}</div>
    ${orderCards(o,a,b,{edit:true})}
    ${measureBoxes(s,a,b)}${gauge}
    ${gridTable(['구분','의미'],[['향상도 > 1','두 항목 A, B의 구매가 서로 연관성이 있다.'],['향상도 = 1','두 항목 A, B의 구매는 연관성이 없다(독립적).'],['향상도 < 1','A의 구매가 B의 구매를 억제한다(음의 상관관계).']].map((r,i)=>({cells:[`<b>${r[0]}</b>`,{v:r[1],cls:'l'}],cls:s.nA&&s.nB&&lw[0]===['> 1','= 1','< 1'][i]?'sel':''})),{left:1})}`};
// 5단계: 연관 규칙 찾기
function goodRules(){return rulesOf(dsOrders(A().ds),DSETS[A().ds].items.length).filter(r=>r.sup>=A().minSup-1e-9&&r.conf>=A().minConf-1e-9&&r.lift>1+1e-12)}
VIEWS.rules=()=>{
  const names=DSETS[A().ds].items,rs=rulesOf(dsOrders(A().ds),names.length),key=A().sort;
  const ok=r=>r.sup>=A().minSup-1e-9&&r.conf>=A().minConf-1e-9,good=r=>ok(r)&&r.lift>1+1e-12,sel=A().sel;
  // 조건을 만족하는 규칙을 먼저, 그 안에서 고른 기준의 내림차순으로 보여 줍니다
  rs.sort((x,y)=>ok(y)-ok(x)||y[key]-x[key]||y.sup-x.sup||y.conf-x.conf);
  const P=plot({id:'p-rule',w:480,h:360,x:[0,Math.max(.6,...rs.map(r=>r.sup))*1.08],y:[0,1.08],yt:[0,.2,.4,.6,.8,1],xl:'지지도',yl:'신뢰도',label:'연관 규칙의 지지도와 신뢰도'});
  let s=P.head+`<rect x="${P.X(A().minSup)}" y="${P.Y(1.08)}" width="${Math.max(0,P.X(P.x[1])-P.X(A().minSup))}" height="${Math.max(0,P.Y(A().minConf)-P.Y(1.08))}" style="fill:color-mix(in oklab,var(--pos) 10%,transparent)"/><line x1="${P.X(A().minSup)}" x2="${P.X(A().minSup)}" y1="${P.m.t}" y2="${P.m.t+P.ih}" style="stroke:var(--pos)" stroke-dasharray="5 4"/><line x1="${P.m.l}" x2="${P.m.l+P.iw}" y1="${P.Y(A().minConf)}" y2="${P.Y(A().minConf)}" style="stroke:var(--pos)" stroke-dasharray="5 4"/>`;
  const jit=new Map();
  rs.forEach(r=>{const k=`${r.sup.toFixed(4)},${r.conf.toFixed(4)}`,n=jit.get(k)||0;jit.set(k,n+1);const col=r.lift>1+1e-12?'var(--pos)':r.lift<1-1e-12?'var(--neg)':'var(--unk)',isSel=sel&&sel[0]===r.a&&sel[1]===r.b;
    s+=`<circle data-pick="rule" data-i="${r.a*100+r.b}" cx="${P.X(r.sup)+n*5}" cy="${P.Y(r.conf)-n*5}" r="${isSel?9:4+Math.min(r.lift,3)*1.6}" style="fill:${col};opacity:${ok(r)?.9:.35}" class="ring2" data-tip="${esc(`${names[r.a]} → ${names[r.b]}\n지지도 ${fx(r.sup,3)} · 신뢰도 ${fx(r.conf,3)} · 향상도 ${fx(r.lift,3)}`)}"/>`});
  if(sel){const r=rs.find(x=>x.a===sel[0]&&x.b===sel[1]);if(r)s+=`<circle class="sel-ring" cx="${P.X(r.sup)}" cy="${P.Y(r.conf)}" r="13"/>`}
  s+=P.end;
  const gs=rs.filter(good);
  const rows=rs.slice(0,60).map(r=>({cells:[`<b>${names[r.a]} → ${names[r.b]}</b>`,`${fx(r.sup,3)} <small class="hint">(${r.nAB}/${r.N})</small>`,fx(r.conf,3),{v:fx(r.lift,3),cls:r.lift>1+1e-12?'':'c-out'}],cls:`pick ${good(r)?'good':''} ${sel&&sel[0]===r.a&&sel[1]===r.b?'sel':''}`,i:r.a*100+r.b}));
  const table=`<div class="tw scroll" style="max-height:360px"><table><thead><tr><th class="l">규칙 (A → B)</th><th>지지도</th><th>신뢰도</th><th>향상도</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.cls}" data-pick="rule" data-i="${r.i}">${r.cells.map((c,i)=>typeof c==='object'?`<td class="${i?'':'l '}${c.cls}">${c.v}</td>`:`<td class="${i?'':'l'}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  let selInfo='';if(sel){const r=rs.find(x=>x.a===sel[0]&&x.b===sel[1]);if(r)selInfo=`<div class="big-eq">만약 <em>${names[r.a]}</em>을(를) 구매하면 <em>${names[r.b]}</em>도 구매할 가능성이 높다</div><p class="note">지지도 ${fx(r.sup,3)} · 신뢰도 ${fx(r.conf,3)} · 향상도 ${fx(r.lift,3)} → ${good(r)?'<b>좋은 규칙</b>의 조건을 모두 만족합니다.':r.lift<=1?'향상도가 1 이하라 의미 있는 규칙이 아닙니다.':'최소 지지도나 최소 신뢰도를 만족하지 못합니다.'}</p>`}
  return`<div class="sim2"><div>${s}<p class="hint">원 = 규칙 하나 · <span style="color:var(--pos)">초록</span> 향상도 &gt; 1, <span style="color:var(--neg)">분홍</span> &lt; 1, 회색 = 1 · 연한 초록 영역이 최소 지지도와 최소 신뢰도를 모두 만족하는 곳</p></div><div>
    <div class="stat">${fact('전체 규칙',`${rs.length}개`,'함께 팔린 적 있는 A → B')}${fact('조건 만족',`${rs.filter(ok).length}개`,'최소 지지도 · 신뢰도')}${fact('좋은 규칙',`${gs.length}개`,'조건 만족 + 향상도 > 1','hl')}</div>${selInfo||'<p class="note">표의 행이나 그래프의 원을 눌러 규칙을 선택해 보세요.</p>'}</div></div>${table}<p class="hint">조건을 만족하는 규칙이 위쪽에 먼저 나옵니다 (최대 60개). 향상도가 1 이하인 칸은 빨간색입니다.</p>`;
};

/* ---------- 입력 · 동작 ---------- */
const IN={
  A:{get:()=>A().A,set:v=>{A().A=+v;visit()}},B:{get:()=>A().B,set:v=>{A().B=+v;visit()}},
  eA:{get:()=>A().eA,set:v=>A().eA=+v},eB:{get:()=>A().eB,set:v=>A().eB=+v},
  ds:{get:()=>A().ds,set:v=>{A().ds=v;A().sel=null}},
  minSup:{get:()=>A().minSup,set:v=>A().minSup=v,fmt:v=>fx(v)},minConf:{get:()=>A().minConf,set:v=>A().minConf=v,fmt:v=>fx(v)}
};
BLANKS.forEach(([r,c])=>{IN[`f${r}_${c}`]={get:()=>A().fill[`${r},${c}`]??'',set:v=>{A().fill[`${r},${c}`]=v;markFill()}}});
['sup','conf','lift'].forEach(k=>{IN[`ans_${k}`]={get:()=>A().ans[k]??'',set:v=>{A().ans[k]=v;markAns()}}});
function visit(){const v=`${A().A},${A().B}`;if(A().A!==A().B&&!A().visited.includes(v))A().visited.push(v)}
const ACT={
  fcheck:()=>{A().checked=true;markFill()},
  fshow:()=>{BLANKS.forEach(([r,c])=>A().fill[`${r},${c}`]=String(BOOKM[r][c]));A().checked=true;document.querySelectorAll('.mtx input').forEach(el=>{const [r,c]=el.dataset.in.slice(1).split('_');el.value=A().fill[`${r},${c}`]});markFill()},
  cell:d=>{A().cell=A().cell===d.v?null:d.v;document.querySelectorAll('.mtx td[data-act],.mtx button[data-act="cell"]').forEach(x=>x.closest('td').classList.toggle('hot',x.dataset.v===A().cell))},
  acheck:()=>{A().ansChecked=true;markAns()},
  swap:()=>{const a=A().A;A().A=A().B;A().B=a;visit()},
  tog:d=>{const o=A().orders[+d.o],i=+d.i,k=o.indexOf(i);if(k>=0){if(o.length>1)o.splice(k,1)}else{o.push(i);o.sort((x,y)=>x-y)}},
  addo:()=>{A().orders.push([2])},delo:()=>{if(A().orders.length>1)A().orders.pop()},booko:()=>{A().orders=BOOK.map(o=>o.slice())},
  eswap:()=>{const a=A().eA;A().eA=A().eB;A().eB=a},
  sort:d=>{A().sort=d.v}
};
const DRAG={},CLICK={};
const PICK={rule:v=>{const s=[Math.floor(v/100),v%100];A().sel=A().sel&&A().sel[0]===s[0]&&A().sel[1]===s[1]?null:s}};

/* ---------- 정적 조각 ---------- */
const pairCtl=()=>`<div class="ctls">${itemSelect('A','A (먼저 산 상품)')}<span>→</span>${itemSelect('B','B (함께 산 상품)')}${btn('swap','⇄ A와 B 바꾸기')}</div>`;
const itemSelect=(name,label)=>`<label class="ctl" style="grid-template-columns:auto auto"><span>${label}</span><select class="sel" data-in="${name}">${ITEMS.map((n,i)=>`<option value="${i}">${n}</option>`).join('')}</select></label>`;
function matrixHTML(){return`<div class="tw mtx"><table><thead><tr><th></th>${ITEMS.map(n=>`<th>${n}</th>`).join('')}</tr></thead><tbody>${ITEMS.map((rn,r)=>`<tr><th class="l">${rn}</th>${ITEMS.map((_,c)=>{if(c>r)return`<td class="dash">-</td>`;
  if(GIVEN.has(`${r},${c}`))return`<td class="given ${A().cell===`${r},${c}`?'hot':''}"><button type="button" class="opt" style="padding:0 8px;border:0;background:none" data-act="cell" data-v="${r},${c}">${BOOKM[r][c]}</button></td>`;
  return`<td class="${A().cell===`${r},${c}`?'hot':''}"><input data-in="f${r}_${c}" inputmode="numeric" autocomplete="off" aria-label="${rn} × ${ITEMS[c]}"> <button type="button" class="btn" style="padding:0 5px;font-size:11px" data-act="cell" data-v="${r},${c}" aria-label="주문 보기">👁</button></td>`}).join('')}</tr>`).join('')}</tbody></table></div>`}

/* ---------- 단계 ---------- */
const STEPS=[
{title:'연관 분석 모델 미리 보기',short:'먼저 알아보기',page:'148–149쪽',
  goal:'인터넷 쇼핑몰이나 편의점이 어떻게 함께 팔리는 상품을 찾아내는지 생각해 보고, 연관 분석이 어디에 활용되는지 살펴보세요.',
  concept:'<p><b>연관 분석</b>은 데이터 간의 유용한 규칙이나 패턴과 같이 일련의 연관성을 찾아내는 분석 방법입니다. 고객들의 상품 구매 데이터에서 판매되는 품목 간의 연관성을 분석할 때 자주 사용하여 <b>장바구니 분석</b>이라고도 합니다.</p><p>연관 규칙은 <span class="formula">만약 A가 발생하면 B도 발생할 가능성이 높다</span>로 만들어집니다.</p>',
  render:()=>card('인터넷 쇼핑몰에서는 어떻게 고객에게 적합한 상품을 추천할까?',`<div class="cards" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))">${['고객 데이터와 구매 내역은 서로 관계가 있을까?','물과 바나나를 같이 구입하면 토마토도 같이 사는 걸까?','빵을 구매할 때 함께 구매하는 상품은 무엇이 있을까?','바나나와 우유를 같이 구매하면 우유의 종류도 관련이 있을까?'].map(t=>`<div class="insight"><span>?</span><p>${t}</p></div>`).join('')}</div>`,{pre:'<p class="eyebrow">생각 열기</p>'})+
    card('연관 분석이 활용되는 예',`<div class="cards" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))">${[['판매를 촉진하는 이웃 상품의 선택','함께 잘 팔리는 상품을 가까이 진열합니다. 삼각김밥 옆에 컵라면과 음료를 두는 것처럼요.'],['온라인 쇼핑몰의 맞춤형 광고','스마트폰을 샀더니 케이스를 추천해 주는 것처럼, 함께 살 만한 상품을 보여 줍니다.'],['인터넷 동영상 서비스 추천','이 영상을 본 사람들이 함께 본 영상을 추천하는 알고리즘에 쓰입니다.']].map(([t,d])=>`<div class="hg-group"><b style="font-size:14px;color:var(--ink)">${t}</b><span class="note">${d}</span></div>`).join('')}</div>`)+
    card('음료 매출을 증가시켜라!',`<p class="note" style="font-size:14.5px">모 기업의 마케팅팀은 매출이 저조한 음료 상품 때문에 고민하다가 연관 분석 모델로 소비자 매출 데이터를 분석했습니다. 그 결과 아침 시간대에 여성의 음료 소비가 많았고, 이 소비자들은 음료를 살 때 헬스 초코바 같은 아침 대용 과자를 함께 구매한다는 사실을 알게 되었습니다.</p>`+insight('분석 결과의 활용','음료의 종류를 늘리는 대신 아침 대용으로 먹을 수 있는 과자류를 늘렸고, 그 결과 음료 매출이 늘어났습니다. 연관 규칙: 만약 아침 대용 과자를 사면, 음료도 살 가능성이 높다.'),{pre:'<p class="eyebrow">데이터 이야기</p>'})+
    card('연관 규칙을 찾는 순서',`<ol class="proc">${[['주문 내역 정리','동시 구매표',1],['지지도','함께 팔린 비율',2],['신뢰도','A를 산 사람 중 B',2],['향상도','1보다 큰가?',3],['규칙 찾기','좋은 규칙 고르기',4]].map(([t,s,to])=>`<li><div class="proc-i"><b>${t}</b><small>${s}</small></div></li>`).join('')}</ol><p class="note">‘만약 A이면 B이다.’라는 연관 규칙이 의미를 가지려면 <b>지지도 → 신뢰도 → 향상도</b> 순서로 계산하여 향상도가 1보다 큰지 확인해야 합니다.</p>`)},
{title:'주문 내역과 동시 구매표',short:'동시 구매표',page:'151–152쪽',quiz:'a1',
  goal:'편의점의 주문 내역 6건을 보고, 두 품목이 함께 판매된 횟수를 정리한 동시 구매표를 직접 완성해 봅니다.',
  concept:'<p><b>동시 구매표</b>는 두 품목이 같은 주문에서 함께 판매된 횟수를 정리한 표입니다. 같은 품목끼리 만나는 칸(대각선)에는 그 품목이 판매된 횟수를 적습니다.</p><p>예: 껌은 총 2개가 판매되었고, 껌과 사이다가 동시에 판매된 것은 한 번입니다(주문 1).</p>',
  render:()=>card('편의점의 상품 주문 내역',slot('book1'),{sub:'아래 표의 👁 단추나 숫자를 누르면 해당 품목이 들어 있는 주문이 강조됩니다.'})+
    card('동시 구매표의 빈칸을 채워 보자',`${matrixHTML()}<div class="btns">${btn('fcheck','정답 확인',{cls:'primary'})}${btn('fshow','🧑‍🏫 정답 채우기')}</div>${slot('hotinfo')}`,{sub:'교과서 152쪽 스스로 실습 1 · 굵은 숫자는 교과서에 이미 적혀 있는 칸입니다.'}),
  calc(){const m=BOOKM;return`# 동시 구매표 = 두 품목이 함께 들어 있는 주문 수
# (? = 아직 채우지 않았거나 틀린 칸)
${ITEMS.map((n,r)=>`${n.padEnd(5,' ')} ${ITEMS.slice(0,r+1).map((_,c)=>GIVEN.has(`${r},${c}`)||fillOk(r,c)?String(m[r][c]):'?').join('  ')}`).join('\n')}

# 칸을 채우는 방법 (예: 사이다 × 삼각김밥)
주문 1: 삼각김밥, 사이다, 껌     ← 둘 다 있음
주문 3: 삼각김밥, 아이스크림, 사이다 ← 둘 다 있음
주문 5: 소화제, 사이다, 삼각김밥   ← 둘 다 있음
→ 3번

# 내가 채운 칸: ${BLANKS.filter(([r,c])=>String(A().fill[`${r},${c}`]??'').trim()!=='').length} / ${BLANKS.length}  ·  정답 ${BLANKS.filter(([r,c])=>fillOk(r,c)).length}개`}},
{title:'지지도',short:'지지도',
  goal:'상품 A와 B를 골라, 전체 주문 중 두 상품이 함께 들어 있는 주문이 얼마나 되는지 살펴봅니다.',
  concept:'<p><b>지지도</b> = P(A∩B): 전체 거래에서 A, B를 모두 포함하는 비율입니다.</p><p><span class="formula">P(X) = X의 경우의 수 ÷ 전체 경우의 수</span></p>',
  render:()=>defCard('sup')+card('지지도 계산',`${pairCtl()}${slot('sup')}`,{sub:'파란 테두리 = A가 있는 주문, 주황 테두리 = B가 있는 주문, 초록 = 둘 다 있는 주문'})},
{title:'신뢰도',short:'신뢰도',
  goal:'A를 산 주문만 놓고 보았을 때, 그중 B도 산 주문이 얼마나 되는지 살펴봅니다.',
  concept:'<p><b>신뢰도</b> = P(B|A) = 지지도 ÷ P(A): A를 구매할 때 B도 구매할 확률입니다.</p>',
  render:()=>defCard('conf')+card('신뢰도 계산',`${pairCtl()}${slot('conf')}`,{sub:'A가 없는 주문은 흐리게 보입니다.&nbsp;A가 있는 주문 중 B도 있는 주문(초록)을 세어 보세요.'})},
{title:'향상도',short:'향상도',
  goal:'A를 산 주문 중 B를 산 비율(신뢰도)을 전체 주문 중 B를 산 비율 P(B)와 비교해 봅니다.',
  concept:'<p><b>향상도</b> = 신뢰도 ÷ P(B): B의 구매가 A와 관련이 있는지, 독립적인지 확인합니다.</p>',
  render:()=>defCard('lift')+card('향상도 계산',`${pairCtl()}${slot('lift')}`,{sub:'위 막대는 A를 산 주문 중 B의 비율(신뢰도), 아래 막대는 전체 주문 중 B의 비율 P(B)입니다.'})},
{title:'데이터 안에서 연관 규칙 찾기',short:'연관 규칙 찾기',page:'152–153쪽',quiz:'a4',
  goal:'가능한 모든 규칙의 지지도, 신뢰도, 향상도를 한눈에 비교하고, 최소 지지도와 최소 신뢰도 조건으로 의미 있는 규칙만 골라냅니다.',
  concept:'<p>찾은 연관성이 <b>최소 지지도</b>를 만족하고, <b>높은 신뢰도</b>를 가지면서 <b>1보다 큰 향상도</b>를 만족한다면 좋은 결과를 얻었다고 할 수 있습니다. 이러한 연관성을 바탕으로 상품의 진열, 쿠폰 발행, 묶음 상품 구성 등에 활용합니다.</p>',
  render:()=>card('연관 규칙 탐색기',`<div class="ctls"><label class="ctl" style="grid-template-columns:auto auto"><span>데이터</span><select class="sel" data-in="ds">${Object.entries(DSETS).map(([k,v])=>`<option value="${k}">${v.t}</option>`).join('')}</select></label>${seg('sort',[['lift','향상도순'],['conf','신뢰도순'],['sup','지지도순']],A().sort)}</div><div class="ctls">${range('minSup','최소 지지도',0,.6,.05)}${range('minConf','최소 신뢰도',0,1,.05)}</div>${slot('rules')}`,{sub:'표의 행이나 그래프의 원을 누르면 규칙을 선택합니다. 초록 줄이 표시된 행이 좋은 규칙입니다.'})+
    card('발견한 연관 규칙 정리하기',gridTable(['항목','교과서 데이터 (삼각김밥 → 사이다)'],[['가장 높은 품목','(삼각김밥 → 사이다): 3'],['지지도','3/6 = 0.5'],['신뢰도','3/4 = 0.75'],['향상도','9/8 = 1.125'],['발견한 연관 규칙','삼각김밥을 구매하면 사이다를 구매할 가능성이 높다 → 함께 진열하거나 묶음 상품으로 구성']],{left:1}),{sub:'교과서 153쪽 스스로 실습 2~6을 시뮬레이션 결과와 비교해 보세요.'}),
  calc(){const names=DSETS[A().ds].items,gs=goodRules().sort((x,y)=>y.lift-x.lift);let t=`# ${DSETS[A().ds].t}
조건: 지지도 ≥ ${fx(A().minSup)}, 신뢰도 ≥ ${fx(A().minConf)}, 향상도 > 1
좋은 규칙 ${gs.length}개
${gs.slice(0,12).map(r=>`${names[r.a]} → ${names[r.b]}  지지 ${fx(r.sup,2)} 신뢰 ${fx(r.conf,2)} 향상 ${fx(r.lift,2)}`).join('\n')}${gs.length>12?`\n… 외 ${gs.length-12}개`:''}`;
    const sel=A().sel;if(sel){const s=stats(dsOrders(A().ds),sel[0],sel[1]);t+=`\n\n# 선택한 규칙: ${names[sel[0]]} → ${names[sel[1]]}\n지지도 = ${s.nAB} ÷ ${s.N} = ${fx(s.sup,3)}\n신뢰도 = ${s.nAB} ÷ ${s.nA} = ${fx(s.conf,3)}\n향상도 = ${fx(s.conf,3)} ÷ (${s.nB} ÷ ${s.N}) = ${fx(s.lift,3)}`}
    return t}}
];
const GROUPS={0:'시작',1:'연관 분석 모델'};
function FLOW(){const a=A(),s=a.A!==a.B?stats(BOOK,a.A,a.B):null,e=a.eA!==a.eB?stats(a.orders,a.eA,a.eB):null,filled=BLANKS.filter(([r,c])=>fillOk(r,c)).length;
  return[
    {steps:[1,0],l:'동시 구매표',b:`${filled} / ${BLANKS.length} 칸`,s:'주문 6건 정리',d:S.done.has('fill'),wait:!filled},
    {steps:[2],l:'지지도',b:s?fx(s.sup,3):'—',s:s?`${ITEMS[a.A]} → ${ITEMS[a.B]}`:'A, B 선택',d:S.done.has('calc')},
    {steps:[2],l:'신뢰도',b:s?fx(s.conf,3):'—',s:'지지도 ÷ P(A)',d:S.done.has('calc')},
    {steps:[3],l:'향상도',b:e?fx(e.lift,3):'—',s:e?liftWord(e.lift)[1]:'A, B 선택',d:S.done.has('lt1')&&S.done.has('eq1')},
    {steps:[4],l:'연관 규칙',b:`좋은 규칙 ${goodRules().length}개`,s:DSETS[a.ds].t,d:S.done.has('best')}]}
const KEYNOTE=`# 연관 분석 모델 핵심 정리

# 1. 연관 분석 (장바구니 분석)
데이터 간의 유용한 규칙이나 패턴을 찾는 분석
연관 규칙: 만약 A가 발생하면 B도 발생할 가능성이 높다

# 2. 연관 규칙 발견 방법 (지지도 → 신뢰도 → 향상도)
P(X) = X의 경우의 수 ÷ 전체 경우의 수
지지도 (A→B) = P(A∩B)
  = A와 B가 동시에 포함된 거래 수 ÷ 전체 거래 수
신뢰도 (A→B) = P(B|A) = P(A∩B) ÷ P(A)
향상도 (A→B) = P(B|A) ÷ P(B)
             = P(A∩B) ÷ (P(A) × P(B))

# 3. 향상도의 의미
향상도 > 1 → 서로 연관성이 있다
향상도 = 1 → 연관성이 없다 (독립적)
향상도 < 1 → A의 구매가 B의 구매를 억제한다

# 4. 좋은 연관 규칙
최소 지지도 만족 + 높은 신뢰도 + 향상도 > 1

# 예 (삼각김밥 → 사이다)
지지도 = 3/6 = 0.5
신뢰도 = (1/2) ÷ (2/3) = 3/4 = 0.75
향상도 = (3/4) ÷ (2/3) = 9/8 = 1.125`;
