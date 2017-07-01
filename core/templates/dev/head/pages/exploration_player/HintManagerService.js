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
    var currentHintText = '';
    var hints = [];

    return {
      init: function(newHints) {
        hints = newHints;
      },
      getHints: function() {
        return hints;
      },
      getCurrentHint: function() {
        return this.getHints()[this.getNumHintsConsumed()].hintText;
      },
      consumeHint: function() {
        numHintsConsumed += 1;
        this.setCurrentHintAvailable(false);
      },
      getNumHintsConsumed: function() {
        return numHintsConsumed;
      },
      setCurrentHintAvailable: function(value) {
        currentHintIsAvailable = value;
      },
      isCurrentHintAvailable: function() {
        return currentHintIsAvailable;
      },
      activateHintAfterTimeout: function() {
        $timeout.cancel(timeout);
        timeout = $timeout(function() {
          currentHintIsAvailable = true;
        }, WAIT_FOR_HINT_MSEC);
      },
      clearTimeout: function() {
        $timeout.cancel(timeout);
        this.setCurrentHintAvailable(true);
      },
      areAllHintsExhausted: function(numHints) {
        return numHintsConsumed === numHints;
      },
      reset: function() {
        numHintsConsumed = 0;
        currentHintIsAvailable = false;
        $timeout.cancel(timeout);
      },
      disableHintButtonTemporarily: function() {
        this.setCurrentHintAvailable(false);
        this.activateHintAfterTimeout();
      },
      getCurrentHintText: function() {
        return currentHintText;
      },
      processHintRequest: function() {
        hints = this.getHints();
        var numHintsConsumed = this.getNumHintsConsumed();
        if (numHintsConsumed < hints.length) {
          currentHintText = this.getCurrentHint();
          playerTranscriptService.addNewInput(
            HINT_REQUEST_STRING_I18N_IDS[Math.floor(
              Math.random() * HINT_REQUEST_STRING_I18N_IDS.length)], true);
          $timeout(function() {
            playerTranscriptService.addNewResponse(currentHintText);
          }, DELAY_FOR_HINT_FEEDBACK_MSEC);
          this.disableHintButtonTemporarily();

          if (!this.areAllHintsExhausted(hints.length)) {
            this.consumeHint();
          }
        }
      }
    };
  }]);
