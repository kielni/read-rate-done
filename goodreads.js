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
    if (!rating) {
      return;
    }
    // set rating and read date from review page: https://www.goodreads.com/review/edit/id
    // click stars (0-indexd)
    document.querySelectorAll('form.reviewForm .stars .star')[rating-1].click();
    // set read to today
    document.querySelector('a.endedAtSetTodayLink').click();
    // save
    document.querySelector('input[value="Post"]').click();
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
    // save book id and params in local storage; goodreads may rewrite the url from review/new to review/edit
    // and drop the params
    // https://www.goodreads.com/review/new/40665796?rating=4&readratedone=true
    localStorage.setItem(bookId, rating);
    // send message with review page URL
    chrome.runtime.sendMessage({
      rating,
      id: bookId,
      url: `https://www.goodreads.com/review/new/${bookId}?readratedone=true&rating=${rating}`,
    });
  }

  const openMyBooks = function() {
    // click My Books
    let link = null;
    document.querySelectorAll('a.siteHeader__topLevelLink').forEach((a) => {
      if (a.text.trim() == 'My Books') {
        link = a;
        return;
      }
    });
    if (link) {
      link.href += '&readratedone=true'
      link.click()
    }
  }

  const getBookList = function() {
    console.log('getBookList');
    const ratings = [];

    document.querySelectorAll('.rating .stars').forEach((rating) => {
      // find tr
      let parent = rating.parentElement;
      while (parent && parent.tagName.toLowerCase() !== 'tr') {
        parent = parent.parentElement;
      }
      ratings.push({
        rating: rating.getAttribute('data-rating'),
        title: parent.querySelector('.title a').getAttribute('title'),
      });
    });

    chrome.runtime.sendMessage({ratings});
  }

  return { review, search, openMyBooks, getBookList };
})();

const href = location.href;
const ratingMatch = href.match(/rating=(\d+)/);
const rating = ratingMatch ? ratingMatch[1] : null;

if (href.match(/readratedone=true/)) {
  if (href.match(/\/search\?/)) {
    kgr.search(rating);
  }
  if (href.match(/\/review\//)) {
    if (href.match(/\/review\/list\//)) {
      kgr.getBookList();
    } else {
      kgr.review(rating);
    }
  }
  if (href.match(/dest=mybooks/)) {
    kgr.openMyBooks();
  }
}
// no readratedone param, but on a review page and a matching book in localStorage
const match = href.match(/.*?\/review\/edit\/(\d+)/);

if (match) {
  const bookId = match[1]

  if (localStorage.getItem(bookId)) {
    localStorage.removeItem(bookId)
    kgr.review(parseInt(localStorage.getItem(bookId)));
  }
}
