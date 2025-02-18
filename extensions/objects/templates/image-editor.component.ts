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
 * @fileoverview Component for image editor.
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
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
// eslint-disable-next-line oppia/disallow-httpclient
import {HttpClient} from '@angular/common/http';

import {AppConstants} from 'app.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ImagePreloaderService} from 'pages/exploration-player-page/services/image-preloader.service';
import {AlertsService} from 'services/alerts.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ContextService} from 'services/context.service';
import {CsrfTokenService} from 'services/csrf-token.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {SvgSanitizerService} from 'services/svg-sanitizer.service';

// Relative path used as an work around to get the angular compiler and webpack
// build to not complain.
// TODO(#16309): Fix relative imports.
import '../../../core/templates/third-party-imports/gif-frames.import';
import {WindowRef} from 'services/contextual/window-ref.service';

const gifshot = require('gifshot');
import * as gifFrames from 'gif-frames';

// We attach GifFrames to the window and use it in our codebase and the
// default Window interface doesn't contain "GifFrames" property. Hence we want
// to extend the Window definition here.
// The "declare global" is needed as we want to augment GifFrames to the
// global scope Window as Window is a global object. Typescript interfaces only
// union the interfaces with the same name when presented in the same scope.
// TODO(#16735): Remove the usage of declare globals in "non-global" files.
declare global {
  interface Window {
    GifFrames: gifFrames;
  }
}

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

// Reference: https://github.com/yahoo/gifshot#creategifoptions-callback.
interface GifshotCallbackObject {
  image: string;
  cameraStream: MediaStream;
  error: boolean;
  errorCode: string;
  errorMsg: string;
  savedRenderingContexts: ImageData;
}

interface ImageUploadBackendResponse {
  filename: string;
}

@Component({
  selector: 'image-editor',
  templateUrl: './image-editor.component.html',
  styleUrls: [],
})
export class ImageEditorComponent implements OnInit, OnChanges {
  @Input() modalId;
  @Input() value;
  @Output() valueChanged = new EventEmitter();
  @Output() validityChange = new EventEmitter<Record<'empty', boolean>>();
  MODE_EMPTY = 1;
  MODE_UPLOADED = 2;
  MODE_SAVED = 3;

  imageIsUploading = false;

  // We only use PNG format since that is what canvas can export to in
  // all browsers.
  OUTPUT_IMAGE_FORMAT = {
    png: 'png',
    gif: 'gif',
  };

  MIME_TYPE_GIF = 'data:image/gif';
  CROP_AREA_BORDER_IN_PX = 3;

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
  ONE_MB_IN_BYTES: number = 1 * 1024 * 1024;
  imageResizeRatio: number;
  cropArea: {x1: number; y1: number; x2: number; y2: number};
  mousePositionWithinCropArea: null | number;
  mouseLastKnownCoordinates: {x: number; y: number};
  lastMouseDownEventCoordinates: {x: number; y: number};
  userIsDraggingCropArea: boolean = false;
  cropAreaResizeDirection: null | number;
  userIsResizingCropArea: boolean = false;
  invalidTagsAndAttributes: {tags: string[]; attrs: string[]};
  processedImageIsTooLarge: boolean;
  entityId: string;
  entityType: string;
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
    private http: HttpClient,
    private alertsService: AlertsService,
    private assetsBackendApiService: AssetsBackendApiService,
    private contextService: ContextService,
    private csrfTokenService: CsrfTokenService,
    private imageLocalStorageService: ImageLocalStorageService,
    private imagePreloaderService: ImagePreloaderService,
    private imageUploadHelperService: ImageUploadHelperService,
    private svgSanitizerService: SvgSanitizerService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.validityChange.emit({empty: false});
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
    this.data = {mode: this.MODE_EMPTY, metadata: {}, crop: true};

    // Resizing properties.
    this.imageResizeRatio = 1;

