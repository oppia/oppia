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
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/NumberWithUnits/directives/' +
        'number_with_units_interaction_directive.html'),
      controller: [
        '$scope', '$attrs', '$uibModal', 'NumberWithUnitsObjectFactory',
        'numberWithUnitsRulesService', 'NUMBER_WITH_UNITS_PARSING_ERRORS',
        'CurrentInteractionService', function(
            $scope, $attrs, $uibModal, NumberWithUnitsObjectFactory,
            numberWithUnitsRulesService, NUMBER_WITH_UNITS_PARSING_ERRORS,
            CurrentInteractionService) {
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

          try {
            NumberWithUnitsObjectFactory.createCurrencyUnits();
          } catch (parsingError) {}

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
              CurrentInteractionService.onSubmit(
                numberWithUnits, numberWithUnitsRulesService);
            } catch (parsingError) {
              errorMessage = parsingError.message;
              $scope.NumberWithUnitsForm.answer.$setValidity(
                FORM_ERROR_TYPE, false);
            }
          };

          $scope.isAnswerValid = function() {
            if ($scope.NumberWithUnitsForm === undefined) {
              return true;
            }
            return (!$scope.NumberWithUnitsForm.$invalid &&
              $scope.answer !== '');
          };

          var submitAnswerFn = function() {
            $scope.submitAnswer($scope.answer);
          };

          CurrentInteractionService.registerCurrentInteraction(
            submitAnswerFn, $scope.isAnswerValid);

          $scope.showHelp = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getExtensionResourceUrl(
                '/interactions/NumberWithUnits/directives/' +
                'number_with_units_help_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.close = function() {
                    $uibModalInstance.close();
                  };
                }
              ]
            }).result.then(function() {});
          };
        }]
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

// Rules service for number with units interaction.
oppia.factory('numberWithUnitsRulesService', [
  'NumberWithUnitsObjectFactory', 'FractionObjectFactory',
  function(NumberWithUnitsObjectFactory, FractionObjectFactory) {
    try {
      NumberWithUnitsObjectFactory.createCurrencyUnits();
    } catch (parsingError) {}

    return {
      IsEqualTo: function(answer, inputs) {
        // Returns true only if input is exactly equal to answer.
        answer = NumberWithUnitsObjectFactory.fromDict(answer);
        inputs = NumberWithUnitsObjectFactory.fromDict(inputs.f);

        answerString = answer.toMathjsCompatibleString();
        inputsString = inputs.toMathjsCompatibleString();

        answerList = NumberWithUnitsObjectFactory.fromRawInputString(
          answerString).toDict();
        inputsList = NumberWithUnitsObjectFactory.fromRawInputString(
          inputsString).toDict();
        return angular.equals(answerList, inputsList);
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
        answerString = answer.toMathjsCompatibleString();
        inputsString = inputs.toMathjsCompatibleString();
        return math.unit(answerString).equals(math.unit(inputsString));
      }
    };
  }
]);
