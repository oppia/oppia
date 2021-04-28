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

import { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { EditThumnailModalComponent } from './edit-thumbnail-modal.component';

@Component({
  selector: 'oppia-thumbnail-uploader',
  templateUrl: './thumbnail-uploader.component.html'
})
export class ThumbnailUploaderComponent implements OnInit {
  @Input() disabled;
  @Input() useLocalStorage;
  @Input() getAllowedBgColors;
  @Input() getAspectRatio;
  @Input() getBgColor;
  @Input() getFilename;
  @Input() getPreviewDescription;
  @Input() getPreviewDescriptionBgColor;
  @Input() getPreviewFooter;
  @Input() getPreviewTitle;
  @Input() updateBgColor;
  @Input() updateFilename;
  openInUploadMode: boolean;
  tempBgColor;
  tempImageName: string;
  uploadedImageMimeType: string;
  dimensions: { height: number; width: number; };
  allowedBgColors;
  aspectRatio;
  resampledFile;
  filename: string;
  newThumbnailDataUrl;
  localStorageBgcolor;
  imageUploadUrlTemplate: string;
  editableThumbnailDataUrl: string;
  transformedData: string;
  parsedResponse;
  constructor(
    private imageUploadHelperService: ImageUploadHelperService,
    private alertsService: AlertsService,
    private csrfTokenService: CsrfTokenService,
    private contextService: ContextService,
    private imageLocalStorageService: ImageLocalStorageService,
    private ngbModal: NgbModal,
    private assetsBackendApiService: AssetsBackendApiService,
    private urlInterpolationService: UrlInterpolationService
  ) {}
  placeholderImageDataUrl = (
    this.urlInterpolationService.getStaticImageUrl(
      '/icons/story-image-icon.png'));
  uploadedImage = null;
  thumbnailIsLoading = false;
  // $watch is required here to update the thumbnail image
  // everytime the thumbnail filename changes (eg. draft is discarded).
  // The trusted resource url for the thumbnail should not be directly
  // bound to ngSrc because it can cause an infinite digest error.
  // eslint-disable-next-line max-len
  // https://github.com/angular/angular.js/blob/master/CHANGELOG.md#sce-
  // This watcher is triggered only if the thumbnail filename of the
  // model changes. It would change for the following operations:
  // 1. Initial render of the page containing this directive.
  // 2. When a thumbnail is uploaded.
  // 3. When a saved draft is discarded.
  // this.$watch('getFilename()', function(filename) {
  //   if (filename) {
  //     this.editableThumbnailDataUrl = (
  //       ImageUploadHelperService
  //         .getTrustedResourceUrlForThumbnailFilename(
  //           this.getFilename(),
  //           ContextService.getEntityType(),
  //           ContextService.getEntityId()));
  //     uploadedImage = this.editableThumbnailDataUrl;
  //   } else {
  //     this.editableThumbnailDataUrl = placeholderImageDataUrl;
  //     uploadedImage = null;
  //   }
  //   this.thumbnailIsLoading = false;
  // });

  filenameChanges(): void {
    if (this.filename) {
      this.editableThumbnailDataUrl = (
        this.imageUploadHelperService
          .getTrustedResourceUrlForThumbnailFilename(
            this.getFilename,
            this.contextService.getEntityType(),
            this.contextService.getEntityId()));
      this.uploadedImage = this.editableThumbnailDataUrl;
    } else {
      this.editableThumbnailDataUrl = this.placeholderImageDataUrl;
      this.uploadedImage = null;
    }
    this.thumbnailIsLoading = true;
  }

  ngOnInit(): void {
    this.filenameChanges();
  }

  // ngOnChanges(): void {
  //   this.filenameChanges();
  //   // This.thumbnailIsLoading = false;
  // }

  saveThumbnailBgColor(newBgColor: string): void {
    if (newBgColor !== this.getBgColor) {
      this.updateBgColor(newBgColor);
    }
  }

  saveThumbnailImageData(imageURI: string, callback): void {
    this.resampledFile = null;
    this.resampledFile = (
      this.imageUploadHelperService.convertImageDataToImageFile(
        imageURI));
    if (this.resampledFile === null) {
      this.alertsService.addWarning('Could not get resampled file.');
      return;
    }
    this.postImageToServer(this.resampledFile, callback);
  }

  postImageToServer(resampledFile: File, callback: () => void): void {
    this.assetsBackendApiService.saveMathExpresionImage(
      resampledFile, this.tempImageName,
      this.contextService.getEntityType(),
      this.contextService.getEntityId()).then((data) => {
      this.editableThumbnailDataUrl = (
        this.imageUploadHelperService
          .getTrustedResourceUrlForThumbnailFilename(
            data.filename, this.contextService.getEntityType(),
            this.contextService.getEntityId()));
      callback();
    }), ((data) => {
    // Remove the XSSI prefix.
      let transformedData = data.responseText.substring(5);
      let parsedResponse = JSON.parse(transformedData);
      this.alertsService.addWarning(
        parsedResponse.error || 'Error communicating with server.');
    });
  }

  showEditThumbnailModal(): void {
    if (this.disabled) {
      return;
    }
    this.openInUploadMode = true;
    // This refers to the temporary thumbnail background
    // color used for preview.
    this.tempBgColor = (
      this.getBgColor ||
      this.getAllowedBgColors[0]);
    this.tempImageName = '';
    this.uploadedImageMimeType = '';
    this.dimensions = {
      height: 0,
      width: 0
    };
    this.allowedBgColors = this.getAllowedBgColors;
    this.aspectRatio = this.getAspectRatio;
    // this.getPreviewDescription = this.getPreviewDescription;
    // this.getPreviewDescriptionBgColor = (
    //   this.getPreviewDescriptionBgColor);
    // this.getPreviewFooter = this.getPreviewFooter;
    // this.getPreviewTitle = this.getPreviewTitle;


    const modalRef = this.ngbModal.open(
      EditThumnailModalComponent,
      {backdrop: 'static'});
    modalRef.componentInstance.allowedBgColors = this.allowedBgColors;
    modalRef.componentInstance.aspectRatio = this.aspectRatio;
    modalRef.componentInstance.dimensions = this.dimensions;
    modalRef.componentInstance.getPreviewDescription =
     this.getPreviewDescription;
    modalRef.componentInstance.getPreviewDescriptionBgColor =
       this.getPreviewDescriptionBgColor;
    modalRef.componentInstance.getPreviewFooter = this.getPreviewFooter;
    modalRef.componentInstance.getPreviewTitle = this.getPreviewTitle;
    modalRef.componentInstance.openInUploadMode = this.openInUploadMode;
    modalRef.componentInstance.uploadedImage = this.uploadedImage;
    modalRef.componentInstance.uploadedImageMimeType =
     this.uploadedImageMimeType;
    modalRef.componentInstance.tempBgColor = this.tempBgColor;

    modalRef.result.then((data) => {
      this.thumbnailIsLoading = true;
      this.filename = this.imageUploadHelperService.generateImageFilename(
        data.dimensions.height, data.dimensions.width, 'svg');
      this.newThumbnailDataUrl = data.newThumbnailDataUrl;
      if (!this.useLocalStorage) {
        if (data.openInUploadMode) {
          this.tempImageName = (
            this.imageUploadHelperService.generateImageFilename(
              data.dimensions.height, data.dimensions.width, 'svg'));
          this.saveThumbnailImageData(data.newThumbnailDataUrl, () => {
            this.uploadedImage = data.newThumbnailDataUrl;
            this.updateFilename(this.tempImageName);
            this.saveThumbnailBgColor(data.newBgColor);
          });
        } else {
          this.saveThumbnailBgColor(data.newBgColor);
          this.thumbnailIsLoading = false;
        }
      } else {
        this.imageLocalStorageService.saveImage(
          this.filename, data.newThumbnailDataUrl);
        this.localStorageBgcolor = data.newBgColor;
        this.imageLocalStorageService.setThumbnailBgColor(data.newBgColor);
      }
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }
}

angular.module('oppia').directive(
  'oppiaThumbnailUploader', downgradeComponent(
    {component: ThumbnailUploaderComponent}));
