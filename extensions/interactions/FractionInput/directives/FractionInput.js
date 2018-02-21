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

oppia.directive('oppiaInteractiveFractionInput', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        onSubmit: '&',
        // This should be called whenever the answer changes.
        setAnswerValidity: '&'
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/FractionInput/directives/' +
        'fraction_input_interaction_directive.html'),
      controller: [
        '$scope', '$attrs', 'FocusManagerService', 'fractionInputRulesService',
        'FractionObjectFactory', 'FRACTION_PARSING_ERRORS',
        'WindowDimensionsService', 'EVENT_PROGRESS_NAV_SUBMITTED',
        function(
            $scope, $attrs, FocusManagerService, fractionInputRulesService,
            FractionObjectFactory, FRACTION_PARSING_ERRORS,
            WindowDimensionsService, EVENT_PROGRESS_NAV_SUBMITTED) {
          $scope.answer = '';
          $scope.labelForFocusTarget = $attrs.labelForFocusTarget || null;

          var requireSimplestForm = (
            $attrs.requireSimplestFormWithValue === 'true');
          var allowImproperFraction = (
            $attrs.allowImproperFractionWithValue === 'true');
          $scope.allowNonzeroIntegerPart = (
            $attrs.allowNonzeroIntegerPartWithValue === 'true');
          $scope.customPlaceholder = HtmlEscaperService.escapedJsonToObj(
            $attrs.customPlaceholderWithValue);

          var errorMessage = '';
          // Label for errors caused whilst parsing a fraction.
          var FORM_ERROR_TYPE = 'FRACTION_FORMAT_ERROR';
          $scope.FRACTION_INPUT_FORM_SCHEMA = {
            type: 'unicode',
            ui_config: {}
          };

          $scope.getWarningText = function() {
            return errorMessage;
          };

          /**
           * Disables the input box if the data entered is not a valid prefix
           * for a fraction.
           * Examples of valid prefixes:
           * -- 1
           * -- 1 2
           * -- 1 2/
           * -- 2/
           * -- 1 2/3
           */
          $scope.$watch('answer', function(newValue) {
            var INVALID_CHARS_REGEX = /[^\d\s\/-]/g;
            // Accepts incomplete fraction inputs
            // (see examples above except last).
            var PARTIAL_FRACTION_REGEX =
              /^\s*(-?\s*((\d*\s*\d+\s*\/?\s*)|\d+)\s*)?$/;
            // Accepts complete fraction inputs.
            var FRACTION_REGEX =
              /^\s*-?\s*((\d*\s*\d+\s*\/\s*\d+)|\d+)\s*$/;
            if (INVALID_CHARS_REGEX.test(newValue)) {
              errorMessage = FRACTION_PARSING_ERRORS.INVALID_CHARS;
              $scope.FractionInputForm.answer.$setValidity(
                FORM_ERROR_TYPE, false);
            } else if (!(FRACTION_REGEX.test(newValue) ||
                PARTIAL_FRACTION_REGEX.test(newValue))) {
              errorMessage = FRACTION_PARSING_ERRORS.INVALID_FORMAT;
              $scope.FractionInputForm.answer.$setValidity(
                FORM_ERROR_TYPE, false);
            } else {
              errorMessage = '';
              $scope.FractionInputForm.answer.$setValidity(
                FORM_ERROR_TYPE, true);
            }
          });

          $scope.submitAnswer = function(answer) {
            try {
              var fraction = FractionObjectFactory.fromRawInputString(
                answer);
              if (requireSimplestForm &&
                !angular.equals(fraction, fraction.convertToSimplestForm())
              ) {
                errorMessage = (
                  'Please enter an answer in simplest form ' +
                  '(e.g., 1/3 instead of 2/6).');
                $scope.FractionInputForm.answer.$setValidity(
                  FORM_ERROR_TYPE, false);
              } else if (
                  !allowImproperFraction && fraction.isImproperFraction()) {
                errorMessage = (
                  'Please enter an answer with a "proper" fractional part ' +
                  '(e.g., 1 2/3 instead of 5/3).');
                $scope.FractionInputForm.answer.$setValidity(
                  FORM_ERROR_TYPE, false);
              } else if (
                  !$scope.allowNonzeroIntegerPart &&
                  fraction.hasNonzeroIntegerPart()) {
                errorMessage = (
                  'Please enter your answer as a fraction (e.g., 5/3 instead ' +
                  'of 1 2/3).');
                $scope.FractionInputForm.answer.$setValidity(
                  FORM_ERROR_TYPE, false);
              } else {
                $scope.onSubmit({
                  answer: fraction,
                  rulesService: fractionInputRulesService
                });
              }
            } catch (parsingError) {
              errorMessage = parsingError.message;
              $scope.FractionInputForm.answer.$setValidity(
                FORM_ERROR_TYPE, false);
            }
          };

          $scope.$on(EVENT_PROGRESS_NAV_SUBMITTED, function() {
            $scope.submitAnswer($scope.answer);
          });

          $scope.isAnswerValid = function() {
            return (!$scope.FractionInputForm.$invalid && $scope.answer !== '');
          };

          $scope.$watch(function() {
            return $scope.answer;
          }, function() {
            $scope.setAnswerValidity({
              answerValidity: $scope.isAnswerValid()
            });
          });
        }
      ]
    };
  }
]);

