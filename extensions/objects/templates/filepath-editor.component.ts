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
 * @fileoverview Component for filepath editor.
 */

// This component can only be used in the context of an exploration.
/**
 * NOTE: These are some hacky behavior in the component class. Apologies in
 * advance if you were stuck on one of these for a long time.
 *
 * 1. Whenever changing a property of the data property of this component
 * class, please make sure the object is reassigned. Angular's change detection
 * uses the `===` operator which would only return false when the object
 * changes. You can use the spread operator to achieve the desired result.
 * Eg: this.data = {..this.data};
 *
 * 2. Angular treats SVG+XMl as dangerous by default. To show this image in the
 * view, we run our own security (for our own safety) and circumvent the angular
 * security. When we circumvent Angular's security checks, it attaches some
 * additional information to inform the Angular's view engine to not run
 * security checks on the image data. This can only be done the in html file
 * using property binding (i.e. [src]). If we use this in the ts file, by doing
 * `const img = new Image; img.src = circumventedValue;`, Angular will raise
 * errors.
 * In addition to this, our custom functions will also fail for this data. To
 * overcome this, during the migration of this component, a new property called
 * imgData was introduced. This contains the not circumvented value for svgs or
 * just the normal image data for other file formats. While updating
 * `this.data.metadata.uploadedImageData`, make sure that you also update
 * imgData. Failing to do so could lead to unpredictable behavior.
 */
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';
import { AlertsService } from 'services/alerts.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';
import { DeviceInfoService} from 'services/contextual/device-info.service';
import { fabric } from 'fabric';
import Picker from 'vanilla-picker';
import { boolean } from 'mathjs';
import { FeedbackPopupBackendApiService } from 'pages/exploration-player-page/services/feedback-popup-backend-api.service';
const gifFrames = require('gif-frames');
const gifshot = require('gifshot');

// These constants are used to identify the tool that is currently being
// used so that other tools can be disabled accordingly.
const STATUS_EDITING = 'editing';
const STATUS_SAVED = 'saved';
const DRAW_MODE_POLY = 'polygon';
const DRAW_MODE_PENCIL = 'pencil';
const DRAW_MODE_BEZIER = 'bezier';
const DRAW_MODE_PIECHART = 'piechart';
const DRAW_MODE_SVG_UPLOAD = 'svgupload';
const DRAW_MODE_NONE = 'none';
const OPEN_POLYGON_MODE = 'open';
const CLOSED_POLYGON_MODE = 'closed';
// The canvas height and width were determined based on the initial
// modal dimensions.
const CANVAS_WIDTH = 494;
const CANVAS_HEIGHT = 368;
interface FilepathData {
  mode: number;
  metadata: {
    uploadedFile?: File;
    uploadedImageData?: string | SafeResourceUrl;
    originalWidth?: number;
    originalHeight?: number;
    savedImageFilename?: string;
    savedImageUrl?: string;
  };
  crop: boolean;
}

interface Dimensions {
  height: number;
  width: number;
}

interface SvgImageData {
  savedSvgFileName: string,
  savedSvgUrl: string
}

// Reference: https://github.com/yahoo/gifshot#creategifoptions-callback.
interface GifshotCallbackObject {
  image: string,
  cameraStream: MediaStream,
  error: boolean,
  errorCode: string,
  errorMsg: string,
  savedRenderingContexts: ImageData
}

@Component({
  selector: 'filepath-editor',
  templateUrl: './filepath-editor.component.html',
  styleUrls: []
})
export class FilepathEditorComponent implements OnInit, OnChanges {
  @Input() modalId;
  @Input() value;
  @Output() valueChanged = new EventEmitter();
  MODE_EMPTY = 1;
  MODE_UPLOADED = 2;
  MODE_SAVED = 3;

  // We only use PNG format since that is what canvas can export to in
  // all browsers.
  // TODO(sll): See if we can add support for other image formats.
  OUTPUT_IMAGE_FORMAT = {
    png: 'png',
    gif: 'gif',
    svg: 'svg'
  };

  OUTPUT_IMAGE_MAX_WIDTH_PX = 490;

  CROP_BORDER_MARGIN_PX = 10;
  CROP_AREA_MIN_WIDTH_PX = 40;
  CROP_AREA_MIN_HEIGHT_PX = 40;

  // Categorize mouse positions with respect to the crop area.
  MOUSE_TOP_LEFT = 1;
  MOUSE_TOP = 2;
  MOUSE_TOP_RIGHT = 3;
  MOUSE_RIGHT = 4;
  MOUSE_BOTTOM_RIGHT = 5;
  MOUSE_BOTTOM = 6;
  MOUSE_BOTTOM_LEFT = 7; 
  MOUSE_LEFT = 8;
  MOUSE_INSIDE = 9;

  // Define the cursors for the crop area.
  CROP_CURSORS: Record<string, string> = {};
  imageContainerStyle = {};
  allowedImageFormats = AppConstants.ALLOWED_IMAGE_FORMATS;
  HUNDRED_KB_IN_BYTES: number = 100 * 1024;
  imageResizeRatio: number;
  cropArea: { x1: number; y1: number; x2: number; y2: number; };
  mousePositionWithinCropArea: null | number;
  mouseLastKnownCoordinates: { x: number; y: number; };
  lastMouseDownEventCoordinates: { x: number; y: number; };
  userIsDraggingCropArea: boolean = false;
  cropAreaResizeDirection: null | number;
  userIsResizingCropArea: boolean = false;
  invalidTagsAndAttributes: { tags: string[]; attrs: string[]; };
  processedImageIsTooLarge: boolean;
  entityId: string;
  entityType: string;
  canvas = new fabric.Canvas()
  initializedSvgImage: boolean = false;
  createSvgMode: boolean = false;
  drawMode = DRAW_MODE_NONE;
  polygonMode = CLOSED_POLYGON_MODE;
  isTouchDevice: boolean;
  // The polyOptions is used to store the points of the polygon in the
  // open and closed polygon tool.
  polyOptions = {
    x: 0,
    y: 0,
    bboxPoints: [],
    lines: [],
    lineCounter: 0,
    shape: null
  };
  // These sizes are used in the strokeWidth options dropdown.
  sizes = [
    '1px', '2px', '3px', '5px', '9px', '10px', '12px',
    '14px', '18px', '24px', '30px', '36px'];
  // These fonts are used in the font family options dropdown.
  fontFamily = [
    'Arial',
    'Helvetica',
    'Myriad Pro',
    'Delicious',
    'Verdana',
    'Georgia',
    'Courier',
    'Comic Sans MS',
    'Impact',
    'Monaco',
    'Optima',
    'Plaster',
    'Engagement'
  ];
  // Dynamically assign a unique id to each lc editor to avoid clashes
  // when there are multiple RTEs in the same page.
  randomId: string = Math.floor(Math.random() * 100000).toString();
  // The canvasId is used to identify the fabric js
  // canvas element in the editor.
  canvasID: string = 'canvas' + this.randomId;
  // The following picker variables are used to store the objects returned
  // from the vanilla color picker.
  fillPicker = null;
  strokePicker = null;
  bgPicker = null;
  diagramWidth = 450;
  currentDiagramWidth = 450;
  diagramHeight = 350;
  currentDiagramHeight = 350;
  // The data variable is used to store the saved svg data
  // and the filename.
  // svgData: SvgImageData
  // The diagramStatus stores the mode of the tool that is being used.
  diagramStatus = STATUS_EDITING;
  displayFontStyles = false;
  objectUndoStack = [];
  objectRedoStack = [];
  canvasObjects = [];
  undoFlag = false;
  isRedo = false;
  undoLimit = 5;
  savedSvgDiagram = '';
  imageSaveDestination = this.contextService.getImageSaveDestination();
  svgContainerStyle = {};
  layerNum = 0;
  fabricjsOptions = {
    stroke: 'rgba(0, 0, 0, 1)',
    fill: 'rgba(0, 0, 0, 0)',
    bg: 'rgba(0, 0, 0, 0)',
    fontFamily: 'Helvetica',
    size: '3px',
    bold: false,
    italic: false
  };
  objectIsSelected = false;
  pieChartDataLimit = 10;
  groupCount = 0;
  pieChartDataInput = [{
    name: 'Data name 1',
    data: 10,
    color: '#ff0000',
    angle: 0
  },
  {
    name: 'Data name 2',
    data: 10,
    color: '#00ff00',
    angle: 0
  }];
  // this.allowedImageFormats = ['svg'];
  uploadedSvgDataUrl = null;
  loadType = 'group';
  defaultTopCoordinate = 50;
  defaultLeftCoordinate = 50;
  defaultRadius = 30;
  // Check the note before imports and after fileoverview.
  private imgData;
  // Check the note before imports and after fileoverview.
  private _data: FilepathData;

  // Check the note before imports and after fileoverview.
  get data(): FilepathData {
    return this._data;
  }
  set data(value: FilepathData) {
    this._data = value;
    this.validate(this._data);
  }
  cropAreaXWhenLastDown: number;
  cropAreaYWhenLastDown: number;

  constructor(
    private alertsService: AlertsService,
    private assetsBackendApiService: AssetsBackendApiService,
    private contextService: ContextService,
    private csrfTokenService: CsrfTokenService,
    private imageLocalStorageService: ImageLocalStorageService,
    private imagePreloaderService: ImagePreloaderService,
    private imageUploadHelperService: ImageUploadHelperService,
    private svgSanitizerService: SvgSanitizerService,
    private urlInterpolationService: UrlInterpolationService,
    private deviceInfoService: DeviceInfoService
  ) {}

