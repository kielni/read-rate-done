/*
  run on Goodreads search tab opened by extension
  - get rating from query param
  - click read, click stars, click set finished to today
*/

var kgr = (function() {
  var waitForStars = function() {
   return new Promise((resolve, reject) => {
      var interval = setInterval(() => {
        if (!document.querySelectorAll('form.reviewForm .stars .star').length) {
          return;
        }
        clearInterval(interval);
        resolve();
      }, 200);
    });
  }

  var rate = function(rating) {
    // click read status dropdown
    document.querySelector('button[value="read"]').click();
    // click read
    document.querySelector('li[data-shelf-name="read"]').click();
    waitForStars().then(() => {
      // click stars (0-indexd)
      document.querySelectorAll('form.reviewForm .stars .star')[rating-1].click();
      // set read to today
      document.querySelector('.endedAtSetTodayLink').click();
      // save
      document.querySelector('input[value="Save"]').click();
    });
  }
  return {
    rate,
  }
})();

var match = location.href.match(/rating=(\d+)/);
if (match) {
  kgr.rate(match[1]);
}
