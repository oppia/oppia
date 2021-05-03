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

import { SimpleChanges } from '@angular/core';
import { Component, Input, OnChanges } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';

@Component({
  selector: 'edit-thumbnail-modal',
  templateUrl: './edit-thumbnail-modal.component.html'
})
export class EditThumbnailModalComponent implements OnChanges {
  @Input() bgColor: string;
  @Input() uploadedImage: string | null;
  @Input() aspectRatio: string;
  @Input() previewDescription: string;
  @Input() previewDescriptionBgColor: string;
  @Input() previewFooter: string;
  @Input() previewTitle: string;
  @Input() allowedBgColors: string[];
  @Input() tempBgColor: string;
  @Input() dimensions: { height: number; width: number; };
  @Input() openInUploadMode: boolean;
  @Input() uploadedImageMimeType: string;

  invalidImageWarningIsShown = false;
  invalidTagsAndAttributes: {
    tags: string[];
    attrs: string[];
  };
  allowedImageFormats = ['svg'];
  file: Blob;
  constructor(
    private svgSanitizerService: SvgSanitizerService,
    private modalInstance: NgbActiveModal,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.uploadedImage &&
        changes.uploadedImage.currentValue ===
         changes.uploadedImage.previousValue) {
      this.openInUploadMode = false;
      this.updateBackgroundColor(this.tempBgColor);
    }
  }

  setImageDimensions(height: number, width: number): void {
    this.dimensions = {
      height: Math.round(height),
      width: Math.round(width)
    };
  }

  isUploadedImageSvg(): boolean {
    return this.uploadedImageMimeType === 'image/svg+xml';
  }

  updateBackgroundColor(color: string): void {
    this.bgColor = color;
  }

  onFileChanged(file: File): void {
    this.uploadedImageMimeType = file.type;
    this.invalidImageWarningIsShown = false;
    this.invalidTagsAndAttributes = {
      tags: [],
      attrs: []
    };
    if (this.isUploadedImageSvg()) {
      $('.oppia-thumbnail-uploader').fadeOut(() => {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () =>{
          let imgSrc = reader.result as string;
          this.updateBackgroundColor(this.tempBgColor);
          let img = new Image();

          img.onload = () => {
          //   Setting a default height of 300px and width of
          //   150px since most browsers use these dimensions
          //   for SVG files that do not have an explicit
          //   height and width defined.
            this.setImageDimensions(
              img.naturalHeight || 150,
              img.naturalWidth || 300);
          };
          img.src = imgSrc;
          this.uploadedImage = imgSrc;
          this.invalidTagsAndAttributes = (
            this.svgSanitizerService.getInvalidSvgTagsAndAttrsFromDataUri(
              imgSrc));
          let tags = this.invalidTagsAndAttributes.tags;
          let attrs = this.invalidTagsAndAttributes.attrs;
          if (tags.length > 0 || attrs.length > 0) {
            this.reset();
          }
        };
        setTimeout(() => {
          $('.oppia-thumbnail-uploader').fadeIn();
        }, 100);
      });
    } else {
      this.reset();
      this.invalidImageWarningIsShown = true;
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
    this.modalInstance.close({
      newThumbnailDataUrl: this.uploadedImage,
      newBgColor: this.tempBgColor,
      openInUploadMode: this.openInUploadMode,
      dimensions: this.dimensions
    });
  }

  cancel(): void {
    this.modalInstance.dismiss();
  }
}
