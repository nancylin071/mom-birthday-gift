(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ua = navigator.userAgent || "";
  var isLine = /\bLine\//i.test(ua);
  var isTouch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;

  function $(id) { return document.getElementById(id); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduceMotion ? 0 : ms); }); }
  /* 先強制排版再加 class，讓轉場一定會播放；不依賴 requestAnimationFrame，背景分頁也不會卡住 */
  function nextFrame() {
    void document.body.offsetHeight;
    return new Promise(function (r) { setTimeout(r, 30); });
  }

  /* 金額旁的金粉：位置固定、只飄一次 */
  (function makeDust() {
    var box = document.querySelector(".dust");
    if (!box || reduceMotion) return;
    var specks = [
      [6, 62, 2.2], [14, 18, 2.5], [22, 78, 2.35], [33, 8, 2.7], [46, 86, 2.45],
      [58, 12, 2.3], [67, 74, 2.6], [78, 24, 2.4], [86, 66, 2.75], [94, 30, 2.5],
      [40, 40, 2.9], [72, 48, 3.0]
    ];
    specks.forEach(function (s, i) {
      var el = document.createElement("i");
      el.style.left = s[0] + "%";
      el.style.top = s[1] + "%";
      el.style.setProperty("--d", s[2] + "s");
      if (i % 3 === 0) { el.style.width = el.style.height = "7px"; }
      box.appendChild(el);
    });
  })();

  var scenes = {
    envelope: $("scene-envelope"),
    letter: $("scene-letter"),
    voucher: $("scene-voucher")
  };
  var current = scenes.envelope;
  var busy = false;

  var envelope = $("envelope");
  var btnOpen = $("btn-open");

  function focusTarget(scene) {
    return scene.querySelector("[tabindex='-1']") || scene.querySelector("button");
  }

  /* 每個場景的按鈕要等內容出現後才可點（毫秒） */
  var readyItems = [
    { scene: scenes.letter, el: $("btn-reveal"), delay: 1600 },
    { scene: scenes.voucher, el: document.querySelector(".actions"), delay: 2900 }
  ];
  var readyTimers = [];

  function armReady(scene) {
    readyTimers.forEach(clearTimeout);
    readyTimers = [];
    readyItems.forEach(function (it) {
      it.el.classList.remove("is-ready");
      if (it.scene === scene) {
        readyTimers.push(setTimeout(function () { it.el.classList.add("is-ready"); }, reduceMotion ? 0 : it.delay));
      }
    });
  }

  function goTo(next, focusEl) {
    var prev = current;
    prev.classList.remove("is-active");
    armReady(null);
    return wait(550).then(function () {
      prev.hidden = true;
      next.hidden = false;
      window.scrollTo(0, 0);
      return nextFrame();
    }).then(function () {
      next.classList.add("is-active");
      current = next;
      armReady(next);
      var el = focusEl || focusTarget(next);
      if (el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
    });
  }

  /* Scene 1 → 2：拆信封 */
  function openEnvelope() {
    if (busy || current !== scenes.envelope) return;
    busy = true;
    btnOpen.disabled = true;
    envelope.setAttribute("aria-disabled", "true");
    scenes.envelope.classList.add("is-leaving");
    envelope.classList.add("is-open");
    wait(850).then(function () {
      envelope.classList.add("is-lifting");
      return wait(1250);
    }).then(function () {
      return goTo(scenes.letter);
    }).then(function () { busy = false; });
  }

  envelope.addEventListener("click", openEnvelope);
  btnOpen.addEventListener("click", openEnvelope);

  /* Scene 2 → 3：揭曉禮券（必須由媽媽自己按） */
  $("btn-reveal").addEventListener("click", function () {
    if (busy || !this.classList.contains("is-ready")) return;
    busy = true;
    goTo(scenes.voucher).then(function () { busy = false; });
  });

  /* 重新拆一次 */
  $("btn-replay").addEventListener("click", function () {
    if (busy || !this.parentNode.classList.contains("is-ready")) return;
    busy = true;
    /* 信封場景此時是隱藏的，先復原狀態，顯示時不會倒播動畫 */
    envelope.classList.remove("is-open", "is-lifting");
    envelope.removeAttribute("aria-disabled");
    scenes.envelope.classList.remove("is-leaving");
    btnOpen.disabled = false;
    goTo(scenes.envelope, btnOpen).then(function () { busy = false; });
  });

  /* ===== 保存禮券 ===== */
  var sheet = $("save-sheet");
  var btnSave = $("btn-save");
  var btnShare = $("btn-share");
  var btnDownload = $("btn-download");
  var hint = $("save-hint");
  var imgUrl = "assets/gift-card.png";
  var fileName = "媽媽專屬變美基金-生日禮券.png";
  var shareFile = null;

  if (isLine) {
    hint.textContent = "長按圖片，選「儲存圖片」即可存到相簿。";
    btnDownload.hidden = true;
  } else if (!isTouch) {
    hint.textContent = "按「下載圖片」即可存到電腦，也可以直接在圖片上按右鍵另存。";
  }

  function prepareShare() {
    if (isLine || shareFile || !window.fetch || !window.File || !navigator.canShare) return;
    fetch(imgUrl).then(function (res) { return res.blob(); }).then(function (blob) {
      var f = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare({ files: [f] })) {
        shareFile = f;
        btnShare.hidden = false;
      }
    }).catch(function () { /* 不支援時保留長按與下載 */ });
  }

  var sheetTimer = null;

  function openSheet() {
    clearTimeout(sheetTimer);
    sheet.hidden = false;
    document.body.style.overflow = "hidden";
    prepareShare();
    nextFrame().then(function () {
      sheet.classList.add("is-open");
      var t = $("t-save");
      try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); }
    });
  }

  function closeSheet() {
    if (!sheet.classList.contains("is-open")) return;
    sheet.classList.remove("is-open");
    document.body.style.overflow = "";
    clearTimeout(sheetTimer);
    sheetTimer = setTimeout(function () {
      sheet.hidden = true;
      btnSave.focus();
    }, reduceMotion ? 0 : 350);
  }

  btnSave.addEventListener("click", function () {
    if (busy || !this.parentNode.classList.contains("is-ready")) return;
    openSheet();
  });
  sheet.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) closeSheet();
  });
  document.addEventListener("keydown", function (e) {
    if (sheet.hidden) return;
    if (e.key === "Escape") { closeSheet(); return; }
    if (e.key === "Tab") {
      var items = Array.prototype.filter.call(
        sheet.querySelectorAll("button, a[href]"),
        function (el) { return !el.hidden && el.offsetParent !== null; }
      );
      items = Array.prototype.slice.call(items);
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      var inside = items.indexOf(document.activeElement) !== -1;
      if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  btnShare.addEventListener("click", function () {
    if (!shareFile) return;
    function fail(err) {
      if (err && err.name === "AbortError") return; /* 使用者自己取消分享 */
      hint.textContent = "這個瀏覽器無法直接分享，請長按圖片儲存，或按「下載圖片」。";
    }
    try {
      navigator.share({ files: [shareFile], title: "媽媽專屬變美基金" }).catch(fail);
    } catch (err) { fail(err); }
  });
})();
