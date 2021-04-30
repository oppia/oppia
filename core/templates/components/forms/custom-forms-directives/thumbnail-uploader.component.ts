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

import { OnChanges, SimpleChanges } from '@angular/core';
import { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { EditThumnailModalComponent } from './edit-thumbnail-modal.component';

@Component({
  selector: 'oppia-thumbnail-uploader',
  templateUrl: './thumbnail-uploader.component.html'
})
export class ThumbnailUploaderComponent implements OnChanges {
  @Input() disabled: boolean;
  @Input() useLocalStorage: boolean;
  @Input() allowedBgColors: boolean;
  @Input() aspectRatio: string;
  @Input() bgColor: string;
  @Input() filename: string;
  @Input() previewDescription: string;
  @Input() previewDescriptionBgColor: string;
  @Input() previewFooter: string;
  @Input() previewTitle: string;
  @Input() updateBgColor: (arg0: string) => void;
  @Input() updateFilename: (arg0: string) => void;
  openInUploadMode: boolean;
  tempBgColor: string;
  tempImageName: string;
  uploadedImageMimeType: string;
  dimensions: { height: number; width: number; };
  resampledFile: Blob;
  newThumbnailDataUrl: string;
  localStorageBgcolor: string;
  imageUploadUrlTemplate: string;
  editableThumbnailDataUrl: string = (
    this.urlInterpolationService.getStaticImageUrl(
      '/icons/story-image-icon.png'));
  transformedData: string;
  parsedResponse;
  constructor(
    private imageUploadHelperService: ImageUploadHelperService,
    private alertsService: AlertsService,
    private contextService: ContextService,
    private imageLocalStorageService: ImageLocalStorageService,
    private ngbModal: NgbModal,
    private assetsBackendApiService: AssetsBackendApiService,
    private urlInterpolationService: UrlInterpolationService
  ) {}
  placeholderImageDataUrl = (
    this.urlInterpolationService.getStaticImageUrl(
      '/icons/story-image-icon.png'));
  thumbnailIsLoading = true;
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
  //     filename = this.editableThumbnailDataUrl;
  //   } else {
  //     this.editableThumbnailDataUrl = placeholderImageDataUrl;
  //     filename = null;
  //   }
  //   this.thumbnailIsLoading = false;
  // });

  filenameChanges(newFilename: string): void {
    if (newFilename) {
      this.editableThumbnailDataUrl = (
        this.imageUploadHelperService
          .getTrustedResourceUrlForThumbnailFilename(
            newFilename,
            this.contextService.getEntityType(),
            this.contextService.getEntityId()));
      console.log(this.editableThumbnailDataUrl);
      this.filename = this.editableThumbnailDataUrl;
    } else {
      this.editableThumbnailDataUrl = this.placeholderImageDataUrl;
      this.filename = null;
    }
    this.thumbnailIsLoading = true;
  }

  // ngOnInit(): void {
  //   this.filenameChanges();
  // }

  ngOnChanges(changes: SimpleChanges): void {
    // console.log(changes);
    // if (
    //   changes.filename &&
    //   changes.filename.currentValue !== changes.filename.previousValue) {
    //   console.log('prya');
    //   const newValue = changes.filename.currentValue;
    //   this.filenameChanges(newValue);
    // }
  }


  saveThumbnailBgColor(newBgColor: string): void {
    if (newBgColor !== this.bgColor) {
      this.updateBgColor(newBgColor);
    }
  }

  saveThumbnailImageData(imageURI: string, callback): void {
    console.log(Blob);
    this.resampledFile = null;
    this.resampledFile = (
      this.imageUploadHelperService.convertImageDataToImageFile(
        imageURI));
        console.log('priya1');
        console.log(this.resampledFile);

    if (this.resampledFile === null) {
      this.alertsService.addWarning('Could not get resampled file.');
      return;
    }
    this.postImageToServer(this.resampledFile, callback);
  }

  postImageToServer(resampledFile: Blob, callback: () => void): void {
    this.assetsBackendApiService.saveMathExpresionImage(
      resampledFile, this.tempImageName,
      this.contextService.getEntityType(),
      this.contextService.getEntityId()).then((data) => {
      this.editableThumbnailDataUrl = (
        this.imageUploadHelperService
          .getTrustedResourceUrlForThumbnailFilename(
            data.filename, this.contextService.getEntityType(),
            this.contextService.getEntityId()));
      console.log('editable thumbnail url' + this.editableThumbnailDataUrl);
      callback();
    }), ((data) => {
    // Remove the XSSI prefix.
      console.log('priya');
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
      this.bgColor ||
      this.allowedBgColors[0]);
    this.tempImageName = '';
    this.uploadedImageMimeType = '';
    this.dimensions = {
      height: 0,
      width: 0
    };
    const modalRef = this.ngbModal.open(
      EditThumnailModalComponent,
      {backdrop: 'static'});
    modalRef.componentInstance.allowedBgColors = this.allowedBgColors;
    modalRef.componentInstance.aspectRatio = this.aspectRatio;
    modalRef.componentInstance.dimensions = this.dimensions;
    modalRef.componentInstance.previewDescription =
     this.previewDescription;
    modalRef.componentInstance.previewDescriptionBgColor =
       this.previewDescriptionBgColor;
    modalRef.componentInstance.previewFooter = this.previewFooter;
    modalRef.componentInstance.previewTitle = this.previewTitle;
    modalRef.componentInstance.openInUploadMode = this.openInUploadMode;
    modalRef.componentInstance.uploadedImage = this.filename;
    modalRef.componentInstance.uploadedImageMimeType =
     this.uploadedImageMimeType;
    modalRef.componentInstance.tempBgColor = this.tempBgColor;

    modalRef.result.then((data) => {
      this.thumbnailIsLoading = true;
      this.filename = this.imageUploadHelperService.generateImageFilename(
        data.dimensions.height, data.dimensions.width, 'svg');
      // console.log(this.filename);
      this.newThumbnailDataUrl = data.newThumbnailDataUrl;
      if (!this.useLocalStorage) {
        if (data.openInUploadMode) {
          this.tempImageName = (
            this.imageUploadHelperService.generateImageFilename(
              data.dimensions.height, data.dimensions.width, 'svg'));
          this.saveThumbnailImageData(data.newThumbnailDataUrl, () => {
            console.log('priya1');
            this.filename = data.newThumbnailDataUrl;
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
