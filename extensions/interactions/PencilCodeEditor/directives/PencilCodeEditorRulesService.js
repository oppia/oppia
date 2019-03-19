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

oppia.factory('PencilCodeEditorRulesService', [
  '$filter', 'CodeNormalizerService',
  function($filter, CodeNormalizerService) {
    return {
      CodeEquals: function(answer, inputs) {
        var normalizedCode =
          CodeNormalizerService.getNormalizedCode(answer.code);
        var normalizedExpectedCode =
          CodeNormalizerService.getNormalizedCode(inputs.x);
        return normalizedCode === normalizedExpectedCode;
      },
      CodeContains: function(answer, inputs) {
        var normalizedCode =
          CodeNormalizerService.getNormalizedCode(answer.code);
        var normalizedSnippet =
          CodeNormalizerService.getNormalizedCode(inputs.x);
        return normalizedCode.indexOf(normalizedSnippet) !== -1;
      },
      CodeDoesNotContain: function(answer, inputs) {
        var normalizedCode =
          CodeNormalizerService.getNormalizedCode(answer.code);
        var normalizedSnippet =
          CodeNormalizerService.getNormalizedCode(inputs.x);
        return normalizedCode.indexOf(normalizedSnippet) === -1;
      },
      OutputEquals: function(answer, inputs) {
        var normalizedOutput = $filter('normalizeWhitespace')(answer.output);
        var normalizedExpectedOutput =
          $filter('normalizeWhitespace')(inputs.x);
        return normalizedOutput === normalizedExpectedOutput;
      },
      OutputRoughlyEquals: function(answer, inputs) {
        var normalizedOutput = $filter(
          'normalizeWhitespacePunctuationAndCase')(answer.output);
        var normalizedExpectedOutput =
          $filter('normalizeWhitespacePunctuationAndCase')(inputs.x);
        return normalizedOutput === normalizedExpectedOutput;
      },
      ResultsInError: function(answer) {
        return !!(answer.error.trim());
      },
      ErrorContains: function(answer, inputs) {
        var normalizedError = $filter('normalizeWhitespace')(answer.error);
        var normalizedSnippet = $filter('normalizeWhitespace')(inputs.x);
        return normalizedError.indexOf(normalizedSnippet) !== -1;
      }
    };
  }]);