    // Cropping properties.
    this.cropArea = {x1: 0, y1: 0, x2: 0, y2: 0};
    this.mousePositionWithinCropArea = null;
    this.mouseLastKnownCoordinates = {x: 0, y: 0};
    this.lastMouseDownEventCoordinates = {x: 0, y: 0};
    this.userIsDraggingCropArea = false;
    this.userIsResizingCropArea = false;
    this.cropAreaResizeDirection = null;
    this.invalidTagsAndAttributes = {
      tags: [],
      attrs: [],
    };
    this.processedImageIsTooLarge = false;

    this.entityId = this.contextService.getEntityId();
    this.entityType = this.contextService.getEntityType();

    window.addEventListener(
      'mouseup',
      e => {
        this.userIsDraggingCropArea = false;
        this.userIsResizingCropArea = false;
      },
      false
    );
    if (this.value) {
      this.resetComponent(this.value);
    }
  }

  /** Internal functions (not visible in the view) */

  private resetComponent(newValue) {
    // Reset the component each time the value changes
    // (e.g. if this is part of an editable list).
    if (newValue) {
      this.setSavedImageFilename(newValue, false);
      const dimensions =
        this.imagePreloaderService.getDimensionsOfImage(newValue);
      this.imageContainerStyle = {
        height: dimensions.height + 'px',
        width: dimensions.width + 'px',
      };
      this.validityChange.emit({empty: true});
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
    x: number,
    y: number,
    width: number,
    height: number,
    imageDataURI: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Put the original image in a canvas.
      let img = new Image();
      img.src = imageDataURI;
      img.addEventListener(
        'load',
        () => {
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
        },
        false
      );
      img.addEventListener(
        'error',
        () => {
          reject(new Error('Image could not be loaded.'));
        },
        false
      );
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
    return {x: x, y: y};
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

    const adjustResizeLeft = x => {
      // Update crop area x1 value, correcting for boundaries.
      this.cropArea.x1 = this.clamp(
        x,
        0,
        this.cropArea.x2 - this.CROP_AREA_MIN_WIDTH_PX
      );
    };

    const adjustResizeRight = x => {
      // Update crop area x2 value, correcting for boundaries.
      this.cropArea.x2 = this.clamp(
        x,
        this.CROP_AREA_MIN_WIDTH_PX + this.cropArea.x1,
        dimensions.width
      );
    };

    const adjustResizeTop = y => {
      // Update crop area y1 value, correcting for boundaries.
      this.cropArea.y1 = this.clamp(
        y,
        0,
        this.cropArea.y2 - this.CROP_AREA_MIN_HEIGHT_PX
      );
    };

    const adjustResizeBottom = y => {
      // Update crop area y2 value, correcting for boundaries.
      this.cropArea.y2 = this.clamp(
        y,
        this.CROP_AREA_MIN_HEIGHT_PX + this.cropArea.y1,
        dimensions.height
      );
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

  private getTrustedResourceUrlForImageFileName(imageFileName) {
    if (
      this.contextService.getImageSaveDestination() ===
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE &&
      this.imageLocalStorageService.isInStorage(imageFileName)
    ) {
      const imageUrl =
        this.imageLocalStorageService.getRawImageData(imageFileName);
      if (imageFileName.endsWith('.svg')) {
        return this.svgSanitizerService.getTrustedSvgResourceUrl(imageUrl);
      }
      return imageUrl;
    }
    const encodedFilepath = window.encodeURIComponent(imageFileName);
    return this.assetsBackendApiService.getImageUrlForPreview(
      this.contextService.getEntityType(),
      this.contextService.getEntityId(),
      encodedFilepath
    );
  }

  resetFilePathEditor(): void {
    if (
      this.data.metadata.savedImageFilename &&
      this.contextService.getImageSaveDestination() ===
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE &&
      this.imageLocalStorageService.isInStorage(
        this.data.metadata.savedImageFilename
      )
    ) {
      this.imageLocalStorageService.deleteImage(
        this.data.metadata.savedImageFilename
      );
    }
    this.data = {
      mode: this.MODE_EMPTY,
      metadata: {},
      crop: true,
    };
    this.imageIsUploading = false;
    this.imageResizeRatio = 1;
    this.invalidTagsAndAttributes = {
      tags: [],
      attrs: [],
    };
    this.validityChange.emit({empty: false});
  }

  validate(data: FilepathData): boolean {
    const isValid =
      data.mode === this.MODE_SAVED &&
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
    const coords = this.getEventCoorindatesRelativeToImageContainer(e);

    if (this.userIsDraggingCropArea) {
      this.handleMouseMoveWhileDraggingCropArea(coords.x, coords.y);
    } else if (this.userIsResizingCropArea) {
      this.handleMouseMoveWhileResizingCropArea(coords.x, coords.y);
    } else {
      this.updatePositionWithinCropArea(coords.x, coords.y);
    }

    this.mouseLastKnownCoordinates = {x: coords.x, y: coords.y};
  }

  onMouseDownOnCropArea(e: MouseEvent): void {
    const coords = this.getEventCoorindatesRelativeToImageContainer(e);
    const position = this.mousePositionWithinCropArea;

    if (position === this.MOUSE_INSIDE) {
      this.lastMouseDownEventCoordinates = {x: coords.x, y: coords.y};
      this.cropAreaXWhenLastDown = this.cropArea.x1;
      this.cropAreaYWhenLastDown = this.cropArea.y1;
      this.userIsDraggingCropArea = true;
    } else if (position !== null) {
      this.lastMouseDownEventCoordinates = {x: coords.x, y: coords.y};
      this.userIsResizingCropArea = true;
      this.cropAreaResizeDirection = position;
    }
  }

  onMouseUpOnCropArea(e: MouseEvent): void {
    this.userIsDraggingCropArea = false;
    this.userIsResizingCropArea = false;
  }

  getImageContainerDynamicStyles(): string {
    if (this.data.mode === this.MODE_EMPTY) {
      return 'border: 1px dotted #888; width: 100%';
    } else {
      return 'border: none; width: ' + this.OUTPUT_IMAGE_MAX_WIDTH_PX + 'px';
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
    return (
      'left: ' + this.cropArea.x2 + 'px;' + 'top: ' + this.cropArea.y1 + 'px;'
    );
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
      background: null,
    };

    if (!styles.cursor) {
      styles.cursor = 'default';
    }

    // Translucent background layer.
    if (this.isUserCropping()) {
      const data =
        'url(' +
        // Check point 2 in the note before imports and after fileoverview.
        (this.imgData || this.data.metadata.uploadedImageData) +
        ')';
      styles.background = data + ' no-repeat';

      // Add crop area border.
      const x = this.cropArea.x1 + this.CROP_AREA_BORDER_IN_PX;
      const y = this.cropArea.y1 + this.CROP_AREA_BORDER_IN_PX;
      styles['background-position'] = '-' + x + 'px -' + y + 'px';

      const dimensions = this.calculateTargetImageDimensions();
      styles['background-size'] =
        dimensions.width + 'px ' + dimensions.height + 'px';
    }

    return Object.keys(styles)
      .map(key => {
        return key + ': ' + styles[key];
      })
      .join('; ');
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
    const imageDataURI =
      this.imgData || (this.data.metadata.uploadedImageData as string);
    const mimeType = imageDataURI.split(';')[0];

    let newImageFile;

    if (mimeType === this.MIME_TYPE_GIF) {
      let successCb = obj => {
        this.validateProcessedFilesize(obj.image);
        newImageFile =
          this.imageUploadHelperService.convertImageDataToImageFile(obj.image);
        this.updateDimensions(newImageFile, obj.image, width, height);
        document.body.style.cursor = 'default';
      };
      let processFrameCb = this.getCroppedGIFDataAsync.bind(
        null,
        x1,
        y1,
        width,
        height
      );
      this.processGIFImage(
        imageDataURI,
        width,
        height,
        processFrameCb,
        successCb
      );
    } else if (mimeType === AppConstants.SVG_MIME_TYPE) {
      // Check point 2 in the note before imports and after fileoverview.
      const imageData =
        this.imgData || (this.data.metadata.uploadedImageData as string);
      newImageFile = this.imageUploadHelperService.convertImageDataToImageFile(
        this.data.metadata.uploadedImageData as string
      );
      this.updateDimensions(newImageFile, imageData, width, height);
    } else {
      // Generate new image data and file.
      const newImageData = this.getCroppedImageData(
        // Check point 2 in the note before imports and after fileoverview.
        this.imgData || this.data.metadata.uploadedImageData,
        x1,
        y1,
        width,
        height
      );
      this.validateProcessedFilesize(newImageData);

      newImageFile =
        this.imageUploadHelperService.convertImageDataToImageFile(newImageData);
      this.updateDimensions(newImageFile, newImageData, width, height);
    }
  }

  updateDimensions(
    newImageFile: File,
    newImageData: string,
    width: number,
    height: number
  ): void {
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
      y2: dimensions.height,
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
    if (
      this.imageResizeRatio === 1 &&
      imageWidth > this.OUTPUT_IMAGE_MAX_WIDTH_PX
    ) {
      return (
        'This image has been automatically downsized to ensure ' +
        'that it will fit in the card.'
      );
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
    this.imageResizeRatio = Math.max(0.1, this.imageResizeRatio - amount / 100);
    this.updateValidationWithLatestDimensions();
  }

  increaseResizePercent(amount: number): void {
    const imageDataURI =
      this.imgData || (this.data.metadata.uploadedImageData as string);
    const mimeType = imageDataURI.split(';')[0];
    const maxImageRatio = mimeType === AppConstants.SVG_MIME_TYPE ? 2 : 1;
    // Do not allow the user to increase size beyond 100% for non-SVG images
    // and 200% for SVG images. Users may downsize the image if required.
    // SVG images can be resized to 200% because certain SVGs may not contain a
    // default height/width, this results in a browser-specific default, which
    // may be too small to work with.
    this.imageResizeRatio = Math.min(
      maxImageRatio,
      this.imageResizeRatio + amount / 100
    );
    this.updateValidationWithLatestDimensions();
    this.cancelCropImage();
  }

  private updateValidationWithLatestDimensions(): void {
    const dimensions = this.calculateTargetImageDimensions();
    const imageDataURI =
      this.imgData || (this.data.metadata.uploadedImageData as string);
    const mimeType = (imageDataURI as string).split(';')[0];
    if (mimeType === this.MIME_TYPE_GIF) {
      let successCb = obj => {
        this.validateProcessedFilesize(obj.image);
        document.body.style.cursor = 'default';
      };
      this.processGIFImage(
        imageDataURI,
        dimensions.width,
        dimensions.height,
        null,
        successCb
      );
    } else {
      const resampledImageData = this.getResampledImageData(
        imageDataURI,
        dimensions.width,
        dimensions.height
      );
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
      height: Math.round(height * this.imageResizeRatio),
    };
  }

  setUploadedFile(file: File): void {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        // Check point 2 in the note before imports and after fileoverview.
        this.imgData = reader.result as string;
        let imageData: string | SafeResourceUrl = reader.result as string;
        if (file.name.endsWith('.svg')) {
          this.invalidTagsAndAttributes =
            this.svgSanitizerService.getInvalidSvgTagsAndAttrsFromDataUri(
              this.imgData
            );
          this.imgData =
            this.svgSanitizerService.removeAllInvalidTagsAndAttributes(
              this.imgData
            );
          imageData = this.svgSanitizerService.getTrustedSvgResourceUrl(
            this.imgData
          );
        }
        this.data = {
          mode: this.MODE_UPLOADED,
          metadata: {
            uploadedFile: file,
            uploadedImageData: imageData,
            originalWidth: img.naturalWidth || 300,
            originalHeight: img.naturalHeight || 150,
          },
          crop: file.type !== 'image/svg+xml',
        };
        const dimensions = this.calculateTargetImageDimensions();
        this.cropArea = {
          x1: 0,
          y1: 0,
          x2: dimensions.width,
          y2: dimensions.height,
        };
        this.updateValidationWithLatestDimensions();
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  setSavedImageFilename(filename: string, updateParent: boolean): void {
    this.data = {
      mode: this.MODE_SAVED,
      metadata: {
        savedImageFilename: filename,
        // Check point 2 in the note before imports and after fileoverview.
        savedImageUrl: this.getTrustedResourceUrlForImageFileName(
          filename
        ) as string,
      },
      crop: true,
    };
    this.imageIsUploading = false;
    if (updateParent) {
      this.alertsService.clearWarnings();
      this.value = filename;
      this.valueChanged.emit(filename);
      this.validityChange.emit({empty: true});
      this.resetComponent(filename);
    }
  }

  onFileChanged(file: File): void {
    this.setUploadedFile(file);
  }

  discardUploadedFile(): void {
    this.resetFilePathEditor();
    this.processedImageIsTooLarge = false;
  }

  validateProcessedFilesize(resampledImageData: string): void {
    const mimeType = resampledImageData.split(';')[0];
    const imageSize = atob(
      resampledImageData.replace(`${mimeType};base64,`, '')
    ).length;
    // The processed image can sometimes be larger than original file size. This
    // is because the output of HTMLCanvasElement.toDataURL() operation in
    // getResampledImageData() is browser specific and can vary in size.
    // See https://stackoverflow.com/a/9777037.
    if (this.entityType === AppConstants.ENTITY_TYPE.BLOG_POST) {
      this.processedImageIsTooLarge = imageSize > this.ONE_MB_IN_BYTES;
    } else {
      this.processedImageIsTooLarge = imageSize > this.HUNDRED_KB_IN_BYTES;
    }
  }

  saveUploadedFile(): void {
    this.alertsService.clearWarnings();
    this.processedImageIsTooLarge = false;
    this.imageIsUploading = true;

    if (!this.data.metadata.uploadedFile) {
      this.alertsService.addWarning('No image file detected.');
      return;
    }

    const dimensions = this.calculateTargetImageDimensions();

    // Check mime type from imageDataURI.
    // Check point 2 in the note before imports and after fileoverview.
    let imageDataURI =
      this.imgData || (this.data.metadata.uploadedImageData as string);
    const mimeType = imageDataURI.split(';')[0];
    let resampledFile;

    if (mimeType === 'data:image/gif') {
      let successCb = obj => {
        if (!obj.error) {
          this.validateProcessedFilesize(obj.image);
          if (this.processedImageIsTooLarge) {
            document.body.style.cursor = 'default';
            this.imageIsUploading = false;
            return;
          }
          resampledFile =
            this.imageUploadHelperService.convertImageDataToImageFile(
              obj.image
            );
          if (resampledFile === null) {
            this.alertsService.addWarning('Could not get resampled file.');
            document.body.style.cursor = 'default';
            this.imageIsUploading = false;
            return;
          }
          this.saveImage(dimensions, resampledFile, 'gif');
          document.body.style.cursor = 'default';
        }
      };
      let gifWidth = dimensions.width;
      let gifHeight = dimensions.height;
      this.processGIFImage(imageDataURI, gifWidth, gifHeight, null, successCb);
    } else if (mimeType === AppConstants.SVG_MIME_TYPE) {
      resampledFile =
        this.imageUploadHelperService.convertImageDataToImageFile(imageDataURI);
      this.saveImage(dimensions, resampledFile, 'svg');
      this.data.crop = false;
    } else {
      const resampledImageData = this.getResampledImageData(
        imageDataURI,
        dimensions.width,
        dimensions.height
      );
      this.validateProcessedFilesize(resampledImageData);
      if (this.processedImageIsTooLarge) {
        this.imageIsUploading = false;
        return;
      }
      resampledFile =
        this.imageUploadHelperService.convertImageDataToImageFile(
          resampledImageData
        );
      if (resampledFile === null) {
        this.alertsService.addWarning('Could not get resampled file.');
        this.imageIsUploading = false;
        return;
      }
      this.saveImage(dimensions, resampledFile, 'png');
    }
  }

  private processGIFImage(
    imageDataURI: string,
    width: number,
    height: number,
    processFrameCallback: (dataUrl: string) => void,
    successCallback: (gifshotCallbackObject: GifshotCallbackObject) => void
  ): void {
    // Looping through individual GIF frames can take a while
    // especially if there are a lot. Changing the cursor will let the
    // user know that something is happening.
    document.body.style.cursor = 'wait';
    (this.windowRef.nativeWindow as Window)
      .GifFrames({
        url: imageDataURI,
        frames: 'all',
        outputType: 'canvas',
      })
      .then(async function (frameData) {
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
          let updatedFrame = processFrameCallback
            ? await processFrameCallback(dataURL)
            : dataURL;
          frames.push(updatedFrame);
        }
        gifshot.createGIF(
          {
            gifWidth: width,
            gifHeight: height,
            images: frames,
          },
          successCallback
        );
      });
  }

  saveImageToLocalStorage(
    dimensions: Dimensions,
    resampledFile: Blob,
    imageType: string
  ): void {
    const filename = this.imageUploadHelperService.generateImageFilename(
      dimensions.height,
      dimensions.width,
      imageType
    );
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      // Check point 2 in the note before imports and after fileoverview.
      this.imgData = imageData;
      this.imageLocalStorageService.saveImage(filename, imageData);
      this.setSavedImageFilename(filename, true);
      const dimensions =
        this.imagePreloaderService.getDimensionsOfImage(filename);
      this.imageContainerStyle = {
        height: dimensions.height + 'px',
        width: dimensions.width + 'px',
      };
    };
    reader.readAsDataURL(resampledFile);
  }

  saveImage(
    dimensions: Dimensions,
    resampledFile: Blob,
    imageType: string
  ): void {
    if (
      this.contextService.getImageSaveDestination() ===
      AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
    ) {
      this.saveImageToLocalStorage(dimensions, resampledFile, imageType);
    } else {
      this.postImageToServer(dimensions, resampledFile, imageType);
    }
  }

  postImageToServer(
    dimensions: Dimensions,
    resampledFile: Blob,
    imageType: string = 'png'
  ): void {
    let form = new FormData();
    form.append('image', resampledFile);
    form.append(
      'payload',
      JSON.stringify({
        filename: this.imageUploadHelperService.generateImageFilename(
          dimensions.height,
          dimensions.width,
          imageType
        ),
      })
    );
    const imageUploadUrlTemplate =
      '/createhandler/imageupload/<entity_type>/<entity_id>';
    this.http
      .post<ImageUploadBackendResponse>(
        this.urlInterpolationService.interpolateUrl(imageUploadUrlTemplate, {
          entity_type: this.entityType,
          entity_id: this.entityId,
        }),
        form
      )
      .toPromise()
      .then(
        data => {
          // Pre-load image before marking the image as saved.
          const img = new Image();
          img.onload = () => {
            this.setSavedImageFilename(data.filename, true);
            let dimensions = this.imagePreloaderService.getDimensionsOfImage(
              data.filename
            );
            this.imageContainerStyle = {
              height: dimensions.height + 'px',
              width: dimensions.width + 'px',
            };
          };
          // Check point 2 in the note before imports and after fileoverview.
          img.src = this.getTrustedResourceUrlForImageFileName(
            data.filename
          ) as string;
        },
        response => {
          this.alertsService.addWarning(
            response.error || 'Error communicating with server.'
          );
        }
      );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.value &&
      changes.value.currentValue !== changes.value.previousValue
    ) {
      const newValue = changes.value.currentValue;
      this.resetComponent(newValue);
    }
  }
}
