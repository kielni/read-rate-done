/*
  extension opens Goodreads search tab: https://www.goodreads.com/search?q=
    - get Goodreads id of first result
    - send message to extension with Goodreads id

  extension opens Goodreads review page in the same tab: https://www.goodreads.com/review/edit/id
    - Goodreads erases query params, so extension sends a message with the rating value
    - on receiving a message with a rating, click stars for rating, set read date to today, and save
*/

const kgr = (function() {
  const review = function(rating) {
    console.log('set rating ', rating);
    // set rating and read date from review page: https://www.goodreads.com/review/edit/id
    // click stars (0-indexd)
    document.querySelectorAll('form.reviewForm .stars .star')[rating-1].click();
    // set read to today
    document.querySelector('a.endedAtSetTodayLink').click();
    // save
    document.querySelector('input[value="Save"]').click();
  }

  const search = function(rating) {
    // get GoodReads id from first result on search page
    console.log('search with rating ', rating);
    const href = document.querySelector('a.bookTitle').getAttribute('href');
    const match = (new RegExp(/\/book\/show\/(\d+).*/)).exec(href);
    if (!match) {
      console.error(`href ${href} doesn't match /book/show/id`);
      return;
    }
    // send message with review page URL
    chrome.runtime.sendMessage({
      rating,
      url: `https://www.goodreads.com/review/edit/${match[1]}`,
    });
  }
  return { review, search };
})();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('content request message=', request);
  if (request.rating) {
    kgr.review(parseInt(request.rating));
  }
});

if (location.href.match(/readratedone=true/) && location.href.match(/\/search\?/)) {
  kgr.search(location.href.match(/rating=(\d+)/)[1]);
}
