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
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {AppConstants} from 'app.constants';
import {fabric} from 'fabric';
import {ImagePreloaderService} from 'pages/exploration-player-page/services/image-preloader.service';
import {AlertsService} from 'services/alerts.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {PageContextService} from 'services/page-context.service';
import {DeviceInfoService} from 'services/contextual/device-info.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {SvgSanitizerService} from 'services/svg-sanitizer.service';
import Picker from 'vanilla-picker';
import {SvgFileFetcherBackendApiService} from './svg-file-fetcher-backend-api.service';
import {SvgEditorConstants} from './svg-editor.constants';
import {Subscription} from 'rxjs';

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

interface PieChartItem {
  name: string;
  data: number;
  color: string;
  angle: number;
}

interface UndoRedoItem {
  action: string;
  object: fabric.Object;
  index?: number;
}

interface TextStyling {
  startIndex: number;
  endIndex: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

@Component({
  selector: 'svg-editor',
  templateUrl: './svg-editor.component.html',
})
export class SvgEditorComponent implements OnInit, OnDestroy {
  @Input() value!: string;
  @Output() valueChanged = new EventEmitter<string>();
  @Output() validityChange = new EventEmitter<Record<'empty', boolean>>();
  @Output() discardImage = new EventEmitter<void>();

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

  CANVAS_WIDTH = 494;
  CANVAS_HEIGHT = 368;
  drawMode = this.DRAW_MODE_NONE;
  polygonMode = this.CLOSED_POLYGON_MODE;
  isTouchDevice = this.deviceInfoService.hasTouchEvents();

  polyOptions: {
    x: number;
    y: number;
    bboxPoints: PolyPoint[];
    lines: fabric.Line[];
    lineCounter: number;
    shape: fabric.Polyline | null;
  } = {
    x: 0,
    y: 0,
    bboxPoints: [],
    lines: [],
    lineCounter: 0,
    shape: null,
  };

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

  randomId = Math.floor(Math.random() * 100000).toString();
  canvasID = 'canvas' + this.randomId;

  fillPicker: Picker | null = null;
  strokePicker: Picker | null = null;
  bgPicker: Picker | null = null;

  diagramWidth = 450;
  currentDiagramWidth = 450;
  diagramHeight = 350;
  currentDiagramHeight = 350;

  data: {
    savedSvgUrl?: SafeResourceUrl | string;
    savedSvgFileName?: string;
  } = {};

  diagramStatus = this.STATUS_EDITING;
  displayFontStyles = false;
  objectUndoStack: UndoRedoItem[] = [];
  objectRedoStack: UndoRedoItem[] = [];
  canvasObjects: fabric.Object[] = [];
  undoFlag = false;
  isRedo = false;
  undoLimit = 5;
  savedSvgDiagram = '';
  entityId!: string;
  entityType!: string;
  imageSaveDestination!: string;
  svgContainerStyle: Record<string, string> = {};
  layerNum = 0;

