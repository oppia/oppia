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
 * @fileoverview Directive for the CodeRepl interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('third-party-imports/ui-codemirror.import.ts');

require('interactions/CodeRepl/directives/code-repl-rules.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require(
  'interactions/interaction-attributes-extractor.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('pages/exploration-player-page/services/player-position.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('oppiaInteractiveCodeRepl', [
  '$timeout', 'CodeReplRulesService', 'InteractionAttributesExtractorService',
  'PlayerPositionService',
  function(
      $timeout, CodeReplRulesService, InteractionAttributesExtractorService,
      PlayerPositionService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getLastAnswer: '&lastAnswer',
      },
      template: require('./code-repl-interaction.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$attrs', 'WindowDimensionsService',
        'CurrentInteractionService',
        function(
            $scope, $attrs, WindowDimensionsService,
            CurrentInteractionService) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          ctrl.initCodeEditor = function(editor) {
            editor.setValue(ctrl.code);
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
            $timeout(function() {
              editor.refresh();
              initMarkers(editor);
            }, 200);

            editor.on('change', function() {
              ctrl.code = editor.getValue();
            });

            ctrl.hasLoaded = true;
          };
          ctrl.runAndSubmitCode = function(codeInput) {
            ctrl.runCode(codeInput, function(evaluation, err) {
              ctrl.sendResponse(evaluation, err);
            });
          };

          var submitAnswer = function() {
            ctrl.runAndSubmitCode(ctrl.code);
          };

          ctrl.runCode = function(codeInput, onFinishRunCallback) {
            ctrl.code = codeInput;
            ctrl.output = '';

            // Evaluate the program asynchronously using Skulpt.
            Sk.misceval.asyncToPromise(function() {
              Sk.importMainWithBody('<stdin>', false, codeInput, true);
            }).then(function() {
              // Finished evaluating.
              ctrl.evaluation = '';
              ctrl.fullError = '';

              if (onFinishRunCallback) {
                onFinishRunCallback('', '');
              }
            }, function(err) {
              if (!(err instanceof Sk.builtin.TimeLimitError)) {
                ctrl.evaluation = '';
                ctrl.fullError = String(err);

                if (onFinishRunCallback) {
                  onFinishRunCallback('', String(err));
                }
              }
            });
          };

          var initMarkers = function(editor) {
            var doc = editor.getDoc();

            // The -1 here is because prepended code ends with a newline.
            var preCodeNumLines = ctrl.preCode.split('\n').length - 1;
            var postCodeNumLines = ctrl.postCode.split('\n').length;
            var fullCodeNumLines = ctrl.code.split('\n').length;
            var userCodeNumLines = (
              fullCodeNumLines - preCodeNumLines - postCodeNumLines);

            // Mark pre- and post- code as uneditable, and give it some styling.
            var markOptions = {
              atomic: false,
              readOnly: true,
              inclusiveLeft: true,
              inclusiveRight: true
            };

            if (ctrl.preCode.length !== 0) {
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

            if (ctrl.postCode.length !== 0) {
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

          ctrl.sendResponse = function(evaluation, err) {
            CurrentInteractionService.onSubmit({
              // Replace tabs with 2 spaces.
              // TODO(sll): Change the default Python indentation to 4 spaces.
              code: ctrl.code.replace(/\t/g, '  ') || '',
              output: ctrl.output,
              evaluation: ctrl.evaluation,
              error: (err || '')
            }, CodeReplRulesService);

            // Without this, the error message displayed in the user-facing
            // console will sometimes not update.
            $scope.$apply();
          };
          ctrl.$onInit = function() {
            ctrl.directiveSubscriptions.add(
              PlayerPositionService.onNewCardAvailable.subscribe(
                () => ctrl.interactionIsActive = false
              )
            );
            const {
              language,
              placeholder,
              preCode,
              postCode
            } = InteractionAttributesExtractorService.getValuesFromAttributes(
              'CodeRepl',
              $attrs
            );
            ctrl.interactionIsActive = (ctrl.getLastAnswer() === null);
            ctrl.language = language;
            ctrl.placeholder = placeholder;
            ctrl.preCode = preCode;
            ctrl.postCode = postCode;

            // Make sure ctrl.preCode ends with a newline.
            if (ctrl.preCode.trim().length === 0) {
              ctrl.preCode = '';
            } else if (ctrl.preCode.slice(-1) !== '\n') {
              ctrl.preCode += '\n';
            }

            // Make sure ctrl.placeholder ends with a newline.
            if (ctrl.placeholder.slice(-1) !== '\n') {
              ctrl.placeholder += '\n';
            }

            ctrl.hasLoaded = false;

            // Keep the code string given by the user and the stdout from the
            // evaluation until sending them back to the server.
            if (ctrl.interactionIsActive) {
              ctrl.code = (
                ctrl.preCode + ctrl.placeholder + ctrl.postCode);
              ctrl.output = '';
            } else {
              ctrl.code = ctrl.getLastAnswer().code;
              ctrl.output = ctrl.getLastAnswer().output;
            }

            // Configure Skulpt.
            Sk.configure({
              output: function(out) {
                // This output function is called continuously throughout the
                // runtime of the script.
                ctrl.output += out;
              },
              read: function(name) {
                // This function is called when a builtin module is imported.
                if (Sk.builtinFiles.files[name] === undefined) {
                  // If corresponding module is not present then,
                  // removal of this block also results in failure of import.
                  throw new Error('module ' + name + ' not found');
                }
                return Sk.builtinFiles.files[name];
              },
              timeoutMsg: function() {
                ctrl.sendResponse('', 'timeout');
              },
              execLimit: 10000
            });

            CurrentInteractionService.registerCurrentInteraction(
              submitAnswer, null);
          };
          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }
]);