  ngOnInit(): void {
    this.CROP_CURSORS[this.MOUSE_TOP_LEFT] = 'nwse-resize';
    this.CROP_CURSORS[this.MOUSE_TOP] = 'ns-resize';
    this.CROP_CURSORS[this.MOUSE_TOP_RIGHT] = 'nesw-resize';
    this.CROP_CURSORS[this.MOUSE_RIGHT] = 'ew-resize';
    this.CROP_CURSORS[this.MOUSE_BOTTOM_RIGHT] = 'nwse-resize';
    this.CROP_CURSORS[this.MOUSE_BOTTOM] = 'ns-resize';
    this.CROP_CURSORS[this.MOUSE_BOTTOM_LEFT] = 'nesw-resize';
    this.CROP_CURSORS[this.MOUSE_LEFT] = 'ew-resize';
    this.CROP_CURSORS[this.MOUSE_INSIDE] = 'move';
    /** Scope variables and functions (visibles to the view) */

    // This variable holds information about the image upload flow.
    // It's always guaranteed to have the 'mode' and 'metadata'
    // properties.
    //
    // See below a description of each mode.
    //
    // MODE_EMPTY:
    //   The user has not uploaded an image yet.
    //   In this mode, data.metadata will be an empty object:
    //     {}
    //
    // MODE_UPLOADED:
    //   The user has uploaded an image but it is not yet saved.
    //   All the crop and resizing happens at this stage.
    //   In this mode, data.metadata will contain the following info:
    //     {
    //       uploadedFile: <a File object>,
    //       uploadedImageData: <binary data corresponding to the image>,
    //       originalWidth: <original width of the uploaded image>,
    //       originalHeight: <original height of the uploaded image>
    //     }
    //
    // MODE_SAVED:
    //   The user has saved the final image for use in Oppia.
    //   At this stage, the user can click on the trash to start over.
    //   In this mode, data.metadata will contain the following info:
    //     {
    //       savedImageFilename: <File name of the resource for the image>
    //       savedImageUrl: <Trusted resource Url for the image>
    //     }.
    this.data = { mode: this.MODE_EMPTY, metadata: {}, crop: true };

    // Resizing properties.
    this.imageResizeRatio = 1;

    // Cropping properties.
    this.cropArea = { x1: 0, y1: 0, x2: 0, y2: 0 };
    this.mousePositionWithinCropArea = null;
    this.mouseLastKnownCoordinates = { x: 0, y: 0 };
    this.lastMouseDownEventCoordinates = { x: 0, y: 0 };
    this.userIsDraggingCropArea = false;
    this.userIsResizingCropArea = false;
    this.cropAreaResizeDirection = null;
    this.invalidTagsAndAttributes = {
      tags: [],
      attrs: []
    };
    this.processedImageIsTooLarge = false;

    this.entityId = this.contextService.getEntityId();
    this.entityType = this.contextService.getEntityType();

    window.addEventListener('mouseup', (e) => {
      e.preventDefault();
      this.userIsDraggingCropArea = false;
      this.userIsResizingCropArea = false;
    }, false);
    if (this.value) {
      this.resetComponent(this.value);
    }
    this.isTouchDevice = this.deviceInfoService.hasTouchEvents();
  }

  polyPoint = function(x, y) {
    this.x = x;
    this.y = y;
  };

  initializeFabricJs(): void {
    this.canvas = new fabric.Canvas(this.canvasID);
    this.setCanvasDimensions();
    this.canvas.selection = false;
    this.initializeMouseEvents();
    this.createColorPicker('stroke');
    this.createColorPicker('fill');
    this.createColorPicker('bg');
    // This is used to change the origin of shapes from top left corner
    // to center of the shape. This is used to align the quadratic bezier
    // control points correctly to the curve.
    fabric.Object.prototype.originX = 'center';
    fabric.Object.prototype.originY = 'center';
  };

  onFillChange(): void {
    // Fetches the bezier curve and then the fill color.
    if (this.drawMode === DRAW_MODE_BEZIER) {
      this.getQuadraticBezierCurve().set({
        fill: this.fabricjsOptions.fill
      });
      this.canvas.renderAll();
    } else {
      let shape = this.canvas.getActiveObject();
      let fillShapes = ['rect', 'circle', 'path', 'textbox', 'polyline'];
      if (shape && fillShapes.indexOf(shape.get('type')) !== -1) {
        shape.set({
          fill: this.fabricjsOptions.fill
        });
        this.canvas.renderAll();
      }
    }
  };

  onBgChange(): void {
    this.canvas.setBackgroundColor(this.fabricjsOptions.bg);
    this.canvas.renderAll();
  };

  createColorPicker(value: string): void {
    let parent = document.getElementById(value + '-color');
    console.log(parent)
    let onChangeFunc = {
      stroke: this.onStrokeChange(),
      fill: this.onFillChange(),
      bg: this.onBgChange(),
    };

    let onOpen = () => {
      // This DOM manipulation is necessary because the color picker is not
      // configurable in the third-party module.
      let alphaSliders = document.querySelectorAll(
        '.picker_alpha .picker_selector');
      alphaSliders.forEach((element) => {
        element.setAttribute('title', 'Transparency Slider');
      });
    };
    let onChange = (color) => {
      parent.style.background = color.rgbaString;
      var topAlphaSquare = document.getElementById(
        'top-' + value + '-alpha');
      var bottomAlphaSquare = document.getElementById(
        'bottom-' + value + '-alpha');
      var opacity = 1 - color.rgba[3];
      topAlphaSquare.style.opacity = opacity.toString();
      bottomAlphaSquare.style.opacity = opacity.toString();
      this.fabricjsOptions[value] = color.rgbaString;
      onChangeFunc;
    };
    let picker = new Picker({
      parent: parent,
      color: this.fabricjsOptions[value],
      onOpen: onOpen,
      onChange: onChange
    });
    parent.style.background = this.fabricjsOptions[value];
    if (value === 'stroke') {
      this.strokePicker = picker;
    }
    if (value === 'fill') {
      this.fillPicker = picker;
    }
    if (value === 'bg') {
      this.bgPicker = picker;
    }
  };

  getQuadraticBezierCurve = () => {
    if (this.drawMode === DRAW_MODE_BEZIER) {
      // The order of objects being added are the path followed by
      // three control points. Therefore the 4th from the last is the
      // quadratic curve.
      return this.canvas.getObjects().slice(-4, -3)[0];
    }
  };

  onStrokeChange(): void {
    if (this.drawMode === DRAW_MODE_BEZIER) {
      this.getQuadraticBezierCurve().set({
        stroke: this.fabricjsOptions.stroke
      });
      this.canvas.renderAll();
    } else {
      let shape = this.canvas.getActiveObject();
      let strokeShapes = ['rect', 'circle', 'path', 'line', 'polyline'];
      this.canvas.freeDrawingBrush.color = this.fabricjsOptions.stroke;
      if (shape && strokeShapes.indexOf(shape.get('type')) !== -1) {
        shape.set({
          stroke: this.fabricjsOptions.stroke
        });
        this.canvas.renderAll();
      }
    }
  };

  setCanvasDimensions(): void {
    this.canvas.setHeight(CANVAS_HEIGHT);
    this.canvas.setWidth(CANVAS_WIDTH);
    this.canvas.renderAll();
  };

  makePolygon(): void {
    // The startPt is the initial point in the polygon and it is also the
    // last point if the polygon is closed.
    let startPt = this.polyOptions.bboxPoints[0];
    if (this.polygonMode === CLOSED_POLYGON_MODE) {
      this.polyOptions.bboxPoints.push(
        new this.polyPoint(startPt.x, startPt.y));
    }
    var shape = new fabric.Polyline(this.polyOptions.bboxPoints, {
      fill: this.fabricjsOptions.fill,
      stroke: this.fabricjsOptions.stroke,
      strokeWidth: this.getSize(),
      strokeUniform: true,
      strokeLineCap: 'round'
    });
    return shape;
  };

  getSize(): number {
    let size = this.fabricjsOptions.size;
    // Removes the word "px" from the end of the string and converts
    // into an int.
    return parseInt(size);
  };

  createPolyShape(): void {
    // This function removes the individual lines and draws the polygon.
    this.polyOptions.lines.forEach((value) => {
      this.canvas.remove(value);
    });
    if (this.polyOptions.bboxPoints.length > 0) {
      this.polyOptions.shape = this.makePolygon();
      this.canvas.add(this.polyOptions.shape);
    }
    this.canvas.hoverCursor = 'move';
    // While drawing the polygon the objects are treated as nonselectable
    // and once the polygon is created the objects are converted into
    // selectable.
    this.canvas.forEachObject((object) => {
      object.selectable = true;
    });
    this.canvas.renderAll();
    this.polyOptions.bboxPoints = [];
    this.polyOptions.lines = [];
    this.polyOptions.lineCounter = 0;
  };

  setPolyStartingPoint(options): void {
    let mouse = this.canvas.getPointer(options.e);
    this.polyOptions.x = mouse.x;
    this.polyOptions.y = mouse.y;
  };

