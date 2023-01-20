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
 * @fileoverview Component for edit thumbnail modal.
 */

import { trigger, transition, style, animate } from '@angular/animations';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';

interface InvalidTagsAndAttributes {
  tags: string[];
  attrs: string[];
}

interface Dimensions {
  height: number;
  width: number;
}

@Component({
  selector: 'edit-thumbnail-modal',
  templateUrl: './edit-thumbnail-modal.component.html',
  animations: [
    trigger('fade', [
      transition('void => *', [
        style({opacity: 0}),
        animate(500, style({opacity: 1}))
      ])
    ])
  ]
})
export class EditThumbnailModalComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() bgColor!: string;
  // 'uploadedImage' will be null when an invalid image has
  // been uploaded.
  @Input() uploadedImage!: string | null;
  @Input() aspectRatio!: string;
  @Input() previewDescription!: string;
  @Input() previewDescriptionBgColor!: string;
  @Input() previewFooter!: string;
  @Input() previewTitle!: string;
  @Input() allowedBgColors!: string[];
  @Input() tempBgColor!: string;
  @Input() dimensions!: Dimensions;
  @Input() uploadedImageMimeType!: string;
  @Input() openInUploadMode: boolean = false;
  imgSrc!: string;
  invalidTagsAndAttributes: InvalidTagsAndAttributes = {
    tags: [], attrs: []
  };

  invalidImageWarningIsShown = false;
  invalidFilenameWarningIsShown = false;
  thumbnailHasChanged = false;
  allowedImageFormats = ['svg'];

  constructor(
    private svgSanitizerService: SvgSanitizerService,
    private ngbActiveModal: NgbActiveModal,
  ) {}

  setImageDimensions(height: number, width: number): void {
    this.dimensions = {
      height: Math.round(height),
      width: Math.round(width)
    };
  }

  isUploadedImageSvg(): boolean {
    return this.uploadedImageMimeType === 'image/svg+xml';
  }

  isValidFilename(file: File): boolean {
    const VALID_THUMBNAIL_FILENAME_REGEX = new RegExp(
      AppConstants.VALID_THUMBNAIL_FILENAME_REGEX);
    return VALID_THUMBNAIL_FILENAME_REGEX.test(file.name);
  }

  updateBackgroundColor(color: string): void {
    this.bgColor = color;
    this.thumbnailHasChanged = true;
  }

  setUploadedFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        //   Setting a default height of 300px and width of
        //   150px since most browsers use these dimensions
        //   for SVG files that do not have an explicit
        //   height and width defined.
        this.setImageDimensions(
          img.naturalHeight || 150,
          img.naturalWidth || 300);
      };
      this.imgSrc = reader.result as string;
      this.updateBackgroundColor(this.tempBgColor);
      img.src = this.imgSrc;
      this.uploadedImage = this.imgSrc;
      this.invalidTagsAndAttributes = (
        this.svgSanitizerService.getInvalidSvgTagsAndAttrsFromDataUri(
          this.imgSrc));
      this.uploadedImage = this.svgSanitizerService
        .removeAllInvalidTagsAndAttributes(this.uploadedImage);
      this.thumbnailHasChanged = true;
    };
    reader.readAsDataURL(file);
  }

  onFileChanged(file: File): void {
    this.uploadedImageMimeType = file.type;
    this.invalidImageWarningIsShown = false;
    this.invalidFilenameWarningIsShown = false;
    this.invalidTagsAndAttributes = {
      tags: [],
      attrs: []
    };
    if (this.isUploadedImageSvg() && this.isValidFilename(file)) {
      this.setUploadedFile(file);
    } else {
      this.reset();
      if (!this.isUploadedImageSvg()) {
        this.invalidImageWarningIsShown = true;
      } else {
        this.invalidFilenameWarningIsShown = true;
      }
    }
  }

  reset(): void {
    this.uploadedImage = null;
    this.openInUploadMode = true;
  }

  onInvalidImageLoaded(): void {
    this.uploadedImage = null;
    this.invalidImageWarningIsShown = true;
  }

  confirm(): void {
    this.thumbnailHasChanged = false;
    this.ngbActiveModal.close({
      newThumbnailDataUrl: this.uploadedImage,
      newBgColor: this.bgColor,
      openInUploadMode: this.openInUploadMode,
      dimensions: this.dimensions
    });
  }

  cancel(): void {
    this.ngbActiveModal.dismiss();
  }
}
