// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility service for Hints in the learner's view.
 */

oppia.factory('HintsAndSolutionManagerService', [
  '$timeout', '$rootScope', 'PlayerTranscriptService',
  'DELAY_FOR_HINT_FEEDBACK_MSEC', 'HINT_REQUEST_STRING_I18N_IDS',
  'WAIT_FOR_FIRST_HINT_MSEC', 'WAIT_FOR_SUBSEQUENT_HINTS_MSEC',
  'EVENT_NEW_CARD_AVAILABLE',
  function(
      $timeout, $rootScope, PlayerTranscriptService,
      DELAY_FOR_HINT_FEEDBACK_MSEC, HINT_REQUEST_STRING_I18N_IDS,
      WAIT_FOR_FIRST_HINT_MSEC, WAIT_FOR_SUBSEQUENT_HINTS_MSEC,
      EVENT_NEW_CARD_AVAILABLE) {
    var timeout = null;
    var ACCELERATED_HINT_WAIT_TIME_MSEC = 10000;
    var WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC = 60000;

    var numHintsReleased = 0;
    var numHintsConsumed = 0;
    var solutionReleased = false;
    var solutionConsumed = false;
    var hintsForLatestCard = [];
    var solutionForLatestCard = null;
    var wrongAnswersSinceLastHintConsumed = 0;
    var correctAnswerSubmitted = false;

    // tooltipIsOpen is a flag which says that the tooltip is currently
    // visible to the learner.
    var tooltipIsOpen = false;
    // This is set to true as soon as a hint/solution is clicked or when the
    // tooltip has been triggered.
    var hintsDiscovered = false;
    var tooltipTimeout = null;


    $rootScope.$on(EVENT_NEW_CARD_AVAILABLE, function() {
      correctAnswerSubmitted = true;
      // This prevents tooltip to hide the Continue button of the help card in
      // mobile view.
      tooltipIsOpen = false;
    });

    // This replaces any timeouts that are already queued.
    var enqueueTimeout = function(func, timeToWaitMsec) {
      if (timeout) {
        $timeout.cancel(timeout);
      }
      timeout = $timeout(func, timeToWaitMsec);
    };

    var showTooltip = function() {
      tooltipIsOpen = true;
      hintsDiscovered = true;
    };

    var releaseHint = function() {
      if (!correctAnswerSubmitted) {
        numHintsReleased++;
        if (!hintsDiscovered && !tooltipTimeout) {
          tooltipTimeout = $timeout(
            showTooltip, WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC);
        }
      }
    };
    var releaseSolution = function() {
      solutionReleased = true;
    };
    var accelerateHintRelease = function() {
      enqueueTimeout(releaseHint, ACCELERATED_HINT_WAIT_TIME_MSEC);
    };

    var areAllHintsExhausted = function() {
      return numHintsReleased === hintsForLatestCard.length;
    };
    var isAHintWaitingToBeViewed = function() {
      return numHintsConsumed < numHintsReleased;
    };

    var consumeHint = function() {
      hintsDiscovered = true;
      tooltipIsOpen = false;
      if (tooltipTimeout) {
        $timeout.cancel(tooltipTimeout);
      }

      numHintsConsumed++;
      wrongAnswersSinceLastHintConsumed = 0;

      var funcToEnqueue = null;
      if (!areAllHintsExhausted()) {
        funcToEnqueue = releaseHint;
      } else if (!!solutionForLatestCard && !solutionReleased) {
        funcToEnqueue = releaseSolution;
      }
      if (funcToEnqueue) {
        enqueueTimeout(funcToEnqueue, WAIT_FOR_SUBSEQUENT_HINTS_MSEC);
      }
    };

    return {
      reset: function(newHints, newSolution) {
        numHintsReleased = 0;
        numHintsConsumed = 0;
        solutionReleased = false;
        solutionConsumed = false;
        hintsForLatestCard = newHints;
        solutionForLatestCard = newSolution;
        wrongAnswersSinceLastHintConsumed = 0;
        correctAnswerSubmitted = false;
        if (timeout) {
          $timeout.cancel(timeout);
        }
        if (tooltipTimeout) {
          $timeout.cancel(tooltipTimeout);
        }

        if (hintsForLatestCard.length > 0) {
          enqueueTimeout(releaseHint, WAIT_FOR_FIRST_HINT_MSEC);
        }
      },
      // WARNING: This method has a side-effect. If the retrieved hint is a
      // pending hint that's being viewed, it starts the timer for the next
      // hint.
      displayHint: function(index) {
        if (index === numHintsConsumed && numHintsConsumed < numHintsReleased) {
          // The latest hint has been consumed. Start the timer.
          consumeHint();
        }

        if (index < numHintsReleased) {
          return hintsForLatestCard[index].hintContent;
        }
        return null;
      },
      displaySolution: function() {
        hintsDiscovered = true;
        solutionConsumed = true;
        if (tooltipTimeout) {
          $timeout.cancel(tooltipTimeout);
        }
        return solutionForLatestCard;
      },
      getNumHints: function() {
        return hintsForLatestCard.length;
      },
      isHintViewable: function(index) {
        return index < numHintsReleased;
      },
      isHintConsumed: function(index) {
        return index < numHintsConsumed;
      },
      isHintTooltipOpen: function() {
        return tooltipIsOpen;
      },
      isSolutionViewable: function() {
        return solutionReleased;
      },
      isSolutionConsumed: function() {
        return solutionConsumed;
      },
      recordWrongAnswer: function() {
        if (isAHintWaitingToBeViewed()) {
          return;
        }

        wrongAnswersSinceLastHintConsumed++;
        if (!areAllHintsExhausted() && !isAHintWaitingToBeViewed()) {
          if (numHintsReleased === 0 &&
              wrongAnswersSinceLastHintConsumed >= 2) {
            accelerateHintRelease();
          } else if (
            numHintsReleased > 0 && wrongAnswersSinceLastHintConsumed >= 1) {
            accelerateHintRelease();
          }
        }
      }
    };
  }
]);
