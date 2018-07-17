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

oppia.animation('.conversation-skin-animate-tutor-card-content', function() {
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

oppia.directive('conversationSkin', [
  'UrlService', 'UrlInterpolationService',
  function(UrlService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      link: function(scope) {
        var isIframed = UrlService.isIframed();
        scope.directiveTemplate = isIframed ?
          UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_player/' +
            'conversation_skin_embed_directive.html') :
          UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_player/' +
            'conversation_skin_directive.html');
      },
      template: '<div ng-include="directiveTemplate"></div>',
      controller: [
        '$scope', '$timeout', '$rootScope', '$window', '$translate', '$http',
        '$location', 'MessengerService', 'AlertsService',
        'ExplorationPlayerService', 'UrlService', 'FocusManagerService',
        'LearnerViewRatingService', 'WindowDimensionsService',
        'PlayerTranscriptService', 'LearnerParamsService',
        'PlayerPositionService', 'ExplorationRecommendationsService',
        'StatsReportingService', 'siteAnalyticsService',
        'ExplorationPlayerStateService', 'CONTENT_FOCUS_LABEL_PREFIX',
        'CONTINUE_BUTTON_FOCUS_LABEL', 'EVENT_ACTIVE_CARD_CHANGED',
        'EVENT_NEW_CARD_AVAILABLE', 'EVENT_PROGRESS_NAV_SUBMITTED',
        'FatigueDetectionService', 'NumberAttemptsService',
        'PlayerCorrectnessFeedbackEnabledService',
        'ConceptCardBackendApiService', 'ConceptCardObjectFactory',
        'RefresherExplorationConfirmationModalService',
        'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE', 'INTERACTION_SPECS',
        'EVENT_NEW_CARD_OPENED', 'HintsAndSolutionManagerService',
        'AudioTranslationManagerService', 'EVENT_AUTOPLAY_AUDIO',
        'COMPONENT_NAME_FEEDBACK', 'AutogeneratedAudioPlayerService',
        function(
            $scope, $timeout, $rootScope, $window, $translate, $http,
            $location, MessengerService, AlertsService,
            ExplorationPlayerService, UrlService, FocusManagerService,
            LearnerViewRatingService, WindowDimensionsService,
            PlayerTranscriptService, LearnerParamsService,
            PlayerPositionService, ExplorationRecommendationsService,
            StatsReportingService, siteAnalyticsService,
            ExplorationPlayerStateService, CONTENT_FOCUS_LABEL_PREFIX,
            CONTINUE_BUTTON_FOCUS_LABEL, EVENT_ACTIVE_CARD_CHANGED,
            EVENT_NEW_CARD_AVAILABLE, EVENT_PROGRESS_NAV_SUBMITTED,
            FatigueDetectionService, NumberAttemptsService,
            PlayerCorrectnessFeedbackEnabledService,
            ConceptCardBackendApiService, ConceptCardObjectFactory,
            RefresherExplorationConfirmationModalService,
            EXPLORATION_SUMMARY_DATA_URL_TEMPLATE, INTERACTION_SPECS,
            EVENT_NEW_CARD_OPENED, HintsAndSolutionManagerService,
            AudioTranslationManagerService, EVENT_AUTOPLAY_AUDIO,
            COMPONENT_NAME_FEEDBACK, AutogeneratedAudioPlayerService) {
          $scope.CONTINUE_BUTTON_FOCUS_LABEL = CONTINUE_BUTTON_FOCUS_LABEL;
          // The minimum width, in pixels, needed to be able to show two cards
          // side-by-side.
          var TIME_PADDING_MSEC = 250;
          var TIME_SCROLL_MSEC = 600;
          var MIN_CARD_LOADING_DELAY_MSEC = 950;

          var hasInteractedAtLeastOnce = false;
          $scope.answerIsBeingProcessed = false;
          var _nextFocusLabel = null;
          // This variable is used only when viewport is narrow.
          // Indicates whether the tutor card is displayed.
          var tutorCardIsDisplayedIfNarrow = true;

          $scope.explorationId = ExplorationPlayerService.getExplorationId();
          $scope.isInPreviewMode = ExplorationPlayerService.isInPreviewMode();
          $scope.isIframed = UrlService.isIframed();
          $rootScope.loadingMessage = 'Loading';
          $scope.hasFullyLoaded = false;
          $scope.recommendedExplorationSummaries = null;
          $scope.answerIsCorrect = false;
          $scope.conceptCardPending = false;
          $scope.pendingCardWasSeenBefore = false;
          $scope.isCorrectnessFeedbackEnabled = function() {
            return PlayerCorrectnessFeedbackEnabledService.isEnabled();
          };

          $scope.isCorrectnessFooterEnabled = function() {
            return (
              $scope.answerIsCorrect && $scope.isCorrectnessFeedbackEnabled() &&
              PlayerPositionService.hasLearnerJustSubmittedAnAnswer());
          };

          $scope.isLearnAgainButton = function() {
            var conceptCardIsBeingShown =
              ExplorationPlayerStateService.isStateShowingConceptCard(
                $scope.activeCard.stateName);
            if (conceptCardIsBeingShown) {
              return false;
            }
            var interaction = ExplorationPlayerService.getInteraction(
              $scope.activeCard.stateName);
            if (INTERACTION_SPECS[interaction.id].is_linear) {
              return false;
            }
            return (
              $scope.pendingCardWasSeenBefore && !$scope.answerIsCorrect &&
              $scope.isCorrectnessFeedbackEnabled());
          };

          $scope.OPPIA_AVATAR_IMAGE_URL = (
            UrlInterpolationService.getStaticImageUrl(
              '/avatar/oppia_avatar_100px.svg'));
          $scope.getStaticImageUrl = (
            UrlInterpolationService.getStaticImageUrl);

          $scope.activeCard = null;

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
                MessengerService.sendMessage(MessengerService.HEIGHT_CHANGE, {
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
            if (
              ExplorationPlayerStateService.isStateShowingConceptCard(
                card.stateName)) {
              return false;
            }
            return !ExplorationPlayerStateService.isInteractionInline(
              card.stateName);
          };

          $scope.isCurrentSupplementalCardNonempty = function() {
            return $scope.activeCard && isSupplementalCardNonempty(
              $scope.activeCard);
          };

          $scope.isSupplementalNavShown = function() {
            if (
              ExplorationPlayerStateService.isStateShowingConceptCard(
                $scope.activeCard.stateName)) {
              return false;
            }
            var interaction = ExplorationPlayerService.getInteraction(
              $scope.activeCard.stateName);
            return (
              Boolean(interaction.id) &&
              INTERACTION_SPECS[interaction.id].show_generic_submit_button &&
              $scope.isCurrentCardAtEndOfTranscript());
          };

          // Navigates to the currently-active card, and resets the
          // 'show previous responses' setting.
          var _navigateToActiveCard = function() {
            $rootScope.$broadcast(EVENT_ACTIVE_CARD_CHANGED);
            $scope.$broadcast(EVENT_AUTOPLAY_AUDIO);
            /* A hash value is added to URL for scrolling to Oppia feedback
               when answer is submitted by user in mobile view. This hash value
               has to be reset each time a new card is loaded to prevent
               unwanted scrolling in the new card. */
            $location.hash(null);
            $scope.pendingCardWasSeenBefore = false;
            // We must cancel the autogenerated audio player here, or else a
            // bug where the autogenerated audio player generates duplicate
            // utterances occurs.
            AutogeneratedAudioPlayerService.cancel();
            var index = PlayerPositionService.getActiveCardIndex();
            $scope.activeCard = PlayerTranscriptService.getCard(index);
            tutorCardIsDisplayedIfNarrow = true;
            if (_nextFocusLabel && PlayerTranscriptService.isLastCard(index)) {
              FocusManagerService.setFocusIfOnDesktop(_nextFocusLabel);
            } else {
              FocusManagerService.setFocusIfOnDesktop(
                $scope.getContentFocusLabel(index));
            }
          };

          $scope.returnToExplorationAfterConceptCard = function() {
            PlayerTranscriptService.addPreviousCard();
            var numCards = PlayerTranscriptService.getNumCards();
            PlayerPositionService.setActiveCardIndex(numCards - 1);
          };

          var animateToTwoCards = function(doneCallback) {
            $scope.isAnimatingToTwoCards = true;
            $timeout(function() {
              $scope.isAnimatingToTwoCards = false;
              if (doneCallback) {
                doneCallback();
              }
            }, TIME_NUM_CARDS_CHANGE_MSEC + TIME_FADEIN_MSEC +
              TIME_PADDING_MSEC);
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
            return PlayerTranscriptService.isLastCard(
              PlayerPositionService.getActiveCardIndex());
          };
          var _addNewCard = function(
              stateName, newParams, contentHtml, interactionHtml) {
            PlayerTranscriptService.addNewCard(
              stateName, newParams, contentHtml, interactionHtml);

            if (newParams) {
              LearnerParamsService.init(newParams);
            }

            var totalNumCards = PlayerTranscriptService.getNumCards();

            var previousSupplementalCardIsNonempty = (
              totalNumCards > 1 &&
              isSupplementalCardNonempty(
                PlayerTranscriptService.getCard(totalNumCards - 2)));
            var nextSupplementalCardIsNonempty = isSupplementalCardNonempty(
              PlayerTranscriptService.getLastCard());

            if (
              totalNumCards > 1 &&
              ExplorationPlayerService.canWindowShowTwoCards() &&
              !previousSupplementalCardIsNonempty &&
              nextSupplementalCardIsNonempty) {
              PlayerPositionService.setActiveCardIndex(totalNumCards - 1);
              animateToTwoCards(function() {});
            } else if (
              totalNumCards > 1 &&
              ExplorationPlayerService.canWindowShowTwoCards() &&
              previousSupplementalCardIsNonempty &&
              !nextSupplementalCardIsNonempty) {
              animateToOneCard(function() {
                PlayerPositionService.setActiveCardIndex(totalNumCards - 1);
              });
            } else {
              PlayerPositionService.setActiveCardIndex(totalNumCards - 1);
            }

            if (ExplorationPlayerStateService.isStateTerminal(stateName)) {
              $scope.isRefresherExploration = false;
              $scope.parentExplorationIds =
                UrlService.getQueryFieldValuesAsList('parent');
              var recommendedExplorationIds = [];
              var includeAutogeneratedRecommendations = false;

              if ($scope.parentExplorationIds.length > 0) {
                $scope.isRefresherExploration = true;
                var parentExplorationId = $scope.parentExplorationIds[
                  $scope.parentExplorationIds.length - 1];
                recommendedExplorationIds.push(parentExplorationId);
              } else {
                recommendedExplorationIds =
                  ExplorationPlayerStateService.getAuthorRecommendedExpIds(
                    stateName);
                includeAutogeneratedRecommendations = true;
              }

              ExplorationRecommendationsService.getRecommendedSummaryDicts(
                recommendedExplorationIds,
                includeAutogeneratedRecommendations,
                function(summaries) {
                  $scope.recommendedExplorationSummaries = summaries;
                });
            }
          };

          $scope.initializePage = function() {
            hasInteractedAtLeastOnce = false;
            $scope.recommendedExplorationSummaries = null;

            PlayerPositionService.init(_navigateToActiveCard);
            ExplorationPlayerService.init(function(
                exploration, initHtml, newParams) {
              ExplorationPlayerStateService.setExploration(exploration);
              $scope.isLoggedIn = ExplorationPlayerService.isLoggedIn();
              _nextFocusLabel = FocusManagerService.generateFocusLabel();

              _addNewCard(
                exploration.initStateName,
                newParams,
                initHtml,
                ExplorationPlayerService.getInteractionHtml(
                  exploration.initStateName, _nextFocusLabel));
              $rootScope.loadingMessage = '';
              $scope.hasFullyLoaded = true;

              // If the exploration is embedded, use the exploration language
              // as site language. If the exploration language is not supported
              // as site language, English is used as default.
              var langCodes = constants.SUPPORTED_SITE_LANGUAGES.map(
                function(language) {
                  return language.id;
                });
              if ($scope.isIframed) {
                var explorationLanguageCode = (
                  ExplorationPlayerService.getExplorationLanguageCode());
                if (langCodes.indexOf(explorationLanguageCode) !== -1) {
                  $translate.use(explorationLanguageCode);
                } else {
                  $translate.use('en');
                }
              }
              $scope.adjustPageHeight(false, null);
              $window.scrollTo(0, 0);
              FocusManagerService.setFocusIfOnDesktop(_nextFocusLabel);

              // The timeout is needed in order to give the recipient of the
              // broadcast sufficient time to load.
              $timeout(function() {
                $rootScope.$broadcast(EVENT_NEW_CARD_OPENED, {
                  stateName: exploration.initStateName
                });
              });
            });
          };

          $scope.submitAnswer = function(answer, interactionRulesService) {
            // Safety check to prevent double submissions from occurring.
            if ($scope.answerIsBeingProcessed ||
              !$scope.isCurrentCardAtEndOfTranscript() ||
              $scope.activeCard.destStateName) {
              return;
            }

            if (!$scope.isInPreviewMode) {
              FatigueDetectionService.recordSubmissionTimestamp();
              if (FatigueDetectionService.isSubmittingTooFast()) {
                FatigueDetectionService.displayTakeBreakMessage();
                $scope.$broadcast('oppiaFeedbackAvailable');
                return;
              }
            }
            NumberAttemptsService.submitAttempt();

            $scope.answerIsBeingProcessed = true;
            hasInteractedAtLeastOnce = true;

            var _oldStateName = PlayerTranscriptService.getLastCard().stateName;
            PlayerTranscriptService.addNewInput(answer, false);

            var timeAtServerCall = new Date().getTime();
            PlayerPositionService.recordAnswerSubmission();

            $scope.answerIsCorrect = ExplorationPlayerService.submitAnswer(
              answer, interactionRulesService, function(
                  newStateName, refreshInteraction, feedbackHtml,
                  feedbackAudioTranslations, contentHtml, newParams,
                  refresherExplorationId, missingPrerequisiteSkillId) {
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
                    PlayerTranscriptService.getLastCard().inputResponsePairs);
                  var lastAnswerFeedbackPair = pairs[pairs.length - 1];
                  $scope.$broadcast(EVENT_AUTOPLAY_AUDIO, {
                    audioTranslations: feedbackAudioTranslations,
                    html: feedbackHtml,
                    componentName: COMPONENT_NAME_FEEDBACK
                  });

                  if (_oldStateName === newStateName) {
                    // Stay on the same card.
                    HintsAndSolutionManagerService.recordWrongAnswer();

                    PlayerTranscriptService.addNewResponse(feedbackHtml);
                    var helpCardAvailable = false;
                    if (feedbackHtml &&
                        !ExplorationPlayerStateService.isInteractionInline(
                          $scope.activeCard.stateName)) {
                      helpCardAvailable = true;
                    }

                    if (helpCardAvailable) {
                      $scope.$broadcast('helpCardAvailable', {
                        helpCardHtml: feedbackHtml,
                        hasContinueButton: false
                      });
                    }
                    if (missingPrerequisiteSkillId) {
                      PlayerTranscriptService.setDestination('conceptCard');
                      ConceptCardBackendApiService.fetchConceptCard(
                        missingPrerequisiteSkillId
                      ).then(function(conceptCardBackendDict) {
                        $scope.conceptCardPending = true;
                        $scope.conceptCard =
                          ConceptCardObjectFactory.createFromBackendDict(
                            conceptCardBackendDict);
                        if (helpCardAvailable) {
                          $scope.$broadcast('helpCardAvailable', {
                            helpCardHtml: feedbackHtml,
                            hasContinueButton: true
                          });
                        }
                      });
                    }
                    if (refreshInteraction) {
                      // Replace the previous interaction with another of the
                      // same type.
                      _nextFocusLabel =
                        FocusManagerService.generateFocusLabel();
                      PlayerTranscriptService.updateLatestInteractionHtml(
                        ExplorationPlayerService.getInteractionHtml(
                          newStateName, _nextFocusLabel) +
                        ExplorationPlayerService.getRandomSuffix());
                    }

                    $scope.redirectToRefresherExplorationConfirmed = false;

                    if (refresherExplorationId) {
                      // TODO(bhenning): Add tests to verify the event is
                      // properly recorded.
                      var confirmRedirection = function() {
                        $scope.redirectToRefresherExplorationConfirmed = true;
                        ExplorationPlayerService.recordLeaveForRefresherExp(
                          newStateName, refresherExplorationId);
                      };
                      $http.get(EXPLORATION_SUMMARY_DATA_URL_TEMPLATE, {
                        params: {
                          stringified_exp_ids: JSON.stringify(
                            [refresherExplorationId])
                        }
                      }).then(function(response) {
                        if (response.data.summaries.length > 0) {
                          RefresherExplorationConfirmationModalService.
                            displayRedirectConfirmationModal(
                              refresherExplorationId, confirmRedirection);
                        }
                      });
                    }
                    FocusManagerService.setFocusIfOnDesktop(_nextFocusLabel);
                    scrollToBottom();
                  } else {
                    // There is a new card. If there is no feedback, move on
                    // immediately. Otherwise, give the learner a chance to read
                    // the feedback, and display a 'Continue' button.
                    FatigueDetectionService.reset();
                    NumberAttemptsService.reset();
                    _nextFocusLabel = FocusManagerService.generateFocusLabel();

                    PlayerTranscriptService.setDestination(newStateName);

                    // These are used to compute the dimensions for the
                    // next card.
                    $scope.upcomingStateName = newStateName;
                    $scope.upcomingParams = newParams;
                    $scope.upcomingContentHtml = (
                      contentHtml + ExplorationPlayerService.getRandomSuffix());

                    var _isNextInteractionInline = (
                      ExplorationPlayerStateService.isInteractionInline(
                        newStateName));
                    $scope.upcomingInlineInteractionHtml = (
                      _isNextInteractionInline ?
                        ExplorationPlayerService.getInteractionHtml(
                          newStateName, _nextFocusLabel
                        ) + ExplorationPlayerService.getRandomSuffix() : '');
                    $scope.upcomingInteractionInstructions = (
                      ExplorationPlayerStateService.getInteractionInstructions(
                        $scope.upcomingStateName));

                    if (feedbackHtml) {
                      var stateHistory =
                        PlayerTranscriptService.getStateHistory();
                      if (stateHistory.indexOf(newStateName) !== -1) {
                        $scope.pendingCardWasSeenBefore = true;
                      }
                      PlayerTranscriptService.addNewResponse(feedbackHtml);
                      if (!ExplorationPlayerStateService.isInteractionInline(
                        $scope.activeCard.stateName)) {
                        $scope.$broadcast('helpCardAvailable', {
                          helpCardHtml: feedbackHtml,
                          hasContinueButton: true
                        });
                      }
                      $rootScope.$broadcast(EVENT_NEW_CARD_AVAILABLE);
                      _nextFocusLabel = $scope.CONTINUE_BUTTON_FOCUS_LABEL;
                      FocusManagerService.setFocusIfOnDesktop(_nextFocusLabel);
                      scrollToBottom();
                    } else {
                      PlayerTranscriptService.addNewResponse(feedbackHtml);
                      // If there is no feedback, it immediately moves on
                      // to next card. Therefore $scope.answerIsCorrect needs
                      // to be set to false before it proceeds to next card.
                      $scope.answerIsCorrect = false;
                      $scope.showPendingCard(
                        newStateName,
                        newParams,
                        contentHtml +
                        ExplorationPlayerService.getRandomSuffix());
                    }
                  }
                  $scope.answerIsBeingProcessed = false;
                }, millisecsLeftToWait);
              }
            );
          };
          $scope.startCardChangeAnimation = false;
          $scope.showPendingCard = function(
              newStateName, newParams, newContentHtml) {
            $scope.startCardChangeAnimation = true;

            $timeout(function() {
              var newInteractionHtml =
                ExplorationPlayerService.getInteractionHtml(
                  newStateName, _nextFocusLabel);
              // Note that newInteractionHtml may be null.
              if (newInteractionHtml) {
                newInteractionHtml +=
                  ExplorationPlayerService.getRandomSuffix();
              }

              _addNewCard(
                newStateName, newParams, newContentHtml, newInteractionHtml);

              $scope.upcomingStateName = null;
              $scope.upcomingParams = null;
              $scope.upcomingContentHtml = null;
              $scope.upcomingInlineInteractionHtml = null;
              $scope.upcomingInteractionInstructions = null;
            }, TIME_FADEOUT_MSEC + 0.1 * TIME_HEIGHT_CHANGE_MSEC);

            $timeout(function() {
              FocusManagerService.setFocusIfOnDesktop(_nextFocusLabel);
              scrollToTop();
            },
            TIME_FADEOUT_MSEC + TIME_HEIGHT_CHANGE_MSEC +
              0.5 * TIME_FADEIN_MSEC);

            $timeout(function() {
              $scope.startCardChangeAnimation = false;
            },
            TIME_FADEOUT_MSEC + TIME_HEIGHT_CHANGE_MSEC + TIME_FADEIN_MSEC +
            TIME_PADDING_MSEC);

            $rootScope.$broadcast(EVENT_NEW_CARD_OPENED, {
              stateName: newStateName
            });
          };

          $scope.showUpcomingCard = function() {
            var currentIndex = PlayerPositionService.getActiveCardIndex();
            var conceptCardIsBeingShown =
              ExplorationPlayerStateService.isStateShowingConceptCard(
                $scope.activeCard.stateName);
            if (conceptCardIsBeingShown &&
                PlayerTranscriptService.isLastCard(currentIndex)) {
              $scope.returnToExplorationAfterConceptCard();
              return;
            }
            if ($scope.conceptCardPending) {
              $scope.conceptCardPending = false;
              _addNewCard(
                null, null, $scope.conceptCard.getExplanation(), null);
              return;
            }
            /* This is for the following situation:
               if A->B->C is the arrangement of cards and C redirected to A,
               then after this, B and C are visited cards and hence
               pendingCardWasSeenBefore would be true during both these
               transitions and as answerIsCorrect is set to false below,
               Continue would briefly change to Learn Again (after it is
               clicked) during these transitions which is not required.
               Also, if the 'if' check is not there, Learn Again button would
               briefly switched to Continue before going to next card. */
            if ($scope.answerIsCorrect) {
              $scope.pendingCardWasSeenBefore = false;
            }
            $scope.answerIsCorrect = false;
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
              if ($(window).scrollTop() +
                    $(window).height() < tutorCardBottom) {
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
            if ($scope.redirectToRefresherExplorationConfirmed) {
              return;
            }
            if (hasInteractedAtLeastOnce && !$scope.isInPreviewMode &&
                !ExplorationPlayerStateService.isStateTerminal(
                  PlayerTranscriptService.getLastCard().stateName)) {
              StatsReportingService.recordMaybeLeaveEvent(
                PlayerTranscriptService.getLastStateName(),
                LearnerParamsService.getAllParams());
              var confirmationMessage = (
                'If you navigate away from this page, your progress on the ' +
                'exploration will be lost.');
              (e || $window.event).returnValue = confirmationMessage;
              return confirmationMessage;
            }
          });

          $scope.canWindowShowTwoCards = function() {
            return ExplorationPlayerService.canWindowShowTwoCards();
          };

          $window.onresize = function() {
            $scope.adjustPageHeight(false, null);
          };

          $window.addEventListener('scroll', function() {
            fixSupplementOnScroll();
          });

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

          $scope.initializePage();
          LearnerViewRatingService.init(function(userRating) {
            $scope.userRating = userRating;
          });

          $scope.collectionId = GLOBALS.collectionId;
          $scope.collectionTitle = GLOBALS.collectionTitle;
          $scope.collectionSummary = null;

          if ($scope.collectionId) {
            $http.get('/collectionsummarieshandler/data', {
              params: {
                stringified_collection_ids: JSON.stringify(
                  [$scope.collectionId])
              }
            }).then(
              function(response) {
                $scope.collectionSummary = response.data.summaries[0];
              },
              function() {
                AlertsService.addWarning(
                  'There was an error while fetching the collection summary.');
              }
            );
          }

          $scope.onNavigateFromIframe = function() {
            siteAnalyticsService.registerVisitOppiaFromIframeEvent(
              $scope.explorationId);
          };

          // Interaction answer validity is used to enable/disable
          // the progress-nav's Submit button. This logic is here because
          // Interactions and the progress-nav are both descendants
          // of ConversationSkinDirective.
          $scope.interactionAnswerIsValid = true;
          $scope.setInteractionAnswerValidity = function(answerValidity) {
            var currentIndex = PlayerPositionService.getActiveCardIndex();
            // This check is added because it was observed that when returning
            // to current card after navigating through previous cards, using
            // the arrows, the Submit button was sometimes falsely disabled.
            // Also, since a learner's answers would always be in the current
            // card, this additional check doesn't interfere with its normal
            // working.
            if (!PlayerTranscriptService.isLastCard(currentIndex)) {
              return;
            }
            $scope.interactionAnswerIsValid = answerValidity;
          };

          $scope.submitAnswerFromProgressNav = function() {
            $scope.$broadcast(EVENT_PROGRESS_NAV_SUBMITTED);
          };
        }
      ]
    };
  }]);
