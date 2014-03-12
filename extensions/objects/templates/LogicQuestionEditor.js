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
    controller: function($scope, $attrs) {
      $scope.alwaysEditable = true;
      $scope.localValue = {
        assumptionsString: '',
        targetString: '',
        errorMessage: '',
        proofString: ''
      };
      $scope.errorMessage = '';
      
      console.log('pater')
      console.log($scope.$parent.value)
      if ($scope.$parent.value !== 'uninitialized') {
        $scope.localValue.assumptionsString = shared.displayExpressionArray(
          $scope.$parent.value.assumptions, 
          sharedData.BASE_STUDENT_LANGUAGE.operators)
        $scope.localValue.targetString = shared.displayExpression(
          $scope.$parent.value.results[0], 
          sharedData.BASE_STUDENT_LANGUAGE.operators)
        $scope.localValue.proofString = $scope.$parent.value.defaultProofString;
      }
      $scope.startBuilding = false;
      
      $scope.buildQuestion = function() {
        if ($scope.startBuilding) {
          try {
            builtQuestion = angular.copy(
              teacher.buildQuestion(
                $scope.localValue.assumptionsString, 
                $scope.localValue.targetString, 
                DEFAULT_QUESTION_DATA.vocabulary));
            $scope.$parent.value = {
              assumptions: builtQuestion.assumptions,
              results: builtQuestion.results,
              language: {
                operators: builtQuestion.operators
              },
              defaultProofString: $scope.localValue.proofString
            }
            $scope.localValue.errorMessage = '';
          }
          catch (err) {
            $scope.localValue.errorMessage = err.message;
          }
        }
      }

      $scope.$watch('localValue.assumptionsString', function(newValue, oldValue) {
        $scope.buildQuestion();
      })
      $scope.$watch('localValue.targetString', function(newValue, oldValue) {
        if (newValue !== '') {
          $scope.startBuilding = true;
        }
        $scope.buildQuestion();
      })
      $scope.$watch('localValue.proofString', function(newValue, oldValue) {
        $scope.buildQuestion();
      })

    }
  };
});
