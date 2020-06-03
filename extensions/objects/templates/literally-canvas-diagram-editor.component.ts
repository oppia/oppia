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

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-player-page/services/image-preloader.service.ts');
require('services/alerts.service.ts');
require('services/assets-backend-api.service.ts');
require('services/context.service.ts');
require('services/csrf-token.service.ts');
require('services/image-upload-helper.service.ts');

const LC = require('literallycanvas');
require('literallycanvas/lib/css/literallycanvas.css');
require('services/literally-canvas-helper.service.ts');

angular.module('oppia').component('literallyCanvasDiagramEditor', {
  template: require('./literally-canvas-diagram-editor.component.html'),
  bindings: {
    value: '='
  },
  controller: [
    '$http', '$sce', '$scope', 'AlertsService', 'AssetsBackendApiService',
    'ContextService', 'CsrfTokenService', 'ImagePreloaderService',
    'ImageUploadHelperService', 'LiterallyCanvasHelperService', 
    'UrlInterpolationService', function($http, $sce, $scope, AlertsService,
      AssetsBackendApiService, ContextService, CsrfTokenService, 
      ImagePreloaderService, ImageUploadHelperService, 
      LiterallyCanvasHelperService, UrlInterpolationService) {
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
      ctrl.diagramStatus = 'editing';
      ctrl.savedSVGDiagram = '';
      ctrl.invalidTagsAndAttributes = {
        tags: [],
        attrs: []
      };
      ctrl.entityId = ContextService.getEntityId();
      ctrl.entityType = ContextService.getEntityType();
      ctrl.svgContainerStyle = {};

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

      ctrl.isDiagramCreated = function() {
        // This function checks if any shape has been created or not.
        if(typeof(ctrl.lc) !== 'undefined' && ctrl.diagramStatus == 'editing') {
          var svgString = ctrl.lc.getSVGString();
          var domParser = new DOMParser();
          var doc = domParser.parseFromString(svgString, 'text/xml');
          var elements = doc.querySelectorAll('svg > g > *');
          if(elements.length > 0) {
            return true;
          }
        }
        return false;
      }

      ctrl.isUserDrawing = function() {
        if(typeof(ctrl.lc) !== 'undefined' &&
           ctrl.lc._shapesInProgress.length > 0) {
          return true;
        }
        return false;
      }

      var getTrustedResourceUrlForSVGFileName = function(svgFileName) {
        var encodedFilepath = window.encodeURIComponent(svgFileName);
        return $sce.trustAsResourceUrl(
          AssetsBackendApiService.getImageUrlForPreview(
            ctrl.entityType, ctrl.entityId, encodedFilepath));
      };

      ctrl.setSavedSVGFilename = function(filename, setData) {
        ctrl.diagramStatus = 'saved';
        ctrl.data = {
          savedSVGFileName: filename,
          savedSVGUrl: getTrustedResourceUrlForSVGFileName(filename)
        }
        ctrl.value = filename;
        if(setData) {
          $http.get(ctrl.data.savedSVGUrl).then(function(response) {
            ctrl.savedSVGDiagram = response.data;
          });
        }
      }

      ctrl.postImageToServer = function(dimensions, resampledFile) {
        let form = new FormData();
        form.append('image', resampledFile);
        form.append('payload', JSON.stringify({
          filename: ImageUploadHelperService.generateImageFilename(
            dimensions.height, dimensions.width, 'svg')
        }));
        var imageUploadUrlTemplate = '/createhandler/imageupload/' +
          '<entity_type>/<entity_id>';
        CsrfTokenService.getTokenAsync().then(function(token) {
          form.append('csrf_token', token);
            $.ajax({
              url: UrlInterpolationService.interpolateUrl(
                imageUploadUrlTemplate, {
                  entity_type: ctrl.entityType,
                  entity_id: ctrl.entityId
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
            }).done(function(data) {
              // Pre-load image before marking the image as saved.
              var img = new Image();
              img.onload = function() {
                console.log("onload")
                ctrl.setSavedSVGFilename(data.filename, false);
                var dimensions = (
                  ImagePreloaderService.getDimensionsOfImage(data.filename));
                ctrl.svgContainerStyle = {
                  height: dimensions.height + 'px',
                  width: dimensions.width + 'px'
                };
                $scope.$apply();
              };
              img.src = getTrustedResourceUrlForSVGFileName(data.filename);
            }).fail(function(data) {
              // Remove the XSSI prefix.
              var transformedData = data.responseText.substring(5);
              var parsedResponse = JSON.parse(transformedData);
              AlertsService.addWarning(
                parsedResponse.error || 'Error communicating with server.');
              $scope.$apply();
            });
          });
      }

      ctrl.saveSVGFile = function() {
        AlertsService.clearWarnings();

        if (!ctrl.isDiagramCreated()) {
          AlertsService.addWarning('Custom Diagram not created.');
          return;
        }

        var svgString = ctrl.lc.getSVGString();
        var svgDataURI = 'data:image/svg+xml;base64,' + btoa(svgString);
        var dimensions = {
          width: ctrl.diagramWidth,
          height: ctrl.diagramHeight,
         }
        let resampledFile;
        
        if (LiterallyCanvasHelperService.svgTagIsValid(svgString)) {
          ctrl.savedSVGDiagram = svgString;
          resampledFile = (
            ImageUploadHelperService.convertImageDataToImageFile(
              svgDataURI));
          ctrl.postImageToServer(dimensions, resampledFile);
        }
      }

      ctrl.isDiagramSaved = function() {
        return ctrl.diagramStatus == 'saved';
      }

      ctrl.continueDiagramEditing = function() {
        ctrl.diagramStatus = 'editing';
        ctrl.data = {};
        ctrl.invalidTagsAndAttributes = {
          tags: [],
          attrs: []
        };
        angular.element(document).ready(function() {
          ctrl.lc = LC.init(document.getElementById(ctrl.lcID), {
            imageSize: {
              width: ctrl.diagramWidth, height: ctrl.diagramHeight},
            imageURLPrefix: (
              '/third_party/static/literallycanvas-0.5.2/lib/img'),
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
          var snapshot = LiterallyCanvasHelperService.svgParse(
            ctrl.savedSVGDiagram, ctrl.lc)
          ctrl.lc.loadSnapshot(snapshot);
        });
      }

      ctrl.validate = function(data) {
        return (
          ctrl.isDiagramSaved() && data.savedSVGFileName &&
          data.savedSVGFileName.length > 0);
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
        if(ctrl.value) {
          ctrl.setSavedSVGFilename(ctrl.value, true);
          var dimensions = (
            ImagePreloaderService.getDimensionsOfImage(ctrl.value));
          ctrl.svgContainerStyle = {
            height: dimensions.height + 'px',
            width: dimensions.width + 'px'
          };
        } else {
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
        }
      };
    }
  ]
});
