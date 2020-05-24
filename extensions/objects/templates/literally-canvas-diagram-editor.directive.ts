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
 * @fileoverview Directive for literally canvas diagram editor.
 */

const LC = require('literallycanvas');
require('literallycanvas/lib/css/literallycanvas.css');
require('services/literally-canvas-helper.service.ts');

angular.module('oppia').directive('literallyCanvasDiagramEditor', [
  '$timeout', 'LiterallyCanvasHelperService',
  function($timeout, LiterallyCanvasHelperService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        value: '='
      },
      template: require('./literally-canvas-diagram-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$scope', function($scope) {
        var ctrl = this;
        ctrl.maxDiagramWidth = 491;
        ctrl.maxDiagramHeight = 551;
        ctrl.diagramWidth = 450;
        ctrl.currentDiagramWidth = 450;
        ctrl.diagramHeight = 350;
        ctrl.currentDiagramHeight = 350;
        ctrl.data = {};
        ctrl.onWidthInputBlur = function() {
          if (ctrl.diagramWidth < ctrl.maxDiagramWidth) {
            ctrl.currentDiagramWidth = ctrl.diagramWidth;
            ctrl.lc.setImageSize(
              ctrl.currentDiagramWidth, ctrl.currentDiagramHeight);
          }
        };

        ctrl.onHeightInputBlur = function() {
          if (ctrl.diagramHeight < ctrl.maxDiagramHeight) {
            ctrl.currentDiagramHeight = ctrl.diagramHeight;
            ctrl.lc.setImageSize(
              ctrl.currentDiagramWidth, ctrl.currentDiagramHeight);
          }
        };

        ctrl.getDiagramSizeHelp = function() {
          var maxWidth = ctrl.maxDiagramWidth;
          var maxHeight = ctrl.maxDiagramHeight;
          return 'This diagram has a maximum dimension of ' + maxWidth +
          'px X ' + maxHeight + 'px to ensure that it fits in the card.';
        };

        ctrl.validate = function(data) {
          // Will be implimented once data is saved.
          return false;
        };

        ctrl.$onInit = function() {
          // A timeout is necessary because when literallyCanvas is initialized
          // container has no size. So a timeout is necessary to ensure that lc
          // div is loaded into the DOM before literallyCanvas is initialized.
          $timeout(function() {
            LC.defineSVGRenderer(
              'Rectangle', LiterallyCanvasHelperService.rectangleSVGRenderer);
            LC.defineSVGRenderer(
              'Ellipse', LiterallyCanvasHelperService.ellipseSVGRenderer);
            LC.defineSVGRenderer(
              'Line', LiterallyCanvasHelperService.lineSVGRenderer);
            LC.defineSVGRenderer(
              'LinePath', LiterallyCanvasHelperService.linepathSVGRenderer);
            LC.defineSVGRenderer(
              'Polygon', LiterallyCanvasHelperService.polygonSVGRenderer);
            LC.defineSVGRenderer(
              'Text', LiterallyCanvasHelperService.textSVGRenderer);
            ctrl.lc = LC.init(document.getElementById('lc'), {
              imageSize: {width: 450, height: 350},
              imageURLPrefix: '/assets/literallyCanvas/img',
              toolbarPosition: 'bottom',
              defaultStrokeWidth: 2,
              strokeWidths: [1, 2, 3, 5, 30],
              // Eraser tool is removed because svgRenderer has not been
              // implimented in LiterallyCanvas. Can include once it is
              // implimented.
              tools: [
                LC.tools.Pencil,
                LC.tools.Line,
                LC.tools.Ellipse,
                LC.tools.Rectangle,
                LC.tools.Text,
                LC.tools.Polygon,
                LC.tools.Pan,
                LC.tools.Eyedropper
              ]
            });
          });
        };
      }]
    };
  }
]);
