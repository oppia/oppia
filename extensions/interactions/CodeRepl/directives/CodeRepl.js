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
 * Directive for the CodeRepl interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveCodeRepl', [
  'HtmlEscaperService', 'codeReplRulesService', 'UrlInterpolationService',
  'EVENT_NEW_CARD_AVAILABLE',
  function(
      HtmlEscaperService, codeReplRulesService, UrlInterpolationService,
      EVENT_NEW_CARD_AVAILABLE) {
    return {
      restrict: 'E',
      scope: {
        onSubmit: '&',
        getLastAnswer: '&lastAnswer',
        // This should be called whenever the answer changes.
        setAnswerValidity: '&'
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/CodeRepl/directives/' +
        'code_repl_interaction_directive.html'),
      controller: [
        '$scope', '$attrs', 'WindowDimensionsService',
        'EVENT_PROGRESS_NAV_SUBMITTED',
        function(
            $scope, $attrs, WindowDimensionsService,
            EVENT_PROGRESS_NAV_SUBMITTED) {
          $scope.interactionIsActive = ($scope.getLastAnswer() === null);

          $scope.$on(EVENT_NEW_CARD_AVAILABLE, function() {
            $scope.interactionIsActive = false;
          });
          $scope.language = HtmlEscaperService.escapedJsonToObj(
            $attrs.languageWithValue);
          $scope.placeholder = HtmlEscaperService.escapedJsonToObj(
            $attrs.placeholderWithValue);
          $scope.preCode = HtmlEscaperService.escapedJsonToObj(
            $attrs.preCodeWithValue);
          $scope.postCode = HtmlEscaperService.escapedJsonToObj(
            $attrs.postCodeWithValue);

          // Make sure $scope.preCode ends with a newline:
          if ($scope.preCode.trim().length === 0) {
            $scope.preCode = '';
          } else if ($scope.preCode.slice(-1) !== '\n') {
            $scope.preCode += '\n';
          }

          // Make sure $scope.placeholder ends with a newline.
          if ($scope.placeholder.slice(-1) !== '\n') {
            $scope.placeholder += '\n';
          }

          $scope.hasLoaded = false;

          // Keep the code string given by the user and the stdout from the
          // evaluation until sending them back to the server.
          if ($scope.interactionIsActive) {
            $scope.code = (
              $scope.preCode + $scope.placeholder + $scope.postCode);
            $scope.output = '';
          } else {
            $scope.code = $scope.getLastAnswer().code;
            $scope.output = $scope.getLastAnswer().output;
          }

          $scope.initCodeEditor = function(editor) {
            editor.setValue($scope.code);

            // Options for the ui-codemirror display.
            editor.setOption('lineNumbers', true);
            editor.setOption('indentWithTabs', true);
            editor.setOption('indentUnit', 4);
            editor.setOption('mode', 'python');
            editor.setOption('extraKeys', {
              Tab: function(cm) {
                var spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
                cm.replaceSelection(spaces);
                // Move the cursor to the end of the selection.
                var endSelectionPos = cm.getDoc().getCursor('head');
                cm.getDoc().setCursor(endSelectionPos);
              }
            });
            editor.setOption('theme', 'preview default');

            // NOTE: this is necessary to avoid the textarea being greyed-out.
            setTimeout(function() {
              editor.refresh();
              initMarkers(editor);
            }, 200);

            editor.on('change', function() {
              $scope.code = editor.getValue();
            });

            // Without this, the editor does not show up correctly on small
            // screens when the user switches to the supplemental interaction.
            $scope.$on('showInteraction', function() {
              setTimeout(function() {
                editor.refresh();
                initMarkers(editor);
              }, 200);
            });

            $scope.hasLoaded = true;
          };

          // Configure Skulpt.
          Sk.configure({
            output: function(out) {
              // This output function is called continuously throughout the
              // runtime of the script.
              $scope.output += out;
            },
            read: function(name) {
              // This function is called when a builtin module is imported
              if (Sk.builtinFiles.files[name] === undefined) {
                // If corresponding module is not present then,
                // removal of this block also results in failure of import.
                throw 'module ' + name + ' not found';
              }
              return Sk.builtinFiles.files[name];
            },
            timeoutMsg: function() {
              $scope.sendResponse('', 'timeout');
            },
            execLimit: 10000
          });

          $scope.runAndSubmitCode = function(codeInput) {
            $scope.runCode(codeInput, function(evaluation, err) {
              $scope.sendResponse(evaluation, err);
            });
          };

          $scope.$on(EVENT_PROGRESS_NAV_SUBMITTED, function() {
            $scope.runAndSubmitCode($scope.code);
          });

          $scope.runCode = function(codeInput, onFinishRunCallback) {
            $scope.code = codeInput;
            $scope.output = '';

            // Evaluate the program asynchronously using Skulpt.
            Sk.misceval.asyncToPromise(function() {
              Sk.importMainWithBody('<stdin>', false, codeInput, true);
            }).then(function() {
              // Finished evaluating.
              $scope.evaluation = '';
              $scope.fullError = '';

              if (onFinishRunCallback) {
                onFinishRunCallback('', '');
              }
            }, function(err) {
              if (!(err instanceof Sk.builtin.TimeLimitError)) {
                $scope.evaluation = '';
                $scope.fullError = String(err);

                if (onFinishRunCallback) {
                  onFinishRunCallback('', String(err));
                }
              }
            });
          };

          var initMarkers = function(editor) {
            var doc = editor.getDoc();

            // The -1 here is because prepended code ends with a newline.
            var preCodeNumLines = $scope.preCode.split('\n').length - 1;
            var postCodeNumLines = $scope.postCode.split('\n').length;
            var fullCodeNumLines = $scope.code.split('\n').length;
            var userCodeNumLines = (
              fullCodeNumLines - preCodeNumLines - postCodeNumLines);

            // Mark pre- and post- code as uneditable, and give it some styling.
            var markOptions = {
              atomic: false,
              readOnly: true,
              inclusiveLeft: true,
              inclusiveRight: true
            };

            if ($scope.preCode.length !== 0) {
              doc.markText(
                {
                  line: 0,
                  ch: 0
                },
                {
                  line: preCodeNumLines,
                  ch: 0
                },
                angular.extend({}, markOptions, {
                  inclusiveRight: false
                }));

              for (var i = 0; i < preCodeNumLines; i++) {
                editor.addLineClass(i, 'text', 'code-repl-noneditable-line');
              }
            }

            if ($scope.postCode.length !== 0) {
              doc.markText(
                {
                  line: preCodeNumLines + userCodeNumLines,
                  ch: 0
                },
                {
                  line: fullCodeNumLines,
                  ch: 0
                },
                markOptions);

              for (var i = 0; i < postCodeNumLines; i++) {
                editor.addLineClass(preCodeNumLines + userCodeNumLines + i,
                  'text', 'code-repl-noneditable-line');
              }
            }
          };

          $scope.sendResponse = function(evaluation, err) {
            $scope.onSubmit({
              answer: {
                // Replace tabs with 2 spaces.
                // TODO(sll): Change the default Python indentation to 4 spaces.
                code: $scope.code.replace(/\t/g, '  ') || '',
                output: $scope.output,
                evaluation: $scope.evaluation,
                error: (err || '')
              },
              rulesService: codeReplRulesService
            });

            // Without this, the error message displayed in the user-facing
            // console will sometimes not update.
            $scope.$apply();
          };
        }
      ]
    };
  }
]);

