// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for image uploader modal.
 */

import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import Cropper from 'cropperjs';
import {SvgSanitizerService} from 'services/svg-sanitizer.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
require('cropperjs/dist/cropper.min.css');

@Component({
  selector: 'oppia-image-uploader-modal',
  templateUrl: './image-uploader-modal.component.html',
})
export class ImageUploaderModalComponent extends ConfirmOrCancelModal {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() allowedImageFormats!: string[];
  @Input() bgColor!: string;
  @Input() previewFooter!: string;
  @Input() previewDescription!: string;
  @Input() previewTitle!: string;
  @Input() previewDescriptionBgColor!: string;
  @Input() imageName!: string;
  @Input() aspectRatio!: string;
  @Input() maxImageSizeInKB!: number;
  @Input() previewImageUrl!: string;

  // 'uploadedImage' will be null if the uploaded svg is invalid or not trusted.
  uploadedImage: SafeResourceUrl | null = null;
  thumbnailImageDataUrl: string | null = null;
  croppedImageDataUrl: string | SafeResourceUrl | null = null;
  invalidImageWarningIsShown: boolean = false;
  windowIsNarrow: boolean = false;
  invalidTagsAndAttributes: {tags: string[]; attrs: string[]} = {
    tags: [],
    attrs: [],
  };
  dimensions = {height: 0, width: 0};
  imageType!: string;

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

  private _getAspectRatio(): number {
    return (
      parseInt(this.aspectRatio.split(':')[0]) /
      parseInt(this.aspectRatio.split(':')[1])
    );
  }

  isThumbnail(): boolean {
    return this.imageName === 'Thumbnail';
  }

  imageNotUploaded(): boolean {
    return !this.uploadedImage && !this.thumbnailImageDataUrl;
  }

  initializeCropper(): void {
    if (!this.croppableImageRef) {
      return;
    }
    let imageElement = this.croppableImageRef.nativeElement;
    if (this.windowIsNarrow) {
      this.cropper = new Cropper(imageElement, {
        minContainerWidth: 200,
        minContainerHeight: 200,
        aspectRatio: this._getAspectRatio(),
      });
    } else {
      this.cropper = new Cropper(imageElement, {
        minContainerWidth: 500,
        minContainerHeight: 350,
        aspectRatio: this._getAspectRatio(),
      });
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
        this.thumbnailImageDataUrl =
          this.svgSanitizerService.removeAllInvalidTagsAndAttributes(imageData);
        this.uploadedImage =
          this.svgSanitizerService.getTrustedSvgResourceUrl(imageData);
      }
      if (!this.uploadedImage) {
        this.uploadedImage = decodeURIComponent(
          (e.target as FileReader).result as string
        );
      }

      const img = new Image();
      img.onload = () => {
        this.dimensions = {height: img.height, width: img.width};

        try {
          this.changeDetectorRef.detectChanges();
        } catch (viewDestroyedError) {
          // This try catch block handles the following error in FE tests:
          // ViewDestroyedError:
          //   Attempt to use a destroyed view: detectChanges thrown.
          // No further action is needed.
        }
        if (this.imageName !== 'Thumbnail') {
          this.initializeCropper();
        }
      };
      img.src = imageData;
      this.imageType = file.type;
    };
    reader.readAsDataURL(file);
  }

  reset(): void {
    this.invalidTagsAndAttributes = {
      tags: [],
      attrs: [],
    };
    this.uploadedImage = null;
    this.croppedImageDataUrl = null;
    this.thumbnailImageDataUrl = null;
  }

  onInvalidImageLoaded(): void {
    this.reset();
    this.invalidImageWarningIsShown = true;
  }

  updateBackgroundColor(color: string): void {
    if (color !== this.bgColor) {
      this.bgColor = color;
    }
  }

  areInvalidTagsOrAttrsPresent(): boolean {
    return (
      this.invalidTagsAndAttributes.tags.length > 0 ||
      this.invalidTagsAndAttributes.attrs.length > 0
    );
  }

  confirm(): void {
    if (this.isThumbnail()) {
      this.croppedImageDataUrl = this.thumbnailImageDataUrl;
    } else {
      if (!this.cropper) {
        throw new Error('Cropper has not been initialized');
      }
      this.croppedImageDataUrl = this.cropper
        .getCroppedCanvas({
          height: this.dimensions.height,
          width: this.dimensions.width,
        })
        .toDataURL(this.imageType);
    }

    super.confirm({
      newImageDataUrl: this.croppedImageDataUrl,
      dimensions: this.dimensions,
      newBgColor: this.bgColor,
    });
  }

  ngOnInit(): void {
    if (this.previewImageUrl) {
      this.thumbnailImageDataUrl = this.previewImageUrl;
    }

    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();

    this.windowDimensionService.getResizeEvent().subscribe(() => {
      this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    });
  }
}
