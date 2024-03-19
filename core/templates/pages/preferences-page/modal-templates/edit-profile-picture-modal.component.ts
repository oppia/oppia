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

import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import Cropper from 'cropperjs';
import {SvgSanitizerService} from 'services/svg-sanitizer.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
require('cropperjs/dist/cropper.min.css');

@Component({
  selector: 'oppia-edit-profile-picture-modal',
  templateUrl: './edit-profile-picture-modal.component.html',
})
export class EditProfilePictureModalComponent extends ConfirmOrCancelModal {
  // 'uploadedImage' will be null if the uploaded svg is invalid or not trusted.
  uploadedImage: SafeResourceUrl | null = null;
  cropppedImageDataUrl: string = '';
  invalidImageWarningIsShown: boolean = false;
  windowIsNarrow: boolean = false;
  allowedImageFormats: readonly string[] = AppConstants.ALLOWED_IMAGE_FORMATS;
  invalidTagsAndAttributes: {tags: string[]; attrs: string[]} = {
    tags: [],
    attrs: [],
  };

  // 'cropper' is initialized before it is to be used, hence we need to do
  // non-null assertion, for more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  cropper!: Cropper;
  @ViewChild('croppableImage') croppableImageRef!: ElementRef;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private ngbActiveModal: NgbActiveModal,
    private windowDimensionService: WindowDimensionsService,
    private svgSanitizerService: SvgSanitizerService
  ) {
    super(ngbActiveModal);
  }

  initializeCropper(): void {
    if (this.croppableImageRef) {
      let profilePicture = this.croppableImageRef.nativeElement;
      if (!this.windowIsNarrow) {
        this.cropper = new Cropper(profilePicture, {
          minContainerWidth: 500,
          minContainerHeight: 350,
          aspectRatio: 1,
        });
      } else {
        this.cropper = new Cropper(profilePicture, {
          minContainerWidth: 200,
          minContainerHeight: 200,
          aspectRatio: 1,
        });
      }
    }
  }

  onFileChanged(file: Blob): void {
    this.invalidImageWarningIsShown = false;
    let reader = new FileReader();
    reader.onload = e => {
      this.invalidTagsAndAttributes = {
        tags: [],
        attrs: [],
      };
      let imageData = (e.target as FileReader).result as string;
      if (this.svgSanitizerService.isBase64Svg(imageData)) {
        this.invalidTagsAndAttributes =
          this.svgSanitizerService.getInvalidSvgTagsAndAttrsFromDataUri(
            imageData
          );
        this.uploadedImage =
          this.svgSanitizerService.getTrustedSvgResourceUrl(imageData);
      }
      if (!this.uploadedImage) {
        this.uploadedImage = decodeURIComponent(
          (e.target as FileReader).result as string
        );
      }
      try {
        this.changeDetectorRef.detectChanges();
      } catch (viewDestroyedError) {
        // This try catch block handles the following error in FE tests:
        // ViewDestroyedError:
        //   Attempt to use a destroyed view: detectChanges thrown.
        // No further action is needed.
      }
      this.initializeCropper();
    };

    reader.readAsDataURL(file);
  }

  reset(): void {
    this.invalidTagsAndAttributes = {
      tags: [],
      attrs: [],
    };
    this.uploadedImage = null;
    this.cropppedImageDataUrl = '';
  }

  onInvalidImageLoaded(): void {
    this.reset();
    this.invalidImageWarningIsShown = true;
  }

  confirm(): void {
    if (this.cropper === undefined) {
      throw new Error('Cropper has not been initialized');
    }
    this.cropppedImageDataUrl = this.cropper
      .getCroppedCanvas({
        height: 150,
        width: 150,
      })
      .toDataURL();
    super.confirm(this.cropppedImageDataUrl);
  }

  ngOnInit(): void {
    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();

    this.windowDimensionService.getResizeEvent().subscribe(() => {
      this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    });
  }
}
