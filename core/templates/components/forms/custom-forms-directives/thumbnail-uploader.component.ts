// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
import {OnChanges, SimpleChanges} from '@angular/core';
import {Component, Input} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AlertsService} from 'services/alerts.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ContextService} from 'services/context.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {EditThumbnailModalComponent} from './edit-thumbnail-modal.component';

@Component({
  selector: 'oppia-thumbnail-uploader',
  templateUrl: './thumbnail-uploader.component.html',
})
export class ThumbnailUploaderComponent implements OnInit, OnChanges {
  @Output() updateBgColor: EventEmitter<string> = new EventEmitter();
  @Output() updateFilename: EventEmitter<string> = new EventEmitter();
  @Output() imageSave: EventEmitter<void> = new EventEmitter();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() disabled!: boolean;
  @Input() useLocalStorage!: boolean;
  @Input() allowedBgColors!: string[];
  @Input() aspectRatio!: string;
  @Input() bgColor!: string;
  @Input() filename!: string;
  @Input() previewDescription!: string;
  @Input() previewDescriptionBgColor!: string;
  @Input() previewFooter!: string;
  @Input() previewTitle!: string;
  tempBgColor!: string;
  tempImageName!: string;
  uploadedImage!: string;
  uploadedImageMimeType!: string;
  dimensions!: {height: number; width: number};
  // Set resampled file returned to null when blob is not of type
  // 'image', blob size is zero or dataURI is null.
  resampledFile!: Blob | null;
  newThumbnailDataUrl!: string;
  localStorageBgcolor!: string;
  imageUploadUrlTemplate!: string;
  editableThumbnailDataUrl!: string;
  transformedData!: string;
  encodedImageURI!: string;
  openInUploadMode: boolean = false;
  hidePlaceholder: boolean = true;
  thumbnailIsLoading: boolean = true;
  placeholderImageUrl: string = this.urlInterpolationService.getStaticImageUrl(
    '/icons/story-image-icon.png'
  );

  placeholderImageDataUrl: string =
    this.urlInterpolationService.getStaticImageUrl(
      '/icons/story-image-icon.png'
    );

  constructor(
    private imageUploadHelperService: ImageUploadHelperService,
    private alertsService: AlertsService,
    private contextService: ContextService,
    private imageLocalStorageService: ImageLocalStorageService,
    private ngbModal: NgbModal,
    private urlInterpolationService: UrlInterpolationService,
    private assetsBackendApiService: AssetsBackendApiService
  ) {}

