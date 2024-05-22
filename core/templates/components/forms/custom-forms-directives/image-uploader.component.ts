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
import {AlertsService} from 'services/alerts.service';
import {ContextService} from 'services/context.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {ImageUploaderModalComponent} from './image-uploader-modal.component';

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
  @Input() disabled!: boolean;
  @Input() allowedBgColors!: string[];
  @Input() aspectRatio!: string;
  @Input() bgColor!: string;
  @Input() filename!: string;
  @Input() previewDescription!: string;
  @Input() previewDescriptionBgColor!: string;
  @Input() previewFooter!: string;
  @Input() previewTitle!: string;
  @Input() allowedImageFormats!: string[];
  @Input() imageName!: string;
  @Input() orientation!: string;
  @Input() maxImageSize!: number;

  uploadedImage!: string;
  dimensions!: {height: number; width: number};
  editableImageDataUrl!: string;
  openInUploadMode: boolean = false;
  hidePlaceholder: boolean = true;
  imageIsLoading: boolean = true;
  imageBgColor!: string;
  placeholderImageUrl!: string;

  constructor(
    private imageUploadHelperService: ImageUploadHelperService,
    private alertsService: AlertsService,
    private contextService: ContextService,
    private ngbModal: NgbModal,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  ngOnInit(): void {
    this.placeholderImageUrl = this.urlInterpolationService.getStaticImageUrl(
      this.orientation === 'landscape'
        ? '/icons/story-image-icon-landscape.png'
        : '/icons/story-image-icon.png'
    );

    if (
      this.filename !== null &&
      this.filename !== undefined &&
      this.filename !== ''
    ) {
      this.hidePlaceholder = false;
      let entityType = this.contextService.getEntityType();
      if (entityType === undefined) {
        throw new Error('No image present for preview');
      }
      this.editableImageDataUrl =
        this.imageUploadHelperService.getTrustedResourceUrlForThumbnailFilename(
          this.filename,
          entityType,
          this.contextService.getEntityId()
        );
      this.uploadedImage = this.editableImageDataUrl;
      this.imageIsLoading = false;
    }
  }

  showImageUploaderModal(): void {
    if (this.disabled) {
      return;
    }
    if (!this.uploadedImage) {
      this.openInUploadMode = true;
    }
    this.dimensions = {
      height: 0,
      width: 0,
    };
    const modalRef = this.ngbModal.open(ImageUploaderModalComponent, {
      backdrop: 'static',
    });
    modalRef.componentInstance.allowedImageFormats = this.allowedImageFormats;
    modalRef.componentInstance.allowedBgColors = this.allowedBgColors;
    modalRef.componentInstance.bgColor =
      this.bgColor || this.allowedBgColors[0];
    modalRef.componentInstance.previewDescriptionBgColor =
      this.previewDescriptionBgColor;
    modalRef.componentInstance.previewTitle = this.previewTitle;
    modalRef.componentInstance.previewDescription = this.previewDescription;
    modalRef.componentInstance.imageName = this.imageName;
    modalRef.componentInstance.aspectRatio = this.aspectRatio;
    modalRef.componentInstance.maxImageSize = this.maxImageSize;

    modalRef.result.then(
      data => {
        this.editableImageDataUrl = data.newImageDataUrl;
        const imageBlobData =
          this.imageUploadHelperService.convertImageDataToImageFile(
            data.newImageDataUrl
          );
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
