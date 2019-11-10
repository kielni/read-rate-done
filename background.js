/*
  listen for messages to the extension:

  from Kindle Cloud Reader
    - rate: open Goodreads tab with query parameters: search query and rating
    - library iframe ready: get url for My Books, then fetch ratings from first page
  from Goodreads
    - rating complete: send message to Kindle Cloud Reader
*/
let tabId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('onMessage request=', request, ' sender=', sender, 'tabId=', tabId);
  // opened Kindle Cloud Reader
  if (sender.url.indexOf('read.amazon.com') >= 0 && request.opened) {
    chrome.pageAction.setIcon({ tabId: sender.tab.id, path: 'icon-gray-16.png' });
    chrome.pageAction.show(sender.tab.id);
  }
  // clicked rating in Kindle Cloud Reeader: open Goodreads tab
  if (sender.url.indexOf('read.amazon.com') >= 0 && request.rating) {
    kgr.openGoodreadsTab(request.q, request.rating);
  }
  // Kindle Cloud Reader iframe is ready: load ratings from Goodreads if logged in
  if (sender.url.indexOf('read.amazon.com') >= 0 && request.libraryIframe) {
    kgr.loadRatings().then((ratings) => {
      chrome.pageAction.setIcon({ tabId: sender.tab.id, path: 'icon-yellow-16.png' });
      chrome.pageAction.show(sender.tab.id);
      sendResponse({ action: 'ratings', ratings: ratings, login: true });
    })
    .catch(() => {
      chrome.pageAction.hide(sender.tab.id);
      sendResponse({ action: 'no login', login: false });
    });
  }
  // Goodreads search page returns Goodreads id
  if (sender.url.indexOf('www.goodreads.com') >= 0 && request.url) {
    kgr.loadReviewTab(request.url, request.rating);
  }
  return true;
});

var kgr = (function() {
  var loadMyBooks = function loadMyBooks() {
    return $.get('https://www.goodreads.com/').then((response) => {
      var match = response.match(/(\/review\/list\/\d+)/);
      return match ? $.get(`https://www.goodreads.com${match[1]}`) : Promise.reject();
    });
  };

  var openGoodreadsTab = function openGoodreadsTab(q, rating, sendResponse) {
    var url = `https://www.goodreads.com/search?q=${q}&rating=${rating}&readratedone=true`;
    return chrome.tabs.create({url: url, active: false}, (t) => {
      if (sendResponse) {
        sendResponse({ action: 'open' });
      }
      tabId = t.id;
    });
  };

  var loadReviewTab = function loadReviewTab(url, rating, sendResponse) {
    return chrome.tabs.update(tabId, {url: url, active: false}, (t) => {
      if (sendResponse) {
        sendResponse({ action: 'open' });
      }
      // review page erases query params, so send them in a message
      chrome.tabs.sendMessage(tabId, { rating });
    });
  };

  var sendRating = function sendRating(rating) {
    // review page erases query params, so send them in a message
    chrome.tabs.sendMessage(tabId, { rating });
  };

  var loadRatings = function loadRatings() {
    return loadMyBooks().then((my) => {
      var ratings = [];
      $(my).find('.rating .stars').each(function() {
        ratings.push({
          rating: $(this).attr('data-rating'),
          title: $(this).closest('tr').find('.title a:first').attr('title'),
        });
      });
      return ratings;
    });
  };

  return {
    openGoodreadsTab,
    loadReviewTab,
    loadRatings,
  }
})();
