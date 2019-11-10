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
    const bookId = match[1];
    // send message with review page URL
    chrome.runtime.sendMessage({
      rating,
      id: bookId,
      url: `https://www.goodreads.com/review/new/${bookId}?readratedone=true&rating=${rating}`,
    });
  }
  return { review, search };
})();

const href = location.href;
const ratingMatch = href.match(/rating=(\d+)/);
const rating = ratingMatch ? ratingMatch[1] : null;

if (href.match(/readratedone=true/)) {
  if (href.match(/\/search\?/)) {
    kgr.search(rating);
  }
  if (href.match(/\/review\//)) {
    kgr.review(rating);
  }
}
