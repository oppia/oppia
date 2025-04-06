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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {
  TranslatableTexts,
  TranslatableTextsBackendDict,
} from 'domain/opportunity/translatable-texts.model';
import {
  ImageLocalStorageService,
  ImagesData,
} from 'services/image-local-storage.service';

interface Data {
  suggestion_type: string;
  target_type: string;
  description: string;
  target_id: string;
  target_version_at_submission: string;
  change_cmd: object;
  files?: Record<string, string>;
}
@Injectable({
  providedIn: 'root',
})
export class TranslateTextBackendApiService {
  constructor(
    private http: HttpClient,
    private imageLocalStorageService: ImageLocalStorageService
  ) {}

  async getTranslatableTextsAsync(
    expId: string,
    languageCode: string
  ): Promise<TranslatableTexts> {
    return this.http
      .get<TranslatableTextsBackendDict>('/gettranslatabletexthandler', {
        params: {
          exp_id: expId,
          language_code: languageCode,
        },
      })
      .toPromise()
      .then((backendDict: TranslatableTextsBackendDict) => {
        return TranslatableTexts.createFromBackendDict(backendDict);
      });
  }

  async suggestTranslatedTextAsync(
    expId: string,
    expVersion: string,
    contentId: string,
    stateName: string,
    languageCode: string,
    contentHtml: string | string[],
    translationHtml: string | string[],
    imagesData: ImagesData[],
    dataFormat: string
  ): Promise<void> {
    const postData: Data = {
      suggestion_type: 'translate_content',
      target_type: 'exploration',
      description: 'Adds translation',
      target_id: expId,
      target_version_at_submission: expVersion,
      change_cmd: {
        cmd: 'add_written_translation',
        content_id: contentId,
        state_name: stateName,
        language_code: languageCode,
        content_html: contentHtml,
        translation_html: translationHtml,
        data_format: dataFormat,
      },
      files:
        await this.imageLocalStorageService.getFilenameToBase64MappingAsync(
          imagesData
        ),
    };
    const body = new FormData();
    body.append('payload', JSON.stringify(postData));
    return this.http.post<void>('/suggestionhandler/', body).toPromise();
  }
}
