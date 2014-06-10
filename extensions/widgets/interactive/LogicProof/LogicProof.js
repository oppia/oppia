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
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {

    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interactiveWidget/LogicProof',
      controller: ['$scope', '$attrs', '$modal', function($scope, $attrs, $modal) {

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
        $scope.haveErrorMessage = false;

        // NOTE: for information on integrating angular and code-mirror see
        // http://github.com/angular-ui/ui-codemirror
        $scope.codeEditor = function(editor) {
          editor.setValue($scope.localQuestionData.default_proof_string)
          $scope.proofString = editor.getValue();
          var cursorPosition = editor.doc.getCursor();

          editor.setOption('lineNumbers', true);
          editor.setOption('indentWithTabs', true);
          editor.setOption('lineWrapping', true);

          // NOTE: this is necessary to avoid the textarea being greyed-out. See
          // http://stackoverflow.com/questions/8349571/codemirror-editor-is-not-loading-content-until-clicked
          // for discussion.
          setTimeout(function() {
            editor.refresh();
          }, 200);          

          // NOTE: we must use beforeChange rather than change here to avoid an
          // infinite loop (which code-mirror will not catch).
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
              $scope.refreshMessages(editor);
              cursorPosition = editor.doc.getCursor();
            }
          })

          // NOTE: we use change rather than beforeChange here so that checking
          // for mistakes is done with respect to the updated text.
          editor.on('change', function(instance, change) {
            $scope.proofString = editor.getValue();
            // We update the message only if the user has added or removed a
            // line break, so that it remains while they work on a single line.
            if (change.text.length > 1 || change.removed.length > 1) {
              $scope.refreshMessages(editor);
            }
          });
        };

        $scope.refreshMessages = function(editor) {
          if($scope.mistakeMark) {
            $scope.mistakeMark.clear();
          }
          try {
            logicProofStudent.validateProof($scope.proofString, $scope.questionInstance);
            $scope.proofError = '';
          } catch(err) {
            $scope.proofError = $scope.displayMessage(err.message, err.line);
            $scope.mistakeMark = editor.doc.markText(
              {line: err.line, ch: 0}, 
              {line: err.line, ch: 100}, 
              {className: 'erroneous-line'});
          }
          // NOTE: this line is necessary to force angular to refresh the
          // displayed proofError.
          $scope.$apply();
        };

        $scope.displayMessage = function(message, lineNumber) {
          return 'line ' + (lineNumber + 1) + ': ' + message;
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
              numberedLines.slice(errorLineNum + 1, numberedLines.length).join('\n')
            ];
        };

        // NOTE: proof_num_lines, displayed_question and displayed_proof are only computed here
        // because response.html needs them and does not have its own
        // javascript.
        $scope.submitProof = function() {
          var success = true;
          try {
            var proof = logicProofStudent.buildProof($scope.proofString, $scope.questionInstance);
            logicProofStudent.checkProof(proof, $scope.questionInstance);
          } catch (err) {
            var success = false;
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
              displayed_message: $scope.displayMessage(err.message, err.line),
              displayed_proof: $scope.displayProof($scope.proofString, err.line)
            }, 'submit');
          }
          if (success) {
            $scope.$parent.$parent.submitAnswer({
              assumptions_string: $scope.assumptionsString,
              target_string: $scope.targetString,
              proof_string: $scope.proofString,
              proof_num_lines: proof.lines.length,
              correct: true,
              displayed_question: $scope.questionString,
              displayed_message: '',
              displayed_proof: $scope.displayProof($scope.proofString)
            }, 'submit');
          }
        };
        $scope.showHelp = function() {
          $modal.open({
            templateUrl: 'modals/logicProofHelp',
            backdrop: 'static',
            controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
                $scope.close = function() {
                  $modalInstance.close();
                };
              }
            ]
          }).result.then(function() {});
        };
      }]
    };
  }
]);