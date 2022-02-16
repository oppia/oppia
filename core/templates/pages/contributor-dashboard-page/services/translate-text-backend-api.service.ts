// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for handling user contributed translations.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { TranslatableTexts, TranslatableTextsBackendDict } from 'domain/opportunity/translatable-texts.model';
import { ImagesData } from 'services/image-local-storage.service';

interface Data {
  'suggestion_type': string;
  'target_type': string;
  description: string;
  'target_id': string;
  'target_version_at_submission': string;
  change: object;
  files?: Record<string, unknown>;
}
@Injectable({
  providedIn: 'root'
})
export class TranslateTextBackendApiService {
  constructor(private http: HttpClient) {}

  async getTranslatableTextsAsync(expId: string, languageCode: string):
    Promise<TranslatableTexts> {
    return this.http.get<TranslatableTextsBackendDict>(
      '/gettranslatabletexthandler', {
        params: {
          exp_id: expId,
          language_code: languageCode
        }
      }).toPromise().then((backendDict: TranslatableTextsBackendDict) => {
      return TranslatableTexts.createFromBackendDict(backendDict);
    });
  }
  async blobtoBase64(blob: Blob): Promise<unknown> {
    return new Promise<unknown> ((resolve, reject)=> {
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
  async suggestTranslatedTextAsync(
      expId: string, expVersion: string, contentId: string, stateName: string,
      languageCode: string, contentHtml: string | string[],
      translationHtml: string | string[], imagesData: ImagesData[],
      dataFormat: string): Promise<unknown> {
    const postData: Data = {
      suggestion_type: 'translate_content',
      target_type: 'exploration',
      description: 'Adds translation',
      target_id: expId,
      target_version_at_submission: expVersion,
      change: {
        cmd: 'add_written_translation',
        content_id: contentId,
        state_name: stateName,
        language_code: languageCode,
        content_html: contentHtml,
        translation_html: translationHtml,
        data_format: dataFormat
      }
    };
    const body = new FormData();
    if (imagesData.length > 0) {
      postData.files = {};
      for await (const obj of imagesData) {
        if (obj.imageBlob === null) {
          throw new Error('No image data found');
        }
        const image = await this.blobtoBase64(obj.imageBlob);
        postData.files[obj.filename] = image;
      }
    }
    body.append('payload', JSON.stringify(postData));
    return this.http.post(
      '/suggestionhandler/', body).toPromise();
  }
}

angular.module('oppia').factory('TranslateTextBackendApiService',
  downgradeInjectable(TranslateTextBackendApiService));