oppia.directive('oppiaResponseCodeRepl', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/CodeRepl/directives/' +
        'code_repl_response_directive.html'),
      controller: [
        '$scope', '$attrs', 'FocusManagerService',
        function($scope, $attrs, FocusManagerService) {
          $scope.answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);

          if ($scope.answer.error) {
            $scope.errorFocusLabel = FocusManagerService.generateFocusLabel();
            FocusManagerService.setFocus($scope.errorFocusLabel);
          }
        }
      ]
    };
  }
]);

oppia.directive('oppiaShortResponseCodeRepl', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/CodeRepl/directives/' +
        'code_repl_short_response_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
      }]
    };
  }
]);

oppia.factory('codeReplRulesService', [
  '$filter', 'CodeNormalizerService',
  function($filter, CodeNormalizerService) {
    return {
      CodeEquals: function(answer, inputs) {
        var normalizedCode =
          CodeNormalizerService.getNormalizedCode(answer.code);
        var normalizedExpectedCode =
          CodeNormalizerService.getNormalizedCode(inputs.x);
        return normalizedCode === normalizedExpectedCode;
      },
      CodeContains: function(answer, inputs) {
        var normalizedCode =
          CodeNormalizerService.getNormalizedCode(answer.code);
        var normalizedSnippet =
          CodeNormalizerService.getNormalizedCode(inputs.x);
        return normalizedCode.indexOf(normalizedSnippet) !== -1;
      },
      CodeDoesNotContain: function(answer, inputs) {
        var normalizedCode =
          CodeNormalizerService.getNormalizedCode(answer.code);
        var normalizedSnippet =
          CodeNormalizerService.getNormalizedCode(inputs.x);
        return normalizedCode.indexOf(normalizedSnippet) === -1;
      },
      OutputContains: function(answer, inputs) {
        var normalizedOutput = $filter('normalizeWhitespace')(answer.output);
        var normalizedSnippet = $filter('normalizeWhitespace')(inputs.x);
        return normalizedOutput.indexOf(normalizedSnippet) !== -1;
      },
      OutputEquals: function(answer, inputs) {
        var normalizedOutput = $filter('normalizeWhitespace')(answer.output);
        var normalizedExpectedOutput =
          $filter('normalizeWhitespace')(inputs.x);
        return normalizedOutput === normalizedExpectedOutput;
      },
      ResultsInError: function(answer) {
        return !!(answer.error.trim());
      },
      ErrorContains: function(answer, inputs) {
        var normalizedError = $filter('normalizeWhitespace')(answer.error);
        var normalizedSnippet = $filter('normalizeWhitespace')(inputs.x);
        return normalizedError.indexOf(normalizedSnippet) !== -1;
      }
    };
  }
]);
