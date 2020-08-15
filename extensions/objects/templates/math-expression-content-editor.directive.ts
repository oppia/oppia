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
require('services/image-upload-helper.service.ts');
require('services/alerts.service.ts');
require('pages/exploration-editor-page/services/exploration-save.service.ts');

import { Subscription } from 'rxjs';

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

angular.module('oppia').directive('mathExpressionContentEditor', [
  'AlertsService', 'ImageUploadHelperService',
  function(AlertsService, ImageUploadHelperService) {
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
        ctrl.directiveSubscriptions = new Subscription();
        // TODO(#10197): Upgrade to MathJax 3, after proper investigation
        // and testing. MathJax 3 provides a faster and more cleaner way to
        // convert a LaTeX string to an SVG.
        var convertLatexStringToSvg = function(inputLatexString) {
          var emptyDiv = document.createElement('div');
          var outputElement = angular.element(emptyDiv);
          // We need to append the element with a script tag so that Mathjax
          // can typeset and convert this element. The typesetting is not
          // possible if we don't add a script tag. The code below is similar
          // to how the math equations are rendered in the mathjaxBind
          // directive (see mathjax-bind.directive.ts).
          var $script = angular.element(
            '<script type="math/tex">'
          ).html(inputLatexString === undefined ? '' : inputLatexString);
          outputElement.html('');
          outputElement.append($script);
          // Naturally MathJax works asynchronously, but we can add processes
          // which we want to happen synchronously into the MathJax Hub Queue.
          MathJax.Hub.Queue(['Typeset', MathJax.Hub, outputElement[0]]);
          MathJax.Hub.Queue(function() {
            if (outputElement[0].getElementsByTagName('svg')[0] !== undefined) {
              ctrl.svgString = (
                outputElement[0].getElementsByTagName('svg')[0].outerHTML);
            }
            ctrl.value.mathExpressionSvgIsBeingProcessed = false;
            $scope.$apply();
          });
        };
        // This method cleans the SVG string and generates a filename before
        // the SVG can be saved to the backend in the RteHelperModalController.
        // The method doesn't save the SVG to the backend, it just updates
        // svgFile field in the ctrl.value passed to it and the
        // RteHelperModalController will handle the saving of the file to the
        // backend.
        var processAndSaveSvg = function() {
          var cleanedSvgString = (
            ImageUploadHelperService.cleanMathExpressionSvgString(
              ctrl.svgString));
          var dimensions = (
            ImageUploadHelperService.
              extractDimensionsFromMathExpressionSvgString(cleanedSvgString));
          var fileName = (
            ImageUploadHelperService.generateMathExpressionImageFilename(
              dimensions.height, dimensions.width, dimensions.verticalPadding));
          // We need use unescape and encodeURIComponent in order to
          // handle the case when SVGs have non-ascii unicode characters.
          var dataURI = (
            'data:image/svg+xml;base64,' +
            btoa(unescape(encodeURIComponent(cleanedSvgString))));
          var invalidTagsAndAttributes = (
            ImageUploadHelperService.getInvalidSvgTagsAndAttrs(dataURI));
          var tags = invalidTagsAndAttributes.tags;
          var attrs = invalidTagsAndAttributes.attrs;
          if (tags.length === 0 && attrs.length === 0) {
            ctrl.value.svgFile = dataURI;
            ctrl.value.svg_filename = fileName;
          } else {
            ctrl.value.raw_latex = '';
            ctrl.value.svg_filename = '';
            AlertsService.addWarning('SVG failed validation.');
          }
        };

        ctrl.$onInit = function() {
          // Reset the component each time the value changes (e.g. if this is
          // part of an editable list).
          ctrl.svgString = '';
          $scope.$watch('$ctrl.value', function() {
            ctrl.localValue = {
              label: ctrl.value.raw_latex || '',
            };
          }, true);
          ctrl.directiveSubscriptions.add(
            ExplorationSaveService.onExternalSave.subscribe(() => {
              processAndSaveSvg();
              if (ctrl.active) {
                ctrl.replaceValue(ctrl.localValue.label);
                // The $scope.$apply() call is needed to propagate the replaced
                // value.
                $scope.$apply();
              }
            })
          );
          ctrl.placeholderText = '\\frac{x}{y}';
          ctrl.alwaysEditable = ctrl.getAlwaysEditable();

          if (ctrl.alwaysEditable) {
            $scope.$watch('$ctrl.localValue.label', function(newValue) {
              ctrl.value.mathExpressionSvgIsBeingProcessed = true;
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
        ctrl.$onDestroy = function() {
          ctrl.directiveSubscriptions.unsubscribe();
        };
      }]
    };
  }
]);
