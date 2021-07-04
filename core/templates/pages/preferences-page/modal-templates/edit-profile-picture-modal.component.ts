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
 * @fileoverview Component for edit profile picture modal.
 */

import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import Cropper from 'cropperjs';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';
require('cropperjs/dist/cropper.min.css');

@Component({
  selector: 'oppia-edit-profile-picture-modal',
  templateUrl: './edit-profile-picture-modal.component.html'
})
export class EditProfilePictureModalComponent extends ConfirmOrCancelModal {
  uploadedImage: SafeResourceUrl;
  cropppedImageDataUrl: string = '';
  invalidImageWarningIsShown: boolean = false;
  allowedImageFormats: readonly string[] = AppConstants.ALLOWED_IMAGE_FORMATS;
  cropper;
  @ViewChild('croppableImage') croppableImageRef: ElementRef;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private ngbActiveModal: NgbActiveModal,
    private svgSanitizerService: SvgSanitizerService,
  ) {
    super(ngbActiveModal);
  }

  initializeCropper(): void {
    let profilePicture = this.croppableImageRef.nativeElement;
    this.cropper = new Cropper(profilePicture, {
      minContainerWidth: 500,
      minContainerHeight: 350,
      aspectRatio: 1
    });
  }

  onFileChanged(file: Blob): void {
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
        height: 150,
        width: 150
      }).toDataURL());
    super.confirm(this.cropppedImageDataUrl);
  }
}
