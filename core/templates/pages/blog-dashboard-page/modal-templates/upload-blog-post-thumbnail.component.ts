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
  uploadedImage: SafeResourceUrl;
  cropppedImageDataUrl: string = '';
  invalidImageWarningIsShown: boolean = false;
  invalidTagsAndAttributes: { tags: string[]; attrs: string[] };
  allowedImageFormats: readonly string[] = AppConstants.ALLOWED_IMAGE_FORMATS;
  croppedFilename: string;
  windowIsNarrow: boolean;
  cropper;
  @ViewChild('croppableImage') croppableImageRef: ElementRef;
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
    // The cropper always returns a png file, thus the extension should be
    // changed to png for the final image type to match the extension.
    this.croppedFilename = (
      originalFilename.replace(/\.([^.]*?)(?=\?|#|$)/, '.png'));
    this.invalidImageWarningIsShown = false;
    let reader = new FileReader();
    reader.onload = (e) => {
      this.invalidTagsAndAttributes = {
        tags: [],
        attrs: []
      };
      let imageData = (e.target as FileReader).result as string;
      const mimeType = imageData.split(';')[0];
      if (mimeType === 'data:image/svg+xml') {
        let svg = this.svgSanitizerService.parseDataURI(imageData);
        this.invalidTagsAndAttributes = (
          this.svgSanitizerService.getInvalidSvgTagsAndAttrs(svg));
        const tags = this.invalidTagsAndAttributes.tags;
        let attrs: string[] = [];
        this.invalidTagsAndAttributes.attrs.forEach(attribute => {
          attrs.push(attribute.split(':')[1]);
        });
        svg = this.svgSanitizerService.removeTagsAndAttributes(
          svg, {tags, attrs});
        imageData = (
          'data:image/svg+xml;base64,' +
        btoa(unescape(encodeURIComponent(svg.documentElement.outerHTML))));
      }
      this.uploadedImage = this.svgSanitizerService.getTrustedSvgResourceUrl(
        imageData);
      if (!this.uploadedImage) {
        this.uploadedImage = decodeURIComponent(
          (e.target as FileReader).result as string);
      }
      this.changeDetectorRef.detectChanges();
      this.initializeCropper();
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
      }).toDataURL());
    this.imageLocalStorageService.saveImage(
      this.croppedFilename, this.cropppedImageDataUrl);
    this.imageLocallySaved.emit(this.cropppedImageDataUrl);
    this.uploadedImage = null;
  }

  cancel(): void {
    this.uploadedImage = false;
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
