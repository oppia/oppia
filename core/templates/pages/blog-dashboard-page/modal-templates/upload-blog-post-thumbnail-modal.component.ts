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
 * @fileoverview Component for uploading thumbnail image modal.
 */

import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import Cropper from 'cropperjs';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
require('cropperjs/dist/cropper.min.css');

@Component({
  selector: 'oppia-blog-post-thumbnail-upload-modal',
  templateUrl: './upload-blog-post-thumbnail-modal.component.html'
})
export class UploadBlogPostThumbnailComponent extends ConfirmOrCancelModal {
  uploadedImage: SafeResourceUrl;
  cropppedImageDataUrl: string = '';
  invalidImageWarningIsShown: boolean = false;
  allowedImageFormats: readonly string[] = AppConstants.ALLOWED_IMAGE_FORMATS;
  filename: string;
  cropper;
  @ViewChild('croppableImage') croppableImageRef: ElementRef;

  constructor(
      ngbActiveModal: NgbActiveModal,
    private changeDetectorRef: ChangeDetectorRef,
    private imageLocalStorageService: ImageLocalStorageService,
    private svgSanitizerService: SvgSanitizerService,
  ) {
    super(ngbActiveModal);
  }

  initializeCropper(): void {
    let thumbnail = this.croppableImageRef.nativeElement;
    this.cropper = new Cropper(thumbnail, {
      minContainerWidth: 500,
      minContainerHeight: 350,
      aspectRatio: 4
    });
  }

  onFileChanged(file: File): void {
    this.filename = file.name;
    this.invalidImageWarningIsShown = false;
    let reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedImage = this.svgSanitizerService.getTrustedSvgResourceUrl(
        (<FileReader>e.target).result as string);
      if (!this.uploadedImage) {
        this.uploadedImage = decodeURIComponent(
          (<FileReader>e.target).result as string);
      }
      this.changeDetectorRef.detectChanges();
      this.initializeCropper();
    };
    reader.readAsDataURL(file);
  }

  reset(): void {
    this.uploadedImage = null;
    this.cropppedImageDataUrl = '';
  }

  onInvalidImageLoaded(): void {
    this.reset();
    this.invalidImageWarningIsShown = true;
  }


  confirm(): void {
    this.cropppedImageDataUrl = (
      this.cropper.getCroppedCanvas({
        height: 200,
        width: 800
      }).toDataURL());
    this.imageLocalStorageService.saveImage(
      this.filename, this.cropppedImageDataUrl);
    super.confirm(this.cropppedImageDataUrl);
  }
}
