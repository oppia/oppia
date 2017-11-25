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
 * Directive for the MathExpressionInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveMathExpressionInput', [
  'HtmlEscaperService', 'mathExpressionInputRulesService',
  function(HtmlEscaperService, mathExpressionInputRulesService) {
    return {
      restrict: 'E',
      scope: {
        onSubmit: '&'
      },
      templateUrl: 'interaction/MathExpressionInput',
      controller: [
        '$scope', '$attrs', '$timeout', '$element', 'LABEL_FOR_CLEARING_FOCUS',
        'DebouncerService', 'DeviceInfoService',
        function($scope, $attrs, $timeout, $element, LABEL_FOR_CLEARING_FOCUS,
          DebouncerService, DeviceInfoService) {
          var guppyDivElt = $element[0].querySelector('.guppy-div');

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
            $scope.startMobileMathInput = function() {
              guppyInstance.activate();

              var fakeInputElement = document.querySelector(
                '#fakeInputForMathExpression');
              fakeInputElement.focus();

              // Place the cursor at the end of the text input, so that the
              // user can use backspace to delete.
              fakeInputElement.setSelectionRange(
                fakeInputElement.value.length, fakeInputElement.value.length);
            };

            var setGuppyContentFromInput = function() {
              // Clear the Guppy instance by setting its content to the
              // output of get_content when empty.
              guppyInstance.set_content('<m><e></e></m>');
              guppyInstance.render(true);

              // Get content of the text input field as an array of characters.
              var textContent = document
                .querySelector('#fakeInputForMathExpression').value
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

          var guppyInstance = new Guppy(guppyDivElt, {
            empty_content: (
              '\\color{grey}{\\text{\\small{Type a formula here.}}}'),
            ready_callback: function() {
              Guppy.get_symbols(
                GLOBALS.ASSET_DIR_PREFIX +
                '/assets/overrides/guppy/oppia_symbols.json');

              if (DeviceInfoService.isMobileUserAgent() &&
                DeviceInfoService.hasTouchEvents()) {
                $scope.mobileOverlayIsShown = true;
                // Wait for the scope change to apply. Since we interact with
                // the DOM elements, they need to be added by angular before
                // the function is called. Timeout of 0 to wait until the end
                // of the current digest cycle, false to not start a new digest
                // cycle. A new cycle is not needed since no angular variables
                // are changed within the function.
                $timeout(makeGuppyMobileFriendly, 0, false);
              }
            }
          });
          var guppyDivId = guppyInstance.editor.id;

          var labelForFocusTarget = $attrs.labelForFocusTarget || null;

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

          guppyInstance.done_callback = function() {
            $scope.submitAnswer();
          };

          var answer = {
            ascii: '',
            latex: ''
          };

          $scope.isCurrentAnswerValid = function() {
            var latexAnswer = Guppy.instances[guppyDivId].get_content('latex');
            try {
              MathExpression.fromLatex(answer.latex);
            } catch (e) {
              return false;
            }

            return true;
          };

          $scope.submitAnswer = function() {
            answer.ascii = Guppy.instances[guppyDivId].get_content('text');
            answer.latex = Guppy.instances[guppyDivId].get_content('latex');

            if (!$scope.isCurrentAnswerValid()) {
              return;
            }

            $scope.onSubmit({
              answer: answer,
              rulesService: mathExpressionInputRulesService
            });
          };
        }
      ]
    };
  }
]);

oppia.directive('oppiaResponseMathExpressionInput', [
  'HtmlEscaperService', function(HtmlEscaperService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/MathExpressionInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.latexAnswer = HtmlEscaperService.escapedJsonToObj(
          $attrs.answer).latex;
      }]
    };
  }
]);

oppia.directive('oppiaShortResponseMathExpressionInput', [
  'HtmlEscaperService', function(HtmlEscaperService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'shortResponse/MathExpressionInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.latexAnswer = HtmlEscaperService.escapedJsonToObj(
          $attrs.answer).latex;
      }]
    };
  }
]);

oppia.factory('mathExpressionInputRulesService', [function() {
  return {
    IsMathematicallyEquivalentTo: function(answer, inputs) {
      return (
        MathExpression.fromLatex(answer.latex).equals(
          MathExpression.fromLatex(inputs.x)));
    }
  };
}]);
