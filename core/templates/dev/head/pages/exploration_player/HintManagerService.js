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

oppia.factory('hintManagerService',
  ['$timeout', function($timeout) {
    var currentHintIsUsable = false;
    var numHintsConsumed = 0;
    var timeout = null;

    return {
      incrementHintsConsumed: function() {
        numHintsConsumed += 1;
      },
      getNumHintsConsumed: function() {
        return numHintsConsumed
      },
      setCurrentHintUsable: function(value) {
        currentHintIsUsable = value;
      },
      isCurrentHintUsable: function() {
        return currentHintIsUsable;
      },
      activateHintAfterTimeout: function(timeInMsec) {
        timeout = $timeout(function() {
          currentHintIsUsable = true;
        }, timeInMsec);
      },
      clearTimeout: function() {
        $timeout.cancel(timeout);
      },
      areAllHintsExhausted: function(numHints) {
        return numHintsConsumed === numHints;
      },
      reset: function() {
        numHintsConsumed = 0;
        currentHintIsUsable = false;
      }
    };
  }]);
