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
 * @fileoverview Component for svg filename editor.
 */

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-player-page/services/image-preloader.service.ts');
require('services/alerts.service.ts');
require('services/assets-backend-api.service.ts');
require('services/context.service.ts');
require('services/csrf-token.service.ts');
require('services/image-local-storage.service.ts');
require('services/image-upload-helper.service.ts');

const LC = require('literallycanvas');
require('literallycanvas/lib/css/literallycanvas.css');
require('services/literally-canvas-helper.service.ts');

angular.module('oppia').component('svgFilenameEditor', {
  template: require('./svg-filename-editor.component.html'),
  bindings: {
    value: '='
  },
  controller: [
    '$http', '$q', '$sce', '$scope', 'AlertsService',
    'AssetsBackendApiService', 'ContextService', 'CsrfTokenService',
    'ImageLocalStorageService', 'ImagePreloaderService',
    'ImageUploadHelperService', 'LiterallyCanvasHelperService',
    'UrlInterpolationService', 'IMAGE_SAVE_DESTINATION_LOCAL_STORAGE',
    function($http, $q, $sce, $scope, AlertsService,
        AssetsBackendApiService, ContextService, CsrfTokenService,
        ImageLocalStorageService, ImagePreloaderService,
        ImageUploadHelperService, LiterallyCanvasHelperService,
        UrlInterpolationService, IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
      const ctrl = this;
      // These max width and height paramameters were determined by manual
      // testing and reference from OUTPUT_IMAGE_MAX_WIDTH_PX in
      // filepath-editor file so that the created diagram fits the card
      // content.
      var MAX_DIAGRAM_WIDTH = 491;
      var MAX_DIAGRAM_HEIGHT = 551;
      var DEFAULT_STROKE_WIDTH = 2;
      var ALLOWED_STROKE_WIDTHS = [1, 2, 3, 5, 30];
      const STATUS_EDITING = 'editing';
      const STATUS_SAVED = 'saved';
      // Dynamically assign a unique id to each lc editor to avoid clashes
      // when there are multiple RTEs in the same page.
      ctrl.lcID = 'lc' + Math.floor(Math.random() * 100000).toString();
      ctrl.diagramWidth = 450;
      ctrl.currentDiagramWidth = 450;
      ctrl.diagramHeight = 350;
      ctrl.currentDiagramHeight = 350;
      ctrl.data = {};
      ctrl.diagramStatus = STATUS_EDITING;
      ctrl.savedSVGDiagram = '';
      ctrl.invalidTagsAndAttributes = {
        tags: [],
        attrs: []
      };
      ctrl.entityId = ContextService.getEntityId();
      ctrl.entityType = ContextService.getEntityType();
      ctrl.imageSaveDestination = ContextService.getImageSaveDestination();
      ctrl.svgContainerStyle = {};
      var lcInitializingOptions = {
        imageSize: {
          width: ctrl.diagramWidth, height: ctrl.diagramHeight},
        imageURLPrefix: (
          '/third_party/static/literallycanvas-0.5.2/lib/img'),
        toolbarPosition: 'bottom',
        defaultStrokeWidth: DEFAULT_STROKE_WIDTH,
        strokeWidths: ALLOWED_STROKE_WIDTHS,
        // Eraser tool is removed because svgRenderer has not been
        // implemented in LiterallyCanvas. It can be included once
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
      };

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
        if (ctrl.lc !== undefined &&
          ctrl.diagramStatus === STATUS_EDITING) {
          var svgString = ctrl.lc.getSVGString();
          var domParser = new DOMParser();
          var doc = domParser.parseFromString(svgString, 'text/xml');
          var elements = doc.querySelectorAll('svg > g > *');
          if (elements.length > 0) {
            return true;
          }
        }
        return false;
      };

      ctrl.isUserDrawing = function() {
        return Boolean(ctrl.lc && ctrl.lc._shapesInProgress.length);
      };

      var getTrustedResourceUrlForSVGFileName = function(svgFileName) {
        if (
          ctrl.imageSaveDestination ===
          IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
          var imageUrl = ImageLocalStorageService.getObjectUrlForImage(
            svgFileName);
          return $sce.trustAsResourceUrl(imageUrl);
        }
        var encodedFilepath = window.encodeURIComponent(svgFileName);
        return $sce.trustAsResourceUrl(
          AssetsBackendApiService.getImageUrlForPreview(
            ctrl.entityType, ctrl.entityId, encodedFilepath));
      };

      ctrl.setSavedSVGFilename = function(filename, setData) {
        ctrl.diagramStatus = STATUS_SAVED;
        ctrl.data = {
          savedSVGFileName: filename,
          savedSVGUrl: getTrustedResourceUrlForSVGFileName(filename)
        };
        ctrl.value = filename;
        if (setData) {
          $http.get(ctrl.data.savedSVGUrl).then(function(response) {
            ctrl.savedSVGDiagram = response.data;
          });
        }
      };

      ctrl.postSVGToServer = function(dimensions, resampledFile) {
        return $q(function(successCallback, errorCallback) {
          let form = new FormData();
          form.append('image', resampledFile);
          form.append('payload', JSON.stringify({
            filename: ImageUploadHelperService.generateImageFilename(
              dimensions.height, dimensions.width, 'svg')
          })
          );
          var imageUploadUrlTemplate = (
            '/createhandler/imageupload/<entity_type>/<entity_id>');
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
              dataType: 'text'
            }).done(function(data) {
              // Remove the XSSI prefix.
              var transformedData = data.substring(5);
              var parsedResponse = JSON.parse(transformedData);
              if (successCallback) {
                successCallback(parsedResponse);
              }
            }).fail(function(data) {
              // Remove the XSSI prefix.
              var transformedData = data.responseText.substring(5);
              var parsedResponse = JSON.parse(transformedData);
              if (errorCallback) {
                errorCallback(parsedResponse);
              }
            });
          });
        });
      };

      ctrl.saveImageToLocalStorage = function(
          dimensions, resampledFile) {
        var filename = ImageUploadHelperService.generateImageFilename(
          dimensions.height, dimensions.width, 'svg');
        var reader = new FileReader();
        reader.onload = function() {
          var imageData = reader.result;
          ImageLocalStorageService.saveImage(filename, imageData);
          var img = new Image();
          img.onload = function() {
            ctrl.setSavedSVGFilename(filename, false);
            var dimensions = (
              ImagePreloaderService.getDimensionsOfImage(filename));
            ctrl.svgContainerStyle = {
              height: dimensions.height + 'px',
              width: dimensions.width + 'px'
            };
            $scope.$apply();
          };
          img.src = getTrustedResourceUrlForSVGFileName(filename);
        };
        reader.readAsDataURL(resampledFile);
      };

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
        };
        let resampledFile;

        if (LiterallyCanvasHelperService.isSvgTagValid(svgString)) {
          ctrl.savedSVGDiagram = svgString;
          resampledFile = (
            ImageUploadHelperService.convertImageDataToImageFile(
              svgDataURI));
          if (
            ctrl.imageSaveDestination ===
            IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
            ctrl.saveImageToLocalStorage(dimensions, resampledFile);
          } else {
            ctrl.postSVGToServer(
              dimensions, resampledFile).then(function(data) {
              // Pre-load image before marking the image as saved.
              var img = new Image();
              img.onload = function() {
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
            }, function(parsedResponse) {
              AlertsService.addWarning(
                parsedResponse.error || 'Error communicating with server.');
              $scope.$apply();
            });
          }
        }
      };

      ctrl.isDiagramSaved = function() {
        return ctrl.diagramStatus === STATUS_SAVED;
      };

      ctrl.continueDiagramEditing = function() {
        if (
          ctrl.data.savedSVGFileName &&
          ctrl.imageSaveDestination ===
          IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
          ImageLocalStorageService.deleteImage(
            ctrl.data.savedSVGFileName);
        }
        ctrl.diagramStatus = STATUS_EDITING;
        if (ctrl.lc !== undefined) {
          ctrl.lc.teardown();
        }
        ctrl.data = {};
        ctrl.invalidTagsAndAttributes = {
          tags: [],
          attrs: []
        };
        angular.element(document).ready(function() {
          ctrl.lc = LC.init(
            document.getElementById(ctrl.lcID), lcInitializingOptions);
          var snapshot = LiterallyCanvasHelperService.parseSvg(
            ctrl.savedSVGDiagram, ctrl.lc);
          ctrl.lc.loadSnapshot(snapshot);
        });
      };

      ctrl.validate = function() {
        return (
          ctrl.isDiagramSaved() && ctrl.data.savedSVGFileName &&
          ctrl.data.savedSVGFileName.length > 0);
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
        if (ctrl.value) {
          ctrl.setSavedSVGFilename(ctrl.value, true);
          var dimensions = (
            ImagePreloaderService.getDimensionsOfImage(ctrl.value));
          ctrl.svgContainerStyle = {
            height: dimensions.height + 'px',
            width: dimensions.width + 'px'
          };
        } else {
          angular.element(document).ready(function() {
            ctrl.lc = LC.init(
              document.getElementById(ctrl.lcID), lcInitializingOptions);
          });
        }
      };
    }
  ]
});
