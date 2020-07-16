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
require('services/contextual/device-info.service.ts');
require('services/context.service.ts');
require('services/csrf-token.service.ts');
require('services/image-local-storage.service.ts');
require('services/image-upload-helper.service.ts');

import { fabric } from 'fabric';
import Picker from 'vanilla-picker';

angular.module('oppia').component('svgFilenameEditor', {
  template: require('./svg-filename-editor.component.html'),
  bindings: {
    value: '='
  },
  controller: [
    '$http', '$q', '$sce', '$scope', 'AlertsService',
    'AssetsBackendApiService', 'ContextService', 'CsrfTokenService',
    'DeviceInfoService', 'ImageLocalStorageService', 'ImagePreloaderService',
    'ImageUploadHelperService', 'UrlInterpolationService',
    'IMAGE_SAVE_DESTINATION_LOCAL_STORAGE',
    function($http, $q, $sce, $scope, AlertsService,
        AssetsBackendApiService, ContextService, CsrfTokenService,
        DeviceInfoService, ImageLocalStorageService, ImagePreloaderService,
        ImageUploadHelperService, UrlInterpolationService,
        IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
      const ctrl = this;
      // These max width and height paramameters were determined by manual
      // testing and reference from OUTPUT_IMAGE_MAX_WIDTH_PX in
      // filepath-editor file so that the created diagram fits the card
      // content.
      var MAX_DIAGRAM_WIDTH = 491;
      var MAX_DIAGRAM_HEIGHT = 551;
      const STATUS_EDITING = 'editing';
      const STATUS_SAVED = 'saved';
      const DRAW_MODE_POLY = 'polygon';
      const DRAW_MODE_PENCIL = 'pencil';
      const DRAW_MODE_BEZIER = 'bezier';
      const DRAW_MODE_NONE = 'none';
      const OPEN_POLYGON_MODE = 'open';
      const CLOSED_POLYGON_MODE = 'closed';
      // The canvas height and width were determined based on the initial
      // modal dimensions.
      const CANVAS_WIDTH = 494;
      const CANVAS_HEIGHT = 338;
      ctrl.drawMode = DRAW_MODE_NONE;
      ctrl.polygonMode = CLOSED_POLYGON_MODE;
      ctrl.isTouchDevice = DeviceInfoService.hasTouchEvents();
      ctrl.polyOptions = {
        x: 0,
        y: 0,
        bboxPoints: [],
        lines: [],
        lineCounter: 0,
        shape: null
      };
      ctrl.sizes = [
        '1px', '2px', '3px', '5px', '9px', '10px', '12px',
        '14px', '18px', '24px', '30px', '36px'];
      ctrl.fontFamily = [
        'arial',
        'helvetica',
        'myriad pro',
        'delicious',
        'verdana',
        'georgia',
        'courier',
        'comic sans ms',
        'impact',
        'monaco',
        'optima',
        'hoefler text',
        'plaster',
        'engagement'
      ];
      // Dynamically assign a unique id to each lc editor to avoid clashes
      // when there are multiple RTEs in the same page.
      var randomId = Math.floor(Math.random() * 100000).toString();
      ctrl.canvasID = 'canvas' + randomId;
      ctrl.canvasElement = null;
      ctrl.fillPicker = null;
      ctrl.strokePicker = null;
      ctrl.diagramWidth = 450;
      ctrl.currentDiagramWidth = 450;
      ctrl.diagramHeight = 350;
      ctrl.currentDiagramHeight = 350;
      ctrl.data = {};
      ctrl.diagramStatus = STATUS_EDITING;
      ctrl.displayFontStyles = false;
      ctrl.objectUndoStack = [];
      ctrl.objectRedoStack = [];
      ctrl.canvasObjects = [];
      ctrl.undoFlag = false;
      ctrl.isRedo = false;
      ctrl.undoLimit = 5;
      ctrl.savedSVGDiagram = '';
      ctrl.entityId = ContextService.getEntityId();
      ctrl.entityType = ContextService.getEntityType();
      ctrl.imageSaveDestination = ContextService.getImageSaveDestination();
      ctrl.svgContainerStyle = {};
      ctrl.layerNum = 0;
      ctrl.fabricjsOptions = {
        stroke: 'rgba(0, 0, 0, 1)',
        fill: 'rgba(0, 0, 0, 0)',
        bg: 'rgba(0, 0, 0, 0)',
        fontFamily: 'helvetica',
        size: '3px',
        bold: false,
        italic: false
      };
      ctrl.objectIsSelected = false;

      ctrl.onWidthInputBlur = function() {
        if (ctrl.diagramWidth < MAX_DIAGRAM_WIDTH) {
          ctrl.currentDiagramWidth = ctrl.diagramWidth;
        } else {
          ctrl.diagramWidth = MAX_DIAGRAM_WIDTH;
          ctrl.currentDiagramWidth = ctrl.diagramWidth;
        }
      };

      ctrl.onHeightInputBlur = function() {
        if (ctrl.diagramHeight < MAX_DIAGRAM_HEIGHT) {
          ctrl.currentDiagramHeight = ctrl.diagramHeight;
        } else {
          ctrl.diagramHeight = MAX_DIAGRAM_HEIGHT;
          ctrl.currentDiagramHeight = ctrl.diagramHeight;
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
        return Boolean(
          !ctrl.isUserDrawing() &&
          ctrl.diagramStatus === STATUS_EDITING &&
          ctrl.canvas && ctrl.canvas.getObjects().length > 0);
      };

      ctrl.isUserDrawing = function() {
        return Boolean(ctrl.canvas && ctrl.drawMode !== DRAW_MODE_NONE);
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
          var dimensions = (
            ImagePreloaderService.getDimensionsOfImage(filename));
          ctrl.svgContainerStyle = {
            height: dimensions.height + 'px',
            width: dimensions.width + 'px'
          };
          ctrl.diagramWidth = dimensions.width;
          ctrl.diagramHeight = dimensions.height;
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
            $scope.$applyAsync();
          };
          img.src = getTrustedResourceUrlForSVGFileName(filename);
        };
        reader.readAsDataURL(resampledFile);
      };

      var getSVGString = function() {
        var svgString = ctrl.canvas.toSVG().replace('\t\t', '');
        var domParser = new DOMParser();
        var doc = domParser.parseFromString(svgString, 'text/xml');
        var svg = doc.querySelector('svg');
        svg.removeAttribute('xml:space');
        var textTags = doc.querySelectorAll('text');
        textTags.forEach(function(obj) {
          obj.removeAttribute('xml:space');
        });
        var elements = svg.querySelectorAll('*');
        // Fabric js adds vector-effect as an attribute which is not part of
        // the svg attribute whitelist, so here it is removed
        // and added as part of the style attribute.
        for (var i = 0; i < elements.length; i++) {
          if (
            elements[i].getAttributeNames().indexOf('vector-effect') !== -1) {
            elements[i].removeAttribute('vector-effect');
            var style = elements[i].getAttribute('style');
            style += ' vector-effect: non-scaling-stroke';
            elements[i].setAttribute('style', style);
          }
        }
        return svg.outerHTML;
      };

      ctrl.isSvgTagValid = function(svgString) {
        var dataURI = 'data:image/svg+xml;base64,' + btoa(svgString);
        var invalidTagsAndAttr = (
          ImageUploadHelperService.getInvalidSvgTagsAndAttrs(dataURI));
        if (invalidTagsAndAttr.tags.length !== 0) {
          var errorText = (
            'Invalid tags in svg:' + invalidTagsAndAttr.tags.join());
          throw new Error(errorText);
        } else if (invalidTagsAndAttr.attrs.length !== 0) {
          var errorText = (
            'Invalid attributes in svg:' + invalidTagsAndAttr.attrs.join());
          throw new Error(errorText);
        }
        return true;
      };

      ctrl.saveSVGFile = function() {
        AlertsService.clearWarnings();

        if (!ctrl.isDiagramCreated()) {
          AlertsService.addWarning('Custom Diagram not created.');
          return;
        }

        var svgString = getSVGString();
        var svgDataURI = 'data:image/svg+xml;base64,' + btoa(svgString);
        var dimensions = {
          width: ctrl.diagramWidth,
          height: ctrl.diagramHeight,
        };
        let resampledFile;

        if (ctrl.isSvgTagValid(svgString)) {
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
                $scope.$applyAsync();
              };
              img.src = getTrustedResourceUrlForSVGFileName(data.filename);
            }, function(parsedResponse) {
              AlertsService.addWarning(
                parsedResponse.error || 'Error communicating with server.');
              $scope.$applyAsync();
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
        ctrl.data = {};
        angular.element(document).ready(function() {
          initializeFabricJs();
          fabric.loadSVGFromString(
            ctrl.savedSVGDiagram, function(objects, options, elements) {
              objects.forEach(function(obj, index) {
                if (obj.get('type') === 'rect') {
                  if (
                    elements[index].width.baseVal.valueAsString === '100%' &&
                    elements[index].height.baseVal.valueAsString === '100%') {
                    ctrl.canvas.setBackgroundColor(obj.get('fill'));
                  } else {
                    ctrl.canvas.add(obj);
                  }
                } else if (obj.type === 'text') {
                  var element = elements[index];
                  var childrens = [].slice.call(element.childNodes);
                  var value = '';
                  childrens.forEach(function(el, index) {
                    if (el.nodeName === 'tspan') {
                      value += el.childNodes[0].nodeValue;
                    }
                    if (index < childrens.length - 1) {
                      value += '\n';
                    }
                  });
                  value = (
                    obj['text-transform'] === 'uppercase' ?
                    value.toUpperCase() : value);

                  var text = new fabric.Textbox(obj.text, obj.toObject());
                  text.set({
                    text: value,
                    type: 'textbox',
                    strokeUniform: true
                  });
                  ctrl.canvas.add(text);
                } else {
                  ctrl.canvas.add(obj);
                }
              });
            }
          );
        });
      };

      ctrl.validate = function() {
        return (
          ctrl.isDiagramSaved() && ctrl.data.savedSVGFileName &&
          ctrl.data.savedSVGFileName.length > 0);
      };

      ctrl.createRect = function() {
        var size = ctrl.fabricjsOptions.size;
        var rect = new fabric.Rect({
          top: 50,
          left: 50,
          width: 60,
          height: 70,
          fill: ctrl.fabricjsOptions.fill,
          stroke: ctrl.fabricjsOptions.stroke,
          strokeWidth: parseInt(size.substring(0, size.length - 2)),
          strokeUniform: true
        });
        ctrl.canvas.add(rect);
      };

      ctrl.createLine = function() {
        var size = ctrl.fabricjsOptions.size;
        var line = new fabric.Line([50, 50, 100, 100], {
          stroke: ctrl.fabricjsOptions.stroke,
          strokeWidth: parseInt(size.substring(0, size.length - 2)),
          strokeUniform: true
        });
        ctrl.canvas.add(line);
      };

      ctrl.createCircle = function() {
        var size = ctrl.fabricjsOptions.size;
        var circle = new fabric.Circle({
          top: 50,
          left: 50,
          radius: 30,
          fill: ctrl.fabricjsOptions.fill,
          stroke: ctrl.fabricjsOptions.stroke,
          strokeWidth: parseInt(size.substring(0, size.length - 2)),
          strokeUniform: true
        });
        ctrl.canvas.add(circle);
      };

      ctrl.createText = function() {
        ctrl.canvas.discardActiveObject();
        ctrl.fillPicker.setOptions({
          color: 'rgba(0,0,0,1)'
        });
        ctrl.fabricjsOptions.size = '18px';
        var size = ctrl.fabricjsOptions.size;
        var text = new fabric.Textbox('Enter Text', {
          top: 50,
          left: 50,
          fontFamily: ctrl.fabricjsOptions.fontFamily,
          fontSize: parseInt(size.substring(0, size.length - 2)),
          fill: ctrl.fabricjsOptions.fill,
          fontWeight: ctrl.fabricjsOptions.bold ? 'bold' : 'normal',
          fontStyle: ctrl.fabricjsOptions.italic ? 'italic' : 'normal',
        });
        ctrl.canvas.add(text);
      };

      ctrl.areAllToolsEnabled = function() {
        return ctrl.drawMode === DRAW_MODE_NONE;
      };

      ctrl.isDrawModePencil = function() {
        return ctrl.drawMode === DRAW_MODE_PENCIL;
      };

      ctrl.isPencilEnabled = function() {
        return (
          ctrl.areAllToolsEnabled() || ctrl.isDrawModePencil());
      };

      ctrl.togglePencilDrawing = function() {
        var size = ctrl.fabricjsOptions.size;
        ctrl.canvas.isDrawingMode = !ctrl.canvas.isDrawingMode;
        ctrl.canvas.freeDrawingBrush.color = ctrl.fabricjsOptions.stroke;
        ctrl.canvas.freeDrawingBrush.width = parseInt(
          size.substring(0, size.length - 2));
        ctrl.drawMode = DRAW_MODE_NONE;
        if (ctrl.canvas.isDrawingMode) {
          ctrl.drawMode = DRAW_MODE_PENCIL;
        }
      };

      var polyPoint = function(x, y) {
        this.x = x;
        this.y = y;
      };

      var makePolygon = function() {
        var startPt = ctrl.polyOptions.bboxPoints[0];
        if (ctrl.polygonMode === CLOSED_POLYGON_MODE) {
          ctrl.polyOptions.bboxPoints.push(
            new polyPoint(startPt.x, startPt.y));
        }
        var size = ctrl.fabricjsOptions.size;
        var shape = new fabric.Polyline(ctrl.polyOptions.bboxPoints, {
          fill: ctrl.fabricjsOptions.fill,
          stroke: ctrl.fabricjsOptions.stroke,
          strokeWidth: parseInt(size.substring(0, size.length - 2)),
          strokeUniform: true,
          strokeLineCap: 'round'
        });
        return shape;
      };

      var createPolyShape = function() {
        ctrl.polyOptions.lines.forEach(function(value) {
          ctrl.canvas.remove(value);
        });
        if (ctrl.polyOptions.bboxPoints.length > 0) {
          ctrl.polyOptions.shape = makePolygon();
          ctrl.canvas.add(ctrl.polyOptions.shape);
        }
        ctrl.canvas.hoverCursor = 'move';
        ctrl.canvas.forEachObject(function(object) {
          object.selectable = true;
        });
        ctrl.canvas.renderAll();
        ctrl.polyOptions.bboxPoints = [];
        ctrl.polyOptions.lines = [];
        ctrl.polyOptions.lineCounter = 0;
      };

      var setPolyStartingPoint = function(options) {
        var mouse = ctrl.canvas.getPointer(options.e);
        ctrl.polyOptions.x = mouse.x;
        ctrl.polyOptions.y = mouse.y;
      };

      var createPolygon = function() {
        if (ctrl.drawMode === DRAW_MODE_POLY) {
          ctrl.drawMode = DRAW_MODE_NONE;
          createPolyShape();
        } else {
          ctrl.drawMode = DRAW_MODE_POLY;
          ctrl.canvas.hoverCursor = 'default';
          ctrl.canvas.forEachObject(function(object) {
            object.selectable = false;
          });
        }
      };

      ctrl.isDrawModePolygon = function() {
        return ctrl.drawMode === DRAW_MODE_POLY;
      };

      ctrl.isOpenPolygonEnabled = function() {
        return (
          ctrl.areAllToolsEnabled() || (
            ctrl.isDrawModePolygon() &&
            ctrl.polygonMode === OPEN_POLYGON_MODE));
      };

      ctrl.createOpenPolygon = function() {
        ctrl.polygonMode = OPEN_POLYGON_MODE;
        createPolygon();
      };

      ctrl.isClosedPolygonEnabled = function() {
        return (
          ctrl.areAllToolsEnabled() || (
            ctrl.isDrawModePolygon() &&
            ctrl.polygonMode === CLOSED_POLYGON_MODE));
      };

      ctrl.createClosedPolygon = function() {
        ctrl.polygonMode = CLOSED_POLYGON_MODE;
        createPolygon();
      };

      var makeCurveCircle = function(left, top) {
        var size = ctrl.fabricjsOptions.size;
        var circle = new fabric.Circle({
          left: left,
          top: top,
          radius: parseInt(size.substring(0, size.length - 2)) + 2,
          fill: '#666666',
          stroke: '#666666',
          hasBorders: false,
          hasControls: false
        });
        return circle;
      };

      var drawQuadratic = function() {
        var size = ctrl.fabricjsOptions.size;
        var curve = new fabric.Path('M 40 40 Q 95, 100, 150, 40', {
          stroke: ctrl.fabricjsOptions.stroke,
          fill: ctrl.fabricjsOptions.fill,
          strokeWidth: parseInt(size.substring(0, size.length - 2)),
          objectCaching: false,
          selectable: false
        });
        ctrl.canvas.add(curve);

        var p1 = makeCurveCircle(95, 100);
        p1.name = 'p1';
        p1.set({
          radius: 12,
          fill: '#ffffff',
          strokeWidth: 5
        });
        ctrl.canvas.add(p1);

        var p0 = makeCurveCircle(40, 40);
        p0.name = 'p0';
        ctrl.canvas.add(p0);

        var p2 = makeCurveCircle(150, 40);
        p2.name = 'p2';
        ctrl.canvas.add(p2);
      };

      ctrl.createBezier = function() {
        if (ctrl.drawMode === DRAW_MODE_NONE) {
          ctrl.canvas.discardActiveObject();
          ctrl.drawMode = DRAW_MODE_BEZIER;
          ctrl.canvas.getObjects().forEach(function(item) {
            item.set({
              hoverCursor: 'default',
              selectable: false
            });
          });
          drawQuadratic();
        } else {
          // Remove the circles and the current path.
          ctrl.canvas.getObjects().slice(-3).forEach(function(item) {
            ctrl.canvas.remove(item);
          });
          var path = ctrl.canvas.getObjects().slice(-1)[0].get('path');
          ctrl.canvas.remove(ctrl.canvas.getObjects().slice(-1)[0]);
          ctrl.canvas.getObjects().forEach(function(item) {
            item.set({
              hoverCursor: 'move',
              selectable: true
            });
          });
          // Change mode and then add the path so that the object is added in
          // cavasObjects array.
          ctrl.drawMode = DRAW_MODE_NONE;
          // Adding a new path so that the bbox is computed correctly.
          var size = ctrl.fabricjsOptions.size;
          var curve = new fabric.Path(path, {
            stroke: ctrl.fabricjsOptions.stroke,
            fill: ctrl.fabricjsOptions.fill,
            strokeWidth: parseInt(size.substring(0, size.length - 2)),
          });
          ctrl.canvas.add(curve);
        }
      };

      ctrl.isBezierEnabled = function() {
        return Boolean(
          ctrl.areAllToolsEnabled() ||
          ctrl.drawMode === DRAW_MODE_BEZIER);
      };

      ctrl.isDrawModeBezier = function() {
        return Boolean(ctrl.drawMode === DRAW_MODE_BEZIER);
      };

      ctrl.bringObjectForward = function() {
        ctrl.canvas.bringForward(ctrl.canvas.getActiveObject());
        if (ctrl.layerNum < ctrl.canvas._objects.length) {
          ctrl.layerNum += 1;
        }
      };

      ctrl.sendObjectBackward = function() {
        ctrl.canvas.sendBackwards(ctrl.canvas.getActiveObject());
        if (ctrl.layerNum > 1) {
          ctrl.layerNum -= 1;
        }
      };

      var undoStackPush = function(object) {
        if (ctrl.objectUndoStack.length === ctrl.undoLimit) {
          ctrl.objectUndoStack.shift();
        }
        ctrl.objectUndoStack.push(object);
      };

      ctrl.onUndo = function() {
        ctrl.canvas.discardActiveObject();
        if (ctrl.objectUndoStack.length > 0) {
          var undoObj = ctrl.objectUndoStack.pop();
          if (undoObj.action === 'add') {
            var shape = ctrl.canvasObjects.pop();
            var index = ctrl.canvas._objects.indexOf(shape);
            ctrl.canvas._objects.splice(index, 1);
            ctrl.objectRedoStack.push({
              action: 'add',
              object: shape
            });
          } else {
            ctrl.isRedo = true;
            ctrl.objectRedoStack.push({
              action: 'remove',
              object: undoObj.object
            });
            // Adding the object in the correct position according to initial
            // order.
            ctrl.undoFlag = true;
            ctrl.canvasObjects.splice(undoObj.index, 0, undoObj.object);
            ctrl.canvas.add(undoObj.object);
          }
          ctrl.canvas.renderAll();
        }
      };

      ctrl.isUndoEnabled = function() {
        return Boolean(
          ctrl.drawMode === DRAW_MODE_NONE && ctrl.objectUndoStack.length);
      };

      ctrl.onRedo = function() {
        ctrl.canvas.discardActiveObject();
        if (ctrl.objectRedoStack.length > 0) {
          var redoObj = ctrl.objectRedoStack.pop();
          undoStackPush(redoObj);
          if (redoObj.action === 'add') {
            ctrl.isRedo = true;
            // Not adding the shape to canvasObjects because it is added by the
            // event function.
            ctrl.canvas.add(redoObj.object);
          } else {
            var shape = redoObj.object;
            var index = ctrl.canvasObjects.indexOf(shape);
            ctrl.canvasObjects.splice(index, 1);
            index = ctrl.canvas._objects.indexOf(shape);
            ctrl.canvas._objects.splice(index, 1);
          }
        }
        ctrl.canvas.renderAll();
      };

      ctrl.isRedoEnabled = function() {
        return Boolean(
          ctrl.drawMode === DRAW_MODE_NONE && ctrl.objectRedoStack.length);
      };

      ctrl.removeShape = function() {
        var shape = ctrl.canvas.getActiveObject();
        var index = ctrl.canvasObjects.indexOf(shape);
        if (shape) {
          undoStackPush({
            action: 'remove',
            object: shape,
            index: index
          });
          ctrl.objectRedoStack = [];
          ctrl.canvasObjects.splice(index, 1);
          ctrl.canvas.remove(shape);
        }
      };

      ctrl.onClear = function() {
        ctrl.objectUndoStack = [];
        ctrl.objectRedoStack = [];
        ctrl.canvasObjects = [];
        ctrl.canvas.clear();
      };

      ctrl.isClearEnabled = function() {
        return Boolean(
          ctrl.canvasObjects.length > 0 && ctrl.drawMode === DRAW_MODE_NONE);
      };

      ctrl.onStrokeChange = function() {
        if (ctrl.drawMode === DRAW_MODE_BEZIER) {
          ctrl.canvas.getObjects().slice(-4, -3)[0].set({
            stroke: ctrl.fabricjsOptions.stroke
          });
          ctrl.canvas.renderAll();
        } else {
          var shape = ctrl.canvas.getActiveObject();
          var strokeShapes = ['rect', 'circle', 'path', 'line', 'polyline'];
          ctrl.canvas.freeDrawingBrush.color = ctrl.fabricjsOptions.stroke;
          if (shape && strokeShapes.indexOf(shape.get('type')) !== -1) {
            shape.set({
              stroke: ctrl.fabricjsOptions.stroke
            });
            ctrl.canvas.renderAll();
          }
        }
      };

      ctrl.onFillChange = function() {
        if (ctrl.drawMode === DRAW_MODE_BEZIER) {
          ctrl.canvas.getObjects().slice(-4, -3)[0].set({
            fill: ctrl.fabricjsOptions.fill
          });
          ctrl.canvas.renderAll();
        } else {
          var shape = ctrl.canvas.getActiveObject();
          var fillShapes = ['rect', 'circle', 'path', 'textbox', 'polyline'];
          if (shape && fillShapes.indexOf(shape.get('type')) !== -1) {
            shape.set({
              fill: ctrl.fabricjsOptions.fill
            });
            ctrl.canvas.renderAll();
          }
        }
      };

      ctrl.onBgChange = function() {
        ctrl.canvas.setBackgroundColor(ctrl.fabricjsOptions.bg);
        ctrl.canvas.renderAll();
      };

      ctrl.onItalicToggle = function() {
        var shape = ctrl.canvas.getActiveObject();
        if (shape && shape.get('type') === 'textbox') {
          shape.set({
            fontStyle: ctrl.fabricjsOptions.italic ? 'italic' : 'normal',
          });
          ctrl.canvas.renderAll();
        }
      };

      ctrl.onBoldToggle = function() {
        var shape = ctrl.canvas.getActiveObject();
        if (shape && shape.get('type') === 'textbox') {
          shape.set({
            fontWeight: ctrl.fabricjsOptions.bold ? 'bold' : 'normal',
          });
          ctrl.canvas.renderAll();
        }
      };

      ctrl.onFontChange = function() {
        var shape = ctrl.canvas.getActiveObject();
        if (shape && shape.get('type') === 'textbox') {
          shape.set({
            fontFamily: ctrl.fabricjsOptions.fontFamily,
          });
          ctrl.canvas.renderAll();
        }
      };

      ctrl.onSizeChange = function() {
        if (ctrl.drawMode === DRAW_MODE_BEZIER) {
          var size = ctrl.fabricjsOptions.size;
          var actualSize = parseInt(size.substring(0, size.length - 2));
          ctrl.canvas.getObjects().slice(-2).forEach(function(object) {
            object.set({
              radius: actualSize + 2
            });
          });
          ctrl.canvas.getObjects().slice(-4, -3)[0].set({
            strokeWidth: actualSize
          });
          ctrl.canvas.renderAll();
        } else {
          var shape = ctrl.canvas.getActiveObject();
          var size = ctrl.fabricjsOptions.size;
          ctrl.canvas.freeDrawingBrush.width = parseInt(
            size.substring(0, size.length - 2));
          var strokeWidthShapes = [
            'rect', 'circle', 'path', 'line', 'polyline'];
          if (shape && strokeWidthShapes.indexOf(shape.get('type')) !== -1) {
            shape.set({
              strokeWidth: parseInt(size.substring(0, size.length - 2))
            });
            ctrl.canvas.renderAll();
          } else if (shape && shape.get('type') === 'textbox') {
            shape.set({
              fontSize: parseInt(size.substring(0, size.length - 2))
            });
            ctrl.canvas.renderAll();
          }
        }
      };

      ctrl.isSizeVisible = function() {
        return Boolean(
          ctrl.objectIsSelected || ctrl.drawMode !== DRAW_MODE_NONE);
      };

      var createColorPicker = function(value) {
        var parent = document.getElementById(value + '-color');
        var onChangeFunc = {
          stroke: ctrl.onStrokeChange,
          fill: ctrl.onFillChange,
          bg: ctrl.onBgChange
        };
        var picker = new Picker(parent);
        parent.style.background = ctrl.fabricjsOptions[value];
        if (value === 'stroke') {
          ctrl.strokePicker = picker;
        }
        if (value === 'fill') {
          ctrl.fillPicker = picker;
        }
        picker.onChange = function(color) {
          parent.style.background = color.rgbaString;
          var topAlphaSquare = document.getElementById(
            'top-' + value + '-alpha');
          var bottomAlphaSquare = document.getElementById(
            'bottom-' + value + '-alpha');
          var opacity = 1 - color.rgba[3];
          topAlphaSquare.style.opacity = opacity.toString();
          bottomAlphaSquare.style.opacity = opacity.toString();
          ctrl.fabricjsOptions[value] = color.rgbaString;
          onChangeFunc[value]();
        };
        picker.setOptions({
          color: ctrl.fabricjsOptions[value]
        });
      };

      ctrl.initializeMouseEvents = function() {
        // Adding event listener for polygon tool.
        ctrl.canvas.on('mouse:dblclick', function() {
          if (ctrl.drawMode === DRAW_MODE_POLY) {
            ctrl.drawMode = DRAW_MODE_NONE;
            createPolyShape();
          }
        });

        ctrl.canvas.on('mouse:down', function(options) {
          if (ctrl.drawMode === DRAW_MODE_POLY) {
            setPolyStartingPoint(options);
            var x = ctrl.polyOptions.x;
            var y = ctrl.polyOptions.y;
            ctrl.polyOptions.bboxPoints.push(new polyPoint(x, y));
            var points = [x, y, x, y];
            var size = ctrl.fabricjsOptions.size;
            var stroke = ctrl.fabricjsOptions.stroke;
            // This is to ensure that the polygon lines are visible when
            // creating the polygon.
            stroke = stroke.slice(0, -2) + '1)';
            var line = new fabric.Line(points, {
              strokeWidth: parseInt(size.substring(0, size.length - 2)),
              selectable: false,
              stroke: stroke,
              strokeLineCap: 'round'
            });
            // This function is for drawing a polygon in a device with touch
            // support.
            if (
              ctrl.polyOptions.lines.length !== 0 &&
              ctrl.drawMode === DRAW_MODE_POLY &&
              ctrl.isTouchDevice) {
              setPolyStartingPoint(options);
              ctrl.polyOptions.lines[ctrl.polyOptions.lineCounter - 1].set({
                x2: ctrl.polyOptions.x,
                y2: ctrl.polyOptions.y,
              });
              ctrl.canvas.renderAll();
            }
            ctrl.polyOptions.lines.push(line);
            ctrl.canvas.add(
              ctrl.polyOptions.lines[ctrl.polyOptions.lineCounter]);
            ctrl.polyOptions.lineCounter++;
          }
          $scope.$applyAsync();
        });

        ctrl.canvas.on('mouse:move', function(options) {
          if (
            ctrl.polyOptions.lines.length !== 0 &&
            ctrl.drawMode === DRAW_MODE_POLY &&
            !ctrl.isTouchDevice) {
            setPolyStartingPoint(options);
            ctrl.polyOptions.lines[ctrl.polyOptions.lineCounter - 1].set({
              x2: ctrl.polyOptions.x,
              y2: ctrl.polyOptions.y,
            });
            ctrl.canvas.renderAll();
          }
        });

        ctrl.canvas.on('object:moving', function(e) {
          if (ctrl.drawMode === DRAW_MODE_BEZIER) {
            var pt = e.target;
            var curve = ctrl.canvas.getObjects().slice(-4, -3)[0];
            if (e.target.name === 'p0') {
              curve.path[0][1] = pt.left;
              curve.path[0][2] = pt.top;
            } else if (e.target.name === 'p1') {
              curve.path[1][1] = pt.left;
              curve.path[1][2] = pt.top;
            } else if (e.target.name === 'p2') {
              curve.path[1][3] = pt.left;
              curve.path[1][4] = pt.top;
            }
            ctrl.canvas.renderAll();
          }
        });

        ctrl.canvas.on('object:added', function() {
          if (
            ctrl.drawMode === DRAW_MODE_NONE ||
            ctrl.drawMode === DRAW_MODE_PENCIL) {
            var shape = ctrl.canvas._objects[ctrl.canvas._objects.length - 1];
            if (!ctrl.undoFlag) {
              ctrl.canvasObjects.push(shape);
            }
            ctrl.undoFlag = false;
            if (!ctrl.isRedo) {
              undoStackPush({
                action: 'add',
                object: shape
              });
              ctrl.objectRedoStack = [];
            }
            ctrl.isRedo = false;
          }
        });

        ctrl.canvas.on('object:scaling', function() {
          if (ctrl.canvas.getActiveObject().get('type') === 'textbox') {
            var text = ctrl.canvas.getActiveObject();
            var scaleX = text.get('scaleX');
            var scaleY = text.get('scaleY');
            var width = text.get('width');
            var height = text.get('height');
            ctrl.canvas.getActiveObject().set({
              width: width * scaleX,
              height: height * scaleY,
              scaleX: 1,
              scaleY: 1
            });
          }
        });

        var onSelection = function() {
          if (
            ctrl.drawMode === DRAW_MODE_NONE ||
            ctrl.drawMode === DRAW_MODE_PENCIL) {
            var shape = ctrl.canvas.getActiveObject();
            ctrl.layerNum = ctrl.canvas._objects.indexOf(shape) + 1;
            ctrl.fillPicker.setOptions({
              color: shape.get('fill')
            });
            ctrl.strokePicker.setOptions({
              color: shape.get('stroke')
            });
            ctrl.objectIsSelected = true;
            var strokeWidthShapes = [
              'rect', 'circle', 'path', 'line', 'polyline'];
            if (strokeWidthShapes.indexOf(shape.get('type')) !== -1) {
              ctrl.fabricjsOptions.size = (
                shape.get('strokeWidth').toString() + 'px');
            } else if (shape.get('type') === 'textbox') {
              ctrl.displayFontStyles = true;
              ctrl.fabricjsOptions.size = (
                shape.get('fontSize').toString() + 'px');
              ctrl.fabricjsOptions.fontFamily = shape.get('fontFamily');
              ctrl.fabricjsOptions.italic = shape.get('fontStyle') === 'italic';
              ctrl.fabricjsOptions.bold = shape.get('fontWeight') === 'bold';
            }
            $scope.$applyAsync();
          }
        };

        ctrl.canvas.on('selection:created', function() {
          onSelection();
        });

        ctrl.canvas.on('selection:updated', function() {
          onSelection();
        });

        ctrl.canvas.on('selection:cleared', function() {
          ctrl.objectIsSelected = false;
          ctrl.displayFontStyles = false;
        });
        $scope.$applyAsync();
      };

      ctrl.setCanvasDimensions = function() {
        ctrl.canvas.setHeight(CANVAS_HEIGHT);
        ctrl.canvas.setWidth(CANVAS_WIDTH);
        ctrl.canvas.renderAll();
      };

      var initializeFabricJs = function() {
        ctrl.canvas = new fabric.Canvas(ctrl.canvasID);
        ctrl.setCanvasDimensions();
        ctrl.canvas.selection = false;
        ctrl.initializeMouseEvents();
        createColorPicker('stroke');
        createColorPicker('fill');
        createColorPicker('bg');
        fabric.Object.prototype.originX = 'center';
        fabric.Object.prototype.originY = 'center';
      };

      ctrl.$onInit = function() {
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
            initializeFabricJs();
          });
        }
      };
    }
  ]
});
