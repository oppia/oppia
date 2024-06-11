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
 * @fileoverview Component for uploading images.
 */

import {EventEmitter, OnInit, Output} from '@angular/core';
import {Component, Input} from '@angular/core';
import {downgradeComponent} from '@angular/upgrade/static';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ContextService} from 'services/context.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {ImageUploaderModalComponent} from './image-uploader-modal.component';

export interface ImageUploaderParameters {
  disabled: boolean;
  maxImageSizeInKB: number;
  imageName: string;
  orientation: string;
  bgColor: string;
  allowedBgColors: string[];
  allowedImageFormats: string[];
  aspectRatio: string;
  filename?: string;
  previewTitle?: string;
  previewDescription?: string;
  previewDescriptionBgColor?: string;
  previewFooter?: string;
  previewImageUrl?: string;
}

@Component({
  selector: 'oppia-image-uploader',
  templateUrl: './image-uploader.component.html',
})
export class ImageUploaderComponent implements OnInit {
  @Output() updateBgColor: EventEmitter<string> = new EventEmitter();
  @Output() updateFilename: EventEmitter<string> = new EventEmitter();
  @Output() imageSave: EventEmitter<Blob> = new EventEmitter();

  @Input() imageUploaderParameters!: ImageUploaderParameters;

  editableImageDataUrl: string | null = null;
  hidePlaceholder: boolean = false;
  imageBgColor: string | null = null;
  placeholderImageUrl!: string;

  constructor(
    private imageUploadHelperService: ImageUploadHelperService,
    private contextService: ContextService,
    private ngbModal: NgbModal,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  ngOnInit(): void {
    this.placeholderImageUrl = this.urlInterpolationService.getStaticImageUrl(
      this.isImageInPortraitMode()
        ? '/icons/story-image-icon.png'
        : '/icons/story-image-icon-landscape.png'
    );

    if (this.imageUploaderParameters.filename) {
      const entityType = this.contextService.getEntityType();
      if (entityType === undefined) {
        throw new Error('No image present for preview');
      }
      this.editableImageDataUrl =
        this.imageUploadHelperService.getTrustedResourceUrlForThumbnailFilename(
          this.imageUploaderParameters.filename,
          entityType,
          this.contextService.getEntityId()
        );
      this.imageBgColor = this.imageUploaderParameters.bgColor;
      this.imageUploaderParameters.previewImageUrl = this.editableImageDataUrl;
      this.hidePlaceholder = true;
    }
  }

  isImageInPortraitMode(): boolean {
    return this.imageUploaderParameters.orientation === 'portrait';
  }

  showImageUploaderModal(): void {
    if (this.imageUploaderParameters.disabled) {
      return;
    }

    const modalRef = this.ngbModal.open(ImageUploaderModalComponent, {
      backdrop: 'static',
    });
    modalRef.componentInstance.imageUploaderParameters =
      this.imageUploaderParameters;

    modalRef.result.then(
      data => {
        this.editableImageDataUrl = data.newImageDataUrl;
        const imageBlobData =
          this.imageUploadHelperService.convertImageDataToImageFile(
            data.newImageDataUrl
          );

        if (!imageBlobData) {
          return;
        }
        const imageFilename =
          this.imageUploadHelperService.generateImageFilename(
            data.dimensions.height,
            data.dimensions.width,
            imageBlobData?.type?.split('/')[1]
          );

        this.hidePlaceholder = true;
        this.imageBgColor = data.newBgColor;
        this.imageSave.emit(imageBlobData);
        this.updateBgColor.emit(data.newBgColor);
        this.updateFilename.emit(imageFilename);
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }
}

angular
  .module('oppia')
  .directive(
    'oppiaThumbnailUploader',
    downgradeComponent({component: ImageUploaderComponent})
  );