  initializeMouseEvents(): void {
    // Adding event listener for polygon tool.
    this.canvas.on('mouse:dblclick', () => {
      if (this.drawMode === DRAW_MODE_POLY) {
        this.drawMode = DRAW_MODE_NONE;
        this.createPolyShape();
      }
    });

    this.canvas.on('mouse:down', (options) => {
      // Used to detect the mouse clicks when drawing the polygon.
      if (this.drawMode === DRAW_MODE_POLY) {
        this.setPolyStartingPoint(options);
        var x = this.polyOptions.x;
        var y = this.polyOptions.y;
        this.polyOptions.bboxPoints.push(new this.polyPoint(x, y));
        var points = [x, y, x, y];
        var stroke = this.fabricjsOptions.stroke;
        // Ensures that the polygon lines are visible when
        // creating the polygon.
        stroke = stroke.slice(0, -2) + '1)';
        var line = new fabric.Line(points, {
          strokeWidth: this.getSize(),
          selectable: false,
          stroke: stroke,
          strokeLineCap: 'round'
        });
        // Enables drawing a polygon in a device with touch support.
        if (
          this.polyOptions.lines.length !== 0 &&
          this.drawMode === DRAW_MODE_POLY &&
          this.isTouchDevice) {
          this.setPolyStartingPoint(options);
          this.polyOptions.lines[this.polyOptions.lineCounter - 1].set({
            x2: this.polyOptions.x,
            y2: this.polyOptions.y,
          });
          this.canvas.renderAll();
        }
        this.polyOptions.lines.push(line);
        this.canvas.add(
          this.polyOptions.lines[this.polyOptions.lineCounter]);
        this.polyOptions.lineCounter++;
      }
    });

    this.canvas.on('mouse:move', (options) => {
      // Detects the mouse movement while drawing the polygon.
      if (
        this.polyOptions.lines.length !== 0 &&
        this.drawMode === DRAW_MODE_POLY &&
        !this.isTouchDevice) {
        this.setPolyStartingPoint(options);
        this.polyOptions.lines[this.polyOptions.lineCounter - 1].set({
          x2: this.polyOptions.x,
          y2: this.polyOptions.y,
        });
        this.canvas.renderAll();
      }
    });

    this.canvas.on('object:moving',(e) => {
      // Detects the movement in the control points when
      // drawing the bezier curve.
      if (this.drawMode === DRAW_MODE_BEZIER) {
        var pt = e.target;
        var curve = this.getQuadraticBezierCurve();
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
        this.canvas.renderAll();
      }
    });

    this.canvas.on('object:added', () => {
      // Ensures that the quadratic bezier control points are
      // not added to the undoStack.
      if (
        this.drawMode === DRAW_MODE_NONE ||
        this.drawMode === DRAW_MODE_PENCIL) {
        var shape = this.canvas._objects[this.canvas._objects.length - 1];
        if (!this.undoFlag) {
          this.canvasObjects.push(shape);
        }
        this.undoFlag = false;
        if (!this.isRedo) {
          this.undoStackPush({
            action: 'add',
            object: shape
          });
          this.objectRedoStack = [];
        }
        this.isRedo = false;
      }
    });

    this.canvas.on('object:scaling', () => {
      // Prevents the textbox from scaling.
      if (this.canvas.getActiveObject().get('type') === 'textbox') {
        var text = this.canvas.getActiveObject();
        var scaleX = text.get('scaleX');
        var scaleY = text.get('scaleY');
        var width = text.get('width');
        var height = text.get('height');
        this.canvas.getActiveObject().set({
          width: width * scaleX,
          height: height * scaleY,
          scaleX: 1,
          scaleY: 1
        });
      }
    });

    let onSelection = () => {
      // Ensures that the fabricjsOptions doesn't change when the user
      // selects the quadratic bezier control points.
      if (
        this.drawMode === DRAW_MODE_NONE ||
        this.drawMode === DRAW_MODE_PENCIL) {
        var shape = this.canvas.getActiveObject();
        this.layerNum = this.canvas._objects.indexOf(shape) + 1;
        this.fillPicker.setOptions({
          color: shape.get('fill')
        });
        this.strokePicker.setOptions({
          color: shape.get('stroke')
        });
        this.objectIsSelected = true;
        var strokeWidthShapes = [
          'rect', 'circle', 'path', 'line', 'polyline'];
        if (strokeWidthShapes.indexOf(shape.get('type')) !== -1) {
          this.fabricjsOptions.size = (
            shape.get('strokeWidth').toString() + 'px');
          this.displayFontStyles = false;
        } else if (shape.get('type') === 'textbox') {
          this.displayFontStyles = true;
          this.fabricjsOptions.size = (
            shape.get('fontSize').toString() + 'px');
          this.fabricjsOptions.fontFamily = shape.get('fontFamily');
          this.fabricjsOptions.italic = shape.get('fontStyle') === 'italic';
          this.fabricjsOptions.bold = shape.get('fontWeight') === 'bold';
        } else {
          this.displayFontStyles = false;
        }
      }
    };

    this.canvas.on('selection:created', () => {
      onSelection();
    });

    this.canvas.on('selection:updated', () => {
      onSelection();
    });

    this.canvas.on('selection:cleared', () => {
      this.objectIsSelected = false;
      this.displayFontStyles = false;
    });
  };

  isFileUploaded(): boolean {
    return Boolean(this.uploadedSvgDataUrl !== null);
  };

  isDrawModeSvgUpload(): boolean {
    return Boolean(this.drawMode === DRAW_MODE_SVG_UPLOAD);
  };

  isOpenPolygonEnabled() {
    return (
      this.areAllToolsEnabled() || (
        this.isDrawModePolygon() &&
        this.polygonMode === OPEN_POLYGON_MODE));
  };

  isDrawModePolygon() {
    return this.drawMode === DRAW_MODE_POLY;
  };

  getTextIndex(text, lineNum, charIndex): number {
    return (
      text.split('\n').slice(0, lineNum).reduce((sum, textLine) => {
        return sum + textLine.length + 1;
      }, 0) + charIndex);
  };

  createChart(): void {
    let total = 0;
    let currentAngle = 0;
    let pieSlices = [];
    let legendText = '';
    const PIE_SLICE_COLOR_INDICATOR = '\u2587';
    for (let i = 0; i < this.pieChartDataInput.length; i++) {
      total += this.pieChartDataInput[i].data;
      legendText += (PIE_SLICE_COLOR_INDICATOR + ' - ');
      legendText += (
        this.pieChartDataInput[i].name + ' - ' +
        this.pieChartDataInput[i].data + '\n');
    }
    legendText = legendText.slice(0, -1);
    for (let i = 0; i < this.pieChartDataInput.length; i++) {
      this.pieChartDataInput[i].angle = (
        this.pieChartDataInput[i].data / total * Math.PI * 2);
      pieSlices.push(this.getPieSlice(
        new this.polyPoint(
          this.defaultTopCoordinate, this.defaultLeftCoordinate
        ), this.defaultRadius, currentAngle,
        currentAngle + this.pieChartDataInput[i].angle,
        this.pieChartDataInput[i].color));
      // If a pie slice has an angle greater than 180, then
      // it should be rendered first, otherwise it will overlap other
      // slices.
      if (this.pieChartDataInput[i].angle > Math.PI) {
        let pieSlice = pieSlices.pop();
        pieSlices.splice(0, 0, pieSlice);
      }
      currentAngle += this.pieChartDataInput[i].angle;
    }
    // The defaultTextSize is to prevent the text from being too small.
    // This can be changed again using editor.
    let defaultTextSize = '18px';
    this.fabricjsOptions.size = defaultTextSize;
    let text = new fabric.Textbox(legendText, {
      top: 100,
      left: 120,
      fontFamily: this.fabricjsOptions.fontFamily,
      fontSize: this.getSize(),
      fill: '#000000',
      fontWeight: this.fabricjsOptions.bold ? 'bold' : 'normal',
      fontStyle: this.fabricjsOptions.italic ? 'italic' : 'normal',
      width: 200
    });
    // Gives the color to the pie slice indicator which
    // is used to indentify the pie slice.
    for (let i = 0; i < this.pieChartDataInput.length; i++) {
      text.setSelectionStart(this.getTextIndex(legendText, i, 0));
      text.setSelectionEnd(this.getTextIndex(legendText, i, 1));
      text.setSelectionStyles({
        stroke: '#000',
        strokeWidth: 2,
        fill: this.pieChartDataInput[i].color,
      });
    }
    this.drawMode = DRAW_MODE_NONE;
    this.canvas.add(text);
    this.canvas.add(new fabric.Group(pieSlices));
    this.groupCount += 1;
  };

  getPieSlice(center, radius, startAngle, endAngle, color): void {
    // The pie slice is a combination of a semicircle and a triangle.
    // The following code is used to calculate the angle of the arc and
    // the points for drawing the polygon.
    let angle = endAngle - startAngle;
    let halfAngle = angle / 2;
    let halfChord = radius * Math.sin(angle / 2);
    let height = Math.sqrt(Math.pow(radius, 2) - Math.pow(halfChord, 2));
    let radiansToDegrees = 180 / Math.PI;

    let arc = new fabric.Circle({
      radius: radius,
      startAngle: -halfAngle,
      endAngle: halfAngle,
      left: center.x,
      top: center.y,
      originX: 'center',
      originY: 'center',
      fill: color,
      stroke: color,
      strokeWidth: 1,
      strokeUniform: true,
      id: 'group' + this.groupCount
    });
    arc.toSVG = this.createCustomToSVG(arc.toSVG, 'path', arc.id);
    let p1 = new this.polyPoint (height + center.x, center.y + halfChord);
    let p2 = new this.polyPoint (height + center.x, center.y - halfChord);
    let tri = new fabric.Polygon([center, p1, p2, center], {
      fill: color,
      stroke: color,
      strokeWidth: 1,
      strokeUniform: true,
      id: 'group' + this.groupCount
    });
    tri.toSVG = this.createCustomToSVG(tri.toSVG, tri.type, tri.id);
    let rotationAngle = (startAngle + halfAngle) * radiansToDegrees;
    let slice = new fabric.Group([arc, tri], {
      originX: 'center',
      originY: 'center',
      top: center.y,
      left: center.x,
      angle: rotationAngle,
    });
    return slice;
  };


  createPieChart(): void {
    if (this.drawMode === DRAW_MODE_NONE) {
      this.canvas.discardActiveObject();
      this.drawMode = DRAW_MODE_PIECHART;
    } else {
      this.createChart();
      // Resets the pie chart form.
      this.pieChartDataInput = [{
        name: 'Data name 1',
        data: 10,
        color: '#ff0000',
        angle: 0
      },
      {
        name: 'Data name 2',
        data: 10,
        color: '#00ff00',
        angle: 0
      }];
    }
  };

  loadTypeSelection(type: string): void {
    if(type === 'group'){
      this.loadType === 'group'
    } else {
      this.loadType === 'nogroup'
    }
  }

  loadSvgFile = (objects) => {
    if (this.loadType === 'group') {
      objects.forEach((obj) => {
        obj.set({
          id: 'group' + this.groupCount
        });
        obj.toSVG = this.createCustomToSVG(
          obj.toSVG, obj.type, obj.id);
      });
      this.canvas.add(new fabric.Group(objects));
      this.groupCount += 1;
    } else {
      objects.forEach((obj) => {
        this.canvas.add(obj);
      });
    }
  };

  bringObjectForward(): void {
    this.canvas.bringForward(this.canvas.getActiveObject());
    if (this.layerNum < this.canvas._objects.length) {
      this.layerNum += 1;
    }
  };

  sendObjectBackward(): void {
    this.canvas.sendBackwards(this.canvas.getActiveObject());
    if (this.layerNum > 1) {
      this.layerNum -= 1;
    }
  };

  undoStackPush(object): void {
    if (this.objectUndoStack.length === this.undoLimit) {
      this.objectUndoStack.shift();
    }
    this.objectUndoStack.push(object);
  };