  fabricjsOptions: Record<string, string | boolean> = {
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
  pieChartDataInput: PieChartItem[] = [
    {name: 'Data name 1', data: 10, color: '#ff0000', angle: 0},
    {name: 'Data name 2', data: 10, color: '#00ff00', angle: 0},
  ];

  allowedImageFormats = ['svg'];
  uploadedSvgDataUrl: {
    safeUrl: SafeResourceUrl;
    unsafeUrl: string;
  } | null = null;

  loadType = 'group';
  defaultTopCoordinate = 50;
  defaultLeftCoordinate = 50;
  defaultRadius = 30;

  canvas!: fabric.Canvas;

  filepath = '';
  loadingIndicatorIsShown = false;
  x!: number;
  y!: number;

  private subscriptions = new Subscription();

  @ViewChild('dropArea') dropAreaRef!: ElementRef;

  constructor(
    private alertsService: AlertsService,
    private assetsBackendApiService: AssetsBackendApiService,
    private changeDetectorRef: ChangeDetectorRef,
    private pageContextService: PageContextService,
    private deviceInfoService: DeviceInfoService,
    private imageLocalStorageService: ImageLocalStorageService,
    private imagePreloaderService: ImagePreloaderService,
    private imageUploadHelperService: ImageUploadHelperService,
    private svgFileFetcherBackendApiService: SvgFileFetcherBackendApiService,
    private svgSanitizerService: SvgSanitizerService
  ) {}

  ngOnInit(): void {
    this.imageSaveDestination =
      this.pageContextService.getImageSaveDestination();
    this.entityId = this.pageContextService.getEntityId();
    this.entityType = this.pageContextService.getEntityType();

    if (this.value) {
      this.setSavedSvgFilename(this.value, true);
      const dimensions = this.imagePreloaderService.getDimensionsOfImage(
        this.value
      );
      this.svgContainerStyle = {
        height: dimensions.height + 'px',
        width: dimensions.width + 'px',
      };
      this.validityChange.emit({empty: true});
    } else {
      this.validityChange.emit({empty: false});
      setTimeout(() => {
        this.initializeFabricJs();
        this.changeDetectorRef.detectChanges();
      }, 0);
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
      const imageUrl = this.imageLocalStorageService.getRawImageData(
        svgFileName
      ) as string;
      return {
        safeUrl: this.svgSanitizerService.getTrustedSvgResourceUrl(
          imageUrl
        ) as SafeResourceUrl,
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
      const svgDataUrl =
        this.imageLocalStorageService.getRawImageData(filename);
      if (
        this.imageSaveDestination ===
          AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE &&
        svgDataUrl
      ) {
        this.uploadedSvgDataUrl = {
          safeUrl: this.svgSanitizerService.getTrustedSvgResourceUrl(
            svgDataUrl as string
          ) as SafeResourceUrl,
          unsafeUrl: svgDataUrl as string,
        };
        this.savedSvgDiagram =
          this.svgSanitizerService.convertBase64ToUnicodeString(
            (svgDataUrl as string).split(',')[1]
          );
      } else {
        this.subscriptions.add(
          this.svgFileFetcherBackendApiService
            .fetchSvg(this.data.savedSvgUrl as string)
            .subscribe(response => {
              this.savedSvgDiagram = response;
            })
        );
      }
    }
  }

  postSvgToServer(
    dimensions: Dimensions,
    resampledFile: Blob
  ): Promise<{filename: string}> {
    return this.svgFileFetcherBackendApiService
      .postSvgFile(resampledFile, dimensions, this.entityType, this.entityId)
      .toPromise() as Promise<{filename: string}>;
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
    if (!svg) {
      return '';
    }

    svg.removeAttribute('xml:space');
    const textTags = doc.querySelectorAll('text');
    textTags.forEach(obj => {
      obj.removeAttribute('xml:space');
    });

    const elements = svg.querySelectorAll('*');
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].getAttributeNames().indexOf('vector-effect') !== -1) {
        elements[i].removeAttribute('vector-effect');
        let style = elements[i].getAttribute('style') || '';
        style += ' vector-effect: non-scaling-stroke';
        elements[i].setAttribute('style', style);
      }
    }
    return svg.outerHTML;
  }

