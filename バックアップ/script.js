// ==========================================================
// とおまち夏花火ナイト LP スクリプト
// このファイルがやっていることは大きく2つだけです
//   1. 吹き出し（.bubble-in）が画面に入ったらフワッと表示する
//   2. 動画の再生/一時停止に合わせて、中央の再生ボタンを出し入れする
// ==========================================================

document.addEventListener('DOMContentLoaded', function () {

  // ---- 1. スクロール連動で吹き出しをフワッと表示 ----
  // IntersectionObserver は「その要素が画面内に入ったかどうか」を
  // 監視してくれるブラウザ標準の仕組みです。
  var bubbles = document.querySelectorAll('.bubble-in');

  if ('IntersectionObserver' in window && bubbles.length > 0) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible'); // style.css 側のアニメーションが発動
          io.unobserve(entry.target); // 一度表示したら監視を終了（毎回アニメーションしないように）
        }
      });
    }, { threshold: 0.3 }); // 要素の3割が見えたら発火

    bubbles.forEach(function (el) {
      io.observe(el);
    });
  } else {
    // 古いブラウザでIntersectionObserverが使えない場合は、最初から表示しておく
    bubbles.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  // ---- 2. 動画の再生ボタン（プレイヒント）の出し入れ ----
  var video = document.getElementById('solution-video');
  var hint = document.getElementById('solution-video-playhint');

  if (video && hint) {
    video.addEventListener('play', function () {
      hint.style.display = 'none'; // 再生が始まったらボタンを隠す
    });
    video.addEventListener('pause', function () {
      hint.style.display = 'flex'; // 一時停止したらボタンを再表示
    });
  }

});
