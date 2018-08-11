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
        'ExplorationEngineService', 'UrlService', 'FocusManagerService',
        'LearnerViewRatingService', 'WindowDimensionsService',
        'EditableExplorationBackendApiService', 'PlayerTranscriptService',
        'LearnerParamsService', 'ExplorationRecommendationsService',
        'ReadOnlyExplorationBackendApiService', 'PlayerPositionService',
        'StatsReportingService', 'siteAnalyticsService',
        'CONTENT_FOCUS_LABEL_PREFIX', 'TWO_CARD_THRESHOLD_PX',
        'CONTINUE_BUTTON_FOCUS_LABEL', 'EVENT_ACTIVE_CARD_CHANGED',
        'EVENT_NEW_CARD_AVAILABLE', 'EVENT_PROGRESS_NAV_SUBMITTED',
        'FatigueDetectionService', 'NumberAttemptsService',
        'PlayerCorrectnessFeedbackEnabledService', 'ContextService',
        'ConceptCardBackendApiService', 'ConceptCardObjectFactory',
        'RefresherExplorationConfirmationModalService', 'PAGE_CONTEXT',
        'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE', 'INTERACTION_SPECS',
        'EVENT_NEW_CARD_OPENED', 'HintsAndSolutionManagerService',
        'AudioTranslationManagerService', 'EVENT_AUTOPLAY_AUDIO',
        'COMPONENT_NAME_FEEDBACK', 'AutogeneratedAudioPlayerService',
        'StateClassifierMappingService', 'ENABLE_PLAYTHROUGH_RECORDING',
        'ImagePreloaderService', 'PlaythroughService', 'PretestEngineService',
        'WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS',
        function(
            $scope, $timeout, $rootScope, $window, $translate, $http,
            $location, MessengerService, AlertsService,
            ExplorationEngineService, UrlService, FocusManagerService,
            LearnerViewRatingService, WindowDimensionsService,
            EditableExplorationBackendApiService, PlayerTranscriptService,
            LearnerParamsService, ExplorationRecommendationsService,
            ReadOnlyExplorationBackendApiService, PlayerPositionService,
            StatsReportingService, siteAnalyticsService,
            CONTENT_FOCUS_LABEL_PREFIX, TWO_CARD_THRESHOLD_PX,
            CONTINUE_BUTTON_FOCUS_LABEL, EVENT_ACTIVE_CARD_CHANGED,
            EVENT_NEW_CARD_AVAILABLE, EVENT_PROGRESS_NAV_SUBMITTED,
            FatigueDetectionService, NumberAttemptsService,
            PlayerCorrectnessFeedbackEnabledService, ContextService,
            ConceptCardBackendApiService, ConceptCardObjectFactory,
            RefresherExplorationConfirmationModalService, PAGE_CONTEXT,
            EXPLORATION_SUMMARY_DATA_URL_TEMPLATE, INTERACTION_SPECS,
            EVENT_NEW_CARD_OPENED, HintsAndSolutionManagerService,
            AudioTranslationManagerService, EVENT_AUTOPLAY_AUDIO,
            COMPONENT_NAME_FEEDBACK, AutogeneratedAudioPlayerService,
            StateClassifierMappingService, ENABLE_PLAYTHROUGH_RECORDING,
            ImagePreloaderService, PlaythroughService, PretestEngineService,
            WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS) {
          $scope.CONTINUE_BUTTON_FOCUS_LABEL = CONTINUE_BUTTON_FOCUS_LABEL;
          // The minimum width, in pixels, needed to be able to show two cards
          // side-by-side.
          var TIME_PADDING_MSEC = 250;
          var TIME_SCROLL_MSEC = 600;
          var MIN_CARD_LOADING_DELAY_MSEC = 950;

          var hasInteractedAtLeastOnce = false;
          $scope.answerIsBeingProcessed = false;
          $scope.inPretestMode = false;
          var storyId = UrlService.getStoryIdInPlayer();
          var _nextFocusLabel = null;
          var _editorPreviewMode = ContextService.isInExplorationEditorPage();
          // This variable is used only when viewport is narrow.
          // Indicates whether the tutor card is displayed.
          var tutorCardIsDisplayedIfNarrow = true;
          var currentEngineService = null;
          $scope.explorationId = ExplorationEngineService.getExplorationId();
          $scope.isInPreviewMode = ExplorationEngineService.isInPreviewMode();
          $scope.isIframed = UrlService.isIframed();
          $rootScope.loadingMessage = 'Loading';
          $scope.hasFullyLoaded = false;
          $scope.recommendedExplorationSummaries = null;
          $scope.answerIsCorrect = false;
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
              currentEngineService.isStateShowingConceptCard();
            if (conceptCardIsBeingShown) {
              return false;
            }
            var interaction = currentEngineService.getCurrentInteraction();
            if (INTERACTION_SPECS[interaction.id].is_linear) {
              return false;
            }
            return (
              $scope.pendingCardWasSeenBefore && !$scope.answerIsCorrect &&
              $scope.isCorrectnessFeedbackEnabled());
          };

          var _getRandomSuffix = function() {
            // This is a bit of a hack. When a refresh to a $scope variable
            // happens,
            // AngularJS compares the new value of the variable to its previous
            // value. If they are the same, then the variable is not updated.
            // Appending a random suffix makes the new value different from the
            // previous one, and thus indirectly forces a refresh.
            var randomSuffix = '';
            var N = Math.round(Math.random() * 1000);
            for (var i = 0; i < N; i++) {
              randomSuffix += ' ';
            }
            return randomSuffix;
          };

          $scope.OPPIA_AVATAR_IMAGE_URL = (
            UrlInterpolationService.getStaticImageUrl(
              '/avatar/oppia_avatar_100px.svg'));
          $scope.getStaticImageUrl = (
            UrlInterpolationService.getStaticImageUrl);

          $scope.activeCard = null;
          var explorationActuallyStarted = false;

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
              currentEngineService.isCurrentStateTerminal();
          };

          var isSupplementalCardNonempty = function(card) {
            return !currentEngineService.isInteractionInline();
          };

          $scope.isCurrentSupplementalCardNonempty = function() {
            return $scope.activeCard && isSupplementalCardNonempty(
              $scope.activeCard);
          };

          $scope.isSupplementalNavShown = function() {
            if (currentEngineService.isStateShowingConceptCard()) {
              return false;
            }
            var interaction = currentEngineService.getCurrentInteraction();
            return (
              Boolean(interaction.id) &&
              INTERACTION_SPECS[interaction.id].show_generic_submit_button &&
              $scope.isCurrentCardAtEndOfTranscript());
          };

          var _recordLeaveForRefresherExp = function(refresherExpId) {
            if (!_editorPreviewMode) {
              StatsReportingService.recordLeaveForRefresherExp(
                ExplorationEngineService.getCurrentStateName(),
                refresherExpId);
            }
          };

          // Navigates to the currently-active card, and resets the
          // 'show previous responses' setting.
          var _navigateToActiveCard = function() {
            var index = PlayerPositionService.getActiveCardIndex();
            $scope.activeCard = PlayerTranscriptService.getCard(index);
            if ($scope.activeCard.getInPretestMode()) {
              currentEngineService = PretestEngineService;
              $scope.inPretestMode = true;
            } else {
              $scope.inPretestMode = false;
              currentEngineService = ExplorationEngineService;
            }
            currentEngineService.setCurrentStateIndex(index);
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
              stateName, newParams, contentHtml, interactionHtml, false,
              $scope.inPretestMode);

            if ($scope.inPretestMode) {
              currentEngineService = PretestEngineService;
            } else {
              currentEngineService = ExplorationEngineService;
            }

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
              $scope.canWindowShowTwoCards() &&
              !previousSupplementalCardIsNonempty &&
              nextSupplementalCardIsNonempty) {
              PlayerPositionService.setActiveCardIndex(totalNumCards - 1);
              animateToTwoCards(function() {});
            } else if (
              totalNumCards > 1 &&
              $scope.canWindowShowTwoCards() &&
              previousSupplementalCardIsNonempty &&
              !nextSupplementalCardIsNonempty) {
              animateToOneCard(function() {
                PlayerPositionService.setActiveCardIndex(totalNumCards - 1);
              });
            } else {
              PlayerPositionService.setActiveCardIndex(totalNumCards - 1);
            }

            if (currentEngineService.isCurrentStateTerminal()) {
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
                  ExplorationEngineService.getAuthorRecommendedExpIds();
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

          var _initializeExplorationServices = function(returnDict) {
            var version = GLOBALS.explorationVersion;
            var explorationId = ContextService.getExplorationId();
            $scope.inPretestMode = false;
            StateClassifierMappingService.init(
              returnDict.state_classifier_mapping);
            StatsReportingService.initSession(
              explorationId, returnDict.exploration.title,
              version, returnDict.session_id, GLOBALS.collectionId);
            if (ENABLE_PLAYTHROUGH_RECORDING) {
              PlaythroughService.initSession(explorationId, version);
            }
            PlayerCorrectnessFeedbackEnabledService.init(
              returnDict.correctness_feedback_enabled);
            currentEngineService = ExplorationEngineService;
            ExplorationEngineService.init(
              returnDict.exploration, returnDict.version,
              returnDict.preferred_audio_language_code,
              returnDict.auto_tts_enabled, _initializeDirectiveComponents);
          };

          var _initializePretestServices = function(returnDict) {
            var version = GLOBALS.explorationVersion;
            $scope.inPretestMode = true;
            var explorationId = ContextService.getExplorationId();
            PlayerCorrectnessFeedbackEnabledService.init(true);
            currentEngineService = PretestEngineService;
            PretestEngineService.init(
              returnDict.pretest_question_dicts,
              _initializeDirectiveComponents);
          };

          var _initializeDirectiveComponents = function(
              initialStateName, initHtml, newParams) {
            $scope.isLoggedIn = currentEngineService.isLoggedIn();
            _nextFocusLabel = FocusManagerService.generateFocusLabel();

            _addNewCard(
              initialStateName,
              newParams,
              initHtml,
              currentEngineService.getCurrentInteractionHtml(
                _nextFocusLabel));
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
                currentEngineService.getLanguageCode());
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
              $rootScope.$broadcast(EVENT_NEW_CARD_OPENED);
            });
          };

          $scope.initializePage = function() {
            hasInteractedAtLeastOnce = false;
            $scope.recommendedExplorationSummaries = null;
            var explorationId = ContextService.getExplorationId();
            var storyId = UrlService.getStoryIdInPlayer();
            PlayerPositionService.init(_navigateToActiveCard);
            PlayerTranscriptService.init();
            var version = GLOBALS.explorationVersion;

            if (_editorPreviewMode) {
              currentEngineService = ExplorationEngineService;
              EditableExplorationBackendApiService.fetchApplyDraftExploration(
                explorationId).then(function(returnDict) {
                ExplorationEngineService.init(
                  returnDict, null, null, null, _initializeDirectiveComponents);
                PlayerCorrectnessFeedbackEnabledService.init(
                  returnDict.correctness_feedback_enabled);
                NumberAttemptsService.reset();
              });
            } else {
              if (version) {
                ReadOnlyExplorationBackendApiService.loadExploration(
                  explorationId, version, storyId).then(function(returnDict) {
                  if (returnDict.pretest_question_dicts.length > 0) {
                    _initializePretestServices(returnDict);
                  } else {
                    _initializeExplorationServices(returnDict);
                  }
                });
              } else {
                ReadOnlyExplorationBackendApiService.loadLatestExploration(
                  explorationId, storyId).then(function(returnDict) {
                  if (returnDict.pretest_question_dicts.length > 0) {
                    _initializePretestServices(returnDict);
                  } else {
                    _initializeExplorationServices(returnDict);
                  }
                });
              }
            }
          };

          $rootScope.$on('playerStateChange', function(evt, newStateName) {
            // To restart the preloader for the new state if required.
            if (!_editorPreviewMode) {
              ImagePreloaderService.onStateChange(newStateName);
            }
            // Ensure the transition to a terminal state properly logs the end
            // of the exploration.
            if (
              !_editorPreviewMode &&
              ExplorationEngineService.isNextStateTerminal()) {
              StatsReportingService.recordExplorationCompleted(
                newStateName, LearnerParamsService.getAllParams());

              // If the user is a guest, has completed this exploration within
              // the context of a collection, and the collection is whitelisted,
              // record their temporary progress.
              var collectionAllowsGuestProgress = (
                WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS.indexOf(
                  GLOBALS.collectionId) !== -1);
              if (collectionAllowsGuestProgress && !_isLoggedIn) {
                GuestCollectionProgressService.
                  recordExplorationCompletedInCollection(
                    GLOBALS.collectionId, _explorationId);
              }

              // For single state explorations, when the exploration reaches the
              // terminal state and explorationActuallyStarted is false, record
              // exploration actual start event.
              if (!explorationActuallyStarted) {
                StatsReportingService.recordExplorationActuallyStarted(
                  newStateName);
                explorationActuallyStarted = true;
              }
            }
          });

          $scope.submitAnswer = function(answer, interactionRulesService) {
            // Safety check to prevent double submissions from occurring.
            if ($scope.answerIsBeingProcessed ||
              !$scope.isCurrentCardAtEndOfTranscript() ||
              $scope.activeCard.getDestStateName()) {
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

            PlayerTranscriptService.addNewInput(answer, false);

            var timeAtServerCall = new Date().getTime();
            PlayerPositionService.recordAnswerSubmission();

            $scope.answerIsCorrect = currentEngineService.submitAnswer(
              answer, interactionRulesService, function(
                  newStateName, refreshInteraction, feedbackHtml,
                  feedbackAudioTranslations, contentHtml, newParams,
                  refresherExplorationId, missingPrerequisiteSkillId,
                  remainOnCurrentCard, wasOldStateInitial, isFirstHit) {
                if (!_editorPreviewMode && !$scope.inPretestMode) {
                  var oldStateName =
                    ExplorationEngineService.getCurrentStateName();
                  if (!remainOnCurrentCard) {
                    StatsReportingService.recordStateTransition(
                      oldStateName, newStateName, answer,
                      LearnerParamsService.getAllParams(), isFirstHit);

                    StatsReportingService.recordStateCompleted(oldStateName);
                  }
                  if (ExplorationEngineService.isNextStateTerminal()) {
                    StatsReportingService.recordStateCompleted(newStateName);
                  }
                  if (wasOldStateInitial && !explorationActuallyStarted) {
                    StatsReportingService.recordExplorationActuallyStarted(
                      oldStateName);
                    explorationActuallyStarted = true;
                  }
                }
                if (!$scope.inPretestMode) {
                  $rootScope.$broadcast('playerStateChange', newStateName);
                }
                // Do not wait if the interaction is supplemental -- there's
                // already a delay bringing in the help card.
                var millisecsLeftToWait = (
                  !currentEngineService.isInteractionInline() ? 1.0 :
                  Math.max(MIN_CARD_LOADING_DELAY_MSEC - (
                    new Date().getTime() - timeAtServerCall),
                  1.0));

                $timeout(function() {
                  $scope.$broadcast('oppiaFeedbackAvailable');
                  var pairs = (
                    PlayerTranscriptService.getLastCard().
                      getInputResponsePairs());
                  var lastAnswerFeedbackPair = pairs[pairs.length - 1];
                  $scope.$broadcast(EVENT_AUTOPLAY_AUDIO, {
                    audioTranslations: feedbackAudioTranslations,
                    html: feedbackHtml,
                    componentName: COMPONENT_NAME_FEEDBACK
                  });

                  if (remainOnCurrentCard) {
                    // Stay on the same card.
                    HintsAndSolutionManagerService.recordWrongAnswer();
                    PlayerTranscriptService.addNewResponse(feedbackHtml);
                    var helpCardAvailable = false;
                    if (feedbackHtml &&
                        !currentEngineService.isInteractionInline()) {
                      helpCardAvailable = true;
                    }

                    if (helpCardAvailable) {
                      $scope.$broadcast('helpCardAvailable', {
                        helpCardHtml: feedbackHtml,
                        hasContinueButton: false
                      });
                    }
                    if (missingPrerequisiteSkillId) {
                      $scope.activeCard.setLeadsToConceptCard(true);
                      ConceptCardBackendApiService.fetchConceptCard(
                        missingPrerequisiteSkillId
                      ).then(function(conceptCardBackendDict) {
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
                        currentEngineService.getCurrentInteractionHtml(
                          _nextFocusLabel) + _getRandomSuffix());
                    }

                    $scope.redirectToRefresherExplorationConfirmed = false;

                    if (refresherExplorationId) {
                      // TODO(bhenning): Add tests to verify the event is
                      // properly recorded.
                      var confirmRedirection = function() {
                        $scope.redirectToRefresherExplorationConfirmed = true;
                        _recordLeaveForRefresherExp(refresherExplorationId);
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
                      contentHtml + _getRandomSuffix());

                    var _isNextInteractionInline = (
                      currentEngineService.isNextInteractionInline());
                    $scope.upcomingInlineInteractionHtml = (
                      _isNextInteractionInline ?
                        currentEngineService.getNextInteractionHtml(
                          _nextFocusLabel
                        ) + _getRandomSuffix() : '');
                    $scope.upcomingInteractionInstructions = (
                      currentEngineService.getNextInteractionInstructions()
                    );

                    if (feedbackHtml) {
                      var stateHistory =
                        PlayerTranscriptService.getStateHistory();
                      if (stateHistory.indexOf(newStateName) !== -1) {
                        $scope.pendingCardWasSeenBefore = true;
                      }
                      PlayerTranscriptService.addNewResponse(feedbackHtml);
                      if (!currentEngineService.isInteractionInline()) {
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
                        newStateName, newParams,
                        contentHtml + _getRandomSuffix());
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
            currentEngineService.recordNewCardAdded();

            $timeout(function() {
              var newInteractionHtml =
                currentEngineService.getNextInteractionHtml(
                  _nextFocusLabel);
              // Note that newInteractionHtml may be null.
              if (newInteractionHtml) {
                newInteractionHtml +=
                  _getRandomSuffix();
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

            $rootScope.$broadcast(EVENT_NEW_CARD_OPENED);
          };

          $scope.showUpcomingCard = function() {
            var currentIndex = PlayerPositionService.getActiveCardIndex();
            var conceptCardIsBeingShown =
              currentEngineService.isStateShowingConceptCard();
            if (conceptCardIsBeingShown &&
                PlayerTranscriptService.isLastCard(currentIndex)) {
              $scope.returnToExplorationAfterConceptCard();
              return;
            }
            if ($scope.activeCard.getLeadsToConceptCard()) {
              currentEngineService.recordNewCardAdded();
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
                !currentEngineService.isCurrentStateTerminal()) {
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

          // Returns whether the screen is wide enough to fit two
          // cards (e.g., the tutor and supplemental cards) side-by-side.
          $scope.canWindowShowTwoCards = function() {
            return WindowDimensionsService.getWidth() > TWO_CARD_THRESHOLD_PX;
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
