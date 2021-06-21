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
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';

interface InvalidTagsAndAttributes {
  tags: string[];
  attrs: string[];
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
export class EditThumbnailModalComponent implements OnInit {
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
  allowedImageFormats = ['svg'];
  file: Blob;
  tags: string[];
  attrs: string[];
  imgSrc: string;
  invalidTagsAndAttributes: InvalidTagsAndAttributes;

  constructor(
    private svgSanitizerService: SvgSanitizerService,
    private ngbActiveModal: NgbActiveModal,
  ) {}

  ngOnInit(): void {
    this.updateBackgroundColor(this.bgColor);
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
      this.imgSrc = <string>reader.result;
      this.updateBackgroundColor(this.tempBgColor);
      img.src = this.imgSrc;
      this.uploadedImage = this.imgSrc;
      this.invalidTagsAndAttributes = (
        this.svgSanitizerService.getInvalidSvgTagsAndAttrsFromDataUri(
          this.imgSrc));
      this.tags = this.invalidTagsAndAttributes.tags;
      this.attrs = this.invalidTagsAndAttributes.attrs;
      if (this.tags.length > 0 || this.attrs.length > 0) {
        this.reset();
      }
    };
    reader.readAsDataURL(file);
  }

  onFileChanged(file: File): void {
    this.uploadedImageMimeType = file.type;
    this.invalidImageWarningIsShown = false;
    this.invalidTagsAndAttributes = {
      tags: [],
      attrs: []
    };
    if (this.isUploadedImageSvg()) {
      this.setUploadedFile(file);
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
