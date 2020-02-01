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
 * @fileoverview Directive for the LogicProof Interaction.
 */

require('interactions/codemirrorRequires.ts');

require('interactions/LogicProof/directives/logic-proof-rules.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require('services/contextual/url.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/html-escaper.service.ts');

import logicProofShared from 'interactions/LogicProof/static/js/shared.ts';
import logicProofStudent from 'interactions/LogicProof/static/js/student.ts';
import logicProofData from 'interactions/LogicProof/static/js/data.ts';
import logicProofConversion from
  'interactions/LogicProof/static/js/conversion.ts';
import LOGIC_PROOF_DEFAULT_QUESTION_DATA from
  'interactions/LogicProof/static/js/generatedDefaultData.ts';

angular.module('oppia').directive('oppiaInteractiveLogicProof', [
  'HtmlEscaperService', 'EVENT_NEW_CARD_AVAILABLE',
  function(HtmlEscaperService, EVENT_NEW_CARD_AVAILABLE) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getLastAnswer: '&lastAnswer',
      },
      template: require('./logic-proof-interaction.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$attrs', '$timeout', '$uibModal', 'LogicProofRulesService',
        'WindowDimensionsService', 'UrlService',
        'CurrentInteractionService',
        function(
            $scope, $attrs, $timeout, $uibModal, LogicProofRulesService,
            WindowDimensionsService, UrlService,
            CurrentInteractionService) {
          var ctrl = this;
          // NOTE: for information on integrating angular and code-mirror see
          // http://github.com/angular-ui/ui-codemirror
          ctrl.codeEditor = function(editor) {
            var proofString = (ctrl.interactionIsActive ?
              ctrl.localQuestionData.default_proof_string :
              ctrl.getLastAnswer().proof_string);
            editor.setValue(proofString);
            ctrl.proofString = editor.getValue();
            var cursorPosition = editor.doc.getCursor();

            editor.setOption('lineNumbers', true);
            editor.setOption('lineWrapping', true);

            // NOTE: this is necessary to avoid the textarea being greyed-out.
            // See: http://stackoverflow.com/questions/8349571 for discussion.
            $timeout(function() {
              editor.refresh();
            }, 500);

            // NOTE: we must use beforeChange rather than change here to avoid
            // an infinite loop (which code-mirror will not catch).
            editor.on('beforeChange', function(instance, change) {
              var convertedText =
              logicProofConversion.convertToLogicCharacters(
                change.text.join('\n'));
              if (convertedText !== change.text.join('\n')) {
                // We update using the converted text, then cancel its being
                // overwritten by the original text.
                editor.doc.replaceRange(
                  convertedText, change.from, change.to);
                change.cancel();
              }
            });

            editor.on('cursorActivity', function() {
              if (editor.doc.getCursor().line !== cursorPosition.line) {
                ctrl.checkForBasicErrors();
                cursorPosition = editor.doc.getCursor();
              }
            });

            // NOTE: we use change rather than beforeChange here so that
            // checking for mistakes is done with respect to the updated text.
            editor.on('change', function(instance, change) {
              ctrl.proofString = editor.getValue();
              // We update the message only if the user has added or removed a
              // line break, so that it remains while they work on a single
              // line.
              if (change.text.length > 1 || change.removed.length > 1) {
                ctrl.checkForBasicErrors();
              }
            });

            ctrl.editor = editor;
          };

          // This performs simple error checks that are done as the student
          // types rather than waiting for the proof to be submitted.
          ctrl.checkForBasicErrors = function() {
            if (!ctrl.messageIsSticky) {
              ctrl.clearMessage();
            }
            try {
              logicProofStudent.validateProof(
                ctrl.proofString, ctrl.questionInstance);
            } catch (err) {
              ctrl.clearMessage();
              ctrl.showMessage(err.message, err.line);
              ctrl.messageIsSticky = false;
            }
            // NOTE: this line is necessary to force angular to refresh the
            // displayed errorMessage.
            $scope.$apply();
          };

          ctrl.clearMessage = function() {
            if (ctrl.errorMark) {
              ctrl.errorMark.clear();
            }
            ctrl.errorMessage = '';
          };

          ctrl.showMessage = function(message, lineNum) {
            ctrl.errorMessage = ctrl.constructDisplayedMessage(
              message, lineNum);
            ctrl.errorMark = ctrl.editor.doc.markText({
              line: lineNum,
              ch: 0
            }, {
              line: lineNum,
              ch: 100
            }, {
              className: 'logic-proof-erroneous-line'
            });
          };

          ctrl.constructDisplayedMessage = function(message, lineNum) {
            return 'line ' + (lineNum + 1) + ': ' + message;
          };

          ctrl.displayProof = function(proofString, errorLineNum) {
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
          ctrl.submitProof = function() {
            ctrl.clearMessage();
            var submission = {
              assumptions_string: ctrl.assumptionsString,
              target_string: ctrl.targetString,
              proof_string: ctrl.proofString,
              proof_num_lines: ctrl.proofString.split('\n').length,
              displayed_question: ctrl.questionString,
              correct: null,
              error_category: null,
              error_code: null,
              error_message: null,
              error_line_number: null,
              displayed_message: null,
              displayed_proof: null
            };
            try {
              var proof = logicProofStudent.buildProof(
                ctrl.proofString, ctrl.questionInstance);
              logicProofStudent.checkProof(proof, ctrl.questionInstance);
              submission.correct = true;
            } catch (err) {
              submission.correct = false;
              submission.error_category = err.category;
              submission.error_code = err.code;
              submission.error_message = err.message;
              submission.error_line_number = err.line;
              submission.displayed_message =
                ctrl.constructDisplayedMessage(err.message, err.line);
              submission.displayed_proof =
                ctrl.displayProof(ctrl.proofString, err.line);

              ctrl.showMessage(err.message, err.line);
              ctrl.messageIsSticky = true;
            }
            if (submission.correct) {
              submission.displayed_message = '';
              submission.displayed_proof = ctrl.displayProof(
                ctrl.proofString);
            }
            CurrentInteractionService.onSubmit(
              submission, LogicProofRulesService);
          };
          ctrl.showHelp = function() {
            $uibModal.open({
              template: require('./logic-proof-help-modal.directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.close = function() {
                    $uibModalInstance.close();
                  };
                }
              ]
            }).result.then(function() {}, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };
          ctrl.$onInit = function() {
            $scope.$on(EVENT_NEW_CARD_AVAILABLE, function() {
              ctrl.interactionIsActive = false;
            });
            ctrl.localQuestionData = HtmlEscaperService.escapedJsonToObj(
              $attrs.questionWithValue);

            // This is the information about how to mark a question (e.g. the
            // permitted line templates) that is stored in defaultData.js within
            // the dependencies.
            ctrl.questionData = angular.copy(LOGIC_PROOF_DEFAULT_QUESTION_DATA);

            ctrl.interactionIsActive = (ctrl.getLastAnswer() === null);
            ctrl.questionData.assumptions =
              ctrl.localQuestionData.assumptions;
            ctrl.questionData.results = ctrl.localQuestionData.results;

            // Deduce the new operators, as in
            // logicProofTeacher.buildQuestion(),
            // since these are not currently stored separately for each
            // question.
            ctrl.expressions = [];
            ctrl.topTypes = [];
            for (var i = 0; i < ctrl.questionData.assumptions.length; i++) {
              ctrl.expressions.push(ctrl.questionData.assumptions[i]);
              ctrl.topTypes.push('boolean');
            }
            ctrl.expressions.push(ctrl.questionData.results[0]);
            ctrl.topTypes.push('boolean');
            ctrl.typing = logicProofShared.assignTypesToExpressionArray(
              ctrl.expressions, ctrl.topTypes,
              logicProofData.BASE_STUDENT_LANGUAGE,
              ['variable', 'constant', 'prefix_function']
            );

            ctrl.questionData.language.operators = ctrl.typing[0].operators;

            if (ctrl.questionData.assumptions.length <= 1) {
              ctrl.assumptionsString = logicProofShared.displayExpressionArray(
                ctrl.questionData.assumptions,
                ctrl.questionData.language.operators);
            } else {
              ctrl.assumptionsString = logicProofShared.displayExpressionArray(
                ctrl.questionData.assumptions.slice(
                  0, ctrl.questionData.assumptions.length - 1
                ), ctrl.questionData.language.operators
              ) + ' and ' + logicProofShared.displayExpression(
                ctrl.questionData.assumptions[
                  ctrl.questionData.assumptions.length - 1],
                ctrl.questionData.language.operators);
            }
            ctrl.targetString = logicProofShared.displayExpression(
              ctrl.questionData.results[0],
              ctrl.questionData.language.operators);
            ctrl.questionString = (
              ctrl.assumptionsString === '' ?
                'I18N_INTERACTIONS_LOGIC_PROOF_QUESTION_STR_NO_ASSUMPTION' :
                'I18N_INTERACTIONS_LOGIC_PROOF_QUESTION_STR_ASSUMPTIONS');
            ctrl.questionStringData = {
              target: ctrl.targetString,
              assumptions: ctrl.assumptionsString
            };

            ctrl.questionInstance = logicProofStudent.buildInstance(
              ctrl.questionData);
            // Denotes whether messages are in response to a submission, in
            // which
            // case they persist for longer.
            ctrl.messageIsSticky = false;

            CurrentInteractionService.registerCurrentInteraction(
              ctrl.submitProof, null);
          };
        }
      ]
    };
  }
]);
