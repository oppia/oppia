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
 * @fileoverview Service for keeping track of the learner's position.
 */

oppia.factory('PlayerPositionService', [
  'PlayerTranscriptService', function(PlayerTranscriptService) {
    var displayedCardIndex = null;
    var onChangeCallback = null;
    var learnerJustSubmittedAnAnswer = false;

    return {
      init: function(callback) {
        displayedCardIndex = null;
        onChangeCallback = callback;
      },
      getCurrentStateName: function() {
        return (
          PlayerTranscriptService.getCard(displayedCardIndex).getStateName());
      },
      setDisplayedCardIndex: function(index) {
        var oldIndex = displayedCardIndex;
        displayedCardIndex = index;

        if (oldIndex !== displayedCardIndex) {
          onChangeCallback();
        }
      },
      getDisplayedCardIndex: function() {
        return displayedCardIndex;
      },
      recordAnswerSubmission: function() {
        learnerJustSubmittedAnAnswer = true;
      },
      recordNavigationButtonClick: function() {
        learnerJustSubmittedAnAnswer = false;
      },
      hasLearnerJustSubmittedAnAnswer: function() {
        return learnerJustSubmittedAnAnswer;
      }
    };
  }
]);
