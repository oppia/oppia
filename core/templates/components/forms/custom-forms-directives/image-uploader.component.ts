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
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() imageUploaderParameters!: ImageUploaderParameters;

  uploadedImage!: string;
  dimensions!: {height: number; width: number};
  editableImageDataUrl!: string;
  hidePlaceholder: boolean = true;
  imageIsLoading: boolean = true;
  imageBgColor!: string;
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

    if (
      this.imageUploaderParameters.filename !== null &&
      this.imageUploaderParameters.filename !== undefined &&
      this.imageUploaderParameters.filename !== ''
    ) {
      this.hidePlaceholder = false;
      this.imageIsLoading = true;
      let entityType = this.contextService.getEntityType();
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
      this.uploadedImage = this.editableImageDataUrl;
      this.imageIsLoading = false;
      this.imageUploaderParameters.previewImageUrl = this.editableImageDataUrl;
    }
  }

  isImageInPortraitMode(): boolean {
    return this.imageUploaderParameters.orientation === 'portrait';
  }

  showImageUploaderModal(): void {
    if (this.imageUploaderParameters.disabled) {
      return;
    }

    this.dimensions = {
      height: 0,
      width: 0,
    };
    const modalRef = this.ngbModal.open(ImageUploaderModalComponent, {
      backdrop: 'static',
    });
    modalRef.componentInstance.imageUploaderParameters =
      this.imageUploaderParameters;

    modalRef.result.then(
      data => {
        this.imageIsLoading = true;
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
            this.dimensions.height,
            this.dimensions.width,
            imageBlobData?.type?.split('/')[1]
          );

        this.hidePlaceholder = false;
        this.imageIsLoading = false;
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
