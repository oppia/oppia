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

        $scope.localQuestionData = JSON.parse($attrs.questionWithValue);

        // This is the information about how to mark a question (e.g. the 
        // permited line templates) that is stored in defaultData.js within
        // the dependencies.
        $scope.questionData = angular.copy(LOGIC_PROOF_DEFAULT_QUESTION_DATA);

        $scope.questionData.assumptions = $scope.localQuestionData.assumptions;
        $scope.questionData.results = $scope.localQuestionData.results;

        // Deduce the new operators, as in logicProofTeacher.buildQuestion(),
        // since these are not currently stored separately for each question.
        $scope.expressions = [];
        $scope.topTypes = [];
        for (var i = 0; i < $scope.questionData.assumptions.length; i++) {
          $scope.expressions.push($scope.questionData.assumptions[i]);
          $scope.topTypes.push('boolean');
        }
        $scope.expressions.push($scope.questionData.results[0]);
        $scope.topTypes.push('boolean');
        $scope.typing = logicProofShared.assignTypesToExpressionArray(
          $scope.expressions, $scope.topTypes, logicProofData.BASE_STUDENT_LANGUAGE, 
          ['variable', 'constant', 'prefix_function']
        );
        $scope.questionData.language.operators = $scope.typing[0].operators;
        
        $scope.assumptionsString = logicProofShared.displayExpressionArray(
          $scope.questionData.assumptions, 
          $scope.questionData.language.operators);
        $scope.targetString = logicProofShared.displayExpression(
          $scope.questionData.results[0], 
          $scope.questionData.language.operators);
        $scope.questionString = ($scope.assumptionsString === '') ?
            'Prove ' + $scope.targetString + '.':
            'Assuming ' + $scope.assumptionsString + '; prove ' + $scope.targetString + '.';

        $scope.questionInstance = logicProofStudent.buildInstance($scope.questionData);
        $scope.proofString = $scope.localQuestionData.default_proof_string;
        $scope.haveErrorMessage = false;

        $scope.displayMessage = function(message, lineNumber) {
          var output = '';
          for (var i = 0; i < lineNumber; i++) {
            output += ' \n';
          }
          output += message;
          return output;
        }

        $scope.$watch('proofString', function(newValue, oldValue) {
          var comparison = logicProofConversion.compareStrings(newValue, oldValue);
          if (comparison.first === newValue.length - 1) {
            $scope.proofString = logicProofConversion.convertToLogicCharacters(newValue);
          }

          var haveNewLineBreak = 
            (newValue.slice(comparison.first, comparison.last + 1).indexOf('\n') !== -1);
          if (haveNewLineBreak) {
            try {
              logicProofStudent.validateProof($scope.proofString, $scope.questionInstance);
              $scope.proofError = '';
            } catch (err) {
              $scope.proofError = $scope.displayMessage(err.message, err.line);
            }
          } else {
            $scope.proofError = '';
          }
        })

        // NOTE: proof_num_lines and displayed_question are only computed here
        // because response.html needs them and does not have its own
        // javascript.
        $scope.submitProof = function() {
          try {
            var proof = logicProofStudent.buildProof($scope.proofString, $scope.questionInstance);
            logicProofStudent.checkProof(proof, $scope.questionInstance);
            $scope.$parent.$parent.submitAnswer({
              assumptions_string: $scope.assumptionsString,
              target_string: $scope.targetString,
              proof_string: $scope.proofString,
              proof_num_lines: proof.lines.length,
              correct: true,
              displayed_question: $scope.questionString,
              displayed_message: ''
            }, 'submit');
          } catch (err) {
            $scope.$parent.$parent.submitAnswer({
              assumptions_string: $scope.assumptionsString,
              target_string: $scope.targetString,
              proof_string: $scope.proofString,
              proof_num_lines: $scope.proofString.split('\n').length,
              correct: false,
              error_category: err.category,
              error_code: err.code,
              error_message: err.message,
              error_line_number: err.line,
              displayed_question: $scope.questionString,
              displayed_message: $scope.displayMessage(err.message, err.line)
            }, 'submit');
          }
        }

      }]
    };
  }
]);
