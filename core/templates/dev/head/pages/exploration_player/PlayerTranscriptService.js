// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for the learner view transcript.
 */

// A service that maintains the transcript of the playthrough (i.e., what cards
// are shown, what answers have been given, etc. Note that this service does
// not maintain the currently-active card -- it's more like a log of what the
// learner has 'discovered' so far.
oppia.factory('playerTranscriptService', ['$log', function($log) {
  // Each element of this array represents a 'card' in the learner view,
  // represented as a JavaScript object with the following keys:
  // - stateName: the name of the state
  // - currentParams: an object with the current parameter names and values.
  //   Each object has two keys:
  //   - parameterName: the name of the parameter
  //   - parameterValue: the new value of the parameter
  // - contentHtml: the HTML representing the non-interactive content, i.e.
  //     what Oppia first says to the learner before asking for a response
  // - interactionHtml: the HTML representing the interaction
  // - answerFeedbackPairs: a list of objects, each with two keys:
  //   - learnerAnswer: the JS representation of the learner's answer
  //   - oppiaFeedbackHtml: the HTML representation of Oppia's response to this
  //       answer, or null if no response was given.
  // - destStateName: if non-null, this means that the learner is ready to move
  //     on. It represents the state name of the next card.
  //
  // Note that every card in this transcript is visible on the screen. The
  // 'destStateName' field is intended to identify transcripts where there is a
  // card 'in reserve', but the learner has not yet navigated to it -- this
  // happens if the current card offers feedback to the learner before they
  // carry on.
  var transcript = [];

  return {
    restore: function(oldTranscript) {
      transcript = angular.copy(oldTranscript);
    },
    init: function() {
      transcript = [];
    },
    getStateHistory: function() {
      var result = [];
      transcript.forEach(function(transcriptItem) {
        result.push(transcriptItem.stateName);
      });
      return result;
    },
    addNewCard: function(stateName, params, contentHtml, interactionHtml) {
      transcript.push({
        stateName: stateName,
        currentParams: params,
        contentHtml: contentHtml,
        interactionHtml: interactionHtml,
        answerFeedbackPairs: [],
        destStateName: null
      });
    },
    setDestination: function(newDestStateName) {
      var lastCard = this.getLastCard();
      if (lastCard.destStateName) {
        throw Error(
          'Trying to set a destStateName when it has already been set.',
          transcript);
      }

      lastCard.destStateName = newDestStateName;
    },
    addNewAnswer: function(answer) {
      var pairs = transcript[transcript.length - 1].answerFeedbackPairs;
      if (pairs.length > 0 &&
          pairs[pairs.length - 1].oppiaFeedbackHtml === null) {
        throw Error(
          'Trying to add an answer before the feedback for the previous ' +
          'answer has been received.',
          transcript);
      }
      transcript[transcript.length - 1].answerFeedbackPairs.push({
        learnerAnswer: answer,
        oppiaFeedbackHtml: null
      });
    },
    addNewFeedback: function(feedbackHtml) {
      var pairs = transcript[transcript.length - 1].answerFeedbackPairs;
      if (pairs[pairs.length - 1].oppiaFeedbackHtml !== null) {
        throw Error(
          'Trying to add feedback when it has already been added.', transcript);
      }
      pairs[pairs.length - 1].oppiaFeedbackHtml = feedbackHtml;
    },
    getNumCards: function() {
      return transcript.length;
    },
    getCard: function(index) {
      if (index < 0 || index >= transcript.length) {
        $log.error(
          'Requested card with index ' + index +
          ', but transcript only has length ' + transcript.length + ' cards.');
      }
      return transcript[index];
    },
    isLastCard: function(index) {
      return index === transcript.length - 1;
    },
    getLastCard: function() {
      return this.getCard(transcript.length - 1);
    },
    getNumSubmitsForLastCard: function() {
      return this.getLastCard().answerFeedbackPairs.length;
    },
    updateLatestInteractionHtml: function(newInteractionHtml) {
      this.getLastCard().interactionHtml = newInteractionHtml;
    },
    getLastStateName: function() {
      return this.getLastCard().stateName;
    }
  };
}]);
