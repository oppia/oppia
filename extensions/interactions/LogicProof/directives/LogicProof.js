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

oppia.directive('oppiaInteractiveLogicProof', [
  'HtmlEscaperService', 'UrlInterpolationService', 'EVENT_NEW_CARD_AVAILABLE',
  function(
      HtmlEscaperService, UrlInterpolationService, EVENT_NEW_CARD_AVAILABLE) {
    return {
      restrict: 'E',
      scope: {
        getLastAnswer: '&lastAnswer',
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/LogicProof/directives/' +
        'logic_proof_interaction_directive.html'),
      controller: [
        '$scope', '$attrs', '$uibModal', 'logicProofRulesService',
        'WindowDimensionsService', 'UrlService',
        'ExplorationPlayerService', 'CurrentInteractionService',
        function(
            $scope, $attrs, $uibModal, logicProofRulesService,
            WindowDimensionsService, UrlService,
            ExplorationPlayerService, CurrentInteractionService) {
          $scope.localQuestionData = HtmlEscaperService.escapedJsonToObj(
            $attrs.questionWithValue);

          // This is the information about how to mark a question (e.g. the
          // permitted line templates) that is stored in defaultData.js within
          // the dependencies.
          $scope.questionData = angular.copy(LOGIC_PROOF_DEFAULT_QUESTION_DATA);

          $scope.interactionIsActive = ($scope.getLastAnswer() === null);
          $scope.$on(EVENT_NEW_CARD_AVAILABLE, function() {
            $scope.interactionIsActive = false;
          });

          $scope.questionData.assumptions =
            $scope.localQuestionData.assumptions;
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
            $scope.expressions, $scope.topTypes,
            logicProofData.BASE_STUDENT_LANGUAGE,
            ['variable', 'constant', 'prefix_function']
          );

          $scope.questionData.language.operators = $scope.typing[0].operators;

          if ($scope.questionData.assumptions.length <= 1) {
            $scope.assumptionsString = logicProofShared.displayExpressionArray(
              $scope.questionData.assumptions,
              $scope.questionData.language.operators);
          } else {
            $scope.assumptionsString = logicProofShared.displayExpressionArray(
              $scope.questionData.assumptions.slice(
                0, $scope.questionData.assumptions.length - 1
              ), $scope.questionData.language.operators
            ) + ' and ' + logicProofShared.displayExpression(
              $scope.questionData.assumptions[
                $scope.questionData.assumptions.length - 1],
              $scope.questionData.language.operators);
          }
          $scope.targetString = logicProofShared.displayExpression(
            $scope.questionData.results[0],
            $scope.questionData.language.operators);
          $scope.questionString = (
            $scope.assumptionsString === '' ?
            'I18N_INTERACTIONS_LOGIC_PROOF_QUESTION_STR_NO_ASSUMPTION' :
            'I18N_INTERACTIONS_LOGIC_PROOF_QUESTION_STR_ASSUMPTIONS');
          $scope.questionStringData = {
            target: $scope.targetString,
            assumptions: $scope.assumptionsString
          };

          $scope.questionInstance = logicProofStudent.buildInstance(
            $scope.questionData);
          // Denotes whether messages are in response to a submission, in which
          // case they persist for longer.
          $scope.messageIsSticky = false;

          // NOTE: for information on integrating angular and code-mirror see
          // http://github.com/angular-ui/ui-codemirror
          $scope.codeEditor = function(editor) {
            var proofString = ($scope.interactionIsActive ?
              $scope.localQuestionData.default_proof_string :
              $scope.getLastAnswer().proof_string);
            editor.setValue(proofString);
            $scope.proofString = editor.getValue();
            var cursorPosition = editor.doc.getCursor();

            editor.setOption('lineNumbers', true);
            editor.setOption('lineWrapping', true);

            // NOTE: this is necessary to avoid the textarea being greyed-out.
            // See: http://stackoverflow.com/questions/8349571 for discussion.
            setTimeout(function() {
              editor.refresh();
            }, 500);

            // NOTE: we must use beforeChange rather than change here to avoid
            // an infinite loop (which code-mirror will not catch).
            editor.on('beforeChange', function(instance, change) {
              var convertedText = logicProofConversion.convertToLogicCharacters(
                change.text.join('\n'));
              if (convertedText !== change.text.join('\n')) {
                // We update using the converted text, then cancel its being
                // overwritten by the original text.
                editor.doc.replaceRange(convertedText, change.from, change.to);
                change.cancel();
              }
            });

            editor.on('cursorActivity', function() {
              if (editor.doc.getCursor().line !== cursorPosition.line) {
                $scope.checkForBasicErrors();
                cursorPosition = editor.doc.getCursor();
              }
            });

            // NOTE: we use change rather than beforeChange here so that
            // checking for mistakes is done with respect to the updated text.
            editor.on('change', function(instance, change) {
              $scope.proofString = editor.getValue();
              // We update the message only if the user has added or removed a
              // line break, so that it remains while they work on a single
              // line.
              if (change.text.length > 1 || change.removed.length > 1) {
                $scope.checkForBasicErrors();
              }
            });

            $scope.editor = editor;
          };

          // This performs simple error checks that are done as the student
          // types rather than waiting for the proof to be submitted.
          $scope.checkForBasicErrors = function() {
            if (!$scope.messageIsSticky) {
              $scope.clearMessage();
            }
            try {
              logicProofStudent.validateProof(
                $scope.proofString, $scope.questionInstance);
            } catch (err) {
              $scope.clearMessage();
              $scope.showMessage(err.message, err.line);
              $scope.messageIsSticky = false;
            }
            // NOTE: this line is necessary to force angular to refresh the
            // displayed errorMessage.
            $scope.$apply();
          };

          $scope.clearMessage = function() {
            if ($scope.errorMark) {
              $scope.errorMark.clear();
            }
            $scope.errorMessage = '';
          };

          $scope.showMessage = function(message, lineNum) {
            $scope.errorMessage = $scope.constructDisplayedMessage(
              message, lineNum);
            $scope.errorMark = $scope.editor.doc.markText({
              line: lineNum,
              ch: 0
            }, {
              line: lineNum,
              ch: 100
            }, {
              className: 'logic-proof-erroneous-line'
            });
          };

          $scope.constructDisplayedMessage = function(message, lineNum) {
            return 'line ' + (lineNum + 1) + ': ' + message;
          };

          $scope.displayProof = function(proofString, errorLineNum) {
            var proofLines = proofString.split('\n');
            var numberedLines = [];
            for (var i = 0; i < proofLines.length; i++) {
              numberedLines.push((i + 1) + '  ' + proofLines[i]);
            }
            // We split incorrect proofs into three parts so that response.html
            // can make the invalid line bold.
            return (errorLineNum === undefined) ?
              [numberedLines.join('\n')] :
              [
                numberedLines.slice(0, errorLineNum).join('\n'),
                numberedLines[errorLineNum],
                numberedLines.slice(
                  errorLineNum + 1, numberedLines.length).join('\n')
              ];
          };

          // NOTE: proof_num_lines, displayed_question and displayed_proof are
          // only computed here because response.html needs them and does not
          // have its own javascript.
          $scope.submitProof = function() {
            $scope.clearMessage();
            var submission = {
              assumptions_string: $scope.assumptionsString,
              target_string: $scope.targetString,
              proof_string: $scope.proofString,
              proof_num_lines: $scope.proofString.split('\n').length,
              displayed_question: $scope.questionString
            };
            try {
              var proof = logicProofStudent.buildProof(
                $scope.proofString, $scope.questionInstance);
              logicProofStudent.checkProof(proof, $scope.questionInstance);
              submission.correct = true;
            } catch (err) {
              submission.correct = false;
              submission.error_category = err.category;
              submission.error_code = err.code;
              submission.error_message = err.message;
              submission.error_line_number = err.line;
              submission.displayed_message =
                $scope.constructDisplayedMessage(err.message, err.line);
              submission.displayed_proof =
                $scope.displayProof($scope.proofString, err.line);

              $scope.showMessage(err.message, err.line);
              $scope.messageIsSticky = true;
            }
            if (submission.correct) {
              submission.displayed_message = '';
              submission.displayed_proof = $scope.displayProof(
                $scope.proofString);
            }
            CurrentInteractionService.onSubmit(
              submission, logicProofRulesService);
          };

          CurrentInteractionService.registerCurrentInteraction(
            $scope.submitProof);

          $scope.showHelp = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getExtensionResourceUrl(
                '/interactions/LogicProof/directives/' +
                'logic_proof_help_modal_directive.html'),
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

oppia.directive('oppiaResponseLogicProof', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/LogicProof/directives/' +
        'logic_proof_response_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
      }]
    };
  }
]);

oppia.directive('oppiaShortResponseLogicProof', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/LogicProof/directives/' +
        'logic_proof_short_response_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
      }]
    };
  }
]);

oppia.factory('logicProofRulesService', [function() {
  return {
    Correct: function(answer) {
      return answer.correct;
    },
    NotCorrect: function(answer) {
      return !answer.correct;
    },
    NotCorrectByCategory: function(answer, inputs) {
      return !answer.correct && answer.error_category === inputs.c;
    }
  };
}]);
