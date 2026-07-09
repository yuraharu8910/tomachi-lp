// ==========================================================
// とおまち夏花火ナイト LP スクリプト
// このファイルがやっていることは大きく3つです
//   1. 吹き出し（.bubble-in）が画面に入ったらフワッと表示する
//   2. 動画の再生/一時停止に合わせて、中央の再生ボタンを出し入れする
//   3. 横スクロールカード列（.scroll-row）が画面に入ったら自動でスクロールする
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

  // ---- 3. 横スクロールカード列（来場シーン／宿泊／来場者の声）の自動スクロール ----
  // 「少しずつ流れる」動きではなく、「1枚ずつスッとスライドして止まる」動きにしています。
  var scrollRows = document.querySelectorAll('.scroll-row');

  scrollRows.forEach(function (row) {
    var interval = 2800;   // 何ミリ秒ごとに次のカードへ進むか
    var isPaused = false;  // ユーザーが指で触っている間はtrueにする
    var timerId = null;    // setInterval のID（動いているかどうかの目印にも使う）
    var currentIndex = 0;  // 今何枚目のカードが表示されているか

    // 子要素（カード）を配列として取得しておく
    var cards = Array.prototype.slice.call(row.children);

    // 現在のスクロール位置から一番近いカードのインデックスを逆算する
    // （ユーザーが手で動かした後、続きから自動再生を再開するために使う）
    function findClosestIndex() {
      var closest = 0;
      var minDiff = Infinity;
      cards.forEach(function (card, i) {
        var diff = Math.abs(card.offsetLeft - row.scrollLeft);
        if (diff < minDiff) {
          minDiff = diff;
          closest = i;
        }
      });
      return closest;
    }

    // イージング関数（動きの緩急のカーブ）
    // 最初と最後がゆっくり、真ん中が速い「ふわっ」とした動きになります
    function easeInOutCubic(t) {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // scroll-snap（カードの位置でピタッと止まる機能）が有効なままだと、
    // アニメーション中もブラウザが裏で位置を補正しようとして、カクつきの原因になります。
    // なので、自動でスライドしている間だけ scroll-snap-type を無効にします。
    function disableSnap() {
      row.style.scrollSnapType = 'none';
    }
    function enableSnap() {
      row.style.scrollSnapType = 'x proximity';
    }

    // ブラウザ任せの scrollTo({behavior:'smooth'}) は動きが速すぎたり
    // カクついたりすることがあるため、自前でアニメーションさせています
    function smoothScrollTo(targetLeft, duration) {
      disableSnap();
      var startLeft = row.scrollLeft;
      var distance = targetLeft - startLeft;
      var startTime = null;

      function frame(now) {
        if (startTime === null) startTime = now;
        var elapsed = now - startTime;
        var progress = Math.min(elapsed / duration, 1); // 0〜1の進行度
        row.scrollLeft = startLeft + distance * easeInOutCubic(progress);
        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          enableSnap(); // アニメーションが終わったら、手動スワイプ用にスナップを元に戻す
        }
      }
      requestAnimationFrame(frame);
    }

    // 次のカードへ、ふわっと（滑らかに）スクロールする
    function goToNext() {
      currentIndex = (currentIndex + 1) % cards.length; // 最後まで行ったら先頭に戻る
      smoothScrollTo(cards[currentIndex].offsetLeft, 700); // 700ミリ秒かけてゆっくり移動
    }

    function startAutoScroll() {
      if (timerId === null) {
        timerId = setInterval(function () {
          if (!isPaused) {
            goToNext();
          }
        }, interval);
      }
    }
    function stopAutoScroll() {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
    }

    // 画面に入ったら自動スクロール開始、画面外に出たら停止（無駄な処理をしないため）
    if ('IntersectionObserver' in window) {
      var rowObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            startAutoScroll();
          } else {
            stopAutoScroll();
          }
        });
      }, { threshold: 0.3 });
      rowObserver.observe(row);
    } else {
      startAutoScroll();
    }

    // ユーザーが指（またはマウス）で触っている間は自動スクロールを止める
    ['touchstart', 'mousedown'].forEach(function (evt) {
      row.addEventListener(evt, function () {
        isPaused = true;
      });
    });
    // 触るのをやめたら、少し間を置いてから、今いる位置の続きから自動再生を再開する
    ['touchend', 'mouseup', 'mouseleave'].forEach(function (evt) {
      row.addEventListener(evt, function () {
        setTimeout(function () {
          currentIndex = findClosestIndex();
          isPaused = false;
        }, 1500);
      });
    });
  });

});

