// Copyright 2018 The Oppia Authors. All Rights Reserved.
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

oppia.directive('oppiaInteractiveNumberWithUnits', [
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
        '/interactions/NumberWithUnits/directives/' +
        'number_with_units_interaction_directive.html'),
      controller: [
        '$scope', '$attrs', 'NumberWithUnitsObjectFactory',
        'numberWithUnitsRulesService', 'NUMBER_WITH_UNITS_PARSING_ERRORS',
        'EVENT_PROGRESS_NAV_SUBMITTED', function(
            $scope, $attrs, NumberWithUnitsObjectFactory,
            numberWithUnitsRulesService, NUMBER_WITH_UNITS_PARSING_ERRORS,
            EVENT_PROGRESS_NAV_SUBMITTED) {
          $scope.answer = '';
          $scope.labelForFocusTarget = $attrs.labelForFocusTarget || null;

          var errorMessage = '';
          // Label for errors caused whilst parsing number with units.
          var FORM_ERROR_TYPE = 'NUMBER_WITH_UNITS_FORMAT_ERROR';
          $scope.NUMBER_WITH_UNITS_FORM_SCHEMA = {
            type: 'unicode',
            ui_config: {}
          };

          $scope.getWarningText = function() {
            return errorMessage;
          };

          $scope.$watch('answer', function(newValue) {
            try {
              var numberWithUnits =
                NumberWithUnitsObjectFactory.fromRawInputString(newValue);
              errorMessage = '';
              $scope.NumberWithUnitsForm.answer.$setValidity(
                FORM_ERROR_TYPE, true);
            } catch (parsingError) {
              errorMessage = parsingError.message;
              $scope.NumberWithUnitsForm.answer.$setValidity(
                FORM_ERROR_TYPE, false);
            }
          });

          $scope.submitAnswer = function(answer) {
            try {
              var numberWithUnits =
                NumberWithUnitsObjectFactory.fromRawInputString(answer);
              $scope.onSubmit({
                answer: numberWithUnits,
                rulesService: numberWithUnitsRulesService
              });
            } catch (parsingError) {
              errorMessage = parsingError.message;
              $scope.NumberWithUnitsForm.answer.$setValidity(
                FORM_ERROR_TYPE, false);
            }
          };

          $scope.$on(EVENT_PROGRESS_NAV_SUBMITTED, function() {
            $scope.submitAnswer($scope.answer);
          });

          $scope.isAnswerValid = function() {
            return (!$scope.NumberWithUnitsForm.$invalid &&
              $scope.answer !== '');
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

oppia.directive('oppiaResponseNumberWithUnits', [
  'NumberWithUnitsObjectFactory', 'HtmlEscaperService',
  'UrlInterpolationService', function(NumberWithUnitsObjectFactory,
      HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/NumberWithUnits/directives/' +
        'number_with_units_response_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
        $scope.answer = NumberWithUnitsObjectFactory.fromDict(
          answer).toString();
      }]
    };
  }
]);

oppia.directive('oppiaShortResponseNumberWithUnits', [
  'NumberWithUnitsObjectFactory', 'HtmlEscaperService',
  'UrlInterpolationService', function(NumberWithUnitsObjectFactory,
      HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/NumberWithUnits/directives/' +
        'number_with_units_short_response_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
        $scope.answer = NumberWithUnitsObjectFactory.fromDict(
          answer).toString();
      }]
    };
  }
]);

// Rule evaluation for number with units.
oppia.factory('numberWithUnitsRulesService', [
  'NumberWithUnitsObjectFactory', 'FractionObjectFactory',
  function(NumberWithUnitsObjectFactory, FractionObjectFactory) {

    return {
      IsEqualTo: function(answer, inputs) {
        return angular.equals(answer, inputs.f);
      },
      IsEquivalentTo: function(answer, inputs) {
        answer = NumberWithUnitsObjectFactory.fromDict(answer);
        inputs = NumberWithUnitsObjectFactory.fromDict(inputs.f);
        if (answer.type === 'fraction') {
          answer.type = 'real';
          answer.real = answer.fraction.toFloat();
        }
        if (inputs.type === 'fraction') {
          inputs.type = 'real';
          inputs.real = inputs.fraction.toFloat();
        }
        answerString = answer.toString();
        inputsString = inputs.toString();
        return math.unit(answerString).equals(math.unit(inputsString));
      }
    };
  }
]);
