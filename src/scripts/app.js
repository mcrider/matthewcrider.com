var $ = require('jquery');
window.$ = window.jQuery = $;
var waypoints = require('./jquery.waypoints.js')
var sticky = require('./sticky.js')

var VideoScroller = require('video-scroller');

var weatherDescriptions = require('./weather.js')

$(document).ready(function() {
  $.ajax({
    url : "http://api.openweathermap.org/data/2.5/weather?q=Trento,it&units=metric",
    dataType : "jsonp",
    success : function(json) {
     var code = json.weather[0].id;
     var temp = Math.round(json.main.temp);
     if (code && temp) {
       $('.marquee').html('Benvenuto. It\'s currently ' + weatherDescriptions[code] + ' and  ' + temp + '°C in trento, italy');
       initMarquee();
     }
    }
  });

  $('.sidebar-toggle, .sidebar-toggle-info').on('click touchstart', function (e) {
    $('html').toggleClass('menu-open');
  })

  $('.collage-feature').click(function (e) {
    $(this).toggleClass('active');
  })

  $('footer .salute').click(function (e) {
    $("html, body").animate({ scrollTop : 0 },"slow");
  });

  $(window).bind('scroll.downArrow', function () {
    $('.down-arrow').addClass('scrolled');
    $(window).unbind('scroll.downArrow');
  });

  new VideoScroller({
    el: document.querySelector('.bottle-video-container').getElementsByTagName('video')[0],
    easingFunction: function() { return 1.2; },
    scrollTimeout: 150
  });

  initGallery();
});

$(window).load(function () {
  // Set up bottle slideshow
  var currentBottle = 0;
  var bottles = [
    $('.bottle-1'),
    $('.bottle-2'),
    $('.bottle-3'),
    $('.bottle-4'),
    $('.bottle-5'),
    $('.bottle-6'),
    $('.bottle-7')
  ];
  var maxIndex = bottles.length - 1;

  setInterval(function () {
    bottles[currentBottle].addClass('visible');

    prevBottle = currentBottle === 0 ? maxIndex : (currentBottle - 1);
    bottles[prevBottle].removeClass('visible');

    currentBottle = currentBottle === maxIndex ? 0 : (currentBottle + 1);
  }, 500);


  var positionOnly = $(window).width() < 1088;
  initStickyScroll(positionOnly);
  $( window ).resize(function() {
    positionOnly = $(window).width() < 1088;
    Waypoint.destroyAll();
    $('.sticky-stop').remove();
    initStickyScroll(positionOnly);
  });
});

function initGallery () {
  var $galleryItems = $('.gallery-item');
  var numImages = $galleryItems.length;
  var currentItemIndex = 0;

  $('.gallery').click(function () {
    $($galleryItems[currentItemIndex]).removeClass('active').hide();
    currentItemIndex = currentItemIndex + 1;
    $($galleryItems[currentItemIndex]).addClass('active');

    if (currentItemIndex >= numImages - 1) {
      $galleryItems.show();
      // Load all images in
      $($galleryItems[currentItemIndex]).removeClass('active');
      currentItemIndex = 0;
      $($galleryItems[currentItemIndex]).addClass('active');
    }
  });
}

function initStickyScroll (positionOnly) {
  var positionOnly = positionOnly || false;
  var topTop = $('.top').position().top; // Top container's start position on page
  var bottomTop = $('.bottom').position().top; // Bottom container's start position on page
  var topHeight = $('.top').height(); // Top container's height
  var bottomHeight = $('.bottom').height(); // Bottom container's height
  var topBottom = topTop + topHeight // Top container's end position on page
  var bottomBottom = bottomTop + bottomHeight // Top container's end position on page

  $('.sticky-copy').each(function () {
    var container = $(this).data('sticky-container');
    var start = $(this).data('sticky-start'); // Start pos (percentage)
    var end = $(this).data('sticky-end'); // Bottom pos (percentage)

    $(this).css({
      'top': container == 'top' ? topTop + ((start / 100) * topHeight) : bottomTop + ((start / 100) * bottomHeight),
      'left': $(window).width() * .1, // Set left and width pixel dimensions since percentage goes wack when we set it to fixed
      'width': $(window).width() * .8,
    });

    if (!positionOnly) {
      // Create element to signify stop point
      var $stopElement = $("<div>", {
        'class': 'sticky-stop',
        css: {
          'position': 'absolute',
          'top': container == 'top' ? topTop + ((end / 100) * topHeight) : bottomTop + ((end / 100) * bottomHeight)
        }
      }).insertAfter(this);

      var aboutOffset = $('.about-copy').offset().top;
      var waypointTop = new Waypoint({
        offset: function () {
          return Waypoint.viewportHeight() / 2 - ($(this.element).outerHeight() / 2);
        },
        element: $(this),
        handler: function(direction) {
          if (direction === 'down') {
            $(this.element).addClass('stuck')
          } else {
            var top = container == 'top' ? topTop + ((start / 100) * topHeight) : bottomTop + ((start / 100) * bottomHeight);
            $(this.element).removeClass('stuck').css({
              'top': top
            });
          }
        }
      });
      var waypointBottom = new Waypoint({
        offset: function () {
          return Waypoint.viewportHeight() / 2 - ($(this.element).outerHeight() / 2);
        },
        element: $stopElement,
        handler: function(direction) {
          if (direction === 'down') {
            var top = $(window).scrollTop() + $(waypointTop.element).position().top;
            $(waypointTop.element).removeClass('stuck').css({
              'top': top
            });
          } else {
            $(waypointTop.element).addClass('stuck')
          }
        }
      });
    }
  });
}

function initMarquee () {
  function go() {
        i = i < width ? i + step : 1;
        m.style.marginLeft = -i + 'px';
    }
    var i = 0,
        step = 2,
        space = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    var m = document.getElementsByClassName('marquee')[0];
    var t = m.innerHTML; //text
    m.innerHTML = t + space;
    m.style.position = 'absolute'; // http://stackoverflow.com/questions/2057682/determine-pixel-length-of-string-in-javascript-jquery/2057789#2057789
    var width = (m.clientWidth + 1);
    m.style.position = '';
    m.innerHTML = t + space + t + space + t + space + t + space + t + space + t + space + t + space;
    var x = setInterval(go, 100);
}
