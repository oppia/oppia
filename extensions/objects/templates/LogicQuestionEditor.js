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


// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

oppia.directive('logicQuestionEditor', function($compile, warningsData) {
  return {
    link: function(scope, element, attrs) {
      scope.getTemplateUrl = function() {
        return OBJECT_EDITOR_TEMPLATES_URL + scope.$parent.objType;
      };
      $compile(element.contents())(scope);
    },
    restrict: 'E',
    scope: true,
    template: '<span ng-include="getTemplateUrl()"></span>',
    controller: function($scope, $element, $attrs) {
      $scope.alwaysEditable = true;
      $scope.localValue = {
        assumptionsString: logicProofShared.displayExpressionArray(
          $scope.$parent.value.assumptions, logicProofData.BASE_STUDENT_LANGUAGE.operators),
        targetString: logicProofShared.displayExpression(
          $scope.$parent.value.results[0], logicProofData.BASE_STUDENT_LANGUAGE.operators),
        errorMessage: '',
        proofString: $scope.$parent.value.default_proof_string
      };

      console.log(logicProofData.BASE_STUDENT_LANGUAGE.operators)
      console.log($scope.$parent.value.assumptions)
      
      // We only start trying to build the question once a target formula has
      // been provided.
      $scope.startBuilding = false;
      
      $scope.buildQuestion = function() {
        if ($scope.startBuilding) {
          try {
            builtQuestion = angular.copy(
              logicProofTeacher.buildQuestion(
                $scope.localValue.assumptionsString, 
                $scope.localValue.targetString, 
                LOGIC_PROOF_DEFAULT_QUESTION_DATA.vocabulary));
            $scope.$parent.value = {
              assumptions: builtQuestion.assumptions,
              results: builtQuestion.results,
              default_proof_string: $scope.localValue.proofString
            }
            $scope.localValue.errorMessage = '';
          }
          catch (err) {
            $scope.localValue.errorMessage = err.message;
          }
        }
      }

      $scope.$watch('localValue.assumptionsString', function(newValue, oldValue) {
        var comparison = logicProofConversion.compareStrings(newValue, oldValue);
        if (comparison.first === newValue.length - 1) {
          $scope.localValue.assumptionsString = logicProofConversion.convertToLogicCharacters(newValue);
        }
        $scope.buildQuestion();
      })

      $scope.$watch('localValue.targetString', function(newValue, oldValue) {
        var comparison = logicProofConversion.compareStrings(newValue, oldValue);
        if (comparison.first === newValue.length - 1) {
          $scope.localValue.targetString = logicProofConversion.convertToLogicCharacters(newValue);
        }
        if (newValue !== '') {
          $scope.startBuilding = true;
        }
        $scope.buildQuestion();
      })

      $scope.$watch('localValue.proofString', function(newValue, oldValue) {
        var comparison = logicProofConversion.compareStrings(newValue, oldValue);
        if (comparison.first === newValue.length - 1) {
          $scope.localValue.proofString = logicProofConversion.convertToLogicCharacters(newValue);
        }
        $scope.startBuilding = true;
        $scope.buildQuestion();
      })

    }
  };
});
