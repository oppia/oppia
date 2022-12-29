// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for uploading thumbnail image.
 */

import { ChangeDetectorRef, Component, ElementRef, Output, ViewChild, EventEmitter, OnInit } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { AppConstants } from 'app.constants';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';
import Cropper from 'cropperjs';
require('cropperjs/dist/cropper.min.css');

@Component({
  selector: 'oppia-upload-blog-post-thumbnail',
  templateUrl: './upload-blog-post-thumbnail.component.html'
})
export class UploadBlogPostThumbnailComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  croppedFilename!: string;
  cropper!: Cropper;
  @ViewChild('croppableImage') croppableImageRef!: ElementRef;
  invalidTagsAndAttributes!: { tags: string[]; attrs: string[] };
  // This property will be null when the SVG uploaded is not valid or when
  // the image is not yet uploaded.
  uploadedImage: SafeResourceUrl | null = null;
  windowIsNarrow: boolean = false;
  cropppedImageDataUrl: string = '';
  invalidImageWarningIsShown: boolean = false;
  allowedImageFormats: readonly string[] = AppConstants.ALLOWED_IMAGE_FORMATS;
  @Output() imageLocallySaved: EventEmitter<string> = new EventEmitter();
  @Output() cancelThumbnailUpload: EventEmitter<void> = new EventEmitter();
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private imageLocalStorageService: ImageLocalStorageService,
    private svgSanitizerService: SvgSanitizerService,
    private windowDimensionService: WindowDimensionsService,
  ) { }

  initializeCropper(): void {
    let thumbnail = this.croppableImageRef.nativeElement;
    if (!this.windowIsNarrow) {
      this.cropper = new Cropper(thumbnail, {
        minContainerWidth: 500,
        minContainerHeight: 350,
        aspectRatio: 4
      });
    } else {
      this.cropper = new Cropper(thumbnail, {
        minContainerWidth: 200,
        minContainerHeight: 200,
        aspectRatio: 4
      });
    }
  }

  onFileChanged(file: File): void {
    let originalFilename = file.name;
    // The cropper always returns a jpeg file, thus the extension should be
    // changed to jpeg for the final image type to match the extension.
    this.croppedFilename = (
      originalFilename.replace(/\.([^.]*?)(?=\?|#|$)/, '.jpeg'));
    this.invalidImageWarningIsShown = false;
    let reader = new FileReader();
    reader.onload = (e) => {
      this.invalidTagsAndAttributes = {
        tags: [],
        attrs: []
      };
      let imageData = (e.target as FileReader).result as string;
      if (this.svgSanitizerService.isBase64Svg(imageData)) {
        this.invalidTagsAndAttributes = this.svgSanitizerService
          .getInvalidSvgTagsAndAttrsFromDataUri(imageData);
        this.uploadedImage = this.svgSanitizerService.getTrustedSvgResourceUrl(
          imageData);
      }
      if (!this.uploadedImage) {
        this.uploadedImage = decodeURIComponent(
          (e.target as FileReader).result as string);
      }
      try {
        this.changeDetectorRef.detectChanges();
        this.initializeCropper();
      } catch (viewDestroyedError) {
        // This try catch block handles the following error in FE tests:
        // ViewDestroyedError:
        //   Attempt to use a destroyed view: detectChanges thrown.
        // No further action is needed.
      }
    };
    reader.readAsDataURL(file);
  }

  reset(): void {
    this.uploadedImage = null;
    this.cropppedImageDataUrl = '';
    this.invalidTagsAndAttributes = {
      tags: [],
      attrs: []
    };
  }

  onInvalidImageLoaded(): void {
    this.reset();
    this.invalidImageWarningIsShown = true;
  }

  save(): void {
    this.cropppedImageDataUrl = (
      this.cropper.getCroppedCanvas({
        height: 200,
        width: 800,
        fillColor: '#fff',
      }).toDataURL('image/jpeg'));
    this.imageLocalStorageService.saveImage(
      this.croppedFilename, this.cropppedImageDataUrl);
    this.imageLocallySaved.emit(this.cropppedImageDataUrl);
    this.uploadedImage = null;
  }

  cancel(): void {
    this.uploadedImage = null;
    this.invalidTagsAndAttributes = {
      tags: [],
      attrs: []
    };
    this.cancelThumbnailUpload.emit();
  }

  ngOnInit(): void {
    this.invalidTagsAndAttributes = {
      tags: [],
      attrs: []
    };
    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();

    this.windowDimensionService.getResizeEvent().subscribe(() => {
      this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    });
  }
}
