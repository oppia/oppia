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
 * @fileoverview Directive for the MathExpressionInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('domain/utilities/url-interpolation.service.ts');
require(
  'interactions/MathExpressionInput/directives/' +
  'math-expression-input-rules.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require('services/contextual/device-info.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/debouncer.service.ts');
require('services/html-escaper.service.ts');

angular.module('oppia').directive('oppiaInteractiveMathExpressionInput', [
  '$timeout', 'MathExpressionInputRulesService',
  'UrlInterpolationService',
  function(
      $timeout, MathExpressionInputRulesService,
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./math-expression-input-interaction.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$attrs', '$element', 'LABEL_FOR_CLEARING_FOCUS',
        'DebouncerService', 'DeviceInfoService', 'WindowDimensionsService',
        'CurrentInteractionService',
        function(
            $scope, $attrs, $element, LABEL_FOR_CLEARING_FOCUS,
            DebouncerService, DeviceInfoService, WindowDimensionsService,
            CurrentInteractionService) {
          var ctrl = this;
          var guppyDivElt, guppyDivId, guppyInstance: Guppy;
          var oppiaSymbolsUrl = UrlInterpolationService.getStaticAssetUrl(
            '/overrides/guppy/oppia_symbols.json');
          var labelForFocusTarget = $attrs.labelForFocusTarget || null;
          var answer = {
            ascii: '',
            latex: ''
          };

          /**
           * Adds a button overlay and invisible text field used to bring up
           * the keyboard on mobile devices.
           *
           * TODO(Oishikatta): On iOS/Safari, keyboard may only appear on first
           * press. This may not be a significant issue as the
           * MathExpressionInput is recreated if the given answer is incorrect.
           */
          var makeGuppyMobileFriendly = function() {
            /**
             * Checks if the guppy div has a width and height greater than 0,
             * if not schedules a timeout to run again after 100ms. If the
             * guppy div has a valid width/height, position the invisible
             * button directly over the guppy div. For mobile browsers, focus()
             * can only be called from within an onclick handler. Using a form
             * element was more reliable than attaching the handler to the
             * guppy div directly.
             */
            var positionButtonOverlay = function() {
              var guppyOffset = $(guppyDivElt).position();
              var guppySize = guppyDivElt.getBoundingClientRect();

              // If the guppy div hasn't rendered yet, retry after 100ms.
              if (guppySize.width === 0 || guppySize.height === 0) {
                $timeout(positionButtonOverlay, 100);
              } else {
                $('#startMathInputButton').css({
                  top: guppyOffset.top,
                  left: guppyOffset.left,
                  width: guppySize.width,
                  height: guppySize.height
                });
              }
            };
            positionButtonOverlay();

            // The focus() call must be in a click event handler and on a text
            // field to make the mobile keyboard appear.
            ctrl.startMobileMathInput = function() {
              guppyInstance.activate();

              var fakeInputElement = document.querySelector(
                '#fakeInputForMathExpression');
              (<HTMLInputElement>fakeInputElement).focus();

              // Place the cursor at the end of the text input, so that the
              // user can use backspace to delete.
              (<HTMLInputElement>fakeInputElement).setSelectionRange(
                (<HTMLInputElement>fakeInputElement).value.length,
                (<HTMLInputElement>fakeInputElement).value.length);
            };

            var setGuppyContentFromInput = function() {
              // Clear the Guppy instance by setting its content to the
              // output of get_content when empty.
              guppyInstance.import_xml('<m><e></e></m>');
              guppyInstance.render(true);

              // Get content of the text input field as an array of characters.
              var textContent = (<HTMLInputElement>document
                .querySelector('#fakeInputForMathExpression')).value
                .toLowerCase().split('');

              // Replay key combination for each character on the document.
              for (var i = 0; i < textContent.length; i++) {
                // If the character is a space, send a 'right' to enable mobile
                // users to complete expressions without arrow keys.
                if (textContent[i] === ' ') {
                  Mousetrap.trigger('right');
                } else {
                  Mousetrap.trigger(textContent[i]);
                }
              }
            };

            // Debounce clear/refill cycles to 1 per 100ms.
            $('#fakeInputForMathExpression').on(
              'input change compositionupdate keydown',
              DebouncerService.debounce(function() {
                setGuppyContentFromInput();
              }, 100)
            ).on('blur', function() {
              guppyInstance.activate();
              setGuppyContentFromInput();
            });
          };

          ctrl.isCurrentAnswerValid = function() {
            var latexAnswer = guppyInstance.latex();
            try {
              MathExpression.fromLatex(latexAnswer);
            } catch (e) {
              return false;
            }

            return true;
          };

          ctrl.submitAnswer = function() {
            if (!ctrl.isCurrentAnswerValid()) {
              return;
            }
            answer.latex = guppyInstance.latex();
            answer.ascii = guppyInstance.text();
            CurrentInteractionService.onSubmit(
              answer, MathExpressionInputRulesService);
          };
          ctrl.$onInit = function() {
            guppyDivElt = $element[0].querySelector('.guppy-div');

            // Dynamically assigns a unique id to the guppy-div
            guppyDivElt.setAttribute(
              'id', 'guppy_' + Math.floor(Math.random() * 100000000));
            guppyDivId = guppyDivElt.id;
            guppyInstance = new Guppy(guppyDivId, {
              settings: {
                empty_content: (
                  '\\color{grey}{\\text{\\small{Type a formula here.}}}'),
                buttons: []
              },
              events: {
                ready: function() {
                  if (DeviceInfoService.isMobileUserAgent() &&
                    DeviceInfoService.hasTouchEvents()) {
                    ctrl.mobileOverlayIsShown = true;
                    // Wait for the scope change to apply. Since we interact
                    // with the DOM elements, they need to be added by angular
                    // before the function is called. Timeout of 0 to wait
                    // until the end of the current digest cycle,
                    // false to not start a new digest cycle.
                    // A new cycle is not needed since no angular variables
                    // are changed within the function.
                    $timeout(makeGuppyMobileFriendly, 0, false);
                  }
                }
              }
            });
            guppyInstance.event('change', (e) => {
              // Need to manually trigger the digest cycle
              // to make any 'watchers' aware of changes in answer.
              $scope.$apply();
            });
            guppyInstance.event('done', (e) => {
              ctrl.submitAnswer();
            });

            if (angular.equals(Guppy.Symbols.symbols, {})) {
              Guppy.init({
                symbols: ['/third_party/static/guppy-175999/sym/symbols.json',
                  oppiaSymbolsUrl]});
            }
            guppyInstance.render();
            CurrentInteractionService.registerCurrentInteraction(
              ctrl.submitAnswer, ctrl.isCurrentAnswerValid);
            $scope.$on('focusOn', function(e, name) {
              if (!labelForFocusTarget) {
                return;
              }

              if (name === labelForFocusTarget) {
                guppyInstance.activate();
              } else if (name === LABEL_FOR_CLEARING_FOCUS) {
                guppyInstance.deactivate();
              }
            });
          };
        }
      ]
    };
  }
]);
