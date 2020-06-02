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
require('services/context.service.ts');
require('services/alerts.service.ts');
require('services/csrf-token.service.ts');
require('domain/utilities/url-interpolation.service.ts');


// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

angular.module('oppia').directive('mathExpressionContentEditor', [
  'AlertsService', 'ContextService', 'CsrfTokenService',
  'ImageUploadHelperService', 'UrlInterpolationService',
  function(AlertsService, ContextService, CsrfTokenService,
      ImageUploadHelperService, UrlInterpolationService) {
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
          var emptyDiv = document.createElement('div');
          var outputElement = angular.element(emptyDiv);
          var $script = angular.element(
            '<script type="math/tex">'
          ).html(inputLatexString === undefined ? '' : inputLatexString);
          outputElement.html('');
          outputElement.append($script);
          MathJax.Hub.Queue(['Typeset', MathJax.Hub, outputElement[0]]);
          MathJax.Hub.Queue(function() {
            ctrl.svgString = (
              outputElement[0].getElementsByTagName('span')[0].outerHTML);
          });
        };

        var processAndSaveSvg = function() {
          var cleanedSvgString = (
            ImageUploadHelperService.cleanMathExpressionSvgString(
              ctrl.svgString));
          ctrl.value.svgString = cleanedSvgString;
          var dimensions = (
            ImageUploadHelperService.
              extractDimensionsFromMathExpressionSvgString(cleanedSvgString));
          var fileName = (
            ImageUploadHelperService.generateMathExpressionImageFilename(
              dimensions.height, dimensions.width, dimensions.verticalPadding));
          ctrl.value.svg_filename = fileName;
          let resampledFile ;
          var dataURI = 'data:image/svg+xml;base64,' + btoa(cleanedSvgString);
          var invalidTagsAndAttributes = (
            ImageUploadHelperService.getInvalidSvgTagsAndAttrs(
              dataURI));
          var tags = invalidTagsAndAttributes.tags;
          var attrs = invalidTagsAndAttributes.attrs;
          if (tags.length === 0 && attrs.length === 0) {
            resampledFile = (
              ImageUploadHelperService.convertImageDataToImageFile(
                dataURI));
            postToServer(resampledFile, fileName);
          } else {
            ctrl.value.raw_latex = '';
            ctrl.value.svg_filename = '';
            AlertsService.addWarning('SVG failed validation.');
          }
        };

        var postToServer = function(resampledFile, filename) {
          let form = new FormData();
          form.append('image', resampledFile);
          form.append('payload', JSON.stringify({
            filename: filename
          }));
          var imageUploadUrlTemplate = '/createhandler/imageupload/' +
            '<entity_type>/<entity_id>';
          CsrfTokenService.getTokenAsync().then(function(token) {
            form.append('csrf_token', token);
            $.ajax({
              url: UrlInterpolationService.interpolateUrl(
                imageUploadUrlTemplate, {
                  entity_type: ContextService.getEntityType(),
                  entity_id: ContextService.getEntityId()
                }
              ),
              data: form,
              processData: false,
              contentType: false,
              type: 'POST',
              dataFilter: function(data) {
                // Remove the XSSI prefix.
                var transformedData = data.substring(5);
                return JSON.parse(transformedData);
              },
              dataType: 'text'
            }).fail(function(data) {
              // Remove the XSSI prefix.
              var transformedData = data.responseText.substring(5);
              var parsedResponse = JSON.parse(transformedData);
              AlertsService.addWarning(
                parsedResponse.error || 'Error communicating with server.');
            });
          });
        };
        ctrl.$onInit = function() {

           console.log("inseid math editor")
           console.log(ctrl.value)
          // Reset the component each time the value changes (e.g. if this is
          // part of an editable list).
          ctrl.svgString = '';
          $scope.$watch('$ctrl.value', function() {
            ctrl.localValue = {
              label: ctrl.value.raw_latex || '',
            };
          }, true);
          $scope.$on('externalSave', function() {
            processAndSaveSvg();

            if (ctrl.active) {
              ctrl.replaceValue(ctrl.localValue.label);
              // The $scope.$apply() call is needed to propagate the replaced
              // value.
              $scope.$apply();
            }
          });
          ctrl.placeholderText = '\\frac{x}{y}';
          ctrl.alwaysEditable = ctrl.getAlwaysEditable();
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
