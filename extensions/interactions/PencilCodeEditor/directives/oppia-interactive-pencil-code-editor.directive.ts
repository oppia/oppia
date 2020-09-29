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
 * @fileoverview Directive for the PencilCodeEditor interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require(
  'interactions/PencilCodeEditor/directives/' +
  'pencil-code-editor-rules.service.ts');
require('services/contextual/window-dimensions.service.ts');
require(
  'interactions/interaction-attributes-extractor.service.ts');
require('services/stateful/focus-manager.service.ts');
require('pages/exploration-player-page/services/player-position.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('oppiaInteractivePencilCodeEditor', [
  '$timeout', 'InteractionAttributesExtractorService', 'PlayerPositionService',
  function(
      $timeout, InteractionAttributesExtractorService, PlayerPositionService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getLastAnswer: '&lastAnswer'
      },
      template: require('./pencil-code-editor-interaction.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$attrs', '$element', '$uibModal', 'CurrentInteractionService',
        'FocusManagerService', 'PencilCodeEditorRulesService',
        function(
            $attrs, $element, $uibModal, CurrentInteractionService,
            FocusManagerService, PencilCodeEditorRulesService) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          var iframeDiv, pce;
          ctrl.reset = function() {
            $uibModal.open({
              template: require(
                './pencil-code-reset-confirmation.directive.html'),
              backdrop: 'static',
              keyboard: false,
              controller: 'ConfirmOrCancelModalController'
            }).result.then(function() {
              pce.setCode(ctrl.initialCode);
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          var getNormalizedCode = function() {
            // Converts tabs to spaces.
            return pce.getCode().replace(/\t/g, '  ');
          };
          ctrl.$onInit = function() {
            ctrl.directiveSubscriptions.add(
              PlayerPositionService.onNewCardAvailable.subscribe(
                () => {
                  ctrl.interactionIsActive = false;
                  pce.hideMiddleButton();
                  pce.hideToggleButton();
                  pce.setReadOnly();
                }
              )
            );
            iframeDiv = $element.find('.pencil-code-editor-iframe').get(0);
            pce = new PencilCodeEmbed(iframeDiv);
            ctrl.interactionIsActive = (ctrl.getLastAnswer() === null);

            const {
              initialCode
            } = InteractionAttributesExtractorService.getValuesFromAttributes(
              'PencilCodeEditor',
              $attrs
            );
            ctrl.initialCode = ctrl.interactionIsActive ?
              initialCode :
              ctrl.getLastAnswer().code;

            pce.beginLoad(ctrl.initialCode);
            pce.on('load', function() {
              // Hides the error console at the bottom right, and prevents it
              // from showing up even if the code has an error. Also, hides the
              // turtle, and redefines say() to also write the text on the
              // screen.
              pce.setupScript([{
                code: [
                  'window.onerror = function() {',
                  '  return true;',
                  '};',
                  'debug.hide();',
                  'window.removeEventListener("error", debug)',
                  '',
                  'ht();',
                  '',
                  'oldsay = window.say',
                  'say = function(x) {',
                  '  write(x);',
                  '  oldsay(x);',
                  '};'
                ].join('\n'),
                type: 'text/javascript'
              }]);

              pce.showEditor();
              pce.hideToggleButton();
              if (ctrl.interactionIsActive) {
                pce.setEditable();
              } else {
                pce.hideMiddleButton();
                pce.setReadOnly();
              }

              // Pencil Code automatically takes the focus on load, so we clear
              // it.
              FocusManagerService.clearFocus();
            });

            var errorIsHappening = false;
            var hasSubmittedAnswer = false;

            pce.on('startExecute', function() {
              hasSubmittedAnswer = false;
            });

            pce.on('execute', function() {
              if (errorIsHappening || hasSubmittedAnswer) {
                return;
              }
              // The first argument in the method below gets executed in the
              // pencilcode output-frame iframe context. The code input by the
              // user is sanitized by pencilcode so there is no security
              // issue in this case.
              pce.eval(
                'document.body.innerHTML', // disable-bad-pattern-check
                function(pencilCodeHtml) {
                  var normalizedCode = getNormalizedCode();

                  // Get all the divs, and extract their textual content.
                  var output = $.map(
                    $(pencilCodeHtml).filter('div'), function(elem) {
                      return $(elem).text();
                    }).join('\n');

                  hasSubmittedAnswer = true;
                  CurrentInteractionService.onSubmit({
                    code: normalizedCode,
                    output: output || '',
                    evaluation: '',
                    error: ''
                  }, PencilCodeEditorRulesService);
                }, true);
            });

            pce.on('error', function(error) {
              if (hasSubmittedAnswer) {
                return;
              }

              var normalizedCode = getNormalizedCode();

              errorIsHappening = true;
              hasSubmittedAnswer = true;

              CurrentInteractionService.onSubmit({
                code: normalizedCode,
                output: '',
                evaluation: '',
                error: error.message
              }, PencilCodeEditorRulesService);

              $timeout(function() {
                errorIsHappening = false;
              }, 1000);
            });

            CurrentInteractionService.registerCurrentInteraction(null, null);
          };
          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }
]);
