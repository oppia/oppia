// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for managing images in localStorage.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AlertsService } from 'services/alerts.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { WindowRef } from 'services/contextual/window-ref.service';

export interface ImagesData {
  filename: string;
  imageBlob: Blob;
}

@Injectable({
  providedIn: 'root'
})
export class ImageLocalStorageService {
  storedImageFilenames: string[] = [];
  // According to https://en.wikipedia.org/wiki/Web_storage, 5MB is the
  // minimum limit, for all browsers, per hostname, that can be stored in
  // sessionStorage and 100kB is the max size limit for uploaded images, hence
  // the limit below.
  MAX_IMAGES_STORABLE: number = 5 * 1024 / 100;
  thumbnailBgColor: string = null;

  constructor(
    private alertsService: AlertsService,
    private imageUploadHelperService: ImageUploadHelperService,
    private windowRef: WindowRef) {}

  getRawImageData(filename: string): string {
    return this.windowRef.nativeWindow.sessionStorage.getItem(filename);
  }

  /**
   * Saves the image data in localStorage.
   * @param {string} filename - Filename of the image.
   * @param {string} rawImage - Raw base64/URLEncoded data of the image.
   */
  saveImage(filename: string, rawImage: string): void {
    if (this.storedImageFilenames.length + 1 > this.MAX_IMAGES_STORABLE) {
      // Since the service is going to be used in the create modal for
      // entities, more images can be added after entity creation, when
      // local storage would no longer be used.
      this.alertsService.addInfoMessage(
        'Image storage limit reached. More images can be added after ' +
        'creation.');
      return;
    }
    this.windowRef.nativeWindow.sessionStorage.setItem(filename, rawImage);
    this.storedImageFilenames.push(filename);
  }

  deleteImage(filename: string): void {
    this.windowRef.nativeWindow.sessionStorage.removeItem(filename);
    const index = this.storedImageFilenames.indexOf(filename);
    this.storedImageFilenames.splice(index, 1);
  }

  getStoredImagesData(): ImagesData[] {
    const returnData = [];
    for (const idx in this.storedImageFilenames) {
      returnData.push({
        filename: this.storedImageFilenames[idx],
        imageBlob: this.imageUploadHelperService.convertImageDataToImageFile(
          this.windowRef.nativeWindow.sessionStorage.getItem(
            this.storedImageFilenames[idx]))
      });
    }
    return returnData;
  }

  isInStorage(filename: string): boolean {
    return this.storedImageFilenames.indexOf(filename) !== -1;
  }

  setThumbnailBgColor(bgColor: string): void {
    this.thumbnailBgColor = bgColor;
  }

  getThumbnailBgColor(): string {
    return this.thumbnailBgColor;
  }

  flushStoredImagesData(): void {
    this.windowRef.nativeWindow.sessionStorage.clear();
    this.storedImageFilenames.length = 0;
    this.thumbnailBgColor = null;
  }
}

angular.module('oppia').factory(
  'ImageLocalStorageService', downgradeInjectable(ImageLocalStorageService));