oppia.directive('oppiaResponseFractionInput', [
  'FractionObjectFactory', 'HtmlEscaperService', 'UrlInterpolationService',
  function(
      FractionObjectFactory, HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/FractionInput/directives/' +
        'fraction_input_response_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
        $scope.answer = FractionObjectFactory.fromDict(answer).toString();
      }]
    };
  }
]);

oppia.directive('oppiaShortResponseFractionInput', [
  'FractionObjectFactory', 'HtmlEscaperService', 'UrlInterpolationService',
  function(
      FractionObjectFactory, HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/FractionInput/directives/' +
        'fraction_input_short_response_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
        $scope.answer = FractionObjectFactory.fromDict(answer).toString();
      }]
    };
  }
]);

/**
 * Rule evaluation for the fraction input.
 */
oppia.factory('fractionInputRulesService', [
  'FractionObjectFactory',
  function(FractionObjectFactory) {
    var toFloat = function(fractionDict) {
      return FractionObjectFactory.fromDict(fractionDict).toFloat();
    };

    return {
      IsEquivalentTo: function(answer, inputs) {
        return toFloat(answer) === toFloat(inputs.f);
      },
      IsEquivalentToAndInSimplestForm: function(answer, inputs) {
        var simplestForm =
          FractionObjectFactory.fromDict(inputs.f).convertToSimplestForm();
        return toFloat(answer) === toFloat(inputs.f) &&
          angular.equals(answer, simplestForm);
      },
      IsExactlyEqualTo: function(answer, inputs) {
        // Only returns true if both answers are structurally equal.
        return angular.equals(answer, inputs.f);
      },
      IsLessThan: function(answer, inputs) {
        return toFloat(answer) < toFloat(inputs.f);
      },
      IsGreaterThan: function(answer, inputs) {
        return toFloat(answer) > toFloat(inputs.f);
      },
      HasIntegerPartEqualTo: function(answer, inputs) {
        var answerFraction = FractionObjectFactory.fromDict(answer);
        return answerFraction.getIntegerPart() === inputs.x;
      },
      HasNumeratorEqualTo: function(answer, inputs) {
        return answer.numerator === inputs.x;
      },
      HasDenominatorEqualTo: function(answer, inputs) {
        return answer.denominator === inputs.x;
      },
      HasNoFractionalPart: function(answer) {
        return answer.numerator === 0;
      },
      HasFractionalPartExactlyEqualTo: function(answer, inputs) {
        return (
          answer.numerator === inputs.f.numerator &&
          answer.denominator === inputs.f.denominator);
      },
    };
  }
]);
