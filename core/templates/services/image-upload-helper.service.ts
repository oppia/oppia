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
 * @fileoverview Image upload helper service.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { SvgSanitizerService } from './svg-sanitizer.service';

import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadHelperService {
  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private svgSanitizerService: SvgSanitizerService
  ) {}

  private _generateDateTimeStringForFilename(): string {
    let date = new Date();
    return date.getFullYear() +
      ('0' + (date.getMonth() + 1)).slice(-2) +
      ('0' + date.getDate()).slice(-2) + '_' +
      ('0' + date.getHours()).slice(-2) +
      ('0' + date.getMinutes()).slice(-2) +
      ('0' + date.getSeconds()).slice(-2) + '_' +
      Math.random().toString(36).substr(2, 10);
  }

  // Image file returned will be null when blob is not of type
  // 'image', blob size is zero or dataURI is null.
  // 'dataURI' here will be null if imageFilename does not exist in
  // local storage.
  convertImageDataToImageFile(dataURI: string | null): Blob | null {
    // Convert base64/URLEncoded data component to raw binary data
    // held in a string.
    if (dataURI !== null) {
      let byteString = atob(dataURI.split(',')[1]);

      // Separate out the mime component.
      let mime = dataURI.split(',')[0].split(':')[1].split(';')[0];

      // Write the bytes of the string to a typed array.
      let ia = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      let blob = new Blob([ia], { type: mime });
      if (blob.type.match('image') &&
        blob.size > 0) {
        return blob;
      }
    }

    return null;
  }

  getTrustedResourceUrlForThumbnailFilename(
      imageFileName: string, entityType: string, entityId: string): string {
    let encodedFilepath = window.encodeURIComponent(imageFileName);
    return this.assetsBackendApiService.getThumbnailUrlForPreview(
      entityType, entityId, encodedFilepath);
  }

  generateImageFilename(
      height: number, width: number, extension: string): string {
    return 'img_' +
      this._generateDateTimeStringForFilename() +
      '_height_' + height +
      '_width_' + width +
      '.' + extension;
  }

  generateMathExpressionImageFilename(
      height: string, width: string, verticalPadding: string): string {
    let filename = (
      'mathImg_' +
        this._generateDateTimeStringForFilename() +
        '_height_' + height +
        '_width_' + width +
        '_vertical_' + verticalPadding +
        '.' + 'svg'
    );
    let filenameRegexString = AppConstants.MATH_SVG_FILENAME_REGEX;
    let filenameRegex = RegExp(filenameRegexString, 'g');
    if (filenameRegex.exec(filename)) {
      return filename;
    } else {
      throw new Error(
        'The Math SVG filename format is invalid.');
    }
  }
}

angular.module('oppia').factory(
  'ImageUploadHelperService',
  downgradeInjectable(ImageUploadHelperService));