  ngOnInit(): void {
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
      this.editableThumbnailDataUrl =
        this.imageUploadHelperService.getTrustedResourceUrlForThumbnailFilename(
          this.filename,
          entityType,
          this.contextService.getEntityId()
        );
      this.uploadedImage = this.editableThumbnailDataUrl;
      this.thumbnailIsLoading = false;
    }
  }

  // 'ngOnChanges' is required here to update the thumbnail image
  // everytime the thumbnail filename changes (eg. draft is discarded).
  // The trusted resource url for the thumbnail should not be directly
  // bound to ngSrc because it can cause an infinite digest error.
  // This watcher is triggered only if the thumbnail filename of the
  // model changes. It would change for the following operations:
  // 1. Initial render of the page containing this directive.
  // 2. When a thumbnail is uploaded.
  // 3. When a saved draft is discarded.
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.filename &&
      changes.filename.currentValue !== changes.filename.previousValue
    ) {
      this.thumbnailIsLoading = true;
      const newValue = changes.filename.currentValue;
      const previousValue = changes.filename.previousValue;
      this.filenameChanges(newValue, previousValue);
    }
  }

  filenameChanges(newFilename: string, prevFilename: string): void {
    if (newFilename) {
      let entityType = this.contextService.getEntityType();
      if (entityType === undefined) {
        throw new Error('No image present for preview');
      }
      this.editableThumbnailDataUrl =
        this.imageUploadHelperService.getTrustedResourceUrlForThumbnailFilename(
          newFilename,
          entityType,
          this.contextService.getEntityId()
        );
      this.uploadedImage = this.editableThumbnailDataUrl;
    }
    this.thumbnailIsLoading = false;
    this.hidePlaceholder = false;
  }

  saveThumbnailBgColor(newBgColor: string): void {
    if (newBgColor !== this.bgColor) {
      this.bgColor = newBgColor;
      this.updateBgColor.emit(newBgColor);
    }
  }

  saveThumbnailImageData(imageURI: string, callback: () => void): void {
    this.resampledFile = null;
    this.resampledFile =
      this.imageUploadHelperService.convertImageDataToImageFile(imageURI);
    this.encodedImageURI = imageURI;
    if (this.resampledFile === null) {
      this.alertsService.addWarning('Could not get resampled file.');
      return;
    }
    this.postImageToServer(this.resampledFile, callback);
  }

  postImageToServer(resampledFile: Blob, callback: () => void): void {
    let entityType = this.contextService.getEntityType();
    if (entityType === undefined) {
      throw new Error('No image present for preview');
    }
    let entityId = this.contextService.getEntityId();
    const result = this.assetsBackendApiService
      .postThumbnailFile(
        resampledFile,
        this.tempImageName,
        entityType,
        entityId
      )
      .toPromise();
    result.then(data => {
      let entityType = this.contextService.getEntityType();
      if (entityType) {
        this.editableThumbnailDataUrl =
          this.imageUploadHelperService.getTrustedResourceUrlForThumbnailFilename(
            data.filename,
            entityType,
            this.contextService.getEntityId()
          );
      }
      callback();
    });
  }

  showEditThumbnailModal(): void {
    if (this.disabled) {
      return;
    }
    if (!this.uploadedImage) {
      this.openInUploadMode = true;
    }
    // This refers to the temporary thumbnail background
    // color used for preview.
    this.tempBgColor = this.bgColor || this.allowedBgColors[0];
    this.tempImageName = '';
    this.uploadedImageMimeType = '';
    this.dimensions = {
      height: 0,
      width: 0,
    };
    const modalRef = this.ngbModal.open(EditThumbnailModalComponent, {
      backdrop: 'static',
    });
    modalRef.componentInstance.bgColor = this.tempBgColor;
    modalRef.componentInstance.allowedBgColors = this.allowedBgColors;
    modalRef.componentInstance.aspectRatio = this.aspectRatio;
    modalRef.componentInstance.dimensions = this.dimensions;
    modalRef.componentInstance.previewDescription = this.previewDescription;
    modalRef.componentInstance.previewDescriptionBgColor =
      this.previewDescriptionBgColor;
    modalRef.componentInstance.previewFooter = this.previewFooter;
    modalRef.componentInstance.previewTitle = this.previewTitle;
    modalRef.componentInstance.openInUploadMode = this.openInUploadMode;
    modalRef.componentInstance.uploadedImage = this.uploadedImage;
    modalRef.componentInstance.uploadedImageMimeType =
      this.uploadedImageMimeType;
    modalRef.componentInstance.tempBgColor = this.tempBgColor;

    modalRef.result.then(
      data => {
        this.thumbnailIsLoading = true;
        let generatedImageFilename =
          this.imageUploadHelperService.generateImageFilename(
            data.dimensions.height,
            data.dimensions.width,
            'svg'
          );
        this.newThumbnailDataUrl = data.newThumbnailDataUrl;
        this.hidePlaceholder = false;
        if (!this.useLocalStorage) {
          if (data.openInUploadMode) {
            this.tempImageName =
              this.imageUploadHelperService.generateImageFilename(
                data.dimensions.height,
                data.dimensions.width,
                'svg'
              );
            this.saveThumbnailImageData(data.newThumbnailDataUrl, () => {
              this.uploadedImage = data.newThumbnailDataUrl;
              this.updateFilename.emit(this.tempImageName);
              this.saveThumbnailBgColor(data.newBgColor);
              this.thumbnailIsLoading = false;
            });
          } else {
            this.saveThumbnailBgColor(data.newBgColor);
            this.thumbnailIsLoading = false;
          }
        } else {
          this.thumbnailIsLoading = false;
          this.imageLocalStorageService.saveImage(
            generatedImageFilename,
            data.newThumbnailDataUrl
          );
          this.localStorageBgcolor = data.newBgColor;
          this.imageLocalStorageService.setThumbnailBgColor(data.newBgColor);
          this.imageSave.emit();
        }
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }
}
