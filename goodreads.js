/*
  run on newly opened Goodreads search tab
*/
console.log('goodreads.js: start');
var match = location.href.match(/rating=(\d+)/);
if (match) {
  var rating = match[1];
  match = location.href.match(/q=(.+)&/);
  var q = match ? match[1] : null;
  // click read status dropdown
  document.querySelector('button[value="read"]').click();
  // click read
  document.querySelector('li[data-shelf-name="read"]').click();
  // wait for popup
  var interval = setInterval(function() {
    if (!document.querySelectorAll('form.reviewForm .stars .star').length) {
      return;
    }
    clearInterval(interval);
    // click stars (0-indexd)
    document.querySelectorAll('form.reviewForm .stars .star')[rating-1].click();
    // set read to today
    document.querySelector('.endedAtSetTodayLink').click();
    // save
    document.querySelector('input[value="Save"]').click();
    chrome.runtime.sendMessage({ rated: true, q: q, rating: rating });
  }, 200);
}
