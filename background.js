/*
  listen for messages to the extension:

  from Kindle Cloud Reader
    - rate: open Goodreads tab with query parameters: search query and rating
    - library iframe ready: get url for My Books, then fetch ratings from first page
  from Goodreads
    - rating complete: send message to Kindle Cloud Reader
*/

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('onMessage request=', request, ' sender=', sender);
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
  // finished rating in Goodreads tab
  if (sender.url.indexOf('www.goodreads.com') >= 0) {
    sendResponse({ action: 'rated' });
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
    var url = `https://www.goodreads.com/search?q=${q}&rating=${rating}`;
    chrome.tabs.create({url: url, active: false}, (t) => {
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
    openGoodreadsTab,
    loadRatings,
  }
})();
