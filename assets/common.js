/* 全ページ共通: 広告・アフィリエイト枠の描画 */
(function () {
  const C = window.SITE_CONFIG || {};
  const esc = s => String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  let adsLoaded = false;

  function loadAdsense() {
    if (adsLoaded || !C.adsenseClient) return;
    const s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(C.adsenseClient);
    document.head.appendChild(s);
    adsLoaded = true;
  }

  // 指定した要素の中に広告ユニットを1つ描画する。設定がなければ何もしない。
  window.renderAd = function (el, slotKey) {
    if (!el) return;
    const slot = C.adSlots && C.adSlots[slotKey];
    if (!C.adsenseClient || !slot) { el.hidden = true; el.innerHTML = ""; return; }
    loadAdsense();
    el.hidden = false;
    el.innerHTML = '<span class="ad-label">広告</span><ins class="adsbygoogle" style="display:block" data-ad-client="' + esc(C.adsenseClient) +
      '" data-ad-slot="' + esc(slot) + '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  };

  // アフィリエイト枠。設定が空なら非表示。
  window.renderAffiliates = function (el) {
    if (!el) return;
    const list = C.affiliates || [];
    if (!list.length) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = '<span class="pr-label">PR</span><div class="pr-head"><img src="img/mamori-point.webp" alt="" width="44"><b>まもりのおすすめ教材</b></div><ul>' +
      list.map(a => '<li><a href="' + esc(a.url) + '" target="_blank" rel="sponsored noopener">' + esc(a.title) +
        (a.note ? '<small>' + esc(a.note) + '</small>' : '') + '</a></li>').join("") + '</ul>';
  };

  document.addEventListener("DOMContentLoaded", function () {
    renderAd(document.getElementById("ad-footer"), "footer");
    renderAffiliates(document.getElementById("pr-footer"));
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  });
})();
