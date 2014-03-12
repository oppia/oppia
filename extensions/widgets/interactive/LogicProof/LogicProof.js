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


/**
 * Directive for the InteractiveMap interactive widget.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveLogicProof', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interactiveWidget/LogicProof',
      controller: ['$scope', '$attrs', function($scope, $attrs) {

        $scope.questionData = angular.copy(DEFAULT_QUESTION_DATA);
        $scope.localQuestionData = JSON.parse($attrs.questionWithValue);
        if ($scope.localQuestionData === 'uninitialized') {
          console.log('uninitialized');
          $scope.questionData.assumptions = [{
            kind: 'variable',
            operator: 'P',
            arguments: [],
            dummies: []
          }];
          $scope.questionData.results = [{
            kind: 'variable',
            operator: 'P',
            arguments: [],
            dummies: []
          }]
        } else {
          $scope.questionData.assumptions = $scope.localQuestionData.assumptions;
          $scope.questionData.results = $scope.localQuestionData.results;
          $scope.questionData.language.operators = $scope.localQuestionData.language.operators;
        }
        
        $scope.assumptionsString = shared.displayExpressionArray($scope.questionData.assumptions, $scope.questionData.language.operators);
        $scope.targetString = shared.displayExpression($scope.questionData.results[0], $scope.questionData.language.operators);

        $scope.questionInstance = student.buildInstance($scope.questionData);
        $scope.proofString = $scope.localQuestionData.defaultProofString;
        $scope.haveDefaultProof = ($scope.proofString !== '');

        $scope.displayMessage = function(message, line) {
          $scope.proofError = '';
          for (var i = 0; i < line; i++) {
            $scope.proofError += ' \n';
          }
          $scope.proofError += message;
        }

        $scope.editProof = function() {
          $scope.checkSuccess = false;
          if ($scope.proofString.slice(-1) === '\n') {
            try {
              student.validateProof($scope.proofString, $scope.questionInstance);
            }
            catch (err) {
              $scope.displayMessage(err.message, err.line);
            }
          } else {
            $scope.proofError = '';
          }
        }

        $scope.submitProof = function() {
          try {
            proof = student.buildProof($scope.proofString, $scope.questionInstance);
            student.checkProof(proof, $scope.questionInstance);
            $scope.$parent.$parent.submitAnswer({
              assumptionsString: $scope.assumptionsString,
              targetString: $scope.targetString,
              proofString: $scope.proofString,
              correct: true
            }, 'submit');
          }
          catch (err) {
            $scope.$parent.$parent.submitAnswer({
              assumptionsString: $scope.assumptionsString,
              targetString: $scope.targetString,
              proofString: $scope.proofString,
              correct: false,
              errorCategory: err.category,
              errorCode: err.code,
              // TODO: should just return err.message, and fix response.html
              errorMessage: 'line ' + (err.line + 1) + ': ' + err.message,
              errorLine: err.line
            }, 'submit');
          }
        }

      }]
    };
  }
]);
