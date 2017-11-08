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
  '$timeout','PlayerTranscriptService', 'DELAY_FOR_HINT_FEEDBACK_MSEC',
  'HINT_REQUEST_STRING_I18N_IDS', 'WAIT_FOR_HINT_MSEC',
  function(
      $timeout, PlayerTranscriptService, DELAY_FOR_HINT_FEEDBACK_MSEC,
      HINT_REQUEST_STRING_I18N_IDS, WAIT_FOR_HINT_MSEC) {
    var currentHintIsAvailable = false;
    var numHintsConsumed = 0;
    var timeout = null;
    var hints = [];
    var _getCurrentHint = function() {
      return hints[numHintsConsumed].hintText;
    };

    return {
      consumeHint: function() {
        var currentHint = _getCurrentHint();
        numHintsConsumed += 1;
        currentHintIsAvailable = false;
        if (timeout) {
          $timeout.cancel(timeout);
        }
        timeout = $timeout(function() {
          currentHintIsAvailable = true;
        }, WAIT_FOR_HINT_MSEC);
        return currentHint;
      },
      isCurrentHintAvailable: function() {
        return currentHintIsAvailable;
      },
      makeCurrentHintAvailable: function() {
        if (timeout) {
          $timeout.cancel(timeout);
        }
        currentHintIsAvailable = true;
      },
      areAllHintsExhausted: function() {
        return numHintsConsumed === hints.length;
      },
      reset: function(newHints) {
        numHintsConsumed = 0;
        currentHintIsAvailable = false;
        if (timeout) {
          $timeout.cancel(timeout);
        }
        hints = newHints;
        timeout = $timeout(function() {
          currentHintIsAvailable = true;
        }, WAIT_FOR_HINT_MSEC);
      }
    };
  }]);
