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
  '$timeout', 'playerTranscriptService', 'DELAY_FOR_HINT_FEEDBACK_MSEC',
  'HINT_REQUEST_STRINGS_ARRAY', 'WAIT_FOR_HINT_MSEC',
  function(
      $timeout, playerTranscriptService, DELAY_FOR_HINT_FEEDBACK_MSEC,
      HINT_REQUEST_STRINGS_ARRAY, WAIT_FOR_HINT_MSEC) {
    var currentHintIsUsable = false;
    var numHintsConsumed = 0;
    var timeout = null;

    return {
      consumeHint: function() {
        numHintsConsumed += 1;
        this.setCurrentHintUsable(false);
      },
      getNumHintsConsumed: function() {
        return numHintsConsumed;
      },
      setCurrentHintUsable: function(value) {
        currentHintIsUsable = value;
      },
      isCurrentHintUsable: function() {
        return currentHintIsUsable;
      },
      activateHintAfterTimeout: function() {
        timeout = $timeout(function() {
          currentHintIsUsable = true;
        }, WAIT_FOR_HINT_MSEC);
      },
      clearTimeout: function() {
        $timeout.cancel(timeout);
        this.setCurrentHintUsable(true);
      },
      areAllHintsExhausted: function(numHints) {
        return numHintsConsumed === numHints;
      },
      reset: function() {
        numHintsConsumed = 0;
        currentHintIsUsable = false;
      },
      showHint: function(hints, isSupplementalCard) {
        var numHintsConsumed = this.getNumHintsConsumed();
        if (numHintsConsumed < hints.length) {
          var currentHint = hints[numHintsConsumed].hintText;
          playerTranscriptService.addNewHintRequest(
            HINT_REQUEST_STRINGS_ARRAY[Math.floor(
              Math.random() * HINT_REQUEST_STRINGS_ARRAY.length)]);
          $timeout(function() {
            playerTranscriptService.addNewHint(currentHint);
          }, DELAY_FOR_HINT_FEEDBACK_MSEC);
          this.setCurrentHintUsable(false);
          this.activateHintAfterTimeout();

          if (this.areAllHintsExhausted(hints.length)) {
            this.reset();
          } else {
            this.consumeHint();
          }
          if (isSupplementalCard) {
            return currentHint;
          }
        }
      }
    };
  }]);
