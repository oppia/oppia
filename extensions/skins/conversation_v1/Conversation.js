// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for the conversation skin.
 *
 * @author sll@google.com (Sean Lip)
 */

// Note: This file should be assumed to be in an IIFE, and the constants below
// should only be used within this file.
var TIME_FADEOUT_MSEC = 100;
var TIME_HEIGHT_CHANGE_MSEC = 500;
var TIME_FADEIN_MSEC = 100;
var TIME_NUM_CARDS_CHANGE_MSEC = 500;

oppia.animation('.conversation-skin-responses-animate-slide', function() {
  return {
    enter: function(element, done) {
      element.hide().slideDown();
    },
    leave: function(element, done) {
      element.slideUp();
    }
  };
});

oppia.animation('.conversation-skin-animate-card-contents', function() {
  var animateCardChange = function(element, className, done) {
    if (className !== 'animate-card-change') {
      return;
    }

    var currentHeight = element.height();
    var expectedNextHeight = $(
      '.conversation-skin-future-tutor-card .conversation-skin-tutor-card-content'
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


oppia.directive('conversationSkin', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'skins/Conversation',
    controller: [
        '$scope', '$timeout', '$rootScope', '$window', 'messengerService',
        'oppiaPlayerService', 'urlService', 'focusService', 'ratingService',
        'windowDimensionsService',
        function(
          $scope, $timeout, $rootScope, $window, messengerService,
          oppiaPlayerService, urlService, focusService, ratingService,
          windowDimensionsService) {

      $scope.CONTINUE_BUTTON_FOCUS_LABEL = 'continueButton';

      // The minimum width, in pixels, needed to be able to show two cards
      // side-by-side.
      var TWO_CARD_THRESHOLD_PX = 1120;
      var TIME_PADDING_MSEC = 250;
      var TIME_SCROLL_MSEC = 600;
      var MIN_CARD_LOADING_DELAY_MSEC = 950;

      var hasInteractedAtLeastOnce = false;
      var _answerIsBeingProcessed = false;
      var _nextFocusLabel = null;

      $scope.isInPreviewMode = oppiaPlayerService.isInPreviewMode();
      $scope.isIframed = urlService.isIframed();
      $rootScope.loadingMessage = 'Loading';
      $scope.explorationCompleted = false;
      $scope.hasFullyLoaded = false;

      $scope.oppiaAvatarImageUrl = oppiaPlayerService.getOppiaAvatarImageUrl();

      $scope.activeCard = null;
      $scope.numProgressDots = 0;
      $scope.currentProgressDotIndex = null;
      $scope.arePreviousResponsesShown = false;

      $scope.loadSupplement = true;

      $scope.waitingForContinueButtonClick = false;

      $scope.upcomingStateName = null;
      $scope.upcomingContentHtml = null;
      $scope.upcomingInlineInteractionHtml = null;

      $scope.panels = [];
      $scope.PANEL_TUTOR = 'tutor';
      $scope.PANEL_SUPPLEMENTAL = 'supplemental';

      $scope.helpCardHtml = null;
      $scope.helpCardHasContinueButton = false;

      $scope.profilePicture = '/images/avatar/user_blue_72px.png';
      oppiaPlayerService.getUserProfileImage().then(function(result) {
        $scope.profilePicture = result;
      });

      $scope.clearHelpCard = function() {
        $scope.helpCardHtml = null;
        $scope.helpCardHasContinueButton = false;
      };

      // If the exploration is iframed, send data to its parent about its
      // height so that the parent can be resized as necessary.
      $scope.lastRequestedHeight = 0;
      $scope.lastRequestedScroll = false;
      $scope.adjustPageHeight = function(scroll, callback) {
        $timeout(function() {
          var newHeight = document.body.scrollHeight;
          if (Math.abs($scope.lastRequestedHeight - newHeight) > 50.5 ||
              (scroll && !$scope.lastRequestedScroll)) {
            // Sometimes setting iframe height to the exact content height still
            // produces scrollbar, so adding 50 extra px.
            newHeight += 50;
            messengerService.sendMessage(messengerService.HEIGHT_CHANGE,
              {height: newHeight, scroll: scroll});
            $scope.lastRequestedHeight = newHeight;
            $scope.lastRequestedScroll = scroll;
          }

          if (callback) {
            callback();
          }
        }, 100);
      };

      $scope.getThumbnailSrc = function(panelName) {
        if (panelName === $scope.PANEL_TUTOR) {
          return oppiaPlayerService.getOppiaAvatarImageUrl();
        } else if (panelName === $scope.PANEL_SUPPLEMENTAL) {
          // TODO(sll): Modify this to handle the case when there are both
          // interactions and gadgets.
          if (!$scope.activeCard.interactionIsInline) {
            return oppiaPlayerService.getInteractionThumbnailSrc(
              $scope.activeCard.stateName);
          } else {
            // For now, pick the first available gadget.
            // TODO(sll): Modify this; we should show thumbnails for all the
            // gadgets.
            for (var i = 0; i < $scope.gadgetPanelsContents.supplemental.length; i++) {
              var gadgetSpec = $scope.gadgetPanelsContents.supplemental[i];
              if (gadgetSpec.visible_in_states.indexOf($scope.activeCard.stateName) !== -1) {
                return oppiaPlayerService.getGadgetThumbnailSrc(gadgetSpec.gadget_type);
              }
            }
          }
        } else {
          throw Error(
            'Found a panel not corresponding to a tutor or interaction: ' +
            panelName);
        }
      };

      var isSupplementalCardNonempty = function(card) {
        return (
          !card.interactionIsInline || doesCardHaveSupplementalGadgets(card));
      };

      $scope.isCurrentSupplementalCardNonempty = function() {
        return $scope.activeCard && isSupplementalCardNonempty($scope.activeCard);
      };

      var _recomputeAndResetPanels = function() {
        $scope.clearHelpCard();

        $scope.panels = [];
        if (!$scope.canWindowFitTwoCards()) {
          $scope.panels.push($scope.PANEL_TUTOR);
        }
        if ($scope.isCurrentSupplementalCardNonempty()) {
          $scope.panels.push($scope.PANEL_SUPPLEMENTAL);
        }
        $scope.resetVisiblePanel();
      };

      $scope.currentVisiblePanelName = null;

      var doesCardHaveSupplementalGadgets = function(card) {
        return (
          $scope.gadgetPanelsContents.supplemental &&
          $scope.gadgetPanelsContents.supplemental.length > 0 &&
          $scope.gadgetPanelsContents.supplemental.some(function(gadgetSpec) {
            return gadgetSpec.visible_in_states.indexOf(card.stateName) !== -1;
          }));
      };

      $scope.isPanelVisible = function(panelName) {
        if (panelName === $scope.PANEL_TUTOR && $scope.canWindowFitTwoCards()) {
          return true;
        } else {
          return panelName == $scope.currentVisiblePanelName;
        }
      };

      $scope.setVisiblePanel = function(panelName) {
        $scope.currentVisiblePanelName = panelName;
        if (panelName === $scope.PANEL_TUTOR) {
          $scope.clearHelpCard();
        }
        if (panelName === $scope.PANEL_SUPPLEMENTAL) {
          $scope.$broadcast('showInteraction');
        }
      };

      $scope.resetVisiblePanel = function() {
        if ($scope.panels.length === 0) {
          $scope.currentVisiblePanelName = null;
        } else {
          $scope.currentVisiblePanelName = $scope.panels[0];
        }
      };

      // Changes the currently-active card, and resets the 'show previous
      // responses' setting.
      var _navigateToCard = function(index) {
        $scope.activeCard = $scope.transcript[index];
        $scope.arePreviousResponsesShown = false;
        $scope.clearHelpCard();

        _recomputeAndResetPanels();
        if (_nextFocusLabel && index === $scope.transcript.length - 1) {
          focusService.setFocusIfOnDesktop(_nextFocusLabel);
        } else {
          focusService.setFocusIfOnDesktop($scope.activeCard.contentHtmlFocusLabel);
        }
      };

      var animateToTwoCards = function(doneCallback) {
        $scope.isAnimatingToTwoCards = true;
        $timeout(function() {
          $scope.isAnimatingToTwoCards = false;
          if (doneCallback) {
            doneCallback();
          }
        }, TIME_NUM_CARDS_CHANGE_MSEC + TIME_FADEIN_MSEC + TIME_PADDING_MSEC);
      };

      var animateToOneCard = function(doneCallback) {
        $scope.isAnimatingToOneCard = true;
        $timeout(function() {
          $scope.isAnimatingToOneCard = false;
          if (doneCallback) {
            doneCallback();
          }
        }, TIME_NUM_CARDS_CHANGE_MSEC + TIME_FADEIN_MSEC + TIME_PADDING_MSEC);
      };

      var _addNewCard = function(stateName, contentHtml, interactionHtml) {
        oppiaPlayerService.applyCachedParamUpdates();
        $scope.transcript.push({
          stateName: stateName,
          contentHtml: contentHtml,
          contentHtmlFocusLabel: focusService.generateFocusLabel(),
          interactionHtml: interactionHtml,
          interactionIsInline: oppiaPlayerService.isInteractionInline(
            stateName),
          interactionIsDisabled: false,
          interactionInstructions: (
            oppiaPlayerService.getInteractionInstructions(stateName)),
          answerFeedbackPairs: []
        });

        $scope.numProgressDots++;
        $scope.progressDotClicked = false;

        var previousSupplementalCardIsNonempty = (
          $scope.transcript.length > 1 &&
          isSupplementalCardNonempty(
            $scope.transcript[$scope.transcript.length - 2]));
        var nextSupplementalCardIsNonempty = isSupplementalCardNonempty(
          $scope.transcript[$scope.transcript.length - 1]);

        if ($scope.canWindowFitTwoCards() && !previousSupplementalCardIsNonempty &&
            nextSupplementalCardIsNonempty) {
          // TODO(sll): Remove this hack. (It exists to ensure that Pencil
          // Code's loading does not interfere with the animation to two
          // side-by-side cards.
          $scope.loadSupplement = false;
          animateToTwoCards(function() {
            $scope.currentProgressDotIndex = $scope.numProgressDots - 1;
            $scope.loadSupplement = true;
          });
        } else if (
            $scope.canWindowFitTwoCards() && previousSupplementalCardIsNonempty &&
            !nextSupplementalCardIsNonempty) {
          animateToOneCard(function() {
            $scope.currentProgressDotIndex = $scope.numProgressDots - 1;
          });
        } else {
          $scope.currentProgressDotIndex = $scope.numProgressDots - 1;
        }
      };

      $scope.toggleShowPreviousResponses = function() {
        $scope.arePreviousResponsesShown = !$scope.arePreviousResponsesShown;
      };

      $scope.initializePage = function() {
        $scope.transcript = [];
        $scope.waitingForOppiaFeedback = false;
        hasInteractedAtLeastOnce = false;

        oppiaPlayerService.init(function(stateName, initHtml) {
          $scope.isLoggedIn = oppiaPlayerService.isLoggedIn();
          _nextFocusLabel = focusService.generateFocusLabel();
          $scope.gadgetPanelsContents = (
            oppiaPlayerService.getGadgetPanelsContents());

          _addNewCard(
            stateName,
            initHtml,
            oppiaPlayerService.getInteractionHtml(stateName, _nextFocusLabel));
          $rootScope.loadingMessage = '';
          $scope.hasFullyLoaded = true;

          $scope.adjustPageHeight(false, null);
          $window.scrollTo(0, 0);
          focusService.setFocusIfOnDesktop(_nextFocusLabel);

          $scope.explorationCompleted = oppiaPlayerService.isStateTerminal(
            stateName);
        });
      };

      $scope.submitAnswer = function(answer) {
        // For some reason, answers are getting submitted twice when the submit
        // button is clicked. This guards against that.
        if (_answerIsBeingProcessed || $scope.activeCard.interactionIsDisabled) {
          return;
        }

        $scope.clearHelpCard();

        _answerIsBeingProcessed = true;
        hasInteractedAtLeastOnce = true;
        $scope.waitingForOppiaFeedback = true;

        var _oldStateName = (
          $scope.transcript[$scope.transcript.length - 1].stateName);
        $scope.transcript[$scope.transcript.length - 1].answerFeedbackPairs.push({
          learnerAnswer: oppiaPlayerService.getAnswerAsHtml(answer),
          shortLearnerAnswer: oppiaPlayerService.getShortAnswerAsHtml(answer),
          oppiaFeedback: null
        });

        var timeAtServerCall = new Date().getTime();

        oppiaPlayerService.submitAnswer(answer, function(
            newStateName, refreshInteraction, feedbackHtml, contentHtml) {

          // Do not wait if the interaction is supplemental -- there's already
          // a delay bringing in the help card.
          var millisecsLeftToWait = (
            !oppiaPlayerService.isInteractionInline(_oldStateName) ? 1.0 :
            Math.max(MIN_CARD_LOADING_DELAY_MSEC - (
              new Date().getTime() - timeAtServerCall),
            1.0));

          $timeout(function() {
            $scope.waitingForOppiaFeedback = false;
            var pairs = (
              $scope.transcript[$scope.transcript.length - 1].answerFeedbackPairs);
            var lastAnswerFeedbackPair = pairs[pairs.length - 1];

            if (_oldStateName === newStateName) {
              // Stay on the same card.
              lastAnswerFeedbackPair.oppiaFeedback = feedbackHtml;
              if (feedbackHtml && !$scope.activeCard.interactionIsInline) {
                $scope.helpCardHtml = feedbackHtml;
              }
              if (refreshInteraction) {
                // Replace the previous interaction (even though it might be of
                // the same type).
                _nextFocusLabel = focusService.generateFocusLabel();
                $scope.transcript[$scope.transcript.length - 1].interactionHtml = (
                  oppiaPlayerService.getInteractionHtml(newStateName, _nextFocusLabel) +
                  oppiaPlayerService.getRandomSuffix());
              }
              focusService.setFocusIfOnDesktop(_nextFocusLabel);
              scrollToBottom();
            } else {
              // There is a new card. Disable the current interaction -- then, if
              // there is no feedback, move on immediately. Otherwise, give the
              // learner a chance to read the feedback, and display a 'Continue'
              // button.
              $scope.transcript[$scope.transcript.length - 1].interactionIsDisabled = true;

              _nextFocusLabel = focusService.generateFocusLabel();

              // These are used to compute the dimensions for the next card.
              $scope.upcomingStateName = newStateName;
              $scope.upcomingContentHtml = (
                contentHtml + oppiaPlayerService.getRandomSuffix());
              var _isNextInteractionInline = oppiaPlayerService.isInteractionInline(
                newStateName);
              $scope.upcomingInlineInteractionHtml = (
                _isNextInteractionInline ?
                oppiaPlayerService.getInteractionHtml(
                  newStateName, _nextFocusLabel
                ) + oppiaPlayerService.getRandomSuffix() : '');

              if (feedbackHtml) {
                lastAnswerFeedbackPair.oppiaFeedback = feedbackHtml;
                $scope.waitingForContinueButtonClick = true;

                if (!$scope.activeCard.interactionIsInline) {
                  $scope.helpCardHtml = feedbackHtml;
                  $scope.helpCardHasContinueButton = true;
                }

                _nextFocusLabel = $scope.CONTINUE_BUTTON_FOCUS_LABEL;
                focusService.setFocusIfOnDesktop(_nextFocusLabel);
                scrollToBottom();
              } else {
                // Note that feedbackHtml is an empty string if no feedback has
                // been specified. This causes the answer-feedback pair to change
                // abruptly, so we make the change only after the animation has
                // completed.
                $scope.showPendingCard(
                  newStateName,
                  contentHtml + oppiaPlayerService.getRandomSuffix(),
                  function() {
                    lastAnswerFeedbackPair.oppiaFeedback = feedbackHtml;
                  });
              }
            }

            $scope.explorationCompleted = oppiaPlayerService.isStateTerminal(
              newStateName);
            _answerIsBeingProcessed = false;
          }, millisecsLeftToWait);
        }, true);
      };

      $scope.startCardChangeAnimation = false;
      $scope.showPendingCard = function(newStateName, newContentHtml, successCallback) {
        $scope.waitingForContinueButtonClick = false;
        $scope.startCardChangeAnimation = true;

        $timeout(function() {
          _addNewCard(
            newStateName,
            newContentHtml,
            oppiaPlayerService.getInteractionHtml(
              newStateName, _nextFocusLabel) + oppiaPlayerService.getRandomSuffix());

          $scope.upcomingStateName = null;
          $scope.upcomingContentHtml = null;
          $scope.upcomingInlineInteractionHtml = null;
        }, TIME_FADEOUT_MSEC + 0.1 * TIME_HEIGHT_CHANGE_MSEC);

        $timeout(function() {
          focusService.setFocusIfOnDesktop(_nextFocusLabel);
          scrollToTop();
        }, TIME_FADEOUT_MSEC + TIME_HEIGHT_CHANGE_MSEC + 0.5 * TIME_FADEIN_MSEC);

        $timeout(function() {
          $scope.startCardChangeAnimation = false;
          if (successCallback) {
            successCallback();
          }
        }, TIME_FADEOUT_MSEC + TIME_HEIGHT_CHANGE_MSEC + TIME_FADEIN_MSEC + TIME_PADDING_MSEC);
      };

      var scrollToBottom = function() {
        $timeout(function() {
          var tutorCard = $('.conversation-skin-tutor-card-active');
          var tutorCardBottom = tutorCard.offset().top + tutorCard.outerHeight();
          if ($(window).scrollTop() + $(window).height() < tutorCardBottom) {
            $('html, body').animate({
              scrollTop: tutorCardBottom - $(window).height() + 12
            }, {
              duration: TIME_SCROLL_MSEC,
              easing: 'easeOutQuad'
            });
          }
        }, 100);
      };

      var scrollToTop = function() {
        $timeout(function() {
          $('html, body').animate({scrollTop: 0}, 800, 'easeOutQuart');
          return false;
        });
      };

      $scope.submitUserRating = function(ratingValue) {
        ratingService.submitUserRating(ratingValue);
      };
      $scope.$on('ratingUpdated', function() {
        $scope.userRating = ratingService.getUserRating();
      });

      $scope.$watch('currentProgressDotIndex', function(newValue) {
        if (newValue !== null) {
          _navigateToCard(newValue);
        }
      });

      $window.addEventListener('beforeunload', function(e) {
        if (hasInteractedAtLeastOnce && !$scope.explorationCompleted &&
            !$scope.isInPreviewMode) {
          oppiaPlayerService.registerMaybeLeaveEvent();
          var confirmationMessage = (
            'If you navigate away from this page, your progress on the ' +
            'exploration will be lost.');
          (e || $window.event).returnValue = confirmationMessage;
          return confirmationMessage;
        }
      });

      $scope.windowWidth = windowDimensionsService.getWidth();
      $window.onresize = function() {
        $scope.adjustPageHeight(false, null);
        $scope.windowWidth = windowDimensionsService.getWidth();
        _recomputeAndResetPanels();
      };

      $window.addEventListener('scroll', function() {
        fadeDotsOnScroll();
        fixSupplementOnScroll();
      });

      var fadeDotsOnScroll = function() {
        var progressDots = $('.conversation-skin-progress-dots');
        var progressDotsTop = progressDots.height();
        var newOpacity = Math.max(
          (progressDotsTop - $(window).scrollTop()) / progressDotsTop, 0);
        progressDots.css({opacity: newOpacity});
      };

      var fixSupplementOnScroll = function() {
        var supplementCard = $('div.conversation-skin-supplemental-card');
        var topMargin = $('.navbar-container').height() - 20;
        if ($(window).scrollTop() > topMargin) {
          supplementCard.addClass('conversation-skin-supplemental-card-fixed');
        } else {
          supplementCard.removeClass('conversation-skin-supplemental-card-fixed');
        }
      };

      $scope.canWindowFitTwoCards = function() {
        return $scope.windowWidth >= TWO_CARD_THRESHOLD_PX;
      };

      $scope.initializePage();
      ratingService.init(function(userRating) {
        $scope.userRating = userRating;
      });
    }]
  };
}]);


oppia.directive('answerFeedbackPair', [function() {
  return {
    restrict: 'E',
    scope: {
      answer: '&',
      feedback: '&',
      oppiaAvatarImageUrl: '&',
      profilePicture: '&',
      shortAnswer: '&'
    },
    templateUrl: 'components/answerFeedbackPair'
  };
}]);


oppia.directive('progressDots', [function() {
  return {
    restrict: 'E',
    scope: {
      getNumDots: '&numDots',
      currentDotIndex: '=',
      progressDotClicked: '='
    },
    templateUrl: 'components/progressDots',
    controller: ['$scope', function($scope) {

      $scope.MAX_DOTS = 18;
      $scope.dots = [];
      var initialDotCount = $scope.getNumDots();
      for (var i = 0; i < initialDotCount; i++) {
        $scope.dots.push({});
      }

      $scope.$watch(function() {
        return $scope.getNumDots();
      }, function(newValue) {
        var oldValue = $scope.dots.length;

        if (newValue === oldValue) {
          return;
        } else if (newValue === oldValue + 1) {
          $scope.dots.push({});
          $scope.currentDotIndex = $scope.dots.length - 1;
          $scope.rightmostVisibleDotIndex = $scope.dots.length - 1;
          if ($scope.dots.length > $scope.MAX_DOTS) {
            $scope.leftmostVisibleDotIndex = $scope.rightmostVisibleDotIndex - $scope.MAX_DOTS + 1;
          } else {
            $scope.leftmostVisibleDotIndex = 0;
          }
        } else {
          throw Error(
            'Unexpected change to number of dots from ' + oldValue + ' to ' +
            newValue);
        }
      });

      $scope.changeActiveDot = function(index) {
        $scope.progressDotClicked = true;
        $scope.currentDotIndex = index;
      };

      $scope.decrementCurrentDotIndex = function() {
        if ($scope.currentDotIndex > 0) {
          if ($scope.currentDotIndex === $scope.leftmostVisibleDotIndex) {
            $scope.leftmostVisibleDotIndex = $scope.leftmostVisibleDotIndex - 1;
            $scope.rightmostVisibleDotIndex = $scope.rightmostVisibleDotIndex - 1;
          }
          $scope.changeActiveDot($scope.currentDotIndex - 1);
        }
      };

      $scope.incrementCurrentDotIndex = function() {
        if ($scope.currentDotIndex < $scope.dots.length - 1) {
          if ($scope.currentDotIndex === $scope.rightmostVisibleDotIndex) {
            $scope.rightmostVisibleDotIndex = $scope.rightmostVisibleDotIndex + 1;
            $scope.leftmostVisibleDotIndex = $scope.leftmostVisibleDotIndex + 1;
          }
          $scope.changeActiveDot($scope.currentDotIndex + 1);
        }
      };
    }]
  };
}]);

oppia.directive('mobileFriendlyTooltip', ['$timeout', function($timeout) {
  return {
    restrict: 'A',
    scope: true,
    controller: ['$scope', 'deviceInfoService', function(
      $scope, deviceInfoService) {
      $scope.opened = false;
      $scope.deviceHasTouchEvents = deviceInfoService.hasTouchEvents();
    }],
    link: function(scope, element) {
      var TIME_TOOLTIP_CLOSE_DELAY_MOBILE = 1000;

      if (scope.deviceHasTouchEvents) {
        element.on('touchstart', function() {
          scope.opened = true;
          scope.$apply();
        });
        element.on('touchend', function() {
          // Set time delay before tooltip close
          $timeout(function() {
            scope.opened = false;
          }, TIME_TOOLTIP_CLOSE_DELAY_MOBILE);
        });
      } else {
        element.on('mouseenter', function() {
          scope.opened = true;
          scope.$apply();
        });

        element.on('mouseleave', function() {
          scope.opened = false;
          scope.$apply();
        });
      };
    }
  };
}]);
