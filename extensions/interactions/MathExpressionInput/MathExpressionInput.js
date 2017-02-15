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
  'oppiaHtmlEscaper', 'mathExpressionInputRulesService',
  function(oppiaHtmlEscaper, mathExpressionInputRulesService) {
    return {
      restrict: 'E',
      scope: {
        onSubmit: '&'
      },
      templateUrl: 'interaction/MathExpressionInput',
      controller: [
        '$scope', '$attrs', '$timeout', '$element', 'LABEL_FOR_CLEARING_FOCUS',
        function($scope, $attrs, $timeout, $element, LABEL_FOR_CLEARING_FOCUS) {
          var guppyDivElt = $element[0].querySelector('.guppy-div');
          var guppyInstance = new Guppy(guppyDivElt, {
            empty_content: (
              '\\color{grey}{\\text{\\small{Type a formula here.}}}'),
            ready_callback: function() {
              Guppy.get_symbols(
                GLOBALS.ASSET_DIR_PREFIX +
                '/assets/overrides/guppy/oppia_symbols.json');
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
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/MathExpressionInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.latexAnswer = oppiaHtmlEscaper.escapedJsonToObj(
          $attrs.answer).latex;
      }]
    };
  }
]);

oppia.directive('oppiaShortResponseMathExpressionInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'shortResponse/MathExpressionInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.latexAnswer = oppiaHtmlEscaper.escapedJsonToObj(
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
