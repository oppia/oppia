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
  '$timeout', 'PlayerTranscriptService', 'DELAY_FOR_HINT_FEEDBACK_MSEC',
  'HINT_REQUEST_STRING_I18N_IDS', 'WAIT_FOR_FIRST_HINT_MSEC',
  'WAIT_FOR_SUBSEQUENT_HINTS_MSEC',
  function(
      $timeout, PlayerTranscriptService, DELAY_FOR_HINT_FEEDBACK_MSEC,
      HINT_REQUEST_STRING_I18N_IDS, WAIT_FOR_FIRST_HINT_MSEC,
      WAIT_FOR_SUBSEQUENT_HINTS_MSEC) {
    var timeout = null;
    var ACCELERATED_HINT_WAIT_TIME_MSEC = 10000;

    var numHintsReleased = 0;
    var numHintsConsumed = 0;
    var solutionReleased = false;
    var solutionConsumed = false;
    var hintsForLatestCard = [];
    var solutionForLatestCard = null;
    var wrongAnswersSinceLastHintConsumed = 0;

    // This replaces any timeouts that are already queued.
    var enqueueTimeout = function(func, timeToWaitMsec) {
      if (timeout) {
        $timeout.cancel(timeout);
      }
      timeout = $timeout(func, timeToWaitMsec);
    };

    var releaseHint = function() {
      numHintsReleased++;
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
      numHintsConsumed++;
      wrongAnswersSinceLastHintConsumed = 0;

      var funcToEnqueue = null;
      if (!areAllHintsExhausted()) {
        funcToEnqueue = releaseHint;
      } else if (!solutionReleased) {
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
        if (timeout) {
          $timeout.cancel(timeout);
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
        solutionConsumed = true;
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