  onUndo(): void {
    this.canvas.discardActiveObject();
    if (this.objectUndoStack.length > 0) {
      var undoObj = this.objectUndoStack.pop();
      if (undoObj.action === 'add') {
        var shape = this.canvasObjects.pop();
        var index = this.canvas._objects.indexOf(shape);
        this.canvas._objects.splice(index, 1);
        this.objectRedoStack.push({
          action: 'add',
          object: shape
        });
      } else {
        this.isRedo = true;
        this.objectRedoStack.push({
          action: 'remove',
          object: undoObj.object
        });
        // Adding the object in the correct position according to initial
        // order.
        this.undoFlag = true;
        this.canvasObjects.splice(undoObj.index, 0, undoObj.object);
        this.canvas.add(undoObj.object);
      }
      this.canvas.renderAll();
    }
  };

  isUndoEnabled(): boolean {
    return (
      this.drawMode === DRAW_MODE_NONE && this.objectUndoStack.length > 0);
  };

  onRedo(): void {
    this.canvas.discardActiveObject();
    if (this.objectRedoStack.length > 0) {
      let redoObj = this.objectRedoStack.pop();
      this.undoStackPush(redoObj);
      if (redoObj.action === 'add') {
        this.isRedo = true;
        // Not adding the shape to canvasObjects because it is added by the
        // event function.
        this.canvas.add(redoObj.object);
      } else {
        var shape = redoObj.object;
        var index = this.canvasObjects.indexOf(shape);
        this.canvasObjects.splice(index, 1);
        index = this.canvas._objects.indexOf(shape);
        this.canvas._objects.splice(index, 1);
      }
    }
    this.canvas.renderAll();
  };

  isRedoEnabled(): boolean {
    return (
      this.drawMode === DRAW_MODE_NONE && this.objectRedoStack.length > 0);
  };

  removeShape(): void {
    let shape = this.canvas.getActiveObject();
    let index = this.canvasObjects.indexOf(shape);
    if (shape) {
      this.undoStackPush({
        action: 'remove',
        object: shape,
        index: index
      });
      this.objectRedoStack = [];
      this.canvasObjects.splice(index, 1);
      this.canvas.remove(shape);
    }
  };

  onClear(): void {
    this.groupCount = 0;
    this.objectUndoStack = [];
    this.objectRedoStack = [];
    this.canvasObjects = [];
    if (this.canvas) {
      this.canvas.clear();
      this.onBgChange();
    }
  };

  isClearEnabled(): boolean {
    return (
      this.canvasObjects.length > 0 && this.drawMode === DRAW_MODE_NONE);
  };

  onBoldToggle(): void {
    let shape = this.canvas.getActiveObject();
    if (shape && shape.get('type') === 'textbox') {
      shape.set({
        fontWeight: this.fabricjsOptions.bold ? 'bold' : 'normal',
      });
      this.canvas.renderAll();
    }
  };

  onFontChange(): void {
    let shape = this.canvas.getActiveObject();
    if (shape && shape.get('type') === 'textbox') {
      shape.set({
        fontFamily: this.fabricjsOptions.fontFamily,
      });
      this.canvas.renderAll();
    }
  };

  onSizeChange(): void {
    // Ensures that the size change is applied only to the curve and
    // not to all the control points.
    if (this.drawMode === DRAW_MODE_BEZIER) {
      var numberOfEdgeControlPoints = 2;
      // Changes the radius of the edge control points.
      // A size 2 is added so that the control circles is not rendered
      // too small.
      this.canvas.getObjects().slice(-numberOfEdgeControlPoints).forEach(
        (object) => {
          object.set({
            radius: this.getSize() + 2
          });
        });
      this.getQuadraticBezierCurve().set({
        strokeWidth: this.getSize()
      });
      this.canvas.renderAll();
    } else {
      var shape = this.canvas.getActiveObject();
      this.canvas.freeDrawingBrush.width = this.getSize();
      var strokeWidthShapes = [
        'rect', 'circle', 'path', 'line', 'polyline'];
      if (shape && strokeWidthShapes.indexOf(shape.get('type')) !== -1) {
        shape.set({
          strokeWidth: this.getSize()
        });
        this.canvas.renderAll();
      } else if (shape && shape.get('type') === 'textbox') {
        shape.set({
          fontSize: this.getSize()
        });
        this.canvas.renderAll();
      }
    }
  };

  isSizeVisible(): boolean {
    return Boolean(
      this.objectIsSelected || this.drawMode !== DRAW_MODE_NONE);
  };

  isPieChartEnabled(): boolean {
    return Boolean(
      this.areAllToolsEnabled() ||
      this.drawMode === DRAW_MODE_PIECHART);
  };

  isDiagramCreated () {
    // This function checks if any shape has been created or not.
    return Boolean(
      !this.isUserDrawing() &&
      this.diagramStatus === STATUS_EDITING &&
      this.canvas && this.canvas.getObjects().length > 0);
  };

  isUserDrawing(): Boolean {
    return Boolean(this.canvas && this.drawMode !== DRAW_MODE_NONE);
  };

  /** Internal functions (not visible in the view) */

  private resetComponent(newValue) {
    // Reset the component each time the value changes
    // (e.g. if this is part of an editable list).
    if (newValue) {
      this.setSavedImageFilename(newValue, false);
      const dimensions = (
        this.imagePreloaderService.getDimensionsOfImage(newValue));
      this.imageContainerStyle = {
        height: dimensions.height + 'px',
        width: dimensions.width + 'px'
      };
    }
  }

  /**
   * Resamples an image to the specified dimension.
   *
   * @param imageDataURI A DOMString containing the input image data URI.
   * @param width The desired output width.
   * @param height The desired output height.
   * @return A DOMString containing the output image data URI.
   */

  private getResampledImageData(imageDataURI, width, height) {
    // Create an Image object with the original data.
    const img = new Image();
    img.src = imageDataURI;

    // Create a Canvas and draw the image on it, resampled.
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/' + this.OUTPUT_IMAGE_FORMAT.png, 1);
  }


  /**
   * Crops an image to the specified rectangular region.
   *
   * @param imageDataURI A DOMString containing the input image data URI.
   * @param x The x coorinate of the top-left corner of the crop region.
   * @param y The y coorinate of the top-left corner of the crop region.
   * @param width The width of the crop region.
   * @param height The height of the crop region.
   * @return A DOMString containing the output image data URI.
   */

  private getCroppedImageData(imageDataURI, x, y, width, height) {
    // Put the original image in a canvas.
    const img = new Image();
    img.src = imageDataURI;
    const canvas = document.createElement('canvas');
    canvas.width = x + width;
    canvas.height = y + height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Get image data for a cropped selection.
    const data = ctx.getImageData(x, y, width, height);

    // Draw on a separate canvas and return the dataURL.
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = width;
    cropCanvas.height = height;
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.putImageData(data, 0, 0);
    return cropCanvas.toDataURL('image/' + this.OUTPUT_IMAGE_FORMAT.png, 1);
  }


  private async getCroppedGIFDataAsync(
      x: number, y: number, width: number, height: number,
      imageDataURI: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Put the original image in a canvas.
      let img = new Image();
      img.src = imageDataURI;
      img.addEventListener('load', () => {
        // If the image loads,
        // fulfill the promise with the cropped dataURL.
        const canvas = document.createElement('canvas');
        canvas.width = x + width;
        canvas.height = y + height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Get image data for a cropped selection.
        const data = ctx.getImageData(x, y, width, height);

        // Draw on a separate canvas and return the dataURL.
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = width;
        cropCanvas.height = height;
        const cropCtx = cropCanvas.getContext('2d');
        cropCtx.putImageData(data, 0, 0);
        resolve(cropCanvas.toDataURL('image/png'));
      }, false);
      img.addEventListener('error', () => {
        reject(new Error('Image could not be loaded.'));
      }, false);
    });
  }


  private getEventCoorindatesRelativeToImageContainer(e) {
    // Even though the event listeners are added to the image container,
    // the events seem to be reported with 'target' set to the deepest
    // element where the event occurred. In other words, if the event
    // occurred outside of the crop area, then the (x, y) reported will be
    // the one with respect to the image container, but if the event
    // occurs inside the crop area, then the (x, y) reported will be the
    // one with respect to the crop area itself. So this function does
    // normalization on the (x, y) values so that they are always reported
    // with respect to the image container (makes calculations easier).
    let x = e.offsetX;
    let y = e.offsetY;
    const containerClass = 'filepath-editor-image-crop-container';
    let node = e.target;
    while (node !== null && !node.classList.contains(containerClass)) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent;
    }
    return { x: x, y: y };
  }

  private clamp(value, min, max) {
    return Math.min(Math.max(min, value), max);
  }

  private handleMouseMoveWhileDraggingCropArea(x, y) {
    const xDown = this.lastMouseDownEventCoordinates.x;
    const yDown = this.lastMouseDownEventCoordinates.y;
    const x1WhenDown = this.cropAreaXWhenLastDown;
    const y1WhenDown = this.cropAreaYWhenLastDown;

    // Calculate new position of the crop area.
    let x1 = x1WhenDown + (x - xDown);
    let y1 = y1WhenDown + (y - yDown);

    // Correct for boundaries.
    const dimensions = this.calculateTargetImageDimensions();
    const cropWidth = this.cropArea.x2 - this.cropArea.x1;
    const cropHeight = this.cropArea.y2 - this.cropArea.y1;
    x1 = this.clamp(x1, 0, dimensions.width - cropWidth);
    y1 = this.clamp(y1, 0, dimensions.height - cropHeight);

    // Update crop area coordinates.
    this.cropArea.x1 = x1;
    this.cropArea.y1 = y1;
    this.cropArea.x2 = x1 + cropWidth;
    this.cropArea.y2 = y1 + cropHeight;
  }

  private handleMouseMoveWhileResizingCropArea(x, y) {
    const dimensions = this.calculateTargetImageDimensions();
    const direction = this.cropAreaResizeDirection;

    const adjustResizeLeft = (x) => {
      // Update crop area x1 value, correcting for boundaries.
      this.cropArea.x1 = this.clamp(
        x, 0, this.cropArea.x2 - this.CROP_AREA_MIN_WIDTH_PX);
    };

    const adjustResizeRight = (x) => {
      // Update crop area x2 value, correcting for boundaries.
      this.cropArea.x2 = this.clamp(
        x,
        this.CROP_AREA_MIN_WIDTH_PX + this.cropArea.x1,
        dimensions.width);
    };

    const adjustResizeTop = (y) => {
      // Update crop area y1 value, correcting for boundaries.
      this.cropArea.y1 = this.clamp(
        y, 0, this.cropArea.y2 - this.CROP_AREA_MIN_HEIGHT_PX);
    };

    const adjustResizeBottom = (y) => {
      // Update crop area y2 value, correcting for boundaries.
      this.cropArea.y2 = this.clamp(
        y,
        this.CROP_AREA_MIN_HEIGHT_PX + this.cropArea.y1,
        dimensions.height);
    };

    switch (direction) {
      case this.MOUSE_TOP_LEFT:
        adjustResizeTop(y);
        adjustResizeLeft(x);
        break;
      case this.MOUSE_TOP:
        adjustResizeTop(y);
        break;
      case this.MOUSE_TOP_RIGHT:
        adjustResizeTop(y);
        adjustResizeRight(x);
        break;
      case this.MOUSE_RIGHT:
        adjustResizeRight(x);
        break;
      case this.MOUSE_BOTTOM_RIGHT:
        adjustResizeBottom(y);
        adjustResizeRight(x);
        break;
      case this.MOUSE_BOTTOM:
        adjustResizeBottom(y);
        break;
      case this.MOUSE_BOTTOM_LEFT:
        adjustResizeBottom(y);
        adjustResizeLeft(x);
        break;
      case this.MOUSE_LEFT:
        adjustResizeLeft(x);
        break;
    }
  }

  private updatePositionWithinCropArea(x, y) {
    const margin = this.CROP_BORDER_MARGIN_PX;
    const cx1 = this.cropArea.x1;
    const cy1 = this.cropArea.y1;
    const cx2 = this.cropArea.x2;
    const cy2 = this.cropArea.y2;

    const xOnLeftBorder = x > cx1 - margin && x < cx1 + margin;
    const xOnRightBorder = x > cx2 - margin && x < cx2 + margin;
    const yOnTopBorder = y > cy1 - margin && y < cy1 + margin;
    const yOnBottomBorder = y > cy2 - margin && y < cy2 + margin;
    const xInside = x > cx1 && x < cx2;
    const yInside = y > cy1 && y < cy2;

    // It is important to check the pointer position for corners first,
    // since the conditions overlap. In other words, the pointer can be
    // at the top border and at the top-right corner at the same time, in
    // which case we want to recognize the corner.
    if (xOnLeftBorder && yOnTopBorder) {
      // Upper left corner.
      this.mousePositionWithinCropArea = this.MOUSE_TOP_LEFT;
    } else if (xOnRightBorder && yOnTopBorder) {
      // Upper right corner.
      this.mousePositionWithinCropArea = this.MOUSE_TOP_RIGHT;
    } else if (xOnLeftBorder && yOnBottomBorder) {
      // Lower left corner.
      this.mousePositionWithinCropArea = this.MOUSE_BOTTOM_LEFT;
    } else if (xOnRightBorder && yOnBottomBorder) {
      // Lower right corner.
      this.mousePositionWithinCropArea = this.MOUSE_BOTTOM_RIGHT;
    } else if (yOnTopBorder) {
      // Top border.
      this.mousePositionWithinCropArea = this.MOUSE_TOP;
    } else if (xOnLeftBorder) {
      // Left border.
      this.mousePositionWithinCropArea = this.MOUSE_LEFT;
    } else if (xOnRightBorder) {
      // Right border.
      this.mousePositionWithinCropArea = this.MOUSE_RIGHT;
    } else if (yOnBottomBorder) {
      // Bottom border.
      this.mousePositionWithinCropArea = this.MOUSE_BOTTOM;
    } else if (xInside && yInside) {
      // Inside the crop area.
      this.mousePositionWithinCropArea = this.MOUSE_INSIDE;
    } else {
      this.mousePositionWithinCropArea = null;
    }
  }

  private getTrustedResourceUrlForImageFileName(
      imageFileName, sanitizeSvg = false) {
    if (
      this.contextService.getImageSaveDestination() ===
      AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE &&
      this.imageLocalStorageService.isInStorage(imageFileName)) {
      const imageUrl = this.imageLocalStorageService.getObjectUrlForImage(
        imageFileName);
      if (imageFileName.endsWith('.svg') && sanitizeSvg) {
        const rawImageData = this.imageLocalStorageService.getRawImageData(
          imageFileName);
        return this.svgSanitizerService.getTrustedSvgResourceUrl(rawImageData);
      }
      return imageUrl;
    }
    const encodedFilepath = window.encodeURIComponent(imageFileName);
    return this.assetsBackendApiService.getImageUrlForPreview(
      this.entityType, this.entityId, encodedFilepath);
  }

  resetFilePathEditor(): void {
    if (
      this.data.metadata.savedImageFilename && (
        this.contextService.getImageSaveDestination() ===
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) &&
      this.imageLocalStorageService.isInStorage(
        this.data.metadata.savedImageFilename)
    ) {
      this.imageLocalStorageService.deleteImage(
        this.data.metadata.savedImageFilename);
    }
    this.data = {
      mode: this.MODE_EMPTY,
      metadata: {},
      crop: true
    };
    this.imageResizeRatio = 1;
    this.invalidTagsAndAttributes = {
      tags: [],
      attrs: []
    };
  }

  validate(data: FilepathData): boolean {
    const isValid = data.mode === this.MODE_SAVED &&
      data.metadata.savedImageFilename &&
      data.metadata.savedImageFilename.length > 0;
    return isValid;
  }

  isUserCropping(): boolean {
    const dimensions = this.calculateTargetImageDimensions();
    const cropWidth = this.cropArea.x2 - this.cropArea.x1;
    const cropHeight = this.cropArea.y2 - this.cropArea.y1;
    return cropWidth < dimensions.width || cropHeight < dimensions.height;
  }

  onMouseMoveOnImageArea(e: MouseEvent): void {
    e.preventDefault();

    const coords = this.getEventCoorindatesRelativeToImageContainer(e);

    if (this.userIsDraggingCropArea) {
      this.handleMouseMoveWhileDraggingCropArea(coords.x, coords.y);
    } else if (this.userIsResizingCropArea) {
      this.handleMouseMoveWhileResizingCropArea(coords.x, coords.y);
    } else {
      this.updatePositionWithinCropArea(coords.x, coords.y);
    }

    this.mouseLastKnownCoordinates = { x: coords.x, y: coords.y };
  }

  onMouseDownOnCropArea(e: MouseEvent): void {
    e.preventDefault();
    const coords = this.getEventCoorindatesRelativeToImageContainer(e);
    const position = this.mousePositionWithinCropArea;

    if (position === this.MOUSE_INSIDE) {
      this.lastMouseDownEventCoordinates = { x: coords.x, y: coords.y };
      this.cropAreaXWhenLastDown = this.cropArea.x1;
      this.cropAreaYWhenLastDown = this.cropArea.y1;
      this.userIsDraggingCropArea = true;
    } else if (position !== null) {
      this.lastMouseDownEventCoordinates = { x: coords.x, y: coords.y };
      this.userIsResizingCropArea = true;
      this.cropAreaResizeDirection = position;
    }
  }

  onMouseUpOnCropArea(e: MouseEvent): void {
    e.preventDefault();
    this.userIsDraggingCropArea = false;
    this.userIsResizingCropArea = false;
  }

  getMainContainerDynamicStyles(): string {
    const width = this.OUTPUT_IMAGE_MAX_WIDTH_PX;
    return 'width: ' + width + 'px';
  }

  getImageContainerDynamicStyles(): string {
    if (this.data.mode === this.MODE_EMPTY) {
      return 'border: 1px dotted #888';
    } else {
      return 'border: none';
    }
  }

  getToolbarDynamicStyles(): string {
    if (this.isUserCropping()) {
      return 'visibility: hidden';
    } else {
      return 'visibility: visible';
    }
  }

  getCropButtonBarDynamicStyles(): string {
    return 'left: ' + this.cropArea.x2 + 'px;' +
      'top: ' + this.cropArea.y1 + 'px;';
  }

  getCropAreaDynamicStyles(): string {
    const cropWidth = this.cropArea.x2 - this.cropArea.x1;
    const cropHeight = this.cropArea.y2 - this.cropArea.y1;
    const position = this.mousePositionWithinCropArea;

    // Position, size, cursor and background.
    const styles = {
      left: this.cropArea.x1 + 'px',
      top: this.cropArea.y1 + 'px',
      width: cropWidth + 'px',
      height: cropHeight + 'px',
      cursor: this.CROP_CURSORS[position],
      background: null
    };

    if (!styles.cursor) {
      styles.cursor = 'default';
    }

    // Translucent background layer.
    if (this.isUserCropping()) {
      const data = 'url(' + (
        // Check point 2 in the note before imports and after fileoverview.
        this.imgData || this.data.metadata.uploadedImageData) + ')';
      styles.background = data + ' no-repeat';

      const x = this.cropArea.x1 + 3; // Add crop area border.
      const y = this.cropArea.y1 + 3; // Add crop area border.
      styles['background-position'] = '-' + x + 'px -' + y + 'px';

      const dimensions = this.calculateTargetImageDimensions();
      styles['background-size'] = dimensions.width + 'px ' +
        dimensions.height + 'px';
    }

    return Object.keys(styles).map(
      key => {
        return key + ': ' + styles[key];
      }).join('; ');
  }

  getUploadedImageDynamicStyles(): string {
    const dimensions = this.calculateTargetImageDimensions();
    const w = dimensions.width;
    const h = dimensions.height;
    return 'width: ' + w + 'px; height: ' + h + 'px;';
  }

  confirmCropImage(): void {
    // Find coordinates of the cropped area within original image scale.
    const dimensions = this.calculateTargetImageDimensions();
    const r = this.data.metadata.originalWidth / dimensions.width;
    const x1 = this.cropArea.x1 * r;
    const y1 = this.cropArea.y1 * r;
    const width = (this.cropArea.x2 - this.cropArea.x1) * r;
    const height = (this.cropArea.y2 - this.cropArea.y1) * r;
    // Check point 2 in the note before imports and after fileoverview.
    const imageDataURI = this.imgData || (
      this.data.metadata.uploadedImageData as string);
    const mimeType = imageDataURI.split(';')[0];

    let newImageFile;

    if (mimeType === 'data:image/gif') {
      let successCb = obj => {
        this.validateProcessedFilesize(obj.image);
        newImageFile = (
          this.imageUploadHelperService.convertImageDataToImageFile(
            obj.image));
        this.updateDimensions(newImageFile, obj.image, width, height);
        document.body.style.cursor = 'default';
      };
      let processFrameCb = this.getCroppedGIFDataAsync.bind(
        null, x1, y1, width, height);
      this.processGIFImage(
        imageDataURI, width, height, processFrameCb, successCb);
    } else if (mimeType === 'data:image/svg+xml') {
      // Check point 2 in the note before imports and after fileoverview.
      const imageData = this.imgData || (
        this.data.metadata.uploadedImageData as string);
      newImageFile = (
        this.imageUploadHelperService.convertImageDataToImageFile(
          this.data.metadata.uploadedImageData as string));
      this.updateDimensions(newImageFile, imageData, width, height);
    } else {
      // Generate new image data and file.
      const newImageData = this.getCroppedImageData(
        // Check point 2 in the note before imports and after fileoverview.
        this.imgData || this.data.metadata.uploadedImageData,
        x1, y1, width, height);
      this.validateProcessedFilesize(newImageData);

      newImageFile = (
        this.imageUploadHelperService.convertImageDataToImageFile(
          newImageData));
      this.updateDimensions(newImageFile, newImageData, width, height);
    }
  }

  updateDimensions(
      newImageFile: File,
      newImageData: string,
      width: number,
      height: number): void {
    // Update image data.
    this.data.metadata.uploadedFile = newImageFile;
    this.data.metadata.uploadedImageData = newImageData;
    this.imgData = newImageData;
    this.data.metadata.originalWidth = width;
    this.data.metadata.originalHeight = height;
    // Check point 1 in the note before imports and after fileoverview.
    this.data = {...this.data};
    // Re-calculate the dimensions of the base image and reset the
    // coordinates of the crop area to the boundaries of the image.
    const dimensions = this.calculateTargetImageDimensions();
    this.cropArea = {
      x1: 0,
      y1: 0,
      x2: dimensions.width,
      y2: dimensions.height
    };
  }

  cancelCropImage(): void {
    const dimensions = this.calculateTargetImageDimensions();
    this.cropArea.x1 = 0;
    this.cropArea.y1 = 0;
    this.cropArea.x2 = dimensions.width;
    this.cropArea.y2 = dimensions.height;
  }

  getImageSizeHelp(): string | null {
    const imageWidth = this.data.metadata.originalWidth;
    if (this.imageResizeRatio === 1 &&
      imageWidth > this.OUTPUT_IMAGE_MAX_WIDTH_PX) {
      return 'This image has been automatically downsized to ensure ' +
        'that it will fit in the card.';
    }
    return null;
  }

  isCropAllowed(): boolean {
    return this.data.crop;
  }

  isNoImageUploaded(): boolean {
    return this.data.mode === this.MODE_EMPTY;
  }

  isImageUploaded(): boolean {
    return this.data.mode === this.MODE_UPLOADED;
  }

  isImageSaved(): boolean {
    return this.data.mode === this.MODE_SAVED;
  }

  getCurrentResizePercent(): number {
    return Math.round(100 * this.imageResizeRatio);
  }

  decreaseResizePercent(amount: number): void {
    // Do not allow to decrease size below 10%.
    this.imageResizeRatio = Math.max(
      0.1, this.imageResizeRatio - amount / 100);
    this.updateValidationWithLatestDimensions();
  }

  increaseResizePercent(amount: number): void {
    // Do not allow to increase size above 100% (only downsize allowed).
    this.imageResizeRatio = Math.min(
      1, this.imageResizeRatio + amount / 100);
    this.updateValidationWithLatestDimensions();
  }

  private updateValidationWithLatestDimensions(): void {
    const dimensions = this.calculateTargetImageDimensions();
    const imageDataURI = <string> this.data.metadata.uploadedImageData;
    const mimeType = (<string>imageDataURI).split(';')[0];
    if (mimeType === 'data:image/gif') {
      let successCb = obj => {
        this.validateProcessedFilesize(obj.image);
        document.body.style.cursor = 'default';
      };
      this.processGIFImage(
        imageDataURI, dimensions.width, dimensions.height,
        null, successCb);
    } else {
      const resampledImageData = this.getResampledImageData(
        imageDataURI, dimensions.width, dimensions.height);
      this.validateProcessedFilesize(resampledImageData);
    }
  }

  calculateTargetImageDimensions(): Dimensions {
    let width = this.data.metadata.originalWidth;
    let height = this.data.metadata.originalHeight;
    if (width > this.OUTPUT_IMAGE_MAX_WIDTH_PX) {
      const aspectRatio = width / height;
      width = this.OUTPUT_IMAGE_MAX_WIDTH_PX;
      height = width / aspectRatio;
    }
    return {
      width: Math.round(width * this.imageResizeRatio),
      height: Math.round(height * this.imageResizeRatio)
    };
  }

  areAllToolsEnabled(): boolean {
    return this.drawMode === DRAW_MODE_NONE;
  };

  isDrawModePencil(): boolean {
    return this.drawMode === DRAW_MODE_PENCIL;
  };

  togglePencilDrawing(): void {
    this.canvas.discardActiveObject();
    this.canvas.isDrawingMode = !this.canvas.isDrawingMode;
    this.canvas.freeDrawingBrush.color = this.fabricjsOptions.stroke;
    this.canvas.freeDrawingBrush.width = this.getSize();
    this.drawMode = DRAW_MODE_NONE;
    if (this.canvas.isDrawingMode) {
      this.drawMode = DRAW_MODE_PENCIL;
    }
  };

  isDrawModePieChart(): boolean {
    return Boolean(this.drawMode === DRAW_MODE_PIECHART);
  };

  isPencilEnabled(): boolean {
    return (
      this.areAllToolsEnabled() || this.isDrawModePencil());
  };

  createCustomToSVG(toSVG, type, id): () => string {
    return ()  => {
      let svgString = toSVG(this);
      console.log(svgString)
      let domParser = new DOMParser();
      let doc = domParser.parseFromString(svgString, 'image/svg+xml');
      console.log(doc)
      console.log(type)
      let parentG = doc.documentElement.querySelector(type);
      parentG.setAttribute('id', id);
      return doc.documentElement.outerHTML;
    };
  };

  loadGroupedObject(objId, obj, groupedObjects): typeof groupedObjects {
    // Checks if the id starts with 'group' to identify whether the
    // svg objects are grouped together.
    if (objId.startsWith('group')) {
      // The objId is of the form "group" + number.
      const GROUP_ID_PREFIX_LENGTH = 5;
      let groupId = parseInt(objId.slice(GROUP_ID_PREFIX_LENGTH));
      // Checks whether the object belongs to an already existing group
      // or not.
      if (groupedObjects.length <= groupId) {
        groupedObjects.push([]);
      }
      obj.toSVG = this.createCustomToSVG(
        obj.toSVG, obj.type, obj.id);
      groupedObjects[groupId].push(obj);
    }
    return groupedObjects;
  };

  loadTextObject(element, obj): void {
    let childNodes = [].slice.call(element.childNodes);
    let value = '';
    let coloredTextIndex = [];
    // Extracts the text from the tspan tags and appends
    // with a \n tag to ensure that the texts are subsequent lines.
    childNodes.forEach((el, index) => {
      if (el.nodeName === 'tspan') {
        value += el.childNodes[0].nodeValue;
        if (el.style.fill !== '') {
          // Fetches the position of the coloured text so
          // it can be given color after the text is rendered.
          coloredTextIndex.push({
            startIndex: (
              value.length - el.childNodes[0].nodeValue.length),
            endIndex: value.length,
            fill: el.style.fill,
            stroke: el.style.stroke,
            strokeWidth: el.style.strokeWidth
          });
        } else if (index < childNodes.length - 1) {
          value += '\n';
        }
      }
    });

    value = (
      obj['text-transform'] === 'uppercase' ?
      value.toUpperCase() : value);

    obj.set({
      text: value,
    });
    let text = new fabric.Textbox(obj.text, obj.toObject());
    text.set({
      type: 'textbox',
      strokeUniform: true,
    });
    // The text moves to the right every time the svg is
    // rendered so this is to ensure that the text doesn't
    // render outside the canvas.
    // https://github.com/fabricjs/fabric.js/issues/1280
    if (text.left > CANVAS_WIDTH) {
      text.set({
        left: CANVAS_WIDTH
      });
    }
    coloredTextIndex.forEach((obj) => {
      text.setSelectionStart(obj.startIndex);
      text.setSelectionEnd(obj.endIndex);
      text.setSelectionStyles({
        stroke: obj.stroke,
        strokeWidth: obj.strokeWidth,
        fill: obj.fill
      });
    });
    this.canvas.add(text);
  };

  isFullRectangle(element): boolean {
    return (
      element.width.baseVal.valueAsString === '100%' &&
      element.height.baseVal.valueAsString === '100%');
  };

  isClosedPolygonEnabled(): boolean {
    return (
      this.areAllToolsEnabled() || (
        this.isDrawModePolygon() &&
        this.polygonMode === CLOSED_POLYGON_MODE));
  };

  continueDiagramEditing(): void {
    if (
      this.data.metadata.uploadedFile.name &&
      this.imageSaveDestination === AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
    ) {
      this.imageLocalStorageService.deleteImage(this.data.metadata.uploadedFile.name);
    }
    this.diagramStatus = STATUS_EDITING;
    angular.element(document).ready(() => {
      this.initializeFabricJs();
      fabric.loadSVGFromString(
        this.savedSvgDiagram, (objects, options, elements) => {
          var groupedObjects = [];
          objects.forEach((obj, index) => {
            var objId = elements[index].id;
            if (objId !== '') {
              groupedObjects = this.loadGroupedObject(
                objId, obj, groupedObjects);
            } else {
              // Detects the background color from the rectangle.
              if (
                obj.get('type') === 'rect' &&
                this.isFullRectangle(elements[index])) {
                this.canvas.setBackgroundColor(obj.get('fill'));
                this.fabricjsOptions.bg = obj.get('fill');
                this.bgPicker.setOptions({
                  color: obj.get('fill')
                });
              } else if (obj.type === 'text') {
                this.loadTextObject(elements[index], obj);
              } else {
                this.canvas.add(obj);
              }
            }
          });
          groupedObjects.forEach((objs) => {
            this.canvas.add(new fabric.Group(objs));
            this.groupCount += 1;
          });
        }
      );
    });
  };

  isDiagramSaved(): boolean {
    return this.diagramStatus === STATUS_SAVED;
  };


  createRect(): void {
    this.canvas.discardActiveObject();
    let defaultWidth = 60;
    let defaultHeight = 70;
    let rect = new fabric.Rect({
      top: this.defaultTopCoordinate,
      left: this.defaultLeftCoordinate,
      width: defaultWidth,
      height: defaultHeight,
      fill: this.fabricjsOptions.fill,
      stroke: this.fabricjsOptions.stroke,
      strokeWidth:this.getSize(),
      strokeUniform: true
    });
    this.canvas.add(rect);
  };
  createLine(): void {
    this.canvas.discardActiveObject();
    let defaultBottomCoordinate = 100;
    let defaultRightCoordinate = 100;
    let line = new fabric.Line(
      [
        this.defaultTopCoordinate,
        this.defaultLeftCoordinate,
        defaultBottomCoordinate,
        defaultRightCoordinate
      ], {
        stroke: this.fabricjsOptions.stroke,
        strokeWidth:this.getSize(),
        strokeUniform: true
      });
    this.canvas.add(line);
  };

  createCircle(): void {
    this.canvas.discardActiveObject();
    let circle = new fabric.Circle({
      top: this.defaultTopCoordinate,
      left: this.defaultLeftCoordinate,
      radius: this.defaultRadius,
      fill: this.fabricjsOptions.fill,
      stroke: this.fabricjsOptions.stroke,
      strokeWidth:this.getSize(),
      strokeUniform: true
    });
    this.canvas.add(circle);
  };

  createText(): void {
    this.canvas.discardActiveObject();
    // The defaultTextSize is necessary to prevent the text
    // from being too small. This can be changed later in the editor.
    let defaultTextSize = '18px';
    this.fillPicker.setOptions({
      color: 'rgba(0,0,0,1)'
    });
    this.fabricjsOptions.size = defaultTextSize;
    let text = new fabric.Textbox('Enter Text', {
      top: this.defaultTopCoordinate,
      left: this.defaultLeftCoordinate,
      fontFamily: this.fabricjsOptions.fontFamily,
      fontSize: this.getSize(),
      fill: this.fabricjsOptions.fill,
      fontWeight: this.fabricjsOptions.bold ? 'bold' : 'normal',
      fontStyle: this.fabricjsOptions.italic ? 'italic' : 'normal',
    });
    this.canvas.add(text);
  };

  isDrawModeBezier(): boolean {
    return this.drawMode === DRAW_MODE_BEZIER;
  };

  onAddItem() {
    if (this.pieChartDataInput.length < this.pieChartDataLimit) {
      var defaultData = 10;
      var dataInput = {
        name: 'Data name',
        data: defaultData,
        color: '#000000',
        angle: 0
      };
      this.pieChartDataInput.push(dataInput);
    }
  };

  isSvgUploadEnabled(): boolean {
    return Boolean(
      this.areAllToolsEnabled() ||
      this.drawMode === DRAW_MODE_SVG_UPLOAD);
  };


  createPolygon(): void {
    if (this.drawMode === DRAW_MODE_POLY) {
      this.drawMode = DRAW_MODE_NONE;
      this.createPolyShape();
    } else {
      this.canvas.discardActiveObject();
      this.drawMode = DRAW_MODE_POLY;
      this.canvas.hoverCursor = 'default';
      this.canvas.forEachObject(function(object) {
        object.selectable = false;
      });
    }
  };

  createOpenPolygon(): void {
    this.polygonMode = OPEN_POLYGON_MODE;
    this.createPolygon();
  };

  createClosedPolygon(): void {
    this.polygonMode = CLOSED_POLYGON_MODE;
    this.createPolygon();
  };

  onItalicToggle(): void {
    let shape = this.canvas.getActiveObject();
    if (shape && shape.get('type') === 'textbox') {
      shape.set({
        fontStyle: this.fabricjsOptions.italic ? 'italic' : 'normal',
      });
      this.canvas.renderAll();
    }
  };


  uploadSvgFileInCanvas(): void {
    if (this.drawMode === DRAW_MODE_NONE) {
      this.canvas.discardActiveObject();
      this.drawMode = DRAW_MODE_SVG_UPLOAD;
    } else {
      this.drawMode = DRAW_MODE_NONE;
      if (this.uploadedSvgDataUrl !== null) {
        let svgString = atob(this.uploadedSvgDataUrl.split(',')[1]);
        fabric.loadSVGFromString(svgString, this.loadSvgFile);
      }
      this.canvas.renderAll();
      this.uploadedSvgDataUrl = null;
    }
  };

  setUploadedFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      let img = new Image();
      img.onload = () => {
        // Check point 2 in the note before imports and after fileoverview.
        this.imgData = (<FileReader>e.target).result;
        let imageData: string | SafeResourceUrl = (<FileReader>e.target).result;
        if (file.name.endsWith('.svg')) {
          imageData = this.svgSanitizerService.getTrustedSvgResourceUrl(
            imageData as string);
          if(imageData != null) {
            this.initializeSvgFile();
            this.uploadedSvgDataUrl = (<FileReader>e.target).result;
            this.uploadSvgFileInCanvas();
          }
        }
        this.data = {
          mode: this.MODE_UPLOADED,
          metadata: {
            uploadedFile: file,
            uploadedImageData: imageData,
            originalWidth: img.naturalWidth || 300,
            originalHeight: img.naturalHeight || 150
          },
          crop: file.type !== 'image/svg+xml'
        };
        console.log(this.data)
        const dimensions = this.calculateTargetImageDimensions();
        this.cropArea = {
          x1: 0,
          y1: 0,
          x2: dimensions.width,
          y2: dimensions.height
        };
        this.updateValidationWithLatestDimensions();
      };
      img.src = <string>((<FileReader>e.target).result);
    };
    reader.readAsDataURL(file);
  }

  getSvgString(): string {
    let svgString = this.canvas.toSVG().replace('\t\t', '');
    let domParser = new DOMParser();
    let doc = domParser.parseFromString(svgString, 'text/xml');
    let svg = doc.querySelector('svg');
    svg.removeAttribute('xml:space');
    let textTags = doc.querySelectorAll('text');
    textTags.forEach(function(obj) {
      obj.removeAttribute('xml:space');
    });
    let elements = svg.querySelectorAll('*');
    // Fabric js adds vector-effect as an attribute which is not part of
    // the svg attribute whitelist, so here it is removed
    // and added as part of the style attribute.
    for (let i = 0; i < elements.length; i++) {
      if (
        elements[i].getAttributeNames().indexOf('vector-effect') !== -1) {
        elements[i].removeAttribute('vector-effect');
        let style = elements[i].getAttribute('style');
        style += ' vector-effect: non-scaling-stroke';
        elements[i].setAttribute('style', style);
      }
    }
    return svg.outerHTML;
  };

  isSvgTagValid(svgString): boolean {
    let dataURI = (
      'data:image/svg+xml;base64,' +
      btoa(unescape(encodeURIComponent(svgString))));
    var invalidTagsAndAttr = (
      this.svgSanitizerService.getInvalidSvgTagsAndAttrsFromDataUri(dataURI));
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

  saveSvgFile(): void {
    this.alertsService.clearWarnings();

    if (!this.isDiagramCreated()) {
      this.alertsService.addWarning('Custom Diagram not created.');
      return;
    }

    let svgString = this.getSvgString();
    let svgDataURI = (
      'data:image/svg+xml;base64,' +
      btoa(unescape(encodeURIComponent(svgString))));
    let dimensions = {
      width: this.diagramWidth,
      height: this.diagramHeight,
    };
    let resampledFile;

    if (this.isSvgTagValid(svgString)) {
      this.savedSvgDiagram = svgString;
      resampledFile = (
        this.imageUploadHelperService.convertImageDataToImageFile(
          svgDataURI));
        this.saveImage(dimensions, resampledFile, 'svg');
    }
  };

  setSavedImageFilename(filename: string, updateParent: boolean): void {
    this.data = {
      mode: this.MODE_SAVED,
      metadata: {
        savedImageFilename: filename,
        // Check point 2 in the note before imports and after fileoverview.
        savedImageUrl: this.getTrustedResourceUrlForImageFileName(
          filename, true) as string
      },
      crop: true
    };
    if (updateParent) {
      this.alertsService.clearWarnings();
      this.value = filename;
      this.valueChanged.emit(filename);
      this.resetComponent(filename);
    }
  }

  onFileChanged(file: File, _filename: string): void {
    this.setUploadedFile(file);
  }

  discardUploadedFile(): void {
    this.resetFilePathEditor();
    this.processedImageIsTooLarge = false;
  }

  validateProcessedFilesize(resampledImageData: string): void {
    const mimeType = resampledImageData.split(';')[0];
    const imageSize = atob(
      resampledImageData.replace(`${mimeType};base64,`, '')).length;
    // The processed image can sometimes be larger than 100 KB. This is
    // because the output of HTMLCanvasElement.toDataURL() operation in
    // getResampledImageData() is browser specific and can vary in size.
    // See https://stackoverflow.com/a/9777037.
    this.processedImageIsTooLarge = imageSize > this.HUNDRED_KB_IN_BYTES;
  }

  createSvgFile(): void {
    this.initializeSvgFile();
    this.createSvgMode = true;
  }

  initializeSvgFile(): void {
    this.initializedSvgImage = true;
    if (this.value) {
      this.setSavedImageFilename(this.value, true);
      let dimensions = (
        this.imagePreloaderService.getDimensionsOfImage(this.value));
      this.svgContainerStyle = {
        height: dimensions.height + 'px',
        width: dimensions.width + 'px'
      };
    } else {
      angular.element(document).ready(() => {
        this.initializeFabricJs();
      });
    }
  }


  createQuadraticBezier(): void {
    if (this.drawMode === DRAW_MODE_NONE) {
      this.canvas.discardActiveObject();
      this.drawMode = DRAW_MODE_BEZIER;
      this.canvas.getObjects().forEach((item) => {
        item.set({
          hoverCursor: 'default',
          selectable: false
        });
      });
      this.drawQuadraticCurve();
    } else {
      // This is the case when the user clicks the tool after drawing the
      // curve. The current path and the circles are removed and new path
      // is added.
      this.canvas.getObjects().slice(-3).forEach((item) => {
        this.canvas.remove(item);
      });
      let path = this.canvas.getObjects().slice(-1)[0].get('path');
      this.canvas.remove(this.canvas.getObjects().slice(-1)[0]);
      this.canvas.getObjects().forEach((item) => {
        item.set({
          hoverCursor: 'move',
          selectable: true
        });
      });
      // Change mode and then add the path so that the object is added in
      // cavasObjects array.
      this.drawMode = DRAW_MODE_NONE;
      // Adding a new path so that the bbox is computed correctly.
      let curve = new fabric.Path(path, {
        stroke: this.fabricjsOptions.stroke,
        fill: this.fabricjsOptions.fill,
        strokeWidth: this.getSize(),
      });
      this.canvas.add(curve);
    }
  };

  drawQuadraticCurve(): void {
    let defaultCurve = 'M 40 40 Q 95, 100, 150, 40';
    let defaultP1TopCoordinate = 95;
    let defaultP1LeftCoordinate = 100;
    let defaultP0TopCoordinate = 40;
    let defaultP0LeftCoordinate = 40;
    let defaultP2TopCoordinate = 150;
    let defaultP2LeftCoordinate = 40;
    let curve = new fabric.Path(defaultCurve, {
      stroke: this.fabricjsOptions.stroke,
      fill: this.fabricjsOptions.fill,
      strokeWidth: this.getSize(),
      objectCaching: false,
      selectable: false
    });
    this.canvas.add(curve);

    let p1 = this.createBezierControlPoints(
      defaultP1TopCoordinate, defaultP1LeftCoordinate);
    p1.name = 'p1';
    p1.set({
      radius: 12,
      fill: '#ffffff',
      strokeWidth: 5
    });
    this.canvas.add(p1);

    let p0 = this.createBezierControlPoints(
      defaultP0TopCoordinate, defaultP0LeftCoordinate);
    p0.name = 'p0';
    this.canvas.add(p0);

    var p2 = this.createBezierControlPoints(
      defaultP2TopCoordinate, defaultP2LeftCoordinate);
    p2.name = 'p2';
    this.canvas.add(p2);
  };

  createBezierControlPoints(left, top): typeof fabric.Circle {
    // This function is used to add the control points for the quadratic
    // bezier curve which is used to control the position of the curve.
    // A size 2 is added so that the control circles is not rendered
    // too small.
    let circle = new fabric.Circle({
      left: left,
      top: top,
      radius: this.getSize() + 2,
      fill: '#666666',
      stroke: '#666666',
      hasBorders: false,
      hasControls: false
    });
    return circle;
  };

  saveUploadedFile(): void {
    this.alertsService.clearWarnings();
    this.processedImageIsTooLarge = false;

    if (!this.data.metadata.uploadedFile) {
      this.alertsService.addWarning('No image file detected.');
      return;
    }

    const dimensions = this.calculateTargetImageDimensions();


    // Check mime type from imageDataURI.
    // Check point 2 in the note before imports and after fileoverview.
    const imageDataURI = this.imgData || (
      this.data.metadata.uploadedImageData as string);
    const mimeType = imageDataURI.split(';')[0];
    let resampledFile;

    if (mimeType === 'data:image/gif') {
      let successCb = obj => {
        if (!obj.error) {
          this.validateProcessedFilesize(obj.image);
          if (this.processedImageIsTooLarge) {
            document.body.style.cursor = 'default';
            return;
          }
          resampledFile = (
            this.imageUploadHelperService.convertImageDataToImageFile(
              obj.image));
          if (resampledFile === null) {
            this.alertsService.addWarning('Could not get resampled file.');
            document.body.style.cursor = 'default';
            return;
          }
          this.saveImage(dimensions, resampledFile, 'gif');
          document.body.style.cursor = 'default';
        }
      };
      let gifWidth = dimensions.width;
      let gifHeight = dimensions.height;
      this.processGIFImage(imageDataURI, gifWidth, gifHeight, null, successCb);
    } else if (mimeType === 'data:image/svg+xml') {
      this.invalidTagsAndAttributes = (
        this.svgSanitizerService.getInvalidSvgTagsAndAttrsFromDataUri(
          imageDataURI));
      const tags = this.invalidTagsAndAttributes.tags;
      const attrs = this.invalidTagsAndAttributes.attrs;
      if (tags.length === 0 && attrs.length === 0) {
        resampledFile = (
          this.imageUploadHelperService.convertImageDataToImageFile(
            imageDataURI));
        this.saveImage(dimensions, resampledFile, 'svg');
        this.data.crop = false;
      }
    } else {
      const resampledImageData = this.getResampledImageData(
        imageDataURI, dimensions.width, dimensions.height);
      this.validateProcessedFilesize(resampledImageData);
      if (this.processedImageIsTooLarge) {
        return;
      }
      resampledFile = (
        this.imageUploadHelperService.convertImageDataToImageFile(
          resampledImageData));
      if (resampledFile === null) {
        this.alertsService.addWarning('Could not get resampled file.');
        return;
      }
      this.saveImage(dimensions, resampledFile, 'png');
    }
  }

  private processGIFImage(
      imageDataURI: string, width: number, height: number,
      processFrameCallback: (dataUrl: string) => void,
      successCallback: (gifshotCallbackObject: GifshotCallbackObject) => void
  ): void {
    // Looping through individual gif frames can take a while
    // especially if there are a lot. Changing the cursor will let the
    // user know that something is happening.
    document.body.style.cursor = 'wait';
    gifFrames({
      url: imageDataURI,
      frames: 'all',
      outputType: 'canvas',
    }).then(async function(frameData) {
      let frames = [];
      for (let i = 0; i < frameData.length; i += 1) {
        let sourceCanvas = frameData[i].getImage();
        // Some GIFs may be optimised such that frames are stacked and
        // only incremental changes are present in individual frames.
        // For such GIFs, no additional operation needs to be done to
        // handle transparent content. These GIFs have 0 or 1 Disposal
        // method value.
        // See https://www.w3.org/Graphics/GIF/spec-gif89a.txt
        if (frameData[i].frameInfo.disposal > 1) {
          // Frames that have transparent content may not render
          // properly in the gifshot output. As a workaround, add a
          // white background to individual frames before creating a
          // GIF.
          let ctx = sourceCanvas.getContext('2d');
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = '#FFF';
          ctx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
          ctx.globalCompositeOperation = 'source-over';
        }
        let dataURL = sourceCanvas.toDataURL('image/png');
        let updatedFrame = (
          processFrameCallback ?
          await processFrameCallback(dataURL) : dataURL);
        frames.push(updatedFrame);
      }
      gifshot.createGIF({
        gifWidth: width,
        gifHeight: height,
        images: frames
      }, successCallback);
    });
  }

  saveImageToLocalStorage(
      dimensions: Dimensions,
      resampledFile: Blob,
      imageType: string): void {
    const filename = this.imageUploadHelperService.generateImageFilename(
      dimensions.height, dimensions.width, imageType);
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      // Check point 2 in the note before imports and after fileoverview.
      this.imgData = imageData;
      this.imageLocalStorageService.saveImage(filename, imageData);
      const img = new Image();
      img.onload = () => {
        this.setSavedImageFilename(filename, true);
        const dimensions = (
          this.imagePreloaderService.getDimensionsOfImage(filename));
        this.imageContainerStyle = {
          height: dimensions.height + 'px',
          width: dimensions.width + 'px'
        };
      };
      // Check point 2 in the note before imports and after fileoverview.
      img.src = this.getTrustedResourceUrlForImageFileName(filename) as string;
    };
    reader.readAsDataURL(resampledFile);
  }

  saveImage(
      dimensions: Dimensions,
      resampledFile: Blob,
      imageType: string): void {
    if (
      this.contextService.getImageSaveDestination() ===
      AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
      this.saveImageToLocalStorage(dimensions, resampledFile, imageType);
    } else {
      this.postImageToServer(dimensions, resampledFile, imageType);
    }
    if(this.initializedSvgImage) {
      this.initializedSvgImage = false
    }
  }

  postImageToServer(
      dimensions: Dimensions,
      resampledFile: Blob,
      imageType: string = 'png'): void {
    let form = new FormData();
    form.append('image', resampledFile);
    form.append('payload', JSON.stringify({
      filename: this.imageUploadHelperService.generateImageFilename(
        dimensions.height, dimensions.width, imageType)
    }));
    const imageUploadUrlTemplate = '/createhandler/imageupload/' +
      '<entity_type>/<entity_id>';
    this.csrfTokenService.getTokenAsync().then((token) => {
      form.append('csrf_token', token);
      $.ajax({
        url: this.urlInterpolationService.interpolateUrl(
          imageUploadUrlTemplate, {
            entity_type: this.entityType,
            entity_id: this.entityId
          }
        ),
        data: form,
        processData: false,
        contentType: false,
        type: 'POST',
        dataFilter: data => {
          // Remove the XSSI prefix.
          const transformedData = data.substring(5);
          return JSON.parse(transformedData);
        },
        dataType: 'text'
      }).done((data) => {
        // Pre-load image before marking the image as saved.
        const img = new Image();
        img.onload = () => {
          this.setSavedImageFilename(data.filename, true);
          let dimensions = (
            this.imagePreloaderService.getDimensionsOfImage(data.filename));
          this.imageContainerStyle = {
            height: dimensions.height + 'px',
            width: dimensions.width + 'px'
          };
        };
        // Check point 2 in the note before imports and after fileoverview.
        img.src = this.getTrustedResourceUrlForImageFileName(
          data.filename) as string;
      }).fail((data) => {
        // Remove the XSSI prefix.
        var transformedData = data.responseText.substring(5);
        var parsedResponse = JSON.parse(transformedData);
        this.alertsService.addWarning(
          parsedResponse.error || 'Error communicating with server.');
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.value &&
      changes.value.currentValue !== changes.value.previousValue) {
      const newValue = changes.value.currentValue;
      this.resetComponent(newValue);
    }
  }
}

angular.module('oppia').directive(
  'filepathEditor', downgradeComponent({
    component: FilepathEditorComponent
  }) as angular.IDirectiveFactory);
