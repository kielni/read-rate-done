/*
  listen for messages to the extension:

  from Kindle Cloud Reader
    - rate: open Goodreads tab with query parameters: search query and rating
    - library iframe ready: get url for My Books, then fetch ratings from first page
  from Goodreads
    - search page returns Goodreads book id: load review tab and rate

  Startup flow:
    - kindle content script: send message on opened; add hidden ratings divs
    - kindle content script: send message when library iframe ready, with fill ratings callback
    - background page: open a new Goodreads tab with dest=mybooks param on read.amazon.com opened
    - goodreads content script: click My Books if dest=mybooks in URL
    - goodreads content script: on My Books, collect books and ratings and send message
    - background page: when ratings received, update icon and call fill ratings callback to unhide stars
*/
var readTabId = null;
var fillRatingsCallback = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('onMessage request=', request, ' sender=', sender);
  // opened Kindle Cloud Reader
  if (sender.url.indexOf('read.amazon.com') >= 0 && request.opened) {
    chrome.pageAction.setIcon({ tabId: sender.tab.id, path: 'icon-gray-16.png' });
    chrome.pageAction.show(sender.tab.id);
    // open new Goodreads tab
    kgr.loadGoodreadsTab();
    // save read.amazon.com tab id
    readTabId = sender.tab.id;
  }
  // clicked rating in Kindle Cloud Reader: open Goodreads tab
  if (sender.url.indexOf('read.amazon.com') >= 0 && request.rating) {
    kgr.openGoodreadsSearchTab(request.q, request.rating);
  }
  // Kindle Cloud Reader iframe is ready: load ratings from Goodreads if logged in
  if (sender.url.indexOf('read.amazon.com') >= 0 && request.libraryIframe) {
    fillRatingsCallback = sendResponse;
  }
  // Goodreads search page returns Goodreads id
  if (sender.url.indexOf('www.goodreads.com') >= 0 && request.url) {
    kgr.loadReviewTab(sender.tab.id, request.url, request.rating);
  }
  // Goodreads MyBooks page returns list of ratings
  if (sender.url.indexOf('www.goodreads.com') >= 0 && request.ratings) {
    chrome.pageAction.setIcon({ tabId: readTabId, path: 'icon-yellow-16.png' });
    chrome.pageAction.show(readTabId);
    if (fillRatingsCallback) {
      fillRatingsCallback({ action: 'ratings', ratings: request.ratings, login: true });
    } else {
      console.log('missing fill ratings callback')
    }
  }
  return true;
});

var kgr = (function() {
  var loadGoodreadsTab = function loadGoodreadsTab(sendResponse) {
    const url = 'https://www.goodreads.com?&readratedone=true&dest=mybooks';

    return chrome.tabs.create({url, active: false}, (t) => {
      if (sendResponse) {
        sendResponse({ action: 'open', tabId: t.id });
      }
    });
  };

  var openGoodreadsSearchTab = function openGoodreadsTab(q, rating, sendResponse) {
    var url = `https://www.goodreads.com/search?q=${q}&rating=${rating}&readratedone=true`;
    return chrome.tabs.create({url: url, active: false}, (t) => {
      if (sendResponse) {
        sendResponse({ action: 'open' });
      }
    });
  };

  var loadReviewTab = function loadReviewTab(tabId, url, rating, sendResponse) {
    return chrome.tabs.update(tabId, {url: url, active: false}, (t) => {
      if (sendResponse) {
        sendResponse({ action: 'open' });
      }
    });
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
    loadGoodreadsTab,
    openGoodreadsSearchTab,
    loadReviewTab,
    loadRatings,
  }
})();