  isSvgTagValid(svgString: string): boolean {
    const dataURI =
      'data:image/svg+xml;base64,' +
      btoa(unescape(encodeURIComponent(svgString)));
    const invalidTagsAndAttr =
      this.svgSanitizerService.getInvalidSvgTagsAndAttrsFromDataUri(dataURI);
    if (invalidTagsAndAttr.tags.length !== 0) {
      throw new Error('Invalid tags in svg:' + invalidTagsAndAttr.tags.join());
    } else if (invalidTagsAndAttr.attrs.length !== 0) {
      throw new Error(
        'Invalid attributes in svg:' + invalidTagsAndAttr.attrs.join()
      );
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

    if (this.isSvgTagValid(svgString)) {
      this.savedSvgDiagram = svgString;
      const resampledFile =
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
            const img = new Image();
            img.onload = () => {
              this.setSavedSvgFilename(data.filename, false);
              const dims = this.imagePreloaderService.getDimensionsOfImage(
                data.filename
              );
              this.svgContainerStyle = {
                height: dims.height + 'px',
                width: dims.width + 'px',
              };
              this.loadingIndicatorIsShown = false;
            };

            img.src = (
              this.getTrustedResourceUrlForSvgFileName(data.filename) as {
                unsafeUrl: string;
              }
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
      if (parentG) {
        parentG.setAttribute('id', id);
      }
      return doc.documentElement.outerHTML;
    };
  }

  loadGroupedObject(
    objId: string,
    obj: fabric.Object,
    groupedObjects: fabric.Object[][]
  ): fabric.Object[][] {
    const groupId = parseInt(objId.slice(5), 10);
    if (groupedObjects.length <= groupId) {
      groupedObjects.push([]);
    }

    const fabricObj = obj as unknown as fabric.Object & {id: string};
    fabricObj.toSVG = this.createCustomToSVG(
      fabricObj.toSVG,
      fabricObj.type || 'path',
      fabricObj.id,
      fabricObj
    );
    groupedObjects[groupId].push(fabricObj);
    return groupedObjects;
  }

  loadTextObject(element: Element, obj: fabric.Object): void {
    const childNodes = Array.from(element.childNodes);
    let value = '';
    const coloredTextIndex: TextStyling[] = [];

    childNodes.forEach((el: ChildNode, index) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.nodeName === 'tspan') {
        const nodeVal = htmlEl.childNodes[0]?.nodeValue || '';
        value += nodeVal;
        if (htmlEl.style.fill !== '') {
          coloredTextIndex.push({
            startIndex: value.length - nodeVal.length,
            endIndex: value.length,
            fill: htmlEl.style.fill,
            stroke: htmlEl.style.stroke,
            strokeWidth: parseInt(htmlEl.style.strokeWidth || '0', 10),
          });
        } else if (index < childNodes.length - 1) {
          value += '\n';
        }
      }
    });

    const fabricTextObj = obj as unknown as fabric.Object & {
      'text-transform': string;
    };
    value =
      fabricTextObj['text-transform'] === 'uppercase'
        ? value.toUpperCase()
        : value;
    fabricTextObj.set({text: value} as Record<string, string>);

    const text = new fabric.Textbox(
      (fabricTextObj as unknown as fabric.Textbox).text,
      fabricTextObj.toObject()
    );
    text.set({type: 'textbox', strokeUniform: true});

    if (text.left !== undefined && text.left > this.CANVAS_WIDTH) {
      text.set({left: this.CANVAS_WIDTH});
    }

    coloredTextIndex.forEach(styleObj => {
      const textbox = text as unknown as fabric.IText;
      textbox.setSelectionStart(styleObj.startIndex);
      textbox.setSelectionEnd(styleObj.endIndex);
      textbox.setSelectionStyles({
        stroke: styleObj.stroke,
        strokeWidth: styleObj.strokeWidth,
        fill: styleObj.fill,
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
    setTimeout(() => {
      this.initializeFabricJs();
      fabric.loadSVGFromString(this.savedSvgDiagram, objects => {
        let groupedObjects: fabric.Object[][] = [];
        const elements = Array.from(
          new DOMParser()
            .parseFromString(this.savedSvgDiagram, 'image/svg+xml')
            .querySelectorAll('[id]')
        );

        objects.forEach((obj, index) => {
          const objId = elements[index]?.id || '';
          if (objId.startsWith('group')) {
            groupedObjects = this.loadGroupedObject(objId, obj, groupedObjects);
          } else {
            if (
              obj.get('type') === 'rect' &&
              this.isFullRectangle(elements[index] as SVGRectElement)
            ) {
              this.canvas.setBackgroundColor(
                obj.get('fill') as string,
                () => {}
              );
              this.fabricjsOptions.bg = obj.get('fill') as string;
              this.bgPicker?.setOptions({color: obj.get('fill') as string});
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
      });
      this.changeDetectorRef.detectChanges();
    }, 0);
  }

  centerContent(): void {
    const temporarySelection = new fabric.ActiveSelection(
      this.canvas.getObjects(),
      {canvas: this.canvas}
    );
    temporarySelection.scaleToWidth(this.canvas.getWidth());
    temporarySelection.center();
    this.canvas.setActiveObject(temporarySelection);
    this.canvas.discardActiveObject();
  }

  validate(): boolean {
    return Boolean(
      this.isDiagramSaved() &&
        this.data.savedSvgFileName &&
        this.data.savedSvgFileName.length > 0
    );
  }

  getSize(): number {
    return parseInt(this.fabricjsOptions.size as string, 10);
  }

  createRect(): void {
    this.canvas.discardActiveObject();
    const rect = new fabric.Rect({
      top: this.defaultTopCoordinate,
      left: this.defaultLeftCoordinate,
      width: 60,
      height: 70,
      fill: this.fabricjsOptions.fill as string,
      stroke: this.fabricjsOptions.stroke as string,
      strokeWidth: this.getSize(),
      strokeUniform: true,
    });
    this.canvas.add(rect);
  }

  createLine(): void {
    this.canvas.discardActiveObject();
    const line = new fabric.Line(
      [this.defaultTopCoordinate, this.defaultLeftCoordinate, 100, 100],
      {
        stroke: this.fabricjsOptions.stroke as string,
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
      fill: this.fabricjsOptions.fill as string,
      stroke: this.fabricjsOptions.stroke as string,
      strokeWidth: this.getSize(),
      strokeUniform: true,
    });
    this.canvas.add(circle);
  }

  createText(): void {
    this.canvas.discardActiveObject();
    this.fillPicker?.setOptions({color: 'rgba(0,0,0,1)'});
    this.fabricjsOptions.size = '18px';
    const text = new fabric.Textbox('Enter Text', {
      top: this.defaultTopCoordinate,
      left: this.defaultLeftCoordinate,
      fontFamily: this.fabricjsOptions.fontFamily as string,
      fontSize: this.getSize(),
      fill: this.fabricjsOptions.fill as string,
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
    if (this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.color = this.fabricjsOptions
        .stroke as string;
      this.canvas.freeDrawingBrush.width = this.getSize();
    }
    this.drawMode = this.canvas.isDrawingMode
      ? this.DRAW_MODE_PENCIL
      : this.DRAW_MODE_NONE;
  }

  private makePolygon(): fabric.Polyline {
    const startPt = this.polyOptions.bboxPoints[0];
    if (this.polygonMode === this.CLOSED_POLYGON_MODE) {
      this.polyOptions.bboxPoints.push(new PolyPoint(startPt.x, startPt.y));
    }
    return new fabric.Polyline(this.polyOptions.bboxPoints, {
      fill: this.fabricjsOptions.fill as string,
      stroke: this.fabricjsOptions.stroke as string,
      strokeWidth: this.getSize(),
      strokeUniform: true,
      strokeLineCap: 'round',
    });
  }

  private createPolyShape(): void {
    this.polyOptions.lines.forEach(line => this.canvas.remove(line));
    if (this.polyOptions.bboxPoints.length > 0) {
      this.polyOptions.shape = this.makePolygon();
      this.canvas.add(this.polyOptions.shape);
    }
    this.canvas.hoverCursor = 'move';
    this.canvas.forEachObject(obj => {
      obj.selectable = true;
    });
    this.canvas.renderAll();
    this.polyOptions.bboxPoints = [];
    this.polyOptions.lines = [];
    this.polyOptions.lineCounter = 0;
  }

  private setPolyStartingPoint(options: {e: MouseEvent}): void {
    const mouse = this.canvas.getPointer(options.e);
    this.polyOptions.x = mouse.x;
    this.polyOptions.y = mouse.y;
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
    if (this.drawMode === this.DRAW_MODE_POLY) {
      this.createPolyShape();
    } else {
      this.drawMode = this.DRAW_MODE_POLY;
    }
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
    if (this.drawMode === this.DRAW_MODE_POLY) {
      this.createPolyShape();
    } else {
      this.drawMode = this.DRAW_MODE_POLY;
    }
  }

  private createBezierControlPoints(left: number, top: number): fabric.Circle {
    return new fabric.Circle({
      left: left,
      top: top,
      radius: this.getSize() + 2,
      fill: '#666666',
      stroke: '#666666',
      hasBorders: false,
      hasControls: false,
    });
  }

  private drawQuadraticCurve(): void {
    const curve = new fabric.Path('M 40 40 Q 95, 100, 150, 40', {
      stroke: this.fabricjsOptions.stroke as string,
      fill: this.fabricjsOptions.fill as string,
      strokeWidth: this.getSize(),
      objectCaching: false,
      selectable: false,
    });
    this.canvas.add(curve);

    const p1 = this.createBezierControlPoints(95, 100);
    p1.name = 'p1';
    p1.set({radius: 12, fill: '#ffffff', strokeWidth: 5});
    this.canvas.add(p1);

    const p0 = this.createBezierControlPoints(40, 40);
    p0.name = 'p0';
    this.canvas.add(p0);

    const p2 = this.createBezierControlPoints(150, 40);
    p2.name = 'p2';
    this.canvas.add(p2);
  }

  private getQuadraticBezierCurve(): fabric.Object {
    return this.canvas.getObjects().slice(-4, -3)[0];
  }

  createQuadraticBezier(): void {
    if (this.drawMode === this.DRAW_MODE_NONE) {
      this.canvas.discardActiveObject();
      this.drawMode = this.DRAW_MODE_BEZIER;
      this.canvas
        .getObjects()
        .forEach(item => item.set({hoverCursor: 'default', selectable: false}));
      this.drawQuadraticCurve();
    } else {
      const pathObj = this.canvas.getObjects().slice(-4, -3)[0] as fabric.Path;
      const pathData = pathObj.path;
      this.canvas
        .getObjects()
        .slice(-4)
        .forEach(item => this.canvas.remove(item));
      this.canvas
        .getObjects()
        .forEach(item => item.set({hoverCursor: 'move', selectable: true}));
      this.drawMode = this.DRAW_MODE_NONE;
      this.canvas.add(
        new fabric.Path(pathData, {
          stroke: this.fabricjsOptions.stroke as string,
          fill: this.fabricjsOptions.fill as string,
          strokeWidth: this.getSize(),
        })
      );
    }
  }

  isDrawModeBezier(): boolean {
    return this.drawMode === this.DRAW_MODE_BEZIER;
  }

  onAddItem(): void {
    if (this.pieChartDataInput.length < this.pieChartDataLimit) {
      this.pieChartDataInput.push({
        name: 'Data name',
        data: 10,
        color: '#000000',
        angle: 0,
      });
    }
  }

  getPieSlice(
    center: PolyPoint,
    radius: number,
    startAngle: number,
    endAngle: number,
    color: string
  ): fabric.Group {
    const angle = endAngle - startAngle;
    const halfAngle = angle / 2;
    const halfChord = radius * Math.sin(angle / 2);
    const height = Math.sqrt(Math.pow(radius, 2) - Math.pow(halfChord, 2));

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
    } as fabric.ICircleOptions);

    const arcObj = arc as unknown as fabric.Object & {id: string};
    arcObj.id = 'group' + this.groupCount;
    arcObj.toSVG = this.createCustomToSVG(
      arcObj.toSVG,
      'path',
      arcObj.id,
      arcObj
    );

    const tri = new fabric.Polygon(
      [
        center,
        {x: height + center.x, y: center.y + halfChord},
        {x: height + center.x, y: center.y - halfChord},
        center,
      ],
      {
        fill: color,
        stroke: color,
        strokeWidth: 1,
        strokeUniform: true,
      } as fabric.IPolylineOptions
    );
    const triObj = tri as unknown as fabric.Object & {id: string};
    triObj.id = 'group' + this.groupCount;
    triObj.toSVG = this.createCustomToSVG(
      triObj.toSVG,
      'polygon',
      triObj.id,
      triObj
    );

    return new fabric.Group([arc, tri], {
      originX: 'center',
      originY: 'center',
      top: center.y,
      left: center.x,
      angle: (startAngle + halfAngle) * (180 / Math.PI),
    });
  }

  getTextIndex(text: string, lineNum: number, charIndex: number): number {
    return (
      text
        .split('\n')
        .slice(0, lineNum)
        .reduce((sum, line) => sum + line.length + 1, 0) + charIndex
    );
  }

  createChart(): void {
    const total = this.pieChartDataInput.reduce((s, i) => s + i.data, 0);
    let currentAngle = 0;
    const pieSlices: fabric.Group[] = [];
    const legendText = this.pieChartDataInput
      .map(i => `\u2587 - ${i.name} - ${i.data}`)
      .join('\n');

    this.pieChartDataInput.forEach(item => {
      item.angle = (item.data / total) * Math.PI * 2;
      const slice = this.getPieSlice(
        new PolyPoint(50, 50),
        30,
        currentAngle,
        currentAngle + item.angle,
        item.color
      );
      if (item.angle > Math.PI) {
        pieSlices.unshift(slice);
      } else {
        pieSlices.push(slice);
      }
      currentAngle += item.angle;
    });

    const text = new fabric.Textbox(legendText, {
      top: 100,
      left: 120,
      fontFamily: this.fabricjsOptions.fontFamily as string,
      fontSize: 18,
      fill: '#000000',
      width: 200,
    });

    this.pieChartDataInput.forEach((item, i) => {
      const textbox = text as unknown as Record<string, Function>;
      textbox.setSelectionStart(this.getTextIndex(legendText, i, 0));
      textbox.setSelectionEnd(this.getTextIndex(legendText, i, 1));
      textbox.setSelectionStyles({
        stroke: '#000',
        strokeWidth: 2,
        fill: item.color,
      });
    });

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
      this.pieChartDataInput = [
        {name: 'Data name 1', data: 10, color: '#ff0000', angle: 0},
        {name: 'Data name 2', data: 10, color: '#00ff00', angle: 0},
      ];
    }
  }

  isPieChartEnabled(): boolean {
    return (
      this.areAllToolsEnabled() || this.drawMode === this.DRAW_MODE_PIECHART
    );
  }
  isDrawModePieChart(): boolean {
    return this.drawMode === this.DRAW_MODE_PIECHART;
  }

  private loadSvgFile(objects: fabric.Object[]): void {
    objects.forEach(obj => {
      const fabricObj = obj as unknown as fabric.Object & {id: string};
      fabricObj.id = 'group' + this.groupCount;
      fabricObj.toSVG = this.createCustomToSVG(
        fabricObj.toSVG,
        fabricObj.type || 'path',
        fabricObj.id,
        fabricObj
      );
    });
    this.canvas.add(new fabric.Group(objects));
    this.groupCount += 1;
  }

  uploadSvgFile(): void {
    if (this.drawMode === this.DRAW_MODE_NONE) {
      this.canvas.discardActiveObject();
      this.drawMode = this.DRAW_MODE_SVG_UPLOAD;
    } else {
      this.drawMode = this.DRAW_MODE_NONE;
      if (this.uploadedSvgDataUrl) {
        const svgStr = this.svgSanitizerService.convertBase64ToUnicodeString(
          this.uploadedSvgDataUrl.unsafeUrl.split(',')[1]
        );
        fabric.loadSVGFromString(svgStr, objs => this.loadSvgFile(objs));
      }
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
          ) as SafeResourceUrl,
          unsafeUrl: reader.result as string,
        };
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onFileChanged(file: File): void {
    this.setUploadedFile(file);
  }
  isFileUploaded(): boolean {
    return this.uploadedSvgDataUrl !== null;
  }
  isDrawModeSvgUpload(): boolean {
    return this.drawMode === this.DRAW_MODE_SVG_UPLOAD;
  }
  isSvgUploadEnabled(): boolean {
    return (
      this.areAllToolsEnabled() || this.drawMode === this.DRAW_MODE_SVG_UPLOAD
    );
  }

  bringObjectForward(): void {
    const active = this.canvas.getActiveObject();
    if (active) {
      this.canvas.bringForward(active);
      if (this.layerNum < this.canvas.getObjects().length) {
        this.layerNum += 1;
      }
    }
  }

  sendObjectBackward(): void {
    const active = this.canvas.getActiveObject();
    if (active) {
      this.canvas.sendBackwards(active);
      if (this.layerNum > 1) {
        this.layerNum -= 1;
      }
    }
  }

  private undoStackPush(item: UndoRedoItem): void {
    if (this.objectUndoStack.length === this.undoLimit) {
      this.objectUndoStack.shift();
    }
    this.objectUndoStack.push(item);
  }

  onUndo(): void {
    this.canvas.discardActiveObject();
    if (this.objectUndoStack.length > 0) {
      const undoObj = this.objectUndoStack.pop();
      if (undoObj?.action === 'add') {
        const shape = this.canvasObjects.pop();
        if (shape) {
          this.canvas.remove(shape);
          this.objectRedoStack.push({action: 'add', object: shape});
        }
      } else if (undoObj) {
        this.isRedo = true;
        this.objectRedoStack.push({action: 'remove', object: undoObj.object});
        this.undoFlag = true;
        if (undoObj.index !== undefined) {
          this.canvasObjects.splice(undoObj.index, 0, undoObj.object);
        }
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
      const redoObj = this.objectRedoStack.pop();
      if (redoObj) {
        this.undoStackPush(redoObj);
        if (redoObj.action === 'add') {
          this.isRedo = true;
          this.canvas.add(redoObj.object);
        } else {
          const index = this.canvasObjects.indexOf(redoObj.object);
          if (index > -1) {
            this.canvasObjects.splice(index, 1);
          }
          this.canvas.remove(redoObj.object);
        }
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
    const shape = this.canvas.getActiveObject();
    if (shape) {
      const index = this.canvasObjects.indexOf(shape);
      this.undoStackPush({action: 'remove', object: shape, index: index});
      this.objectRedoStack = [];
      if (index > -1) {
        this.canvasObjects.splice(index, 1);
      }
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
    const active = this.canvas.getActiveObject();
    if (this.drawMode === this.DRAW_MODE_BEZIER) {
      this.getQuadraticBezierCurve().set({
        stroke: this.fabricjsOptions.stroke as string,
      });
    } else if (active) {
      active.set({stroke: this.fabricjsOptions.stroke as string});
    }
    this.canvas.renderAll();
  }

  onFillChange(): void {
    const active = this.canvas.getActiveObject();
    if (this.drawMode === this.DRAW_MODE_BEZIER) {
      this.getQuadraticBezierCurve().set({
        fill: this.fabricjsOptions.fill as string,
      });
    } else if (active) {
      active.set({fill: this.fabricjsOptions.fill as string});
    }
    this.canvas.renderAll();
  }

  onBgChange(): void {
    this.canvas.setBackgroundColor(this.fabricjsOptions.bg as string, () =>
      this.canvas.renderAll()
    );
  }

  onItalicToggle(): void {
    const active = this.canvas.getActiveObject();
    if (active?.type === 'textbox') {
      (active as unknown as fabric.IText).set({
        fontStyle: this.fabricjsOptions.italic ? 'italic' : 'normal',
      });
      this.canvas.renderAll();
    }
  }

  onBoldToggle(): void {
    const active = this.canvas.getActiveObject();
    if (active?.type === 'textbox') {
      (active as unknown as fabric.IText).set({
        fontWeight: this.fabricjsOptions.bold ? 'bold' : 'normal',
      });
      this.canvas.renderAll();
    }
  }

  onFontChange(): void {
    const active = this.canvas.getActiveObject();
    if (active?.type === 'textbox') {
      (active as unknown as fabric.IText).set({
        fontFamily: this.fabricjsOptions.fontFamily as string,
      });
      this.canvas.renderAll();
    }
  }

  onSizeChange(): void {
    if (this.drawMode === this.DRAW_MODE_BEZIER) {
      this.canvas
        .getObjects()
        .slice(-2)
        .forEach(obj =>
          (obj as fabric.Circle).set({radius: this.getSize() + 2})
        );
      this.getQuadraticBezierCurve().set({strokeWidth: this.getSize()});
    } else {
      const active = this.canvas.getActiveObject();
      if (active) {
        if (active.type === 'textbox') {
          (active as fabric.Textbox).set({fontSize: this.getSize()});
        } else {
          active.set({strokeWidth: this.getSize()});
        }
      }
    }
    this.canvas.renderAll();
  }

  isSizeVisible(): boolean {
    return this.objectIsSelected || this.drawMode !== this.DRAW_MODE_NONE;
  }

  createColorPicker(type: string): void {
    const parent = document.getElementById(type + '-color');
    if (!parent) {
      return;
    }

    const picker = new Picker({
      parent: parent,
      color: this.fabricjsOptions[type] as string,
      onOpen: () => {
        document
          .querySelectorAll('.picker_alpha .picker_selector')
          .forEach(el => el.setAttribute('title', 'Transparency Slider'));
      },
      onChange: color => {
        parent.style.background = color.rgbaString;
        const topAlpha = document.getElementById(`top-${type}-alpha`);
        const bottomAlpha = document.getElementById(`bottom-${type}-alpha`);
        if (topAlpha) {
          topAlpha.style.opacity = (1 - color.rgba[3]).toString();
        }
        if (bottomAlpha) {
          bottomAlpha.style.opacity = (1 - color.rgba[3]).toString();
        }
        this.fabricjsOptions[type] = color.rgbaString;
        if (type === 'stroke') {
          this.onStrokeChange();
        } else if (type === 'fill') {
          this.onFillChange();
        } else {
          this.onBgChange();
        }
      },
    });

    if (type === 'stroke') {
      this.strokePicker = picker;
    } else if (type === 'fill') {
      this.fillPicker = picker;
    } else {
      this.bgPicker = picker;
    }
  }

  initializeMouseEvents(): void {
    this.canvas.on('mouse:dblclick', () => {
      if (this.drawMode === this.DRAW_MODE_POLY) {
        this.drawMode = this.DRAW_MODE_NONE;
        this.createPolyShape();
      }
    });

    this.canvas.on('mouse:down', options => {
      if (this.drawMode === this.DRAW_MODE_POLY) {
        this.setPolyStartingPoint(options as {e: MouseEvent});
        const {x, y} = this.polyOptions;
        this.polyOptions.bboxPoints.push(new PolyPoint(x, y));
        const line = new fabric.Line([x, y, x, y], {
          strokeWidth: this.getSize(),
          selectable: false,
          stroke: (this.fabricjsOptions.stroke as string).slice(0, -2) + '1)',
          strokeLineCap: 'round',
        });
        this.polyOptions.lines.push(line);
        this.canvas.add(line);
        this.polyOptions.lineCounter++;
      }
    });

    this.canvas.on('mouse:move', options => {
      if (
        this.polyOptions.lines.length !== 0 &&
        this.drawMode === this.DRAW_MODE_POLY
      ) {
        this.setPolyStartingPoint(options as {e: MouseEvent});
        this.polyOptions.lines[this.polyOptions.lineCounter - 1].set({
          x2: this.polyOptions.x,
          y2: this.polyOptions.y,
        });
        this.canvas.renderAll();
      }
    });

    this.canvas.on('object:moving', e => {
      if (this.drawMode === this.DRAW_MODE_BEZIER && e.target) {
        const curve = this.getQuadraticBezierCurve() as unknown as {
          path: number[][];
        };
        if (e.target.name === 'p0') {
          curve.path[0][1] = e.target.left as number;
          curve.path[0][2] = e.target.top as number;
        } else if (e.target.name === 'p1') {
          curve.path[1][1] = e.target.left as number;
          curve.path[1][2] = e.target.top as number;
        } else if (e.target.name === 'p2') {
          curve.path[1][3] = e.target.left as number;
          curve.path[1][4] = e.target.top as number;
        }
        this.canvas.renderAll();
      }
    });

    this.canvas.on('object:added', () => {
      if (
        this.drawMode === this.DRAW_MODE_NONE ||
        this.drawMode === this.DRAW_MODE_PENCIL
      ) {
        const objs = this.canvas.getObjects();
        const shape = objs[objs.length - 1];
        if (!this.undoFlag) {
          this.canvasObjects.push(shape);
        }
        this.undoFlag = false;
        if (!this.isRedo) {
          this.undoStackPush({action: 'add', object: shape});
          this.objectRedoStack = [];
        }
        this.isRedo = false;
      }
    });

    this.canvas.on('object:scaling', () => {
      const active = this.canvas.getActiveObject();
      if (active?.type === 'textbox') {
        const {scaleX = 1, scaleY = 1, width = 0, height = 0} = active;
        active.set({
          width: width * scaleX,
          height: height * scaleY,
          scaleX: 1,
          scaleY: 1,
        });
      }
    });

    const onSelection = () => {
      const shape = this.canvas.getActiveObject();
      if (
        shape &&
        (this.drawMode === this.DRAW_MODE_NONE ||
          this.drawMode === this.DRAW_MODE_PENCIL)
      ) {
        this.layerNum = this.canvas.getObjects().indexOf(shape) + 1;
        this.fillPicker?.setOptions({color: shape.get('fill') as string});
        this.strokePicker?.setOptions({color: shape.get('stroke') as string});
        this.objectIsSelected = true;
        if (
          ['rect', 'circle', 'path', 'line', 'polyline'].includes(
            shape.type || ''
          )
        ) {
          this.fabricjsOptions.size =
            (shape.strokeWidth || 0).toString() + 'px';
          this.displayFontStyles = false;
        } else if (shape.type === 'textbox') {
          const textbox = shape as fabric.Textbox;
          this.displayFontStyles = true;
          this.fabricjsOptions.size = (textbox.fontSize || 0).toString() + 'px';
          this.fabricjsOptions.fontFamily = textbox.fontFamily || 'Arial';
          this.fabricjsOptions.italic = textbox.fontStyle === 'italic';
          this.fabricjsOptions.bold = textbox.fontWeight === 'bold';
        }
      }
    };

    this.canvas.on('selection:created', onSelection);
    this.canvas.on('selection:updated', onSelection);
    this.canvas.on('selection:cleared', () => {
      this.objectIsSelected = false;
      this.displayFontStyles = false;
    });
  }

  setCanvasDimensions(): void {
    const dims = this.value
      ? this.imagePreloaderService.getDimensionsOfImage(this.value)
      : null;
    this.canvas.setHeight(dims?.height || this.CANVAS_HEIGHT);
    this.canvas.setWidth(dims?.width || this.CANVAS_WIDTH);
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
    fabric.Object.prototype.originX = 'center';
    fabric.Object.prototype.originY = 'center';
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.canvas) {
      this.canvas.dispose();
    }
  }
}
