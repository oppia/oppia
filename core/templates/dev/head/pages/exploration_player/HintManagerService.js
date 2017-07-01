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

oppia.factory('HintManagerService', [
  '$timeout','playerTranscriptService', 'DELAY_FOR_HINT_FEEDBACK_MSEC',
  'HINT_REQUEST_STRING_I18N_IDS', 'WAIT_FOR_HINT_MSEC',
  function(
      $timeout, playerTranscriptService, DELAY_FOR_HINT_FEEDBACK_MSEC,
      HINT_REQUEST_STRING_I18N_IDS, WAIT_FOR_HINT_MSEC) {
    var currentHintIsAvailable = false;
    var numHintsConsumed = 0;
    var timeout = null;
    var hints = [];
    var _setCurrentHintAvailable = function(value) {
      currentHintIsAvailable = value;
    };

    return {
      setHints: function(newHints) {
        hints = newHints;
      },
      getCurrentHint: function() {
        return hints[this.getNumHintsConsumed()].hintText;
      },
      consumeHint: function() {
        numHintsConsumed += 1;
        _setCurrentHintAvailable(false);
      },
      getNumHintsConsumed: function() {
        return numHintsConsumed;
      },
      isCurrentHintAvailable: function() {
        return currentHintIsAvailable;
      },
      makeCurrentHintAvailable: function() {
        $timeout.cancel(timeout);
        _setCurrentHintAvailable(true);
      },
      areAllHintsExhausted: function() {
        return numHintsConsumed === hints.length;
      },
      reset: function() {
        numHintsConsumed = 0;
        currentHintIsAvailable = false;
        $timeout.cancel(timeout);
      },
      disableHintButtonTemporarily: function() {
        _setCurrentHintAvailable(false);
        $timeout.cancel(timeout);
        timeout = $timeout(function() {
          currentHintIsAvailable = true;
        }, WAIT_FOR_HINT_MSEC);
      },
      processHintRequest: function() {
        var numHintsConsumed = this.getNumHintsConsumed();
        var currentHint = this.getCurrentHint();
        if (numHintsConsumed < hints.length) {
          playerTranscriptService.addNewInput(
            HINT_REQUEST_STRING_I18N_IDS[Math.floor(
              Math.random() * HINT_REQUEST_STRING_I18N_IDS.length)], true);
          $timeout(function() {
            playerTranscriptService.addNewResponse(currentHint);
          }, DELAY_FOR_HINT_FEEDBACK_MSEC);
          this.disableHintButtonTemporarily();

          this.consumeHint();
        }
      }
    };
  }]);
