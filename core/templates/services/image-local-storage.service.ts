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

import {Injectable} from '@angular/core';

import {AlertsService} from 'services/alerts.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {WindowRef} from 'services/contextual/window-ref.service';

export interface ImagesData {
  filename: string;
  // 'imageBlob' will be null when filenames
  // are not present in localStorage.
  imageBlob: Blob | null;
}

@Injectable({
  providedIn: 'root',
})
export class ImageLocalStorageService {
  storedImageFilenames: string[] = [];
  // According to https://en.wikipedia.org/wiki/Web_storage, 5MB is the
  // minimum limit, for all browsers, per hostname, that can be stored in
  // sessionStorage and 100kB is the max size limit for uploaded images, hence
  // the limit below.
  MAX_IMAGES_STORABLE: number = (5 * 1024) / 100;
  // 'null' value here represents that either image is not present in local
  // storage or ImageData has been flushed.
  thumbnailBgColor: string | null = null;

  constructor(
    private alertsService: AlertsService,
    private imageUploadHelperService: ImageUploadHelperService,
    private windowRef: WindowRef
  ) {}

  // Function returns null if filename doesn't exist in local storage.
  getRawImageData(filename: string): string | null {
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
          'creation.'
      );
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
            this.storedImageFilenames[idx]
          )
        ),
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

  // Function returns null if no image is present in local storage.
  getThumbnailBgColor(): string | null {
    return this.thumbnailBgColor;
  }

  flushStoredImagesData(): void {
    this.windowRef.nativeWindow.sessionStorage.clear();
    this.storedImageFilenames.length = 0;
    this.thumbnailBgColor = null;
  }

  async getFilenameToBase64MappingAsync(
    imagesData: ImagesData[]
  ): Promise<Record<string, string>> {
    let filesToBase64Mapping: {[key: string]: string} = {};
    if (imagesData.length > 0) {
      for await (const obj of imagesData) {
        if (obj.imageBlob === null) {
          throw new Error('No image data found');
        }
        const image = await this._blobtoBase64(obj.imageBlob);
        filesToBase64Mapping[obj.filename] = image;
      }
    }
    return filesToBase64Mapping;
  }

  private async _blobtoBase64(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Read the base64 data from result.
        const dataurl = reader.result as string;
        const prefixRegex = /^data:image\/(gif|png|jpeg|svg\+xml|jpg);base64,/;
        if (!dataurl.match(prefixRegex)) {
          reject(new Error('No valid prefix found in data url'));
        }
        // Remove "data:mime/type;base64," prefix from data url.
        // And just return base64 string.
        const base64 = dataurl.replace(prefixRegex, '');
        resolve(base64);
      };
      // Read image blob and store the result.
      reader.readAsDataURL(blob);
      reader.onerror = error => reject(error);
    });
  }
}
