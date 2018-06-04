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

oppia.directive('logicQuestionEditor', [
  '$compile', 'OBJECT_EDITOR_URL_PREFIX',
  function($compile, OBJECT_EDITOR_URL_PREFIX) {
    return {
      link: function(scope, element) {
        scope.getTemplateUrl = function() {
          return OBJECT_EDITOR_URL_PREFIX + 'LogicQuestion';
        };
        $compile(element.contents())(scope);
      },
      restrict: 'E',
      scope: {
        value: '='
      },
      template: '<span ng-include="getTemplateUrl()"></span>',
      controller: ['$scope', function($scope) {
        $scope.alwaysEditable = true;
        $scope.localValue = {
          assumptionsString: logicProofShared.displayExpressionArray(
            $scope.value.assumptions,
            logicProofData.BASE_STUDENT_LANGUAGE.operators),
          targetString: logicProofShared.displayExpression(
            $scope.value.results[0],
            logicProofData.BASE_STUDENT_LANGUAGE.operators),
          errorMessage: '',
          proofString: $scope.value.default_proof_string
        };

        // NOTE: we use ng-change rather than $watch because the latter runs in
        // response to any change to the watched value, and we only want to
        // respond to changes made by the user.
        $scope.changeAssumptions = function() {
          $scope.convertThenBuild(
            'logicQuestionAssumptions', 'assumptionsString');
        };
        $scope.changeTarget = function() {
          $scope.convertThenBuild('logicQuestionTarget', 'targetString');
        };
        $scope.changeProof = function() {
          $scope.convertThenBuild('logicQuestionProof', 'proofString');
        };

        $scope.convertThenBuild = function(elementID, nameOfString) {
          var element = document.getElementById(elementID);
          var cursorPosition = element.selectionEnd;
          $scope.localValue[nameOfString] =
            logicProofConversion.convertToLogicCharacters(
              $scope.localValue[nameOfString]);
          $scope.buildQuestion();
          // NOTE: angular will reset the position of the cursor after this
          // function runs, so we need to delay our re-resetting.
          setTimeout(function() {
            element.selectionEnd = cursorPosition;
          }, 2);
        };

        $scope.buildQuestion = function() {
          try {
            builtQuestion = angular.copy(
              logicProofTeacher.buildQuestion(
                $scope.localValue.assumptionsString,
                $scope.localValue.targetString,
                LOGIC_PROOF_DEFAULT_QUESTION_DATA.vocabulary));
            $scope.value = {
              assumptions: builtQuestion.assumptions,
              results: builtQuestion.results,
              default_proof_string: $scope.localValue.proofString
            };
            $scope.localValue.errorMessage = '';
          } catch (err) {
            $scope.localValue.errorMessage = err.message;
          }
        };
      }]
    };
  }]);
