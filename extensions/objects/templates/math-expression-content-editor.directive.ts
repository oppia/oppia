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
 * @fileoverview Directive for math expression content editor.
 */
require('mathjaxConfig.ts');
require('directives/mathjax-bind.directive.ts');

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

angular.module('oppia').directive('mathExpressionContentEditor', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getAlwaysEditable: '&',
        value: '='
      },
      template: require('./math-expression-content-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$scope', function($scope) {
        var ctrl = this;
        var convertLatexStringToSvg = function(inputLatexString) {
          var emptyDiv = document.createElement("div");
          var outputElement = angular.element(emptyDiv);
          var $script = angular.element(
            '<script type="math/tex">'
          ).html(inputLatexString === undefined ? '' : inputLatexString);
          console.log("in convertLatexStringToSvg")
          outputElement.html('');
          outputElement.append($script);
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, outputElement[0]]);
          MathJax.Hub.Queue(function() {
            ctrl.svgString = outputElement[0].getElementsByTagName('span')[0].innerHTML;
            // console.log("svgString")
            // console.log(ctrl.svgString)
          });
        }
        
        ctrl.$onInit = function() {
          // Reset the component each time the value changes (e.g. if this is
          // part of an editable list).
          ctrl.svgString = '';
          $scope.$watch('$ctrl.value', function() {
            ctrl.localValue = {
              label: ctrl.value.raw_latex || '',
            };
          }, true);
          $scope.$on('externalSave', function() {
             console.log("svgString in externalSave")
             console.log(ctrl.svgString)

            if (ctrl.active) {
              ctrl.replaceValue(ctrl.localValue.label);
              // The $scope.$apply() call is needed to propagate the replaced
              // value.
              $scope.$apply();
              console.log("svgString in active")
              console.log(ctrl.svgString)

            }
          });
          ctrl.placeholderText = '\\frac{x}{y}';
          ctrl.alwaysEditable = ctrl.getAlwaysEditable();
          console.log("alwaysEditable")
          console.log(ctrl.alwaysEditable)

          if (ctrl.alwaysEditable) {

            $scope.$watch('$ctrl.localValue.label', function(newValue) {

              ctrl.value.raw_latex = newValue;
              convertLatexStringToSvg(ctrl.localValue.label);
            });
          } else {
            ctrl.openEditor = function() {
              ctrl.active = true;
            };

            ctrl.closeEditor = function() {
              ctrl.active = false;
            };

            ctrl.replaceValue = function(newValue) {
              ctrl.localValue = {
                label: newValue
              };
              ctrl.value.raw_latex = newValue;
              ctrl.closeEditor();
            };

            ctrl.closeEditor();
          }
        };
      }]
    };
  }
]);
