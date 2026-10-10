/* 一問一答・弱点復習・重要数字 */
(function () {
  const CATS = window.CATS, Q = window.QUESTIONS, NUMS = window.NUMS;
  const byId = {}; Q.forEach(q => byId[q.id] = q);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = s => String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const $ = id => document.getElementById(id);

  let rec = store.get("tk_rec", {});          // id -> {n:解答回数, ok:正答数, last:直近正誤}
  const TYPES = window.TYPES || { all: "すべて" };
  let filter = store.get("tk_filter", "all");
  if (filter !== "all" && !CATS[filter]) filter = "all";
  let qtype = store.get("tk_type", "all");
  if (!TYPES[qtype]) qtype = "all";

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function record(id, ok) { const r = rec[id] || { n: 0, ok: 0, last: null }; r.n++; if (ok) r.ok++; r.last = ok; rec[id] = r; store.set("tk_rec", rec); }

  /* ---------- 1問の表示（一問一答・弱点復習で共通） ---------- */
  // onAnswer(ok) は記録後に呼ばれ、onNext() は「次の問題へ」で呼ばれる
  function renderQuestion(el, q, onAnswer, onNext) {
    el.innerHTML = `<div class="sheet"><span class="qno">問${String(q.id).padStart(2, "0")}</span><span class="cat">${CATS[q.c]}</span>
    <p class="q">${q.q}</p>
    <div class="marks"><button type="button" class="mark" data-v="1" aria-label="○ 正しい">○</button><button type="button" class="mark" data-v="0" aria-label="× 誤り">×</button></div>
    <div class="result" role="status" aria-live="polite"></div></div>`;
    const res = el.querySelector(".result");
    el.querySelectorAll(".mark").forEach(b => b.onclick = () => {
      const ok = (b.dataset.v === "1") === q.a;
      record(q.id, ok);
      el.querySelectorAll(".mark").forEach(m => m.disabled = true);
      b.classList.add("picked");
      res.innerHTML = `<div class="result-row"><img src="img/${ok ? "mamori-ok" : "mamori-ng"}.webp" alt=""><div class="result-body"><span class="verdict ${ok ? "ok" : "ng"}">${ok ? "正解" : "不正解"}　答え：${q.a ? "○" : "×"}</span><p class="exp">${q.e}</p></div></div>`;
      const nx = document.createElement("button");
      nx.type = "button"; nx.className = "next"; nx.textContent = "次の問題へ";
      nx.onclick = onNext;
      el.querySelector(".sheet").appendChild(nx);
      nx.focus({ preventScroll: true });
      onAnswer(ok);
      renderStats();
    });
  }

  /* ---------- 一問一答 ---------- */
  let order = [], pos = 0, sessionOk = 0, sessionN = 0;
  function pool() { return Q.filter(q => (filter === "all" || q.c === filter) && (qtype === "all" || (q.t || []).includes(qtype))); }
  function startDrill() { order = shuffle(pool().map(q => q.id)); pos = 0; sessionOk = 0; sessionN = 0; drawDrill(); }
  function drawDrill() {
    const el = $("sheet");
    if (!order.length) {
      $("progress").textContent = "0 問"; $("score").textContent = "";
      el.innerHTML = `<div class="empty">この組み合わせの問題はまだありません。<br>分野か出題タイプを変えてください。</div>`;
      return;
    }
    $("progress").textContent = `${Math.min(pos + 1, order.length)} / ${order.length} 問`;
    $("score").textContent = sessionN ? `今回 ${sessionOk}/${sessionN} 正解` : "";
    if (pos >= order.length) {
      el.innerHTML = `<div class="sheet"><h2>この範囲を一周しました</h2><p class="lead">今回の正解 ${sessionOk} / ${sessionN} 問。</p><button type="button" class="next" id="againDrill">シャッフルしてもう一周</button><div class="ad" id="ad-round-drill" hidden></div></div>`;
      $("againDrill").onclick = startDrill;
      window.renderAd && renderAd($("ad-round-drill"), "afterRound");
      return;
    }
    renderQuestion(el, byId[order[pos]],
      ok => { sessionN++; if (ok) sessionOk++; $("score").textContent = `今回 ${sessionOk}/${sessionN} 正解`; },
      () => { pos++; drawDrill(); });
  }
  function renderFilters() {
    const count = (c, t) => Q.filter(q => (c === "all" || q.c === c) && (t === "all" || (q.t || []).includes(t))).length;
    const row = (label, opts, cur, key) => `<div class="frow" role="group" aria-label="${label}"><span class="flabel">${label}</span>` +
      opts.map(([k, l]) => `<button type="button" class="chip" id="${key}-${k}" data-key="${key}" data-k="${k}" aria-pressed="${cur === k}">${l}</button>`).join("") + `</div>`;
    $("filters").innerHTML =
      row("分野", [["all", "すべて"], ...Object.entries(CATS)], filter, "f") +
      row("タイプ", Object.entries(TYPES).map(([k, l]) => [k, k === "all" ? l : `${l}（${count(filter, k)}）`]), qtype, "t");
    $("filters").querySelectorAll(".chip").forEach(b => b.onclick = () => {
      if (b.dataset.key === "f") { filter = b.dataset.k; store.set("tk_filter", filter); }
      else { qtype = b.dataset.k; store.set("tk_type", qtype); }
      renderFilters(); startDrill();
    });
  }

  /* ---------- 試験日カウントダウン（日本時間で計算） ---------- */
  function renderCountdown() {
    const el = $("countdown"), C = window.SITE_CONFIG || {};
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(C.examDate || "");
    if (!el || !m) return;
    const exam = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    const jst = new Date(Date.now() + 9 * 3600e3);
    const today = Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate());
    const days = Math.round((exam - today) / 864e5);
    if (days < 0) { el.hidden = true; return; }
    const label = esc(C.examLabel || "本試験");
    const date = `${+m[2]}月${+m[3]}日`;
    el.innerHTML = days === 0
      ? `<b>今日は${label}の本番です。</b>落ち着いていきましょう。`
      : `${label}（${date}）まで <b class="cd-num">あと${days}日</b>${days <= 14 ? `<span class="cd-tip">比較問題と重要数字で総仕上げ</span>` : ""}`;
    el.hidden = false;
  }

  /* ---------- 弱点復習 ----------
   * キュー方式: 先頭の問題を出題し、正解ならキューから外し、不正解なら末尾へ戻す。
   * キューが空になったとき（全問を今回の復習中に一度正解したとき）だけ「復習完了」。 */
  let rQueue = [], rTotal = 0, rCleared = 0;
  function startReview() {
    rQueue = shuffle(Q.filter(q => rec[q.id] && rec[q.id].last === false).map(q => q.id));
    rTotal = rQueue.length; rCleared = 0;
    const area = $("reviewArea");
    if (!rTotal) {
      area.innerHTML = `<div class="empty">間違えた問題はまだありません。<br>一問一答で間違えた問題がここに集まります。</div>`;
      return;
    }
    area.innerHTML = `<div class="toolbar"><span class="meta" style="margin:0" id="rLeft"></span><button type="button" class="ghost" id="resetBtn">学習記録をリセット</button></div><div id="confirmBox"></div><div id="rsheet"></div>`;
    $("resetBtn").onclick = askReset;
    drawReview();
  }
  function drawReview() {
    const el = $("rsheet");
    if (!rQueue.length) {
      $("rLeft").textContent = `${rTotal} 問すべて正解`;
      el.innerHTML = `<div class="sheet"><h2>復習完了</h2><p class="lead">対象の ${rTotal} 問すべてに、この復習の中で正解できました。</p><button type="button" class="next" id="backDrill">一問一答へ戻る</button><div class="ad" id="ad-round-review" hidden></div></div>`;
      $("backDrill").onclick = () => show("drill", true);
      window.renderAd && renderAd($("ad-round-review"), "afterRound");
      return;
    }
    $("rLeft").textContent = `あと ${rQueue.length} 問（対象 ${rTotal} 問）`;
    const id = rQueue[0];
    renderQuestion(el, byId[id],
      ok => {
        rQueue.shift();
        if (ok) rCleared++; else rQueue.push(id);   // 不正解は末尾へ戻す
      },
      () => drawReview());
  }
  function askReset() {
    const box = $("confirmBox");
    box.innerHTML = `<div class="sheet confirm" role="group" aria-labelledby="confirmMsg"><p id="confirmMsg" style="margin:0">全問題の解答記録を消去します。元に戻せません。</p><div class="confirm-actions"><button type="button" class="ghost danger" id="yesReset">消去する</button><button type="button" class="ghost" id="noReset">やめる</button></div></div>`;
    $("noReset").focus();
    $("yesReset").onclick = () => { rec = {}; store.set("tk_rec", rec); renderStats(); startReview(); };
    $("noReset").onclick = () => { box.innerHTML = ""; $("resetBtn").focus(); };
  }

  /* ---------- 集計 ---------- */
  function renderStats() {
    $("stats").innerHTML = Object.entries(CATS).map(([k, l]) => {
      const qs = Q.filter(q => q.c === k), done = qs.filter(q => rec[q.id]), okLast = done.filter(q => rec[q.id].last).length;
      const pct = qs.length ? Math.round(okLast / qs.length * 100) : 0;
      return `<div class="stat">${l}<b>${okLast}/${qs.length}</b><span class="stat-sub">直近正解 ・ 解答済 ${done.length}</span><div class="bar" aria-hidden="true"><i style="width:${pct}%"></i></div></div>`;
    }).join("");
  }

  /* ---------- 重要数字（カード表示＋赤シート） ---------- */
  let redOn = false;
  function renderNums() {
    $("numsBox").innerHTML = NUMS.map(([g, items], gi) =>
      `<section class="ngroup" aria-labelledby="ng-${gi}"><h3 class="ngroup-title" id="ng-${gi}">${esc(g)}</h3><ul class="nlist">` +
      items.map(([k, v, note], i) => `<li class="nrow"><span class="nlabel" id="nl-${gi}-${i}">${esc(k)}${note ? `<small>${esc(note)}</small>` : ""}</span>` +
        `<button type="button" class="num" aria-describedby="nl-${gi}-${i}"><span class="v">${esc(v).replace(/\n/g, "<br>")}</span><span class="mask" aria-hidden="true">？ タップで表示</span></button></li>`).join("") +
      `</ul></section>`).join("");
    $("numsBox").querySelectorAll(".num").forEach(b => b.onclick = () => {
      if (!redOn) return;
      const shown = b.classList.toggle("show");
      b.setAttribute("aria-pressed", shown);
      // 表示中は数字そのものを読み上げ、隠れているときは操作方法を読み上げる
      if (shown) b.removeAttribute("aria-label"); else b.setAttribute("aria-label", "隠れている数字。押すと表示");
    });
    applyRed();
  }
  function applyRed() {
    $("numsBox").classList.toggle("redsheet", redOn);
    $("numsBox").querySelectorAll(".num").forEach(b => {
      b.classList.remove("show");
      if (redOn) { b.setAttribute("aria-pressed", "false"); b.setAttribute("aria-label", "隠れている数字。押すと表示"); }
      else { b.removeAttribute("aria-pressed"); b.removeAttribute("aria-label"); }
    });
    $("redBtn").setAttribute("aria-pressed", redOn);
    $("redBtn").textContent = redOn ? "赤シート：ON" : "赤シート：OFF";
  }

  /* ---------- タブ（ARIA Tabs） ---------- */
  const VIEWS = ["drill", "review", "nums"];
  let numsAdShown = false;
  function show(v, focusTab) {
    VIEWS.forEach(x => {
      const t = $("tab-" + x), sel = x === v;
      t.setAttribute("aria-selected", sel);
      t.tabIndex = sel ? 0 : -1;
      $("view-" + x).hidden = !sel;
    });
    if (focusTab) $("tab-" + v).focus();
    if (v === "review") startReview();
    if (v === "nums" && !numsAdShown && window.renderAd) { renderAd($("ad-nums"), "numsBottom"); numsAdShown = true; }
    try { history.replaceState(null, "", v === "drill" ? location.pathname : "#" + v); } catch (e) {}
  }
  function bindTabs() {
    VIEWS.forEach((v, i) => {
      const t = $("tab-" + v);
      t.onclick = () => show(v);
      t.onkeydown = e => {
        let n = null;
        if (e.key === "ArrowRight") n = (i + 1) % VIEWS.length;
        else if (e.key === "ArrowLeft") n = (i - 1 + VIEWS.length) % VIEWS.length;
        else if (e.key === "Home") n = 0;
        else if (e.key === "End") n = VIEWS.length - 1;
        if (n !== null) { e.preventDefault(); show(VIEWS[n], true); }
      };
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    $("redBtn").onclick = () => { redOn = !redOn; applyRed(); };
    bindTabs();
    ["mamori-ok", "mamori-ng"].forEach(n => { const i = new Image(); i.src = `img/${n}.webp`; });
    $("qcount").textContent = Q.length;
    renderCountdown(); renderFilters(); renderStats(); renderNums(); startDrill();
    const h = location.hash.slice(1);
    if (h === "review" || h === "nums") show(h);
  });
})();
