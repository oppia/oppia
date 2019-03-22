// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Rules service for the interaction.
 */

oppia.factory('TextInputRulesService', ['$filter', function($filter) {
  return {
    Equals: function(answer, inputs) {
      var normalizedAnswer = $filter('normalizeWhitespace')(answer);
      var normalizedInput = $filter('normalizeWhitespace')(inputs.x);
      return normalizedAnswer.toLowerCase() === normalizedInput.toLowerCase();
    },
    FuzzyEquals: function(answer, inputs) {
      var normalizedAnswer = $filter('normalizeWhitespace')(answer);
      var answerString = normalizedAnswer.toLowerCase();

      var normalizedInput = $filter('normalizeWhitespace')(inputs.x);
      var inputString = normalizedInput.toLowerCase();

      if (inputString === answerString) {
        return true;
      }
      var editDistance = [];
      for (var i = 0; i <= inputString.length; i++) {
        editDistance.push([i]);
      }
      for (var j = 1; j <= answerString.length; j++) {
        editDistance[0].push(j);
      }
      for (var i = 1; i <= inputString.length; i++) {
        for (var j = 1; j <= answerString.length; j++) {
          if (inputString.charAt(i - 1) === answerString.charAt(j - 1)) {
            editDistance[i][j] = editDistance[i - 1][j - 1];
          } else {
            editDistance[i][j] = Math.min(editDistance[i - 1][j - 1],
              editDistance[i][j - 1],
              editDistance[i - 1][j]) + 1;
          }
        }
      }
      return editDistance[inputString.length][answerString.length] === 1;
    },
    CaseSensitiveEquals: function(answer, inputs) {
      var normalizedAnswer = $filter('normalizeWhitespace')(answer);
      var normalizedInput = $filter('normalizeWhitespace')(inputs.x);
      return normalizedAnswer === normalizedInput;
    },
    StartsWith: function(answer, inputs) {
      var normalizedAnswer = $filter('normalizeWhitespace')(answer);
      var normalizedInput = $filter('normalizeWhitespace')(inputs.x);
      return normalizedAnswer.toLowerCase().indexOf(
        normalizedInput.toLowerCase()) === 0;
    },
    Contains: function(answer, inputs) {
      var normalizedAnswer = $filter('normalizeWhitespace')(answer);
      var normalizedInput = $filter('normalizeWhitespace')(inputs.x);
      return normalizedAnswer.toLowerCase().indexOf(
        normalizedInput.toLowerCase()) !== -1;
    }
  };
}]);
