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
 * @fileoverview Service for the learner view transcript.
 */

// A service that maintains the transcript of the playthrough (i.e., what cards
// are shown, what answers have been given, etc. Note that this service does
// not maintain the currently-active card -- it's more like a log of what the
// learner has 'discovered' so far.
oppia.factory('PlayerTranscriptService', ['$log', function($log) {
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
  // - inputResponsePairs: a list of input response pairs:
  //   - learnerInput: the JS representation of the learner's input. This can
  //       either be an answer or a request for a hint.
  //   - oppiaResponse: the HTML representation of Oppia's response to
  //       the learner's input. This could either be a hint or a feedback for
  //       the learner's answer.
  //   - isHint: A boolean value representing if the current input is a request
  //       for a hint.
  // - destStateName: if non-null, this means that the learner is ready to move
  //     on. It represents the state name of the next card.
  //
  // Note that every card in this transcript is visible on the screen. The
  // 'destStateName' field is intended to identify transcripts where there is a
  // card 'in reserve', but the learner has not yet navigated to it -- this
  // happens if the current card offers feedback to the learner before they
  // carry on.
  var transcript = [];
  var numAnswersSubmitted = 0;

  return {
    restore: function(oldTranscript) {
      transcript = angular.copy(oldTranscript);
    },
    init: function() {
      transcript = [];
      numAnswersSubmitted = 0;
    },
    getStateHistory: function() {
      var result = [];
      transcript.forEach(function(transcriptItem) {
        result.push(transcriptItem.stateName);
      });
      return result;
    },
    addNewCard: function(
        stateName, params, contentHtml, interactionHtml, leadsToConceptCard) {
      transcript.push({
        stateName: stateName,
        currentParams: params,
        contentHtml: contentHtml,
        interactionHtml: interactionHtml,
        inputResponsePairs: [],
        destStateName: null,
        leadsToConceptCard: leadsToConceptCard
      });
      numAnswersSubmitted = 0;
    },
    addPreviousCard: function() {
      if (transcript.length === 1) {
        throw Error(
          'Exploration player is on the first card and hence no previous ' +
          'card exists.');
      }
      // TODO(aks681): Once worked examples are introduced, modify the below
      // line to take into account the number of worked examples displayed.
      var previousCard = angular.copy(transcript[transcript.length - 2]);
      previousCard.leadsToConceptCard = false;
      transcript.push(previousCard);
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
    addNewInput: function(input, isHint) {
      var pairs = transcript[transcript.length - 1].inputResponsePairs;
      if (pairs.length > 0 &&
          pairs[pairs.length - 1].oppiaResponse === null) {
        throw Error(
          'Trying to add an input before the response for the previous ' +
          'input has been received.',
          transcript);
      }
      if (!isHint) {
        numAnswersSubmitted += 1;
      }
      transcript[transcript.length - 1].inputResponsePairs.push({
        learnerInput: input,
        oppiaResponse: null,
        isHint: isHint
      });
    },
    addNewResponse: function(response) {
      var pairs = transcript[transcript.length - 1].inputResponsePairs;
      if (pairs[pairs.length - 1].oppiaResponse !== null) {
        throw Error(
          'Trying to add a response when it has already been added.',
          transcript);
      }
      pairs[pairs.length - 1].oppiaResponse = response;
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
    getLastAnswerOnActiveCard: function(index) {
      if (this.isLastCard(index) || transcript[index].stateName === null) {
        return null;
      } else {
        return transcript[index].
          inputResponsePairs.slice(-1)[0].learnerInput;
      }
    },
    isLastCard: function(index) {
      return index === transcript.length - 1;
    },
    getLastCard: function() {
      return this.getCard(transcript.length - 1);
    },
    getNumSubmitsForLastCard: function() {
      return numAnswersSubmitted;
    },
    updateLatestInteractionHtml: function(newInteractionHtml) {
      this.getLastCard().interactionHtml = newInteractionHtml;
    },
    getLastStateName: function() {
      return this.getLastCard().stateName;
    }
  };
}]);
