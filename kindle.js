/*
  run on read.amazon.com
  - wait for iframe to load book details
  - add stars to page, with click handler to send rating message to extension
  - send loaded message, and fill stars with matching Goodreads ratings fetched by extension
*/

var kgr = (function() {
  var iframe = function() {
    return $('#KindleLibraryIFrame').contents()
  }

  var setRating = function setRating(stars, rating) {
    stars.find('.star').each(function(idx) {
      if (idx < rating) {
        $(this).removeClass('off');
        $(this).addClass('on');
      } else {
        $(this).removeClass('on');
        $(this).addClass('off');
      }
    });
  }

  var waitForBookDetails = function() {
    return new Promise((resolve, reject) => {
      $(document).arrive('#KindleLibraryIFrame', () => {
        // all_frames: true doesn't work with dynamically added iframes
        // arrive.js doesn't work with iframes
        var poll = setInterval(() => {
          if (iframe().find('.book_details').length) {
            clearInterval(poll);
            resolve();
          }
        }, 500);
      });
    });
  }

  var fillRatings = function(response) {
    if (!response || !response.login || !response.ratings) { // not logged in
      console.log('fillRatings: no data', response);
      return;
    }
    response.ratings.forEach((book) => {
      var stars = iframe().find(`.book_title:contains("${book.title}")`).parent().find('.stars');
      if (stars.length) {
        setRating(stars, parseInt(book.rating, 10));
      }
    });
    iframe().find('.kcr2gr.stars').show();
  }


  var stars = function stars() {
    var s = '<div class="kcr2gr stars">';
    for (var i = 1; i < 6; i++) {
      s += `<div class="star off" data="${i}"></div>`;
    }
    s += '</div>';
    return s;
  }

  var drawStars = function draw() {
    // inject stylesheet
    var head = iframe().find('head');
    head.append(`<link rel="stylesheet" type="text/css" href="${chrome.extension.getURL('stars.css')}"/>`);
    // add stars markup
    iframe().find('.book_details').slice(0, 30).each(function() {
      if (!$(this).find('.kcr2gr').length) { // not already added
        $(this).append(stars());
      }
    });
    // add click listener for stars
    iframe().find('.star').on('click', (ev) => {
      var rating = parseInt($(ev.target).attr('data'), 10);
      var bookId = $(ev.target).closest('.book_container').attr('id');
      setRating($(ev.target).closest('.stars'), rating);
      console.log('send rating ', rating, ' for ', bookId);
      // send message to extension to do rating
      chrome.runtime.sendMessage({ rating: rating, q: bookId });
    });
  }

  return {
    waitForBookDetails,
    fillRatings,
    drawStars
  }
})();

chrome.runtime.sendMessage({ opened: true });
kgr.waitForBookDetails().then((details) => {
  kgr.drawStars();
  chrome.runtime.sendMessage({ libraryIframe: true }, kgr.fillRatings);
});
