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
 */

// Note: This file should be assumed to be in an IIFE, and the constants below
// should only be used within this file.
var TIME_FADEOUT_MSEC = 100;
var TIME_HEIGHT_CHANGE_MSEC = 500;
var TIME_FADEIN_MSEC = 100;
var TIME_NUM_CARDS_CHANGE_MSEC = 500;

oppia.animation('.conversation-skin-animate-tutor-card-on-narrow', function() {
  var tutorCardLeft, tutorCardWidth, tutorCardHeight, oppiaAvatarLeft;
  var tutorCardAnimatedLeft, tutorCardAnimatedWidth;

  var beforeAddClass = function(element, className, done) {
    if (className !== 'ng-hide') {
      done();
      return;
    }
    var tutorCard = element;
    var supplementalCard = $('.conversation-skin-supplemental-card-container');
    var oppiaAvatar = $('.conversation-skin-oppia-avatar.show-tutor-card');
    oppiaAvatarLeft = supplementalCard.position().left +
                      supplementalCard.width() - oppiaAvatar.width();
    tutorCardLeft = tutorCard.position().left;
    tutorCardWidth = tutorCard.width();
    tutorCardHeight = tutorCard.height();

    if (tutorCard.offset().left + tutorCardWidth > oppiaAvatar.offset().left) {
      var animationLength = Math.min(oppiaAvatarLeft - tutorCard.offset().left,
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

oppia.animation('.conversation-skin-animate-cards', function() {
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

oppia.directive('conversationSkin', ['urlService', function(urlService) {
  return {
    restrict: 'E',
    scope: {},
    link: function(scope) {
      var isIframed = urlService.isIframed();
      scope.directiveTemplateId = isIframed ?
        'skins/ConversationEmbed' : 'skins/Conversation';
    },
    template: '<div ng-include="directiveTemplateId"></div>',
    controller: [
      '$scope', '$timeout', '$rootScope', '$window', '$translate', '$http',
       'messengerService', 'oppiaPlayerService', 'urlService', 'focusService',
      'LearnerViewRatingService', 'windowDimensionsService',
      'playerTranscriptService', 'LearnerParamsService',
      'playerPositionService', 'explorationRecommendationsService',
      'StatsReportingService', 'UrlInterpolationService',
      'siteAnalyticsService', 'ExplorationPlayerStateService',
      'TWO_CARD_THRESHOLD_PX', 'CONTENT_FOCUS_LABEL_PREFIX', 'alertsService',
      function(
          $scope, $timeout, $rootScope, $window, $translate, $http,
          messengerService, oppiaPlayerService, urlService, focusService,
          LearnerViewRatingService, windowDimensionsService,
          playerTranscriptService, LearnerParamsService,
          playerPositionService, explorationRecommendationsService,
          StatsReportingService, UrlInterpolationService,
          siteAnalyticsService, ExplorationPlayerStateService,
          TWO_CARD_THRESHOLD_PX, CONTENT_FOCUS_LABEL_PREFIX, alertsService) {
        $scope.CONTINUE_BUTTON_FOCUS_LABEL = 'continueButton';
        // The minimum width, in pixels, needed to be able to show two cards
        // side-by-side.
        var TIME_PADDING_MSEC = 250;
        var TIME_SCROLL_MSEC = 600;
        var MIN_CARD_LOADING_DELAY_MSEC = 950;

        var hasInteractedAtLeastOnce = false;
        var _answerIsBeingProcessed = false;
        var _nextFocusLabel = null;
        // This variable is used only when viewport is narrow.
        // Indicates whether the tutor card is displayed.
        var tutorCardIsDisplayedIfNarrow = true;

        $scope.explorationId = oppiaPlayerService.getExplorationId();
        $scope.isInPreviewMode = oppiaPlayerService.isInPreviewMode();
        $scope.isIframed = urlService.isIframed();
        $rootScope.loadingMessage = 'Loading';
        $scope.hasFullyLoaded = false;
        $scope.recommendedExplorationSummaries = [];

        $scope.OPPIA_AVATAR_IMAGE_URL = (
          UrlInterpolationService.getStaticImageUrl(
            '/avatar/oppia_black_72px.png'));

        $scope.activeCard = null;
        $scope.numProgressDots = 0;

        $scope.upcomingStateName = null;
        $scope.upcomingContentHtml = null;
        $scope.upcomingInlineInteractionHtml = null;

        $scope.DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER =
          GLOBALS.DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER;

        $scope.getContentFocusLabel = function(index) {
          return CONTENT_FOCUS_LABEL_PREFIX + index;
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
              // Sometimes setting iframe height to the exact content height
              // still produces scrollbar, so adding 50 extra px.
              newHeight += 50;
              messengerService.sendMessage(messengerService.HEIGHT_CHANGE, {
                height: newHeight,
                scroll: scroll
              });
              $scope.lastRequestedHeight = newHeight;
              $scope.lastRequestedScroll = scroll;
            }

            if (callback) {
              callback();
            }
          }, 100);
        };

        $scope.reloadExploration = function() {
          $window.location.reload();
        };

        $scope.isOnTerminalCard = function() {
          return $scope.activeCard &&
            ExplorationPlayerStateService.isStateTerminal(
              $scope.activeCard.stateName);
        };

        var isSupplementalCardNonempty = function(card) {
          return !ExplorationPlayerStateService.isInteractionInline(
            card.stateName);
        };

        $scope.isCurrentSupplementalCardNonempty = function() {
          return $scope.activeCard && isSupplementalCardNonempty(
            $scope.activeCard);
        };

        // Navigates to the currently-active card, and resets the 'show previous
        // responses' setting.
        var _navigateToActiveCard = function() {
          $scope.$broadcast('activeCardChanged');

          var index = playerPositionService.getActiveCardIndex();
          $scope.activeCard = playerTranscriptService.getCard(index);
          tutorCardIsDisplayedIfNarrow = true;
          if (_nextFocusLabel && playerTranscriptService.isLastCard(index)) {
            focusService.setFocusIfOnDesktop(_nextFocusLabel);
          } else {
            focusService.setFocusIfOnDesktop(
              $scope.getContentFocusLabel(index));
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
          }, TIME_NUM_CARDS_CHANGE_MSEC);
        };

        $scope.isCurrentCardAtEndOfTranscript = function() {
          return playerTranscriptService.isLastCard(
            playerPositionService.getActiveCardIndex());
        };
        var _addNewCard = function(
            stateName, newParams, contentHtml, interactionHtml) {
          playerTranscriptService.addNewCard(
            stateName, newParams, contentHtml, interactionHtml);

          if (newParams) {
            LearnerParamsService.init(newParams);
          }

          $scope.numProgressDots++;

          var totalNumCards = playerTranscriptService.getNumCards();

          var previousSupplementalCardIsNonempty = (
            totalNumCards > 1 &&
            isSupplementalCardNonempty(
              playerTranscriptService.getCard(totalNumCards - 2)));
          var nextSupplementalCardIsNonempty = isSupplementalCardNonempty(
            playerTranscriptService.getLastCard());

          if (totalNumCards > 1 && !$scope.isViewportNarrow() &&
              !previousSupplementalCardIsNonempty &&
              nextSupplementalCardIsNonempty) {
            playerPositionService.setActiveCardIndex(
                $scope.numProgressDots - 1);
            animateToTwoCards(function() {});
          } else if (
              totalNumCards > 1 && !$scope.isViewportNarrow() &&
              previousSupplementalCardIsNonempty &&
              !nextSupplementalCardIsNonempty) {
            animateToOneCard(function() {
              playerPositionService.setActiveCardIndex(
                $scope.numProgressDots - 1);
            });
          } else {
            playerPositionService.setActiveCardIndex(
              $scope.numProgressDots - 1);
          }

          if (ExplorationPlayerStateService.isStateTerminal(stateName)) {
            explorationRecommendationsService.getRecommendedSummaryDicts(
              ExplorationPlayerStateService.getAuthorRecommendedExpIds(
                stateName),
              function(summaries) {
                $scope.recommendedExplorationSummaries = summaries;
              });
          }
        };

        $scope.initializePage = function() {
          hasInteractedAtLeastOnce = false;
          $scope.recommendedExplorationSummaries = [];

          playerPositionService.init(_navigateToActiveCard);
          oppiaPlayerService.init(function(exploration, initHtml, newParams) {
            ExplorationPlayerStateService.setExploration(exploration);
            $scope.isLoggedIn = oppiaPlayerService.isLoggedIn();
            _nextFocusLabel = focusService.generateFocusLabel();

            _addNewCard(
              exploration.initStateName,
              newParams,
              initHtml,
              oppiaPlayerService.getInteractionHtml(
                exploration.initStateName, _nextFocusLabel));
            $rootScope.loadingMessage = '';
            $scope.hasFullyLoaded = true;

            // If the exploration is embedded, use the exploration language
            // as site language. If the exploration language is not supported
            // as site language, English is used as default.
            var langCodes = $window.GLOBALS.SUPPORTED_SITE_LANGUAGES.map(
              function(language) {
                return language.id;
              });
            if ($scope.isIframed) {
              var explorationLanguageCode = (
                oppiaPlayerService.getExplorationLanguageCode());
              if (langCodes.indexOf(explorationLanguageCode) !== -1) {
                $translate.use(explorationLanguageCode);
              } else {
                $translate.use('en');
              }
            }
            $scope.adjustPageHeight(false, null);
            $window.scrollTo(0, 0);
            focusService.setFocusIfOnDesktop(_nextFocusLabel);
          });
        };

        $scope.submitAnswer = function(answer, interactionRulesService) {
          // For some reason, answers are getting submitted twice when the
          // submit button is clicked. This guards against that.
          if (_answerIsBeingProcessed ||
              !$scope.isCurrentCardAtEndOfTranscript() ||
              $scope.activeCard.destStateName) {
            return;
          }

          _answerIsBeingProcessed = true;
          hasInteractedAtLeastOnce = true;

          var _oldStateName = playerTranscriptService.getLastCard().stateName;
          playerTranscriptService.addNewAnswer(answer);

          var timeAtServerCall = new Date().getTime();

          oppiaPlayerService.submitAnswer(
            answer, interactionRulesService, function(
                newStateName, refreshInteraction, feedbackHtml, contentHtml,
                newParams) {
              // Do not wait if the interaction is supplemental -- there's
              // already a delay bringing in the help card.
              var millisecsLeftToWait = (
                !ExplorationPlayerStateService.isInteractionInline(
                  _oldStateName) ? 1.0 :
                Math.max(MIN_CARD_LOADING_DELAY_MSEC - (
                  new Date().getTime() - timeAtServerCall),
                1.0));

              $timeout(function() {
                $scope.$broadcast('oppiaFeedbackAvailable');
                var pairs = (
                  playerTranscriptService.getLastCard().answerFeedbackPairs);
                var lastAnswerFeedbackPair = pairs[pairs.length - 1];

                if (_oldStateName === newStateName) {
                  // Stay on the same card.
                  playerTranscriptService.addNewFeedback(feedbackHtml);
                  if (feedbackHtml &&
                      !ExplorationPlayerStateService.isInteractionInline(
                        $scope.activeCard.stateName)) {
                    $scope.$broadcast('helpCardAvailable', {
                      helpCardHtml: feedbackHtml,
                      hasContinueButton: false
                    });
                  }
                  if (refreshInteraction) {
                    // Replace the previous interaction with another of the
                    // same type.
                    _nextFocusLabel = focusService.generateFocusLabel();
                    playerTranscriptService.updateLatestInteractionHtml(
                      oppiaPlayerService.getInteractionHtml(
                        newStateName, _nextFocusLabel) +
                      oppiaPlayerService.getRandomSuffix());
                  }
                  focusService.setFocusIfOnDesktop(_nextFocusLabel);
                  scrollToBottom();
                } else {
                  // There is a new card. If there is no feedback, move on
                  // immediately. Otherwise, give the learner a chance to read
                  // the feedback, and display a 'Continue' button.

                  _nextFocusLabel = focusService.generateFocusLabel();

                  playerTranscriptService.setDestination(newStateName);

                  // These are used to compute the dimensions for the next card.
                  $scope.upcomingStateName = newStateName;
                  $scope.upcomingParams = newParams;
                  $scope.upcomingContentHtml = (
                    contentHtml + oppiaPlayerService.getRandomSuffix());

                  var _isNextInteractionInline = (
                    ExplorationPlayerStateService.isInteractionInline(
                      newStateName));
                  $scope.upcomingInlineInteractionHtml = (
                    _isNextInteractionInline ?
                    oppiaPlayerService.getInteractionHtml(
                      newStateName, _nextFocusLabel
                    ) + oppiaPlayerService.getRandomSuffix() : '');

                  $scope.$broadcast('destinationCardAvailable', {
                    upcomingStateName: $scope.upcomingStateName,
                    upcomingParams: $scope.upcomingParams,
                    upcomingContentHtml: $scope.upcomingContentHtml,
                    upcomingInlineInteractionHtml:
                        $scope.upcomingInlineInteractionHtml
                  });

                  if (feedbackHtml) {
                    playerTranscriptService.addNewFeedback(feedbackHtml);

                    if (!ExplorationPlayerStateService.isInteractionInline(
                          $scope.activeCard.stateName)) {
                      $scope.$broadcast('helpCardAvailable', {
                        helpCardHtml: feedbackHtml,
                        hasContinueButton: true
                      });
                    }

                    _nextFocusLabel = $scope.CONTINUE_BUTTON_FOCUS_LABEL;
                    focusService.setFocusIfOnDesktop(_nextFocusLabel);
                    scrollToBottom();
                  } else {
                    playerTranscriptService.addNewFeedback(feedbackHtml);
                    $scope.showPendingCard(
                      newStateName,
                      newParams,
                      contentHtml + oppiaPlayerService.getRandomSuffix());
                  }
                }

                _answerIsBeingProcessed = false;
              }, millisecsLeftToWait);
            }
          );
        };
        $scope.startCardChangeAnimation = false;
        $scope.showPendingCard = function(
            newStateName, newParams, newContentHtml) {
          $scope.startCardChangeAnimation = true;

          $timeout(function() {
            var newInteractionHtml = oppiaPlayerService.getInteractionHtml(
              newStateName, _nextFocusLabel);
            // Note that newInteractionHtml may be null.
            if (newInteractionHtml) {
              newInteractionHtml += oppiaPlayerService.getRandomSuffix();
            }

            _addNewCard(
              newStateName, newParams, newContentHtml, newInteractionHtml);

            $scope.upcomingStateName = null;
            $scope.upcomingParams = null;
            $scope.upcomingContentHtml = null;
            $scope.upcomingInlineInteractionHtml = null;
          }, TIME_FADEOUT_MSEC + 0.1 * TIME_HEIGHT_CHANGE_MSEC);

          $timeout(function() {
            focusService.setFocusIfOnDesktop(_nextFocusLabel);
            scrollToTop();
          },
          TIME_FADEOUT_MSEC + TIME_HEIGHT_CHANGE_MSEC + 0.5 * TIME_FADEIN_MSEC);

          $timeout(function() {
            $scope.startCardChangeAnimation = false;
          },
          TIME_FADEOUT_MSEC + TIME_HEIGHT_CHANGE_MSEC + TIME_FADEIN_MSEC +
          TIME_PADDING_MSEC);
        };

        $scope.showUpcomingCard = function() {
          $scope.showPendingCard(
            $scope.upcomingStateName, $scope.upcomingParams,
            $scope.upcomingContentHtml);
        };

        var scrollToBottom = function() {
          $timeout(function() {
            var tutorCard = $('.conversation-skin-main-tutor-card');

            if (tutorCard.length === 0) {
              return;
            }
            var tutorCardBottom = (
              tutorCard.offset().top + tutorCard.outerHeight());
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
            $('html, body').animate({
              scrollTop: 0
            }, 800, 'easeOutQuart');
            return false;
          });
        };

        $scope.submitUserRating = function(ratingValue) {
          LearnerViewRatingService.submitUserRating(ratingValue);
        };
        $scope.$on('ratingUpdated', function() {
          $scope.userRating = LearnerViewRatingService.getUserRating();
        });

        $window.addEventListener('beforeunload', function(e) {
          if (hasInteractedAtLeastOnce && !$scope.isInPreviewMode &&
              !ExplorationPlayerStateService.isStateTerminal(
                playerTranscriptService.getLastCard().stateName)) {
            StatsReportingService.recordMaybeLeaveEvent(
              playerTranscriptService.getLastStateName(),
              LearnerParamsService.getAllParams());
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
          progressDots.css({
            opacity: newOpacity
          });
        };

        var fixSupplementOnScroll = function() {
          var supplementCard = $('div.conversation-skin-supplemental-card');
          var topMargin = $('.navbar-container').height() - 20;
          if ($(window).scrollTop() > topMargin) {
            supplementCard.addClass(
              'conversation-skin-supplemental-card-fixed');
          } else {
            supplementCard.removeClass(
              'conversation-skin-supplemental-card-fixed');
          }
        };

        $scope.isViewportNarrow = function() {
          return $scope.windowWidth < TWO_CARD_THRESHOLD_PX;
        };

        $scope.isScreenNarrowAndShowingTutorCard = function() {
          if (!$scope.isCurrentSupplementalCardNonempty()) {
            return $scope.isViewportNarrow();
          }
          return $scope.isViewportNarrow() &&
                 tutorCardIsDisplayedIfNarrow;
        };

        $scope.isScreenNarrowAndShowingSupplementalCard = function() {
          return $scope.isViewportNarrow() &&
                 !tutorCardIsDisplayedIfNarrow;
        };

        $scope.showTutorCardIfScreenIsNarrow = function() {
          if ($scope.isViewportNarrow()) {
            tutorCardIsDisplayedIfNarrow = true;
          }
        };

        $scope.showSupplementalCardIfScreenIsNarrow = function() {
          if ($scope.isViewportNarrow()) {
            tutorCardIsDisplayedIfNarrow = false;
          }
        };

        $scope.initializePage();
        LearnerViewRatingService.init(function(userRating) {
          $scope.userRating = userRating;
        });

        $scope.collectionId = GLOBALS.collectionId;
        $scope.collectionTitle = GLOBALS.collectionTitle;

        if ($scope.collectionId) {
          $http.get('/collectionsummarieshandler/data', {
            params: {
              stringified_collection_ids: JSON.stringify([$scope.collectionId])
            }
          }).then(
            function(response) {
              $scope.collectionSummary = response.data.summaries[0];
            },
            function() {
              alertsService.addWarning(
                'There was an error while fetching the collection summary.');
            }
          );
        }

        $scope.onNavigateFromIframe = function() {
          siteAnalyticsService.registerVisitOppiaFromIframeEvent(
            $scope.explorationId);
        };

        $scope.getExplorationGadgetPanelsContents = function() {
          return ExplorationPlayerStateService.getGadgetPanelsContents();
        };
      }
    ]
  };
}]);
