// Copyright 2019 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Module for the conversation skin.
 */

angular.module('conversationSkinModule', []);

// Note: This file should be assumed to be in an IIFE, and the constants below
// should only be used within this file.
var TIME_FADEOUT_MSEC = 100;
var TIME_HEIGHT_CHANGE_MSEC = 500;
var TIME_FADEIN_MSEC = 100;
var TIME_NUM_CARDS_CHANGE_MSEC = 500;

angular.module('conversationSkinModule', []);
  .animation('.conversation-skin-animate-tutor-card-on-narrow', function() {
    var tutorCardLeft, tutorCardWidth, tutorCardHeight, oppiaAvatarLeft;
    var tutorCardAnimatedLeft, tutorCardAnimatedWidth;

    var beforeAddClass = function(element, className, done) {
      if (className !== 'ng-hide') {
        done();
        return;
      }
      var tutorCard = element;
      var supplementalCard = $(
        '.conversation-skin-supplemental-card-container');
      var oppiaAvatar = $('.conversation-skin-oppia-avatar.show-tutor-card');
      oppiaAvatarLeft = supplementalCard.position().left +
                        supplementalCard.width() - oppiaAvatar.width();
      tutorCardLeft = tutorCard.position().left;
      tutorCardWidth = tutorCard.width();
      tutorCardHeight = tutorCard.height();

      if (tutorCard.offset().left + tutorCardWidth >
        oppiaAvatar.offset().left) {
        var animationLength = Math.min(
          oppiaAvatarLeft - tutorCard.offset().left,
          tutorCardWidth);
        tutorCardAnimatedLeft = tutorCardLeft + animationLength;
        tutorCardAnimatedWidth = tutorCardWidth - animationLength;
      } else {
        tutorCardAnimatedLeft = oppiaAvatarLeft;
        tutorCardAnimatedWidth = 0;
      }

      oppiaAvatar.hide();
      tutorCard.css({
        'min-width': 0
      });
      tutorCard.animate({
        left: tutorCardAnimatedLeft,
        width: tutorCardAnimatedWidth,
        height: 0,
        opacity: 1
      }, 500, function() {
        oppiaAvatar.show();
        tutorCard.css({
          left: '',
          width: '',
          height: '',
          opacity: '',
          'min-width': ''
        });
        done();
      });
    };

    var removeClass = function(element, className, done) {
      if (className !== 'ng-hide') {
        done();
        return;
      }
      var tutorCard = element;
      $('.conversation-skin-oppia-avatar.show-tutor-card').hide(0, function() {
        tutorCard.css({
          left: tutorCardAnimatedLeft,
          width: tutorCardAnimatedWidth,
          height: 0,
          opacity: 0,
          'min-width': 0
        });
        tutorCard.animate({
          left: tutorCardLeft,
          width: tutorCardWidth,
          height: tutorCardHeight,
          opacity: 1
        }, 500, function() {
          tutorCard.css({
            left: '',
            width: '',
            height: '',
            opacity: '',
            'min-width': ''
          });
          done();
        });
      });
    };

    return {
      beforeAddClass: beforeAddClass,
      removeClass: removeClass
    };
  });

angular.module('conversationSkinModule').animation(
  '.conversation-skin-animate-tutor-card-content', function() {
  var animateCardChange = function(element, className, done) {
    if (className !== 'animate-card-change') {
      return;
    }

    var currentHeight = element.height();
    var expectedNextHeight = $(
      '.conversation-skin-future-tutor-card ' +
      '.oppia-learner-view-card-content'
    ).height();

    // Fix the current card height, so that it does not change during the
    // animation, even though its contents might.
    element.css('height', currentHeight);

    jQuery(element).animate({
      opacity: 0
    }, TIME_FADEOUT_MSEC).animate({
      height: expectedNextHeight
    }, TIME_HEIGHT_CHANGE_MSEC).animate({
      opacity: 1
    }, TIME_FADEIN_MSEC, function() {
      element.css('height', '');
      done();
    });

    return function(cancel) {
      if (cancel) {
        element.css('opacity', '1.0');
        element.css('height', '');
        element.stop();
      }
    };
  };

  return {
    addClass: animateCardChange
  };
});

angular.module('conversationSkinModule').animation(
  '.conversation-skin-animate-cards', function() {
  // This removes the newly-added class once the animation is finished.
  var animateCards = function(element, className, done) {
    var tutorCardElt = jQuery(element).find(
      '.conversation-skin-main-tutor-card');
    var supplementalCardElt = jQuery(element).find(
      '.conversation-skin-supplemental-card-container');

    if (className === 'animate-to-two-cards') {
      var supplementalWidth = supplementalCardElt.width();
      supplementalCardElt.css({
        width: 0,
        'min-width': '0',
        opacity: '0'
      });
      supplementalCardElt.animate({
        width: supplementalWidth
      }, TIME_NUM_CARDS_CHANGE_MSEC, function() {
        supplementalCardElt.animate({
          opacity: '1'
        }, TIME_FADEIN_MSEC, function() {
          supplementalCardElt.css({
            width: '',
            'min-width': '',
            opacity: ''
          });
          jQuery(element).removeClass('animate-to-two-cards');
          done();
        });
      });

      return function(cancel) {
        if (cancel) {
          supplementalCardElt.css({
            width: '',
            'min-width': '',
            opacity: ''
          });
          supplementalCardElt.stop();
          jQuery(element).removeClass('animate-to-two-cards');
        }
      };
    } else if (className === 'animate-to-one-card') {
      supplementalCardElt.css({
        opacity: 0,
        'min-width': 0
      });
      supplementalCardElt.animate({
        width: 0
      }, TIME_NUM_CARDS_CHANGE_MSEC, function() {
        jQuery(element).removeClass('animate-to-one-card');
        done();
      });

      return function(cancel) {
        if (cancel) {
          supplementalCardElt.css({
            opacity: '',
            'min-width': '',
            width: ''
          });
          supplementalCardElt.stop();

          jQuery(element).removeClass('animate-to-one-card');
        }
      };
    } else {
      return;
    }
  };

  return {
    addClass: animateCards
  };
});