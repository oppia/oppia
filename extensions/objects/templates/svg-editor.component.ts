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
 * @fileoverview Component for svg editor.
 */

import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {AppConstants} from 'app.constants';
import {fabric} from 'fabric';
import {ImagePreloaderService} from 'pages/exploration-player-page/services/image-preloader.service';
import {AlertsService} from 'services/alerts.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ContextService} from 'services/context.service';
import {DeviceInfoService} from 'services/contextual/device-info.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {SvgSanitizerService} from 'services/svg-sanitizer.service';
import Picker from 'vanilla-picker';
import {SvgFileFetcherBackendApiService} from './svg-file-fetcher-backend-api.service';
import {SvgEditorConstants} from './svg-editor.constants';

export interface Dimensions {
  height: number;
  width: number;
}

export class PolyPoint {
  constructor(
    public x: number,
    public y: number
  ) {}
}

@Component({
  selector: 'svg-editor',
  templateUrl: './svg-editor.component.html',
})
export class SvgEditorComponent implements OnInit {
  @Input() value: string;
  @Output() valueChanged = new EventEmitter();
  @Output() validityChange = new EventEmitter<Record<'empty', boolean>>();
  @Output() discardImage = new EventEmitter();
  // These constants are used to identify the tool that is currently being
  // used so that other tools can be disabled accordingly.
  STATUS_EDITING = 'editing';
  STATUS_SAVED = 'saved';
  DRAW_MODE_POLY = 'polygon';
  DRAW_MODE_PENCIL = 'pencil';
  DRAW_MODE_BEZIER = 'bezier';
  DRAW_MODE_PIECHART = 'piechart';
  DRAW_MODE_SVG_UPLOAD = 'svgupload';
  DRAW_MODE_NONE = 'none';
  OPEN_POLYGON_MODE = 'open';
  CLOSED_POLYGON_MODE = 'closed';
  // The canvas height and width were determined based on the initial
  // modal dimensions.
  CANVAS_WIDTH = 494;
  CANVAS_HEIGHT = 368;
  drawMode = this.DRAW_MODE_NONE;
  polygonMode = this.CLOSED_POLYGON_MODE;
  isTouchDevice = this.deviceInfoService.hasTouchEvents();
  // The polyOptions is used to store the points of the polygon in the
  // open and closed polygon tool.
  polyOptions = {
    x: 0,
    y: 0,
    bboxPoints: [],
    lines: [],
    lineCounter: 0,
    shape: null,
  };

  // These sizes are used in the strokeWidth options dropdown.
  sizes = [
    '1px',
    '2px',
    '3px',
    '5px',
    '9px',
    '10px',
    '12px',
    '14px',
    '18px',
    '24px',
    '30px',
    '36px',
  ];

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
    'Engagement',
  ];

  // Dynamically assign a unique id to each lc editor to avoid clashes
  // when there are multiple RTEs in the same page.
  randomId = Math.floor(Math.random() * 100000).toString();
  // The canvasId is used to identify the fabric js
  // canvas element in the editor.
  canvasID = 'canvas' + this.randomId;
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
  data: {
    savedSvgUrl?: SafeResourceUrl | string;
    savedSvgFileName?: string;
  } = {};

  // The diagramStatus stores the mode of the tool that is being used.
  diagramStatus = this.STATUS_EDITING;
  displayFontStyles = false;
  objectUndoStack = [];
  objectRedoStack = [];
  canvasObjects = [];
  undoFlag = false;
  isRedo = false;
  undoLimit = 5;
  savedSvgDiagram = '';
  entityId: string;
  entityType: string;
  imageSaveDestination: string;
  svgContainerStyle = {};
  layerNum = 0;
  fabricjsOptions = {
    stroke: 'rgba(0, 0, 0, 1)',
    fill: 'rgba(0, 0, 0, 0)',
    bg: 'rgba(0, 0, 0, 0)',
    fontFamily: 'Helvetica',
    size: '3px',
    bold: false,
    italic: false,
  };

  objectIsSelected = false;
  pieChartDataLimit = 10;
  groupCount = 0;
  pieChartDataInput = [
    {
      name: 'Data name 1',
      data: 10,
      color: '#ff0000',
      angle: 0,
    },
    {
      name: 'Data name 2',
      data: 10,
      color: '#00ff00',
      angle: 0,
    },
  ];

  allowedImageFormats = ['svg'];
  uploadedSvgDataUrl: {
    safeUrl: SafeResourceUrl;
    unsafeUrl: string;
  } = null;

  loadType = 'group';
  defaultTopCoordinate = 50;
  defaultLeftCoordinate = 50;
  defaultRadius = 30;

  canvas: fabric.Canvas;
  filepath: string;
  loadingIndicatorIsShown: boolean;
  x: number;
  y: number;
  constructor(
    private alertsService: AlertsService,
    private assetsBackendApiService: AssetsBackendApiService,
    private changeDetectorRef: ChangeDetectorRef,
    private contextService: ContextService,
    private deviceInfoService: DeviceInfoService,
    private imageLocalStorageService: ImageLocalStorageService,
    private imagePreloaderService: ImagePreloaderService,
    private imageUploadHelperService: ImageUploadHelperService,
    private svgFileFetcherBackendApiService: SvgFileFetcherBackendApiService,
    private svgSanitizerService: SvgSanitizerService
  ) {}

  ngOnInit(): void {
    this.imageSaveDestination = this.contextService.getImageSaveDestination();
    this.entityId = this.contextService.getEntityId();
    this.entityType = this.contextService.getEntityType();
    const domReady = new Promise((resolve, reject) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve(0);
      }
    });
    if (this.value) {
      this.setSavedSvgFilename(this.value, true);
      var dimensions = this.imagePreloaderService.getDimensionsOfImage(
        this.value
      );
      this.svgContainerStyle = {
        height: dimensions.height + 'px',
        width: dimensions.width + 'px',
      };
      this.validityChange.emit({empty: true});
    } else {
      this.validityChange.emit({empty: false});
      domReady.then(() => {
        this.initializeFabricJs();
        this.changeDetectorRef.detectChanges();
      });
    }
  }

  onWidthInputBlur(): void {
    if (this.diagramWidth > SvgEditorConstants.MAX_SVG_DIAGRAM_WIDTH) {
      this.diagramWidth = SvgEditorConstants.MAX_SVG_DIAGRAM_WIDTH;
    } else if (this.diagramWidth < SvgEditorConstants.MIN_SVG_DIAGRAM_WIDTH) {
      this.diagramWidth = SvgEditorConstants.MIN_SVG_DIAGRAM_WIDTH;
    }
    this.currentDiagramWidth = this.diagramWidth;
  }

  onHeightInputBlur(): void {
    if (this.diagramHeight > SvgEditorConstants.MAX_SVG_DIAGRAM_HEIGHT) {
      this.diagramHeight = SvgEditorConstants.MAX_SVG_DIAGRAM_HEIGHT;
    } else if (this.diagramHeight < SvgEditorConstants.MIN_SVG_DIAGRAM_HEIGHT) {
      this.diagramHeight = SvgEditorConstants.MIN_SVG_DIAGRAM_HEIGHT;
    }
    this.currentDiagramHeight = this.diagramHeight;
  }

  isDiagramCreated(): boolean {
    // This function checks if any shape has been created or not.
    return Boolean(
      this.diagramStatus === this.STATUS_EDITING &&
        this.canvas &&
        this.canvas.getObjects().length > 0
    );
  }

  private getTrustedResourceUrlForSvgFileName(svgFileName: string): {
    safeUrl: SafeResourceUrl | string;
    unsafeUrl: string;
  } {
    if (
      this.imageSaveDestination ===
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE &&
      this.imageLocalStorageService.isInStorage(svgFileName)
    ) {
      const imageUrl =
        this.imageLocalStorageService.getRawImageData(svgFileName);
      return {
        safeUrl: this.svgSanitizerService.getTrustedSvgResourceUrl(imageUrl),
        unsafeUrl: imageUrl,
      };
    }
    const encodedFilepath = window.encodeURIComponent(svgFileName);
    const imageUrl = this.assetsBackendApiService.getImageUrlForPreview(
      this.entityType,
      this.entityId,
      encodedFilepath
    );
    return {
      safeUrl: imageUrl,
      unsafeUrl: imageUrl,
    };
  }

  setSavedSvgFilename(filename: string, setData: boolean): void {
    this.diagramStatus = this.STATUS_SAVED;
    // Reset fabric js parameters.
    this.onClear();
    this.data = {
      savedSvgFileName: filename,
      savedSvgUrl: this.getTrustedResourceUrlForSvgFileName(filename).safeUrl,
    };
    this.value = filename;
    this.valueChanged.emit(this.value);
    if (setData) {
      const dimensions =
        this.imagePreloaderService.getDimensionsOfImage(filename);
      this.svgContainerStyle = {
        height: dimensions.height + 'px',
        width: dimensions.width + 'px',
      };
      this.diagramWidth = dimensions.width;
      this.diagramHeight = dimensions.height;
      let svgDataUrl = this.imageLocalStorageService.getRawImageData(
        this.data.savedSvgFileName
      );
      if (
        this.imageSaveDestination ===
          AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE &&
        svgDataUrl
      ) {
        this.uploadedSvgDataUrl = {
          safeUrl: this.svgSanitizerService.getTrustedSvgResourceUrl(
            svgDataUrl as string
          ),
          unsafeUrl: svgDataUrl as string,
        };
        this.savedSvgDiagram =
          this.svgSanitizerService.convertBase64ToUnicodeString(
            svgDataUrl.split(',')[1]
          );
      } else {
        this.svgFileFetcherBackendApiService
          .fetchSvg(this.data.savedSvgUrl as string)
          .subscribe(response => {
            this.savedSvgDiagram = response;
          });
      }
    }
  }

  postSvgToServer(
    dimensions: Dimensions,
    resampledFile: Blob
  ): Promise<{filename: string}> {
    return this.svgFileFetcherBackendApiService
      .postSvgFile(resampledFile, dimensions, this.entityType, this.entityId)
      .toPromise();
  }

  saveImageToLocalStorage(dimensions: Dimensions, svgDataURI: string): void {
    const filename = this.imageUploadHelperService.generateImageFilename(
      dimensions.height,
      dimensions.width,
      'svg'
    );
    this.imageLocalStorageService.saveImage(filename, svgDataURI);
    this.setSavedSvgFilename(filename, false);
    this.svgContainerStyle = {
      height: dimensions.height + 'px',
      width: dimensions.width + 'px',
    };
  }

  getSvgString(): string {
    const svgString = this.canvas.toSVG().replace('\t\t', '');
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(svgString, 'text/xml');
    const svg = doc.querySelector('svg');
    svg.removeAttribute('xml:space');
    const textTags = doc.querySelectorAll('text');
    textTags.forEach(obj => {
      obj.removeAttribute('xml:space');
    });
    const elements = svg.querySelectorAll('*');
    // Fabric js adds vector-effect as an attribute which is not part of
    // the svg attribute allowlist, so here it is removed
    // and added as part of the style attribute.
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].getAttributeNames().indexOf('vector-effect') !== -1) {
        elements[i].removeAttribute('vector-effect');
        let style = elements[i].getAttribute('style');
        style += ' vector-effect: non-scaling-stroke';
        elements[i].setAttribute('style', style);
      }
    }
    return svg.outerHTML;
  }

  isSvgTagValid(svgString: string): true {
    const dataURI =
      'data:image/svg+xml;base64,' +
      btoa(unescape(encodeURIComponent(svgString)));
    const invalidTagsAndAttr =
      this.svgSanitizerService.getInvalidSvgTagsAndAttrsFromDataUri(dataURI);
    if (invalidTagsAndAttr.tags.length !== 0) {
      const errorText = 'Invalid tags in svg:' + invalidTagsAndAttr.tags.join();
      throw new Error(errorText);
    } else if (invalidTagsAndAttr.attrs.length !== 0) {
      const errorText =
        'Invalid attributes in svg:' + invalidTagsAndAttr.attrs.join();
      throw new Error(errorText);
    }
    return true;
  }

  discardSvgFile(): void {
    this.discardImage.emit();
  }

  saveSvgFile(): void {
    this.alertsService.clearWarnings();

    if (!this.isDiagramCreated()) {
      this.alertsService.addWarning('Custom Diagram not created.');
      return;
    }

    const svgString = this.getSvgString();
    const svgDataURI =
      'data:image/svg+xml;base64,' +
      btoa(unescape(encodeURIComponent(svgString)));
    const dimensions: Dimensions = {
      width: this.diagramWidth,
      height: this.diagramHeight,
    };
    let resampledFile: Blob;

    if (this.isSvgTagValid(svgString)) {
      this.savedSvgDiagram = svgString;
      resampledFile =
        this.imageUploadHelperService.convertImageDataToImageFile(svgDataURI);
      if (
        this.imageSaveDestination ===
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
      ) {
        this.saveImageToLocalStorage(dimensions, svgDataURI);
        this.validityChange.emit({empty: true});
      } else {
        this.loadingIndicatorIsShown = true;
        this.postSvgToServer(dimensions, resampledFile).then(
          data => {
            // Pre-load image before marking the image as saved.
            const img = new Image();
            img.onload = () => {
              this.setSavedSvgFilename(data.filename, false);
              var dimensions = this.imagePreloaderService.getDimensionsOfImage(
                data.filename
              );
              this.svgContainerStyle = {
                height: dimensions.height + 'px',
                width: dimensions.width + 'px',
              };
              this.loadingIndicatorIsShown = false;
            };
            img.src = this.getTrustedResourceUrlForSvgFileName(
              data.filename
            ).unsafeUrl;
            this.validityChange.emit({empty: true});
          },
          parsedResponse => {
            this.loadingIndicatorIsShown = false;
            this.alertsService.addWarning(
              parsedResponse.error.error || 'Error communicating with server.'
            );
          }
        );
      }
    }
  }

  isDiagramSaved(): boolean {
    return this.diagramStatus === this.STATUS_SAVED;
  }

  createCustomToSVG(
    toSVG: () => string,
    selector: string,
    id: string,
    ctx: unknown
  ): () => string {
    return (): string => {
      const svgString = toSVG.call(ctx);
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(svgString, 'image/svg+xml');
      const parentG = doc.querySelector(selector);
      parentG.setAttribute('id', id);
      return doc.documentElement.outerHTML;
    };
  }

  loadGroupedObject(
    objId: string,
    obj: fabric.Object,
    groupedObjects: fabric.Object[][]
  ): fabric.Object[][] {
    // The objId is of the form "group" + number.
    const GROUP_ID_PREFIX_LENGTH = 5;
    const groupId = parseInt(objId.slice(GROUP_ID_PREFIX_LENGTH));
    // Checks whether the object belongs to an already existing group
    // or not.
    if (groupedObjects.length <= groupId) {
      groupedObjects.push([]);
    }
    obj.toSVG = this.createCustomToSVG(
      obj.toSVG,
      obj.type,
      (obj as unknown as {id: string}).id,
      obj
    );
    groupedObjects[groupId].push(obj);
    return groupedObjects;
  }

  loadTextObject(element: Element, obj: fabric.Object): void {
    const childNodes = [].slice.call(element.childNodes);
    let value = '';
    const coloredTextIndex = [];
    // Extracts the text from the tspan tags and appends
    // with a \n tag to ensure that the texts are subsequent lines.
    childNodes.forEach((el, index) => {
      if (el.nodeName === 'tspan') {
        value += el.childNodes[0].nodeValue;
        if (el.style.fill !== '') {
          // Fetches the position of the coloured text so
          // it can be given color after the text is rendered.
          coloredTextIndex.push({
            startIndex: value.length - el.childNodes[0].nodeValue.length,
            endIndex: value.length,
            fill: el.style.fill,
            stroke: el.style.stroke,
            strokeWidth: el.style.strokeWidth,
          });
        } else if (index < childNodes.length - 1) {
          value += '\n';
        }
      }
    });

    value = obj['text-transform'] === 'uppercase' ? value.toUpperCase() : value;

    obj.set({
      text: value,
    } as unknown);
    var text = new fabric.Textbox(
      (obj as unknown as {text: string}).text,
      obj.toObject()
    );
    text.set({
      type: 'textbox',
      strokeUniform: true,
    });
    // The text moves to the right every time the svg is
    // rendered so this is to ensure that the text doesn't
    // render outside the canvas.
    // https://github.com/fabricjs/fabric.js/issues/1280
    if (text.left > this.CANVAS_WIDTH) {
      text.set({
        left: this.CANVAS_WIDTH,
      });
    }
    coloredTextIndex.forEach(obj => {
      text.setSelectionStart(obj.startIndex);
      text.setSelectionEnd(obj.endIndex);
      text.setSelectionStyles({
        stroke: obj.stroke,
        strokeWidth: obj.strokeWidth,
        fill: obj.fill,
      });
    });
    this.canvas.add(text);
  }

  isFullRectangle(element: SVGRectElement): boolean {
    return (
      element.width.baseVal.valueAsString === '100%' &&
      element.height.baseVal.valueAsString === '100%'
    );
  }

  continueDiagramEditing(): void {
    if (
      this.data.savedSvgFileName &&
      this.imageSaveDestination ===
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
    ) {
      this.imageLocalStorageService.deleteImage(this.data.savedSvgFileName);
    }
    this.diagramStatus = this.STATUS_EDITING;
    this.data = {};
    const domReady = new Promise((resolve, reject) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve(0);
      }
    });
    this.changeDetectorRef.detectChanges();
    domReady.then(() => {
      this.initializeFabricJs();
      fabric.loadSVGFromString(this.savedSvgDiagram, ((
        objects,
        options,
        elements
      ) => {
        let groupedObjects = [];
        objects.forEach((obj, index) => {
          const objId = elements[index].id;
          // Checks if the id starts with 'group' to identify whether the
          // svg objects are grouped together.
          if (objId.startsWith('group')) {
            groupedObjects = this.loadGroupedObject(objId, obj, groupedObjects);
          } else {
            // Detects the background color from the rectangle.
            if (
              obj.get('type') === 'rect' &&
              this.isFullRectangle(elements[index])
            ) {
              this.canvas.setBackgroundColor(obj.get('fill'), () => {});
              this.fabricjsOptions.bg = obj.get('fill');
              this.bgPicker.setOptions({
                color: obj.get('fill'),
              });
            } else if (obj.type === 'text') {
              this.loadTextObject(elements[index], obj);
            } else {
              this.canvas.add(obj);
            }
          }
        });
        groupedObjects.forEach(objs => {
          this.canvas.add(new fabric.Group(objs));
          this.groupCount += 1;
        });
        this.centerContent();
      }) as unknown as (results: Object[], options) => void);
      this.changeDetectorRef.detectChanges();
    });
  }

  centerContent(): void {
    let temporarySelection = new fabric.ActiveSelection(
      this.canvas.getObjects(),
      {canvas: this.canvas}
    );
    temporarySelection.scaleToWidth(this.canvas.getWidth());
    temporarySelection.center();
    this.canvas.setActiveObject(temporarySelection);
    this.canvas.discardActiveObject();
  }

  validate(): boolean {
    return (
      this.isDiagramSaved() &&
      this.data.savedSvgFileName &&
      this.data.savedSvgFileName.length > 0
    );
  }

  getSize(): number {
    const size = this.fabricjsOptions.size;
    // Removes the word "px" from the end of the string and converts
    // into an int.
    return parseInt(size);
  }

  createRect(): void {
    this.canvas.discardActiveObject();
    const defaultWidth = 60;
    const defaultHeight = 70;
    const rect = new fabric.Rect({
      top: this.defaultTopCoordinate,
      left: this.defaultLeftCoordinate,
      width: defaultWidth,
      height: defaultHeight,
      fill: this.fabricjsOptions.fill,
      stroke: this.fabricjsOptions.stroke,
      strokeWidth: this.getSize(),
      strokeUniform: true,
    });
    this.canvas.add(rect);
  }

  createLine(): void {
    this.canvas.discardActiveObject();
    const defaultBottomCoordinate = 100;
    const defaultRightCoordinate = 100;
    const line = new fabric.Line(
      [
        this.defaultTopCoordinate,
        this.defaultLeftCoordinate,
        defaultBottomCoordinate,
        defaultRightCoordinate,
      ],
      {
        stroke: this.fabricjsOptions.stroke,
        strokeWidth: this.getSize(),
        strokeUniform: true,
      }
    );
    this.canvas.add(line);
  }

  createCircle(): void {
    this.canvas.discardActiveObject();
    const circle = new fabric.Circle({
      top: this.defaultTopCoordinate,
      left: this.defaultLeftCoordinate,
      radius: this.defaultRadius,
      fill: this.fabricjsOptions.fill,
      stroke: this.fabricjsOptions.stroke,
      strokeWidth: this.getSize(),
      strokeUniform: true,
    });
    this.canvas.add(circle);
  }

  createText(): void {
    this.canvas.discardActiveObject();
    // The defaultTextSize is necessary to prevent the text
    // from being too small. This can be changed later in the editor.
    var defaultTextSize = '18px';
    this.fillPicker.setOptions({
      color: 'rgba(0,0,0,1)',
    });
    this.fabricjsOptions.size = defaultTextSize;
    var text = new fabric.Textbox('Enter Text', {
      top: this.defaultTopCoordinate,
      left: this.defaultLeftCoordinate,
      fontFamily: this.fabricjsOptions.fontFamily,
      fontSize: this.getSize(),
      fill: this.fabricjsOptions.fill,
      fontWeight: this.fabricjsOptions.bold ? 'bold' : 'normal',
      fontStyle: this.fabricjsOptions.italic ? 'italic' : 'normal',
    });
    this.canvas.add(text);
  }

  areAllToolsEnabled(): boolean {
    return this.drawMode === this.DRAW_MODE_NONE;
  }

  isDrawModePencil(): boolean {
    return this.drawMode === this.DRAW_MODE_PENCIL;
  }

  isPencilEnabled(): boolean {
    return this.areAllToolsEnabled() || this.isDrawModePencil();
  }

  togglePencilDrawing(): void {
    this.canvas.discardActiveObject();
    this.canvas.isDrawingMode = !this.canvas.isDrawingMode;
    this.canvas.freeDrawingBrush.color = this.fabricjsOptions.stroke;
    this.canvas.freeDrawingBrush.width = this.getSize();
    this.drawMode = this.DRAW_MODE_NONE;
    if (this.canvas.isDrawingMode) {
      this.drawMode = this.DRAW_MODE_PENCIL;
    }
  }

  private makePolygon(): fabric.Polyline {
    // The startPt is the initial point in the polygon and it is also the
    // last point if the polygon is closed.
    const startPt = this.polyOptions.bboxPoints[0];
    if (this.polygonMode === this.CLOSED_POLYGON_MODE) {
      this.polyOptions.bboxPoints.push(new PolyPoint(startPt.x, startPt.y));
    }
    var shape = new fabric.Polyline(this.polyOptions.bboxPoints, {
      fill: this.fabricjsOptions.fill,
      stroke: this.fabricjsOptions.stroke,
      strokeWidth: this.getSize(),
      strokeUniform: true,
      strokeLineCap: 'round',
    });
    return shape;
  }

  private createPolyShape(): void {
    // This function removes the individual lines and draws the polygon.
    this.polyOptions.lines.forEach(value => {
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
    this.canvas.forEachObject(object => {
      object.selectable = true;
    });
    this.canvas.renderAll();
    this.polyOptions.bboxPoints = [];
    this.polyOptions.lines = [];
    this.polyOptions.lineCounter = 0;
  }

  private setPolyStartingPoint(options): void {
    var mouse = this.canvas.getPointer(options.e);
    this.polyOptions.x = mouse.x;
    this.polyOptions.y = mouse.y;
  }

  private createPolygon() {
    if (this.drawMode === this.DRAW_MODE_POLY) {
      this.drawMode = this.DRAW_MODE_NONE;
      this.createPolyShape();
    } else {
      this.canvas.discardActiveObject();
      this.drawMode = this.DRAW_MODE_POLY;
      this.canvas.hoverCursor = 'default';
      this.canvas.forEachObject(object => {
        object.selectable = false;
      });
    }
  }

  isDrawModePolygon(): boolean {
    return this.drawMode === this.DRAW_MODE_POLY;
  }

  isOpenPolygonEnabled(): boolean {
    return (
      this.areAllToolsEnabled() ||
      (this.isDrawModePolygon() && this.polygonMode === this.OPEN_POLYGON_MODE)
    );
  }

  createOpenPolygon(): void {
    this.polygonMode = this.OPEN_POLYGON_MODE;
    this.createPolygon();
  }

  isClosedPolygonEnabled(): boolean {
    return (
      this.areAllToolsEnabled() ||
      (this.isDrawModePolygon() &&
        this.polygonMode === this.CLOSED_POLYGON_MODE)
    );
  }

  createClosedPolygon(): void {
    this.polygonMode = this.CLOSED_POLYGON_MODE;
    this.createPolygon();
  }

  private createBezierControlPoints(left: number, top: number): fabric.Circle {
    // This function is used to add the control points for the quadratic
    // bezier curve which is used to control the position of the curve.
    // A size 2 is added so that the control circles is not rendered
    // too small.
    var circle = new fabric.Circle({
      left: left,
      top: top,
      radius: this.getSize() + 2,
      fill: '#666666',
      stroke: '#666666',
      hasBorders: false,
      hasControls: false,
    });
    return circle;
  }

  private drawQuadraticCurve(): void {
    const defaultCurve = 'M 40 40 Q 95, 100, 150, 40';
    const defaultP1TopCoordinate = 95;
    const defaultP1LeftCoordinate = 100;
    const defaultP0TopCoordinate = 40;
    const defaultP0LeftCoordinate = 40;
    const defaultP2TopCoordinate = 150;
    const defaultP2LeftCoordinate = 40;
    const curve = new fabric.Path(defaultCurve, {
      stroke: this.fabricjsOptions.stroke,
      fill: this.fabricjsOptions.fill,
      strokeWidth: this.getSize(),
      objectCaching: false,
      selectable: false,
    });
    this.canvas.add(curve);

    const p1 = this.createBezierControlPoints(
      defaultP1TopCoordinate,
      defaultP1LeftCoordinate
    );
    p1.name = 'p1';
    p1.set({
      radius: 12,
      fill: '#ffffff',
      strokeWidth: 5,
    });
    this.canvas.add(p1);

    const p0 = this.createBezierControlPoints(
      defaultP0TopCoordinate,
      defaultP0LeftCoordinate
    );
    p0.name = 'p0';
    this.canvas.add(p0);

    const p2 = this.createBezierControlPoints(
      defaultP2TopCoordinate,
      defaultP2LeftCoordinate
    );
    p2.name = 'p2';
    this.canvas.add(p2);
  }

  private getQuadraticBezierCurve() {
    if (this.drawMode === this.DRAW_MODE_BEZIER) {
      // The order of objects being added are the path followed by
      // three control points. Therefore the 4th from the last is the
      // quadratic curve.
      return this.canvas.getObjects().slice(-4, -3)[0];
    }
  }

  createQuadraticBezier(): void {
    if (this.drawMode === this.DRAW_MODE_NONE) {
      this.canvas.discardActiveObject();
      this.drawMode = this.DRAW_MODE_BEZIER;
      this.canvas.getObjects().forEach(item => {
        item.set({
          hoverCursor: 'default',
          selectable: false,
        });
      });
      this.drawQuadraticCurve();
    } else {
      // This is the case when the user clicks the tool after drawing the
      // curve. The current path and the circles are removed and new path
      // is added.
      this.canvas
        .getObjects()
        .slice(-3)
        .forEach(item => {
          this.canvas.remove(item);
        });
      const path = this.canvas
        .getObjects()
        .slice(-1)[0]
        .get('path' as keyof fabric.Object);
      this.canvas.remove(this.canvas.getObjects().slice(-1)[0]);
      this.canvas.getObjects().forEach(item => {
        item.set({
          hoverCursor: 'move',
          selectable: true,
        });
      });
      // Change mode and then add the path so that the object is added in
      // cavasObjects array.
      this.drawMode = this.DRAW_MODE_NONE;
      // Adding a new path so that the bbox is computed correctly.
      const curve = new fabric.Path(path, {
        stroke: this.fabricjsOptions.stroke,
        fill: this.fabricjsOptions.fill,
        strokeWidth: this.getSize(),
      });
      this.canvas.add(curve);
    }
  }

  isDrawModeBezier(): boolean {
    return this.drawMode === this.DRAW_MODE_BEZIER;
  }

  onAddItem(): void {
    if (this.pieChartDataInput.length < this.pieChartDataLimit) {
      var defaultData = 10;
      var dataInput = {
        name: 'Data name',
        data: defaultData,
        color: '#000000',
        angle: 0,
      };
      this.pieChartDataInput.push(dataInput);
    }
  }

  getPieSlice(
    center: {x: number; y: number},
    radius: number,
    startAngle: number,
    endAngle: number,
    color: string
  ): fabric.Group {
    // The pie slice is a combination of a semicircle and a triangle.
    // The following code is used to calculate the angle of the arc and
    // the points for drawing the polygon.
    const angle = endAngle - startAngle;
    const halfAngle = angle / 2;
    const halfChord = radius * Math.sin(angle / 2);
    const height = Math.sqrt(Math.pow(radius, 2) - Math.pow(halfChord, 2));
    const radiansToDegrees = 180 / Math.PI;

    const arc = new fabric.Circle({
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
      id: 'group' + this.groupCount,
    } as unknown as fabric.ICircleOptions);
    arc.toSVG = this.createCustomToSVG(
      arc.toSVG,
      'path',
      (arc as unknown as {id: string}).id,
      arc
    );
    const p1 = new PolyPoint(height + center.x, center.y + halfChord);
    const p2 = new PolyPoint(height + center.x, center.y - halfChord);
    const tri = new fabric.Polygon([center, p1, p2, center], {
      fill: color,
      stroke: color,
      strokeWidth: 1,
      strokeUniform: true,
      id: 'group' + this.groupCount,
    } as unknown as fabric.IPolylineOptions);
    tri.toSVG = this.createCustomToSVG(
      tri.toSVG,
      tri.type,
      (tri as unknown as {id: string}).id,
      tri
    );
    const rotationAngle = (startAngle + halfAngle) * radiansToDegrees;
    const slice = new fabric.Group([arc, tri], {
      originX: 'center',
      originY: 'center',
      top: center.y,
      left: center.x,
      angle: rotationAngle,
    });
    return slice;
  }

  getTextIndex(text: string, lineNum: number, charIndex: number): number {
    return (
      text
        .split('\n')
        .slice(0, lineNum)
        .reduce((sum, textLine) => {
          return sum + textLine.length + 1;
        }, 0) + charIndex
    );
  }

  createChart(): void {
    let total = 0;
    let currentAngle = 0;
    let pieSlices = [];
    let legendText = '';
    const PIE_SLICE_COLOR_INDICATOR = '\u2587';
    for (var i = 0; i < this.pieChartDataInput.length; i++) {
      total += this.pieChartDataInput[i].data;
      legendText += PIE_SLICE_COLOR_INDICATOR + ' - ';
      legendText +=
        this.pieChartDataInput[i].name +
        ' - ' +
        this.pieChartDataInput[i].data +
        '\n';
    }
    legendText = legendText.slice(0, -1);
    for (var i = 0; i < this.pieChartDataInput.length; i++) {
      this.pieChartDataInput[i].angle =
        (this.pieChartDataInput[i].data / total) * Math.PI * 2;
      pieSlices.push(
        this.getPieSlice(
          new PolyPoint(this.defaultTopCoordinate, this.defaultLeftCoordinate),
          this.defaultRadius,
          currentAngle,
          currentAngle + this.pieChartDataInput[i].angle,
          this.pieChartDataInput[i].color
        )
      );
      // If a pie slice has an angle greater than 180, then
      // it should be rendered first, otherwise it will overlap other
      // slices.
      if (this.pieChartDataInput[i].angle > Math.PI) {
        var pieSlice = pieSlices.pop();
        pieSlices.splice(0, 0, pieSlice);
      }
      currentAngle += this.pieChartDataInput[i].angle;
    }
    // The defaultTextSize is to prevent the text from being too small.
    // This can be changed again using editor.
    var defaultTextSize = '18px';
    this.fabricjsOptions.size = defaultTextSize;
    var text = new fabric.Textbox(legendText, {
      top: 100,
      left: 120,
      fontFamily: this.fabricjsOptions.fontFamily,
      fontSize: this.getSize(),
      fill: '#000000',
      fontWeight: this.fabricjsOptions.bold ? 'bold' : 'normal',
      fontStyle: this.fabricjsOptions.italic ? 'italic' : 'normal',
      width: 200,
    });
    // Gives the color to the pie slice indicator which
    // is used to indentify the pie slice.
    for (var i = 0; i < this.pieChartDataInput.length; i++) {
      text.setSelectionStart(this.getTextIndex(legendText, i, 0));
      text.setSelectionEnd(this.getTextIndex(legendText, i, 1));
      text.setSelectionStyles({
        stroke: '#000',
        strokeWidth: 2,
        fill: this.pieChartDataInput[i].color,
      });
    }
    this.drawMode = this.DRAW_MODE_NONE;
    this.canvas.add(text);
    this.canvas.add(new fabric.Group(pieSlices));
    this.groupCount += 1;
  }

  createPieChart(): void {
    if (this.drawMode === this.DRAW_MODE_NONE) {
      this.canvas.discardActiveObject();
      this.drawMode = this.DRAW_MODE_PIECHART;
    } else {
      this.createChart();
      // Resets the pie chart form.
      this.pieChartDataInput = [
        {
          name: 'Data name 1',
          data: 10,
          color: '#ff0000',
          angle: 0,
        },
        {
          name: 'Data name 2',
          data: 10,
          color: '#00ff00',
          angle: 0,
        },
      ];
    }
  }

  isPieChartEnabled(): boolean {
    return Boolean(
      this.areAllToolsEnabled() || this.drawMode === this.DRAW_MODE_PIECHART
    );
  }

  isDrawModePieChart(): boolean {
    return Boolean(this.drawMode === this.DRAW_MODE_PIECHART);
  }

  private loadSvgFile(objects): void {
    if (this.loadType === 'group') {
      objects.forEach(obj => {
        obj.set({
          id: 'group' + this.groupCount,
        });
        obj.toSVG = this.createCustomToSVG(obj.toSVG, obj.type, obj.id, obj);
      });
      this.canvas.add(new fabric.Group(objects));
      this.groupCount += 1;
    } else {
      objects.forEach(obj => {
        this.canvas.add(obj);
      });
    }
  }

  uploadSvgFile(): void {
    if (this.drawMode === this.DRAW_MODE_NONE) {
      this.canvas.discardActiveObject();
      this.drawMode = this.DRAW_MODE_SVG_UPLOAD;
    } else {
      this.drawMode = this.DRAW_MODE_NONE;
      if (this.uploadedSvgDataUrl !== null) {
        const svgString = this.svgSanitizerService.convertBase64ToUnicodeString(
          this.uploadedSvgDataUrl.unsafeUrl.split(',')[1]
        );
        fabric.loadSVGFromString(svgString, args => this.loadSvgFile(args));
      }
      this.canvas.renderAll();
      this.uploadedSvgDataUrl = null;
    }
  }

  setUploadedFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        this.uploadedSvgDataUrl = {
          safeUrl: this.svgSanitizerService.getTrustedSvgResourceUrl(
            reader.result as string
          ),
          unsafeUrl: reader.result as string,
        };
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onFileChanged(file: File, filename: string): void {
    this.setUploadedFile(file);
  }

  isFileUploaded(): boolean {
    return Boolean(this.uploadedSvgDataUrl !== null);
  }

  isDrawModeSvgUpload(): boolean {
    return Boolean(this.drawMode === this.DRAW_MODE_SVG_UPLOAD);
  }

  isSvgUploadEnabled(): boolean {
    return Boolean(
      this.areAllToolsEnabled() || this.drawMode === this.DRAW_MODE_SVG_UPLOAD
    );
  }

  bringObjectForward(): void {
    this.canvas.bringForward(this.canvas.getActiveObject());
    if (this.layerNum < this.canvas._objects.length) {
      this.layerNum += 1;
    }
  }

  sendObjectBackward(): void {
    this.canvas.sendBackwards(this.canvas.getActiveObject());
    if (this.layerNum > 1) {
      this.layerNum -= 1;
    }
  }

  private undoStackPush(object): void {
    if (this.objectUndoStack.length === this.undoLimit) {
      this.objectUndoStack.shift();
    }
    this.objectUndoStack.push(object);
  }

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
          object: shape,
        });
      } else {
        this.isRedo = true;
        this.objectRedoStack.push({
          action: 'remove',
          object: undoObj.object,
        });
        // Adding the object in the correct position according to initial
        // order.
        this.undoFlag = true;
        this.canvasObjects.splice(undoObj.index, 0, undoObj.object);
        this.canvas.add(undoObj.object);
      }
      this.canvas.renderAll();
    }
  }

  isUndoEnabled(): boolean {
    return (
      this.drawMode === this.DRAW_MODE_NONE && this.objectUndoStack.length > 0
    );
  }

  onRedo(): void {
    this.canvas.discardActiveObject();
    if (this.objectRedoStack.length > 0) {
      var redoObj = this.objectRedoStack.pop();
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
  }

  isRedoEnabled(): boolean {
    return (
      this.drawMode === this.DRAW_MODE_NONE && this.objectRedoStack.length > 0
    );
  }

  removeShape(): void {
    var shape = this.canvas.getActiveObject();
    var index = this.canvasObjects.indexOf(shape);
    if (shape) {
      this.undoStackPush({
        action: 'remove',
        object: shape,
        index: index,
      });
      this.objectRedoStack = [];
      this.canvasObjects.splice(index, 1);
      this.canvas.remove(shape);
    }
  }

  onClear(): void {
    this.groupCount = 0;
    this.objectUndoStack = [];
    this.objectRedoStack = [];
    this.canvasObjects = [];
    if (this.canvas) {
      this.canvas.clear();
      this.onBgChange();
    }
  }

  isClearEnabled(): boolean {
    return (
      this.canvasObjects.length > 0 && this.drawMode === this.DRAW_MODE_NONE
    );
  }

  onStrokeChange(): void {
    if (this.drawMode === this.DRAW_MODE_BEZIER) {
      this.getQuadraticBezierCurve().set({
        stroke: this.fabricjsOptions.stroke,
      });
      this.canvas.renderAll();
    } else {
      var shape = this.canvas.getActiveObject();
      var strokeShapes = ['rect', 'circle', 'path', 'line', 'polyline'];
      this.canvas.freeDrawingBrush.color = this.fabricjsOptions.stroke;
      if (shape && strokeShapes.indexOf(shape.get('type')) !== -1) {
        shape.set({
          stroke: this.fabricjsOptions.stroke,
        });
        this.canvas.renderAll();
      }
    }
  }

  onFillChange(): void {
    // Fetches the bezier curve and then the fill color.
    if (this.drawMode === this.DRAW_MODE_BEZIER) {
      this.getQuadraticBezierCurve().set({
        fill: this.fabricjsOptions.fill,
      });
      this.canvas.renderAll();
    } else {
      var shape = this.canvas.getActiveObject();
      var fillShapes = ['rect', 'circle', 'path', 'textbox', 'polyline'];
      if (shape && fillShapes.indexOf(shape.get('type')) !== -1) {
        shape.set({
          fill: this.fabricjsOptions.fill,
        });
        this.canvas.renderAll();
      }
    }
  }

  onBgChange(): void {
    this.canvas.setBackgroundColor(this.fabricjsOptions.bg, () => {
      // This is a call back that runs when background is set.
      // This is needed for ts checks.
    });
    this.canvas.renderAll();
  }

  onItalicToggle(): void {
    var shape = this.canvas.getActiveObject();
    if (shape && shape.get('type') === 'textbox') {
      shape.set({
        fontStyle: this.fabricjsOptions.italic ? 'italic' : 'normal',
      } as Partial<fabric.Object>);
      this.canvas.renderAll();
    }
  }

  onBoldToggle(): void {
    var shape = this.canvas.getActiveObject();
    if (shape && shape.get('type') === 'textbox') {
      shape.set({
        fontWeight: this.fabricjsOptions.bold ? 'bold' : 'normal',
      } as Partial<fabric.Object>);
      this.canvas.renderAll();
    }
  }

  onFontChange(): void {
    var shape = this.canvas.getActiveObject();
    if (shape && shape.get('type') === 'textbox') {
      shape.set({
        fontFamily: this.fabricjsOptions.fontFamily,
      } as Partial<fabric.Object>);
      this.canvas.renderAll();
    }
  }

  onSizeChange(): void {
    // Ensures that the size change is applied only to the curve and
    // not to all the control points.
    if (this.drawMode === this.DRAW_MODE_BEZIER) {
      var numberOfEdgeControlPoints = 2;
      // Changes the radius of the edge control points.
      // A size 2 is added so that the control circles is not rendered
      // too small.
      this.canvas
        .getObjects()
        .slice(-numberOfEdgeControlPoints)
        .forEach(object => {
          object.set({
            radius: this.getSize() + 2,
          } as Partial<fabric.Object>);
        });
      this.getQuadraticBezierCurve().set({
        strokeWidth: this.getSize(),
      } as Partial<fabric.Object>);
      this.canvas.renderAll();
    } else {
      var shape = this.canvas.getActiveObject();
      this.canvas.freeDrawingBrush.width = this.getSize();
      var strokeWidthShapes = ['rect', 'circle', 'path', 'line', 'polyline'];
      if (shape && strokeWidthShapes.indexOf(shape.get('type')) !== -1) {
        shape.set({
          strokeWidth: this.getSize(),
        } as Partial<fabric.Object>);
        this.canvas.renderAll();
      } else if (shape && shape.get('type') === 'textbox') {
        shape.set({
          fontSize: this.getSize(),
        } as Partial<fabric.Object>);
        this.canvas.renderAll();
      }
    }
  }

  isSizeVisible(): boolean {
    return Boolean(
      this.objectIsSelected || this.drawMode !== this.DRAW_MODE_NONE
    );
  }

  createColorPicker(value: string): void {
    var parent = document.getElementById(value + '-color');

    var onChangeFunc = {
      stroke: () => this.onStrokeChange(),
      fill: () => this.onFillChange(),
      bg: () => this.onBgChange(),
    };
    let onOpen = () => {
      // This DOM manipulation is necessary because the color picker is not
      // configurable in the third-party module.
      let alphaSliders = document.querySelectorAll(
        '.picker_alpha .picker_selector'
      );
      alphaSliders.forEach(element => {
        element.setAttribute('title', 'Transparency Slider');
      });
    };
    let onChange = color => {
      parent.style.background = color.rgbaString;
      var topAlphaSquare = document.getElementById('top-' + value + '-alpha');
      var bottomAlphaSquare = document.getElementById(
        'bottom-' + value + '-alpha'
      );
      var opacity = 1 - color.rgba[3];
      topAlphaSquare.style.opacity = opacity.toString();
      bottomAlphaSquare.style.opacity = opacity.toString();
      this.fabricjsOptions[value] = color.rgbaString;
      onChangeFunc[value]();
    };
    var picker = new Picker({
      parent: parent,
      color: this.fabricjsOptions[value],
      onOpen: onOpen,
      onChange: onChange,
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
  }

  initializeMouseEvents(): void {
    // Adding event listener for polygon tool.
    this.canvas.on('mouse:dblclick', () => {
      if (this.drawMode === this.DRAW_MODE_POLY) {
        this.drawMode = this.DRAW_MODE_NONE;
        this.createPolyShape();
      }
    });

    this.canvas.on('mouse:down', options => {
      // Used to detect the mouse clicks when drawing the polygon.
      if (this.drawMode === this.DRAW_MODE_POLY) {
        this.setPolyStartingPoint(options);
        var x = this.polyOptions.x;
        var y = this.polyOptions.y;
        this.polyOptions.bboxPoints.push(new PolyPoint(x, y));
        var points = [x, y, x, y];
        var stroke = this.fabricjsOptions.stroke;
        // Ensures that the polygon lines are visible when
        // creating the polygon.
        stroke = stroke.slice(0, -2) + '1)';
        var line = new fabric.Line(points, {
          strokeWidth: this.getSize(),
          selectable: false,
          stroke: stroke,
          strokeLineCap: 'round',
        });
        // Enables drawing a polygon in a device with touch support.
        if (
          this.polyOptions.lines.length !== 0 &&
          this.drawMode === this.DRAW_MODE_POLY &&
          this.isTouchDevice
        ) {
          this.setPolyStartingPoint(options);
          this.polyOptions.lines[this.polyOptions.lineCounter - 1].set({
            x2: this.polyOptions.x,
            y2: this.polyOptions.y,
          });
          this.canvas.renderAll();
        }
        this.polyOptions.lines.push(line);
        this.canvas.add(this.polyOptions.lines[this.polyOptions.lineCounter]);
        this.polyOptions.lineCounter++;
      }
    });

    this.canvas.on('mouse:move', options => {
      // Detects the mouse movement while drawing the polygon.
      if (
        this.polyOptions.lines.length !== 0 &&
        this.drawMode === this.DRAW_MODE_POLY &&
        !this.isTouchDevice
      ) {
        this.setPolyStartingPoint(options);
        this.polyOptions.lines[this.polyOptions.lineCounter - 1].set({
          x2: this.polyOptions.x,
          y2: this.polyOptions.y,
        });
        this.canvas.renderAll();
      }
    });

    this.canvas.on('object:moving', e => {
      // Detects the movement in the control points when
      // drawing the bezier curve.
      if (this.drawMode === this.DRAW_MODE_BEZIER) {
        var pt = e.target;
        var curve = this.getQuadraticBezierCurve() as unknown as {
          path: number[][];
        };
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
        this.drawMode === this.DRAW_MODE_NONE ||
        this.drawMode === this.DRAW_MODE_PENCIL
      ) {
        var shape = this.canvas._objects[this.canvas._objects.length - 1];
        if (!this.undoFlag) {
          this.canvasObjects.push(shape);
        }
        this.undoFlag = false;
        if (!this.isRedo) {
          this.undoStackPush({
            action: 'add',
            object: shape,
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
          scaleY: 1,
        });
      }
    });

    var onSelection = () => {
      // Ensures that the fabricjsOptions doesn't change when the user
      // selects the quadratic bezier control points.
      if (
        this.drawMode === this.DRAW_MODE_NONE ||
        this.drawMode === this.DRAW_MODE_PENCIL
      ) {
        var shape = this.canvas.getActiveObject();
        this.layerNum = this.canvas._objects.indexOf(shape) + 1;
        this.fillPicker.setOptions({
          color: shape.get('fill'),
        });
        this.strokePicker.setOptions({
          color: shape.get('stroke'),
        });
        this.objectIsSelected = true;
        var strokeWidthShapes = ['rect', 'circle', 'path', 'line', 'polyline'];
        if (strokeWidthShapes.indexOf(shape.get('type')) !== -1) {
          this.fabricjsOptions.size =
            shape.get('strokeWidth').toString() + 'px';
          this.displayFontStyles = false;
        } else if (shape.get('type') === 'textbox') {
          this.displayFontStyles = true;
          this.fabricjsOptions.size =
            shape.get('fontSize' as keyof fabric.Object).toString() + 'px';
          this.fabricjsOptions.fontFamily = shape.get(
            'fontFamily' as keyof fabric.Object
          );
          this.fabricjsOptions.italic =
            shape.get('fontStyle' as keyof fabric.Object) === 'italic';
          this.fabricjsOptions.bold =
            shape.get('fontWeight' as keyof fabric.Object) === 'bold';
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
  }

  setCanvasDimensions(): void {
    let dimensions =
      this.value && this.imagePreloaderService.getDimensionsOfImage(this.value);
    this.canvas.setHeight(dimensions?.height || this.CANVAS_HEIGHT);
    this.canvas.setWidth(dimensions?.width || this.CANVAS_WIDTH);
    this.canvas.renderAll();
  }

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
  }
}
