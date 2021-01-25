// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
import { ImagesData } from './image-local-storage.service';


export class StateNamesToContentIdMappingBackendDict {
  [state: string]: {[contentId:string]: string}
}

export class TranslatableTextHandlerResponseBackendDict {
  'state_names_to_content_id_mapping': StateNamesToContentIdMappingBackendDict;
  'version': string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslateTextBackendApiService {
  constructor(private http: HttpClient) {}

  async getTranslatableTextsAsync(expId: string, languageCode: string):
    Promise<TranslatableTextHandlerResponseBackendDict> {
    return this.http.get<TranslatableTextHandlerResponseBackendDict>(
      '/gettranslatabletexthandler', {
        params: {
          exp_id: expId,
          language_code: languageCode
        }
      }).toPromise();
  }

  async putTranslatedTextSuggestion(
      expId: string, expVersion: string, contentId: string, stateName: string,
      languageCode: string,
      stateWiseContents:StateNamesToContentIdMappingBackendDict,
      translationHtml: string, imagesData: ImagesData[]): Promise<unknown> {
    const postData = {
      suggestion_type: 'translate_content',
      target_type: 'exploration',
      description: 'Adds translation',
      target_id: expId,
      target_version_at_submission: expVersion,
      change: {
        cmd: 'add_translation',
        content_id: contentId,
        state_name: stateName,
        language_code: languageCode,
        content_html: stateWiseContents[
          stateName][contentId],
        translation_html: translationHtml
      }
    };

    let body = new FormData();
    body.append('payload', JSON.stringify(postData));
    let filenames = imagesData.map(obj => obj.filename);
    let imageBlobs = imagesData.map(obj => obj.imageBlob);
    for (let idx in imageBlobs) {
      body.append(filenames[idx], imageBlobs[idx]);
    }
    return this.http.put(
      '/suggestionhandler/', body,
      // The actual header to be added is 'multipart/form-data', But
      // adding it manually won't work because we will miss the boundary
      // parameter. When we keep 'Content-Type' as undefined the browser
      // automatically fills the boundary parameter according to the form
      // data. Refer https://stackoverflow.com/questions/37039852/. and
      // https://stackoverflow.com/questions/34983071/.
      // Note: This should be removed and a convetion similar to
      // SkillCreationBackendApiService should be followed once this service
      // is migrated to Angular 8.
      {headers: {'Content-Type': undefined}}
    ).toPromise();
  }
}

angular.module('oppia').factory('TranslateTextBackendApiService',
  downgradeInjectable(TranslateTextBackendApiService));
