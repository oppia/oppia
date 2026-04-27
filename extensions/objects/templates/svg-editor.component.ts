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
import {PageContextService} from 'services/page-context.service';
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

interface UploadedSvgDataUrl {
  safeUrl: SafeResourceUrl | string;
  unsafeUrl: string;
}

interface PolygonOptions {
  x: number;
  y: number;
  bboxPoints: PolyPoint[];
  lines: fabric.Line[];
  lineCounter: number;
  shape: fabric.Polyline | null;
}

interface PieChartDataInput {
  name: string;
  data: number;
  color: string;
  angle: number;
}

interface UndoRedoAction {
  action: 'add' | 'remove';
  object: fabric.Object;
  index?: number;
}

@Component({
  selector: 'svg-editor',
  templateUrl: './svg-editor.component.html',
})
export class SvgEditorComponent implements OnInit {
  @Input() value!: string | null;
  @Output() valueChanged = new EventEmitter<string | null>();
  @Output() validityChange = new EventEmitter<Record<'empty', boolean>>();
  @Output() discardImage = new EventEmitter<void>();
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
  // Expose constant for use in template.
  SVG_EDITOR_TOOLBAR_HEIGHT_PX =
    SvgEditorConstants.SVG_EDITOR_TOOLBAR_HEIGHT_PX;
  drawMode = this.DRAW_MODE_NONE;
  polygonMode = this.CLOSED_POLYGON_MODE;
  isTouchDevice = this.deviceInfoService.hasTouchEvents();
  // The polyOptions is used to store the points of the polygon in the
  // open and closed polygon tool.
  polyOptions: PolygonOptions = {
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
  fillPicker: Picker | null = null;
  strokePicker: Picker | null = null;
  bgPicker: Picker | null = null;
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
  objectUndoStack: UndoRedoAction[] = [];
  objectRedoStack: UndoRedoAction[] = [];
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
  pieChartDataInput: PieChartDataInput[] = [
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
  uploadedSvgDataUrl: UploadedSvgDataUrl | null = null;

  loadType = 'group';
  defaultTopCoordinate = 50;
  defaultLeftCoordinate = 50;
  defaultRadius = 30;

  canvas!: fabric.Canvas;
  filepath!: string;
  loadingIndicatorIsShown: boolean = false;
  x!: number;
  y!: number;
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
      this.pageContextService.getImageSaveDestination() ?? '';
    this.entityId = this.pageContextService.getEntityId() ?? '';
    this.entityType = this.pageContextService.getEntityType() ?? '';
    const domReady = new Promise<void>(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve());
      } else {
        resolve();
      }
    });
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
    this.setCanvasDimensions();
  }

  onHeightInputBlur(): void {
    if (this.diagramHeight > SvgEditorConstants.MAX_SVG_DIAGRAM_HEIGHT) {
      this.diagramHeight = SvgEditorConstants.MAX_SVG_DIAGRAM_HEIGHT;
    } else if (this.diagramHeight < SvgEditorConstants.MIN_SVG_DIAGRAM_HEIGHT) {
      this.diagramHeight = SvgEditorConstants.MIN_SVG_DIAGRAM_HEIGHT;
    }
    this.currentDiagramHeight = this.diagramHeight;
    this.setCanvasDimensions();
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
      if (!imageUrl) {
        throw new Error('SVG data not found in local storage.');
      }
      const trustedSvgUrl =
        this.svgSanitizerService.getTrustedSvgResourceUrl(imageUrl);
      if (!trustedSvgUrl) {
        throw new Error('Trusted SVG URL could not be generated.');
      }
      return {
        safeUrl: trustedSvgUrl,
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
    const savedSvgUrls = this.getTrustedResourceUrlForSvgFileName(filename);
    this.data = {
      savedSvgFileName: filename,
      savedSvgUrl: savedSvgUrls.safeUrl,
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
        const trustedSvgUrl =
          this.svgSanitizerService.getTrustedSvgResourceUrl(svgDataUrl);
        if (!trustedSvgUrl) {
          throw new Error('Trusted SVG URL could not be generated.');
        }
        this.uploadedSvgDataUrl = {
          safeUrl: trustedSvgUrl,
          unsafeUrl: svgDataUrl,
        };
        this.savedSvgDiagram =
          this.svgSanitizerService.convertBase64ToUnicodeString(
            svgDataUrl.split(',')[1]
          );
      } else {
        this.svgFileFetcherBackendApiService
          .fetchSvg(savedSvgUrls.unsafeUrl)
          .subscribe(response => {
            this.savedSvgDiagram = response;
          });
      }
    }
  }

  postSvgToServer(
    dimensions: Dimensions,
    resampledFile: Blob
  ): Promise<{filename: string} | undefined> {
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
    if (!svg) {
      throw new Error('SVG element not found.');
    }
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
        let style = elements[i].getAttribute('style') ?? '';
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
    let resampledFile: Blob | null = null;

    if (this.isSvgTagValid(svgString)) {
      this.savedSvgDiagram = svgString;
      resampledFile =
        this.imageUploadHelperService.convertImageDataToImageFile(svgDataURI);
      if (!resampledFile) {
        this.alertsService.addWarning('Could not get resampled file.');
        return;
      }
      if (
        this.imageSaveDestination ===
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
      ) {
        this.saveImageToLocalStorage(dimensions, svgDataURI);
        this.validityChange.emit({empty: true});
      } else {
        this.loadingIndicatorIsShown = true;
        this.postSvgToServer(dimensions, resampledFile).then(
          (data: {filename: string} | undefined) => {
            if (!data) {
              this.loadingIndicatorIsShown = false;
              this.alertsService.addWarning('Error communicating with server.');
              return;
            }
            // Pre-load image before marking the image as saved.
            const img = new Image();
            img.onload = () => {
              this.setSavedSvgFilename(data.filename, false);
              const dimensions =
                this.imagePreloaderService.getDimensionsOfImage(data.filename);
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
          (parsedResponse: {error?: {error?: string}}) => {
            this.loadingIndicatorIsShown = false;
            this.alertsService.addWarning(
              parsedResponse.error?.error || 'Error communicating with server.'
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
      obj.type ?? 'path',
      (obj as unknown as {id: string}).id,
      obj
    );
    groupedObjects[groupId]?.push(obj);
    return groupedObjects;
  }

  loadTextObject(element: Element, obj: fabric.Object): void {
    const childNodes = Array.from(element.children) as SVGElement[];
    let value = '';
    const coloredTextIndex: {
      startIndex: number;
      endIndex: number;
      fill: string;
      stroke: string;
      strokeWidth: string;
    }[] = [];
    // Extracts the text from the tspan tags and appends
    // with a \n tag to ensure that the texts are subsequent lines.
    childNodes.forEach((el: SVGElement, index: number) => {
      if (el.nodeName === 'tspan') {
        const textContent = el.textContent ?? '';
        value += textContent;
        const fill = el.getAttribute('fill') ?? '';
        if (fill !== '') {
          // Fetches the position of the coloured text so
          // it can be given color after the text is rendered.
          coloredTextIndex.push({
            startIndex: value.length - textContent.length,
            endIndex: value.length,
            fill: fill,
            stroke: el.getAttribute('stroke') ?? '',
            strokeWidth: el.getAttribute('stroke-width') ?? '',
          });
        } else if (index < childNodes.length - 1) {
          value += '\n';
        }
      }
    });

    const textTransform = (obj as unknown as {'text-transform'?: string})[
      'text-transform'
    ];
    value = textTransform === 'uppercase' ? value.toUpperCase() : value;

    // Use a new Textbox for editability, but copy properties from the loaded object.
    const textOptions = obj.toObject() as fabric.ITextboxOptions;
    const text = new fabric.Textbox(value, {
      ...textOptions,
      width: textOptions.width || this.diagramWidth,
      type: 'textbox',
      strokeUniform: true,
      fill: (obj as fabric.Object).get('fill') || '#000',
    }) as fabric.Textbox;

    // The text moves to the right every time the svg is
    // rendered so this is to ensure that the text doesn't
    // render outside the canvas.
    // https://github.com/fabricjs/fabric.js/issues/1280
    if ((text.left ?? 0) > this.diagramWidth) {
      text.set({
        left: this.diagramWidth - (text.width || 0),
      });
    }
    coloredTextIndex.forEach(colorRange => {
      text.setSelectionStart(colorRange.startIndex);
      text.setSelectionEnd(colorRange.endIndex);
      text.setSelectionStyles({
        stroke: colorRange.stroke,
        strokeWidth: colorRange.strokeWidth,
        fill: colorRange.fill,
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
    const domReady = new Promise<void>(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve());
      } else {
        resolve();
      }
    });
    this.changeDetectorRef.detectChanges();
    domReady.then(() => {
      this.initializeFabricJs();
      fabric.loadSVGFromString(this.savedSvgDiagram, ((
        objects: fabric.Object[],
        _options: Record<string, unknown>,
        elements: SVGElement[]
      ) => {
        let groupedObjects: fabric.Object[][] = [];
        objects.forEach((obj: fabric.Object, index: number) => {
          const element = elements[index];
          if (!element) {
            return;
          }
          const objId = element.id;
          // Checks if the id starts with 'group' to identify whether the
          // svg objects are grouped together.
          if (objId.startsWith('group')) {
            groupedObjects = this.loadGroupedObject(objId, obj, groupedObjects);
          } else {
            // Detects the background color from the rectangle.
            if (
              obj.get('type') === 'rect' &&
              this.isFullRectangle(element as unknown as SVGRectElement)
            ) {
              const fillColor = (obj.get('fill') as string) ?? '';
              this.canvas.setBackgroundColor(fillColor, () => {});
              this.fabricjsOptions.bg = fillColor;
              this.bgPicker?.setOptions({
                color: fillColor,
              });
            } else if (obj.type === 'text') {
              this.loadTextObject(element, obj);
            } else {
              this.canvas.add(obj);
            }
          }
        });
        groupedObjects.forEach((objs: fabric.Object[]) => {
          this.canvas.add(new fabric.Group(objs));
          this.groupCount += 1;
        });
        this.centerContent();
      }) as unknown as (
        results: Object[],
        options: unknown,
        elements?: SVGElement[]
      ) => void);
      this.changeDetectorRef.detectChanges();
    });
  }

  centerContent(): void {
    let temporarySelection = new fabric.ActiveSelection(
      this.canvas.getObjects(),
      {canvas: this.canvas}
    );
    // Only scale wide images to fit the canvas width. Tall/narrow images
    // should not be scaled to width as this causes them to exceed the
    // canvas height and get clipped.
    const selectionWidth = temporarySelection.width ?? 0;
    const selectionHeight = temporarySelection.height ?? 0;
    if (selectionWidth > selectionHeight) {
      temporarySelection.scaleToWidth(this.canvas.getWidth());
    }
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
    const defaultTextSize = '18px';
    this.fillPicker?.setOptions({
      color: 'rgba(0,0,0,1)',
    });
    this.fabricjsOptions.size = defaultTextSize;
    const text = new fabric.Textbox('Enter Text', {
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

  private setPolyStartingPoint(options: fabric.IEvent<Event>): void {
    const mouse = this.canvas.getPointer(options.e as MouseEvent | TouchEvent);
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
    const circle = new fabric.Circle({
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

  private getQuadraticBezierCurve(): fabric.Object | null {
    if (this.drawMode === this.DRAW_MODE_BEZIER) {
      // The order of objects being added are the path followed by
      // three control points. Therefore the 4th from the last is the
      // quadratic curve.
      return this.canvas.getObjects().slice(-4, -3)[0];
    }
    return null;
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
      const latestObject = this.canvas.getObjects().slice(-1)[0];
      if (!latestObject) {
        this.drawMode = this.DRAW_MODE_NONE;
        return;
      }
      const path = latestObject.get('path' as keyof fabric.Object);
      if (!path) {
        this.canvas.remove(latestObject);
        this.drawMode = this.DRAW_MODE_NONE;
        return;
      }
      this.canvas.remove(latestObject);
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
      const curve = new fabric.Path(path as string, {
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
      const defaultData = 10;
      const dataInput = {
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
      tri.type ?? 'polygon',
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
    const pieSlices: fabric.Group[] = [];
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
    for (let i = 0; i < this.pieChartDataInput.length; i++) {
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
        const pieSlice = pieSlices.pop();
        if (pieSlice) {
          pieSlices.splice(0, 0, pieSlice);
        }
      }
      currentAngle += this.pieChartDataInput[i].angle;
    }
    // The defaultTextSize is to prevent the text from being too small.
    // This can be changed again using editor.
    const defaultTextSize = '18px';
    this.fabricjsOptions.size = defaultTextSize;
    const text = new fabric.Textbox(legendText, {
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

  private loadSvgFile(objects: fabric.Object[]): void {
    if (this.loadType === 'group') {
      objects.forEach((obj: fabric.Object) => {
        const svgObject = obj as fabric.Object & {
          id?: string;
          type?: string;
        };
        svgObject.set('id', 'group' + this.groupCount);
        svgObject.toSVG = this.createCustomToSVG(
          svgObject.toSVG,
          svgObject.type ?? 'path',
          svgObject.id ?? 'group' + this.groupCount,
          svgObject
        );
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
        const encodedSvg = this.uploadedSvgDataUrl.unsafeUrl.split(',')[1];
        if (!encodedSvg) {
          this.uploadedSvgDataUrl = null;
          return;
        }
        const svgString =
          this.svgSanitizerService.convertBase64ToUnicodeString(encodedSvg);
        fabric.loadSVGFromString(svgString, (objects: fabric.Object[]) =>
          this.loadSvgFile(objects)
        );
      }
      this.canvas.renderAll();
      this.uploadedSvgDataUrl = null;
    }
  }

  setUploadedFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (_e: ProgressEvent<FileReader>) => {
      const svgDataUrl = reader.result;
      if (typeof svgDataUrl !== 'string') {
        return;
      }
      const img = new Image();
      img.onload = () => {
        const trustedSvgUrl =
          this.svgSanitizerService.getTrustedSvgResourceUrl(svgDataUrl);
        if (!trustedSvgUrl) {
          return;
        }
        this.uploadedSvgDataUrl = {
          safeUrl: trustedSvgUrl,
          unsafeUrl: svgDataUrl,
        };
      };
      img.src = svgDataUrl;
    };
    reader.readAsDataURL(file);
  }

  onFileChanged(file: File, _filename: string): void {
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
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) {
      return;
    }
    this.canvas.bringForward(activeObject);
    if (this.layerNum < this.canvas._objects.length) {
      this.layerNum += 1;
    }
  }

  sendObjectBackward(): void {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) {
      return;
    }
    this.canvas.sendBackwards(activeObject);
    if (this.layerNum > 1) {
      this.layerNum -= 1;
    }
  }

  private undoStackPush(object: UndoRedoAction): void {
    if (this.objectUndoStack.length === this.undoLimit) {
      this.objectUndoStack.shift();
    }
    this.objectUndoStack.push(object);
  }

  onUndo(): void {
    this.canvas.discardActiveObject();
    if (this.objectUndoStack.length > 0) {
      const undoObj = this.objectUndoStack.pop();
      if (!undoObj) {
        return;
      }
      if (undoObj.action === 'add') {
        const shape = this.canvasObjects.pop();
        if (!shape) {
          return;
        }
        this.canvas.remove(shape);
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
        this.canvasObjects.splice(undoObj.index ?? 0, 0, undoObj.object);
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
      if (!redoObj) {
        return;
      }
      this.undoStackPush(redoObj);
      if (redoObj.action === 'add') {
        this.isRedo = true;
        // Not adding the shape to canvasObjects because it is added by the
        // event function.
        this.canvas.add(redoObj.object);
      } else {
        const shape = redoObj.object;
        const index = this.canvasObjects.indexOf(shape);
        if (index === -1) {
          return;
        }
        this.canvasObjects.splice(index, 1);
        const canvasIndex = this.canvas._objects.indexOf(shape);
        if (canvasIndex === -1) {
          return;
        }
        this.canvas._objects.splice(canvasIndex, 1);
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
    const index = this.canvasObjects.indexOf(shape);
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
      this.getQuadraticBezierCurve()?.set({
        stroke: this.fabricjsOptions.stroke,
      });
      this.canvas.renderAll();
    } else {
      const shape = this.canvas.getActiveObject() as
        | (fabric.Object & {type?: string})
        | null;
      const strokeShapes = ['rect', 'circle', 'path', 'line', 'polyline'];
      this.canvas.freeDrawingBrush.color = this.fabricjsOptions.stroke;
      const shapeType = shape?.type ?? '';
      if (shape && strokeShapes.indexOf(shapeType) !== -1) {
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
      this.getQuadraticBezierCurve()?.set({
        fill: this.fabricjsOptions.fill,
      });
      this.canvas.renderAll();
    } else {
      const shape = this.canvas.getActiveObject() as
        | (fabric.Object & {type?: string})
        | null;
      const fillShapes = ['rect', 'circle', 'path', 'textbox', 'polyline'];
      const shapeType = shape?.type ?? '';
      if (shape && fillShapes.indexOf(shapeType) !== -1) {
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
    const shape = this.canvas.getActiveObject();
    if (shape && shape.get('type') === 'textbox') {
      shape.set({
        fontStyle: this.fabricjsOptions.italic ? 'italic' : 'normal',
      } as Partial<fabric.Object>);
      this.canvas.renderAll();
    }
  }

  onBoldToggle(): void {
    const shape = this.canvas.getActiveObject();
    if (shape && shape.get('type') === 'textbox') {
      shape.set({
        fontWeight: this.fabricjsOptions.bold ? 'bold' : 'normal',
      } as Partial<fabric.Object>);
      this.canvas.renderAll();
    }
  }

  onFontChange(): void {
    const shape = this.canvas.getActiveObject();
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
      const numberOfEdgeControlPoints = 2;
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
      this.getQuadraticBezierCurve()?.set({
        strokeWidth: this.getSize(),
      } as Partial<fabric.Object>);
      this.canvas.renderAll();
    } else {
      const shape = this.canvas.getActiveObject() as
        | (fabric.Object & {type?: string})
        | null;
      this.canvas.freeDrawingBrush.width = this.getSize();
      const strokeWidthShapes = ['rect', 'circle', 'path', 'line', 'polyline'];
      const shapeType = shape?.type ?? '';
      if (shape && strokeWidthShapes.indexOf(shapeType) !== -1) {
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

  createColorPicker(value: 'stroke' | 'fill' | 'bg'): void {
    const parent = document.getElementById(value + '-color');
    if (!parent) {
      return;
    }

    const onChangeFunc = {
      stroke: () => this.onStrokeChange(),
      fill: () => this.onFillChange(),
      bg: () => this.onBgChange(),
    };
    const onOpen = (): void => {
      // This DOM manipulation is necessary because the color picker is not
      // configurable in the third-party module.
      const alphaSliders = document.querySelectorAll(
        '.picker_alpha .picker_selector'
      );
      alphaSliders.forEach((element: Element) => {
        element.setAttribute('title', 'Transparency Slider');
      });
    };
    const onChange = (color: {rgbaString: string; rgba: number[]}) => {
      parent.style.background = color.rgbaString;
      const topAlphaSquare = document.getElementById('top-' + value + '-alpha');
      const bottomAlphaSquare = document.getElementById(
        'bottom-' + value + '-alpha'
      );
      const opacity = 1 - color.rgba[3];
      if (topAlphaSquare) {
        topAlphaSquare.style.opacity = opacity.toString();
      }
      if (bottomAlphaSquare) {
        bottomAlphaSquare.style.opacity = opacity.toString();
      }
      this.fabricjsOptions[value] = color.rgbaString;
      onChangeFunc[value]();
    };
    const picker = new Picker({
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

    this.canvas.on('mouse:down', (options: fabric.IEvent<Event>) => {
      // Used to detect the mouse clicks when drawing the polygon.
      if (this.drawMode === this.DRAW_MODE_POLY) {
        this.setPolyStartingPoint(options);
        const x = this.polyOptions.x;
        const y = this.polyOptions.y;
        this.polyOptions.bboxPoints.push(new PolyPoint(x, y));
        const points = [x, y, x, y];
        let stroke = this.fabricjsOptions.stroke;
        // Ensures that the polygon lines are visible when
        // creating the polygon.
        stroke = stroke.slice(0, -2) + '1)';
        const line = new fabric.Line(points, {
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
          const latestLine =
            this.polyOptions.lines[this.polyOptions.lineCounter - 1];
          latestLine?.set({
            x2: this.polyOptions.x,
            y2: this.polyOptions.y,
          });
          this.canvas.renderAll();
        }
        this.polyOptions.lines.push(line);
        const createdLine =
          this.polyOptions.lines[this.polyOptions.lineCounter];
        if (createdLine) {
          this.canvas.add(createdLine);
        }
        this.polyOptions.lineCounter++;
      }
    });

    this.canvas.on('mouse:move', (options: fabric.IEvent<Event>) => {
      // Detects the mouse movement while drawing the polygon.
      if (
        this.polyOptions.lines.length !== 0 &&
        this.drawMode === this.DRAW_MODE_POLY &&
        !this.isTouchDevice
      ) {
        this.setPolyStartingPoint(options);
        const latestLine =
          this.polyOptions.lines[this.polyOptions.lineCounter - 1];
        latestLine?.set({
          x2: this.polyOptions.x,
          y2: this.polyOptions.y,
        });
        this.canvas.renderAll();
      }
    });

    this.canvas.on('object:moving', (e: fabric.IEvent<Event>) => {
      // Detects the movement in the control points when
      // drawing the bezier curve.
      if (this.drawMode === this.DRAW_MODE_BEZIER) {
        const pt = e.target as
          | (fabric.Object & {name?: string; left?: number; top?: number})
          | undefined;
        const curve = this.getQuadraticBezierCurve() as unknown as {
          path: number[][];
        } | null;
        if (!pt || !curve?.path) {
          return;
        }
        const pathIndex =
          pt.name === 'p0' ? 0 : pt.name === 'p1' || pt.name === 'p2' ? 1 : -1;
        const xCoordinateIndex = pt.name === 'p2' ? 3 : 1;
        const yCoordinateIndex = pt.name === 'p2' ? 4 : 2;
        const targetPath = curve.path[pathIndex];
        if (pathIndex === -1 || !targetPath) {
          return;
        }
        targetPath[xCoordinateIndex] = pt.left ?? targetPath[xCoordinateIndex];
        targetPath[yCoordinateIndex] = pt.top ?? targetPath[yCoordinateIndex];
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
        const shape =
          this.canvas.getObjects()[this.canvas.getObjects().length - 1];
        if (!shape) {
          return;
        }
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
      const activeObject = this.canvas.getActiveObject();
      if (activeObject?.get('type') === 'textbox') {
        const text = activeObject;
        const scaleX: number = text.get('scaleX') as number;
        const scaleY: number = text.get('scaleY') as number;
        const width: number = text.get('width') as number;
        const height: number = text.get('height') as number;
        activeObject.set({
          width: width * scaleX,
          height: height * scaleY,
          scaleX: 1,
          scaleY: 1,
        });
      }
    });

    const onSelection = () => {
      // Ensures that the fabricjsOptions doesn't change when the user
      // selects the quadratic bezier control points.
      if (
        this.drawMode === this.DRAW_MODE_NONE ||
        this.drawMode === this.DRAW_MODE_PENCIL
      ) {
        const shape = this.canvas.getActiveObject();
        if (!shape) {
          this.objectIsSelected = false;
          this.displayFontStyles = false;
          return;
        }
        this.layerNum = this.canvas.getObjects().indexOf(shape) + 1;
        const fillColor: string = (shape.get('fill') as string) ?? '';
        const strokeColor: string = (shape.get('stroke') as string) ?? '';
        this.fillPicker?.setOptions({
          color: fillColor,
        });
        this.strokePicker?.setOptions({
          color: strokeColor,
        });
        this.objectIsSelected = true;
        const strokeWidthShapes = [
          'rect',
          'circle',
          'path',
          'line',
          'polyline',
        ];
        const shapeType = (shape.get('type') as string | undefined) ?? '';
        if (strokeWidthShapes.indexOf(shapeType) !== -1) {
          this.fabricjsOptions.size =
            String(shape.get('strokeWidth') ?? this.getSize()) + 'px';
          this.displayFontStyles = false;
        } else if (shapeType === 'textbox') {
          this.displayFontStyles = true;
          this.fabricjsOptions.size =
            String(
              shape.get('fontSize' as keyof fabric.Object) ?? this.getSize()
            ) + 'px';
          this.fabricjsOptions.fontFamily = shape.get(
            'fontFamily' as keyof fabric.Object
          ) as string;
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

  // Sets the canvas dimensions based on diagramHeight and diagramWidth which
  // are controlled by the user through the dimension inputs. Previously, this
  // method used imagePreloaderService.getDimensionsOfImage() to get dimensions
  // from the saved image, but that approach didn't work for new/edited images
  // where the user has changed the dimensions. Using diagramHeight/diagramWidth
  // ensures the canvas always matches what the user has specified.
  setCanvasDimensions(): void {
    if (!this.canvas) {
      return;
    }
    this.canvas.setHeight(this.diagramHeight);
    this.canvas.setWidth(this.diagramWidth);
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
