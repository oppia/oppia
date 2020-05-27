// Copyright 2020 The Oppia Authors. All Rights Reserved.
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

angular.module('oppia').component('literallyCanvasDiagramEditor', {
  template: require('./literally-canvas-diagram-editor.component.html'),
  controller: [
    'LiterallyCanvasHelperService', function(LiterallyCanvasHelperService) {
      const ctrl = this;
      // These max width and height paramameters were determined by manual
      // testing and reference from OUTPUT_IMAGE_MAX_WIDTH_PX in
      // filepath-editor file so that the created diagram fits the card
      // content.
      var MAX_DIAGRAM_WIDTH = 491;
      var MAX_DIAGRAM_HEIGHT = 551;
      var DEFAULT_STROKE_WIDTH = 2;
      var ALLOWED_STROKE_WIDTHS = [1, 2, 3, 5, 30];
      // Dynamically assign a unique id to each lc editor to avoid clashes
      // when there are multiple RTEs in the same page.
      ctrl.lcID = 'lc' + Math.floor(Math.random() * 100000).toString();
      ctrl.diagramWidth = 450;
      ctrl.currentDiagramWidth = 450;
      ctrl.diagramHeight = 350;
      ctrl.currentDiagramHeight = 350;
      ctrl.data = {};
      ctrl.onWidthInputBlur = function() {
        if (ctrl.diagramWidth < MAX_DIAGRAM_WIDTH) {
          ctrl.currentDiagramWidth = ctrl.diagramWidth;
          ctrl.lc.setImageSize(
            ctrl.currentDiagramWidth, ctrl.currentDiagramHeight);
        }
      };

      ctrl.onHeightInputBlur = function() {
        if (ctrl.diagramHeight < MAX_DIAGRAM_HEIGHT) {
          ctrl.currentDiagramHeight = ctrl.diagramHeight;
          ctrl.lc.setImageSize(
            ctrl.currentDiagramWidth, ctrl.currentDiagramHeight);
        }
      };

      ctrl.getDiagramSizeInfo = function() {
        var maxWidth = MAX_DIAGRAM_WIDTH;
        var maxHeight = MAX_DIAGRAM_HEIGHT;
        return (
          'This diagram has a maximum dimension of ' + maxWidth +
          'px X ' + maxHeight + 'px to ensure that it fits in the card.');
      };

      ctrl.validate = function(data) {
        // TODO(#9357): Will be implemented once the svg data saving
        // functionality is implemented.
        return false;
      };

      ctrl.$onInit = function() {
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
        angular.element(document).ready(function() {
          ctrl.lc = LC.init(document.getElementById(ctrl.lcID), {
            imageSize: {
              width: ctrl.diagramWidth, height: ctrl.diagramHeight},
            imageURLPrefix: '/third_party/static/literallycanvas-0.5.2/lib/img',
            toolbarPosition: 'bottom',
            defaultStrokeWidth: DEFAULT_STROKE_WIDTH,
            strokeWidths: ALLOWED_STROKE_WIDTHS,
            // Eraser tool is removed because svgRenderer has not been
            // implemented in LiterallyCanvas and it can be included once
            // svgRenderer function is implemented.
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
    }
  ]
});
