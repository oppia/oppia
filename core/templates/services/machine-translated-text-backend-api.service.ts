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
 * @fileoverview Services for machine translated texts.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ContentIdToContentMapping } from 'domain/opportunity/translatable-texts.model';

export interface MachineTranslatedTextBackendDict {
  'translated_text': ContentIdToContentMapping
}


@Injectable({
  providedIn: 'root'
})
export class MachineTranslatedTextBackendApiService {
  constructor(private http: HttpClient) {}

  async getMachineTranslatedStateTextsAsync(
      explorationId: string, stateName: string, contentIds: string[],
      targetLanguageCode: string): Promise<ContentIdToContentMapping> {
    return this.http.get<MachineTranslatedTextBackendDict>(
      '/machine_translated_state_texts_handler',
      {
        params: {
          exp_id: explorationId,
          state_name: stateName,
          content_ids: JSON.stringify(contentIds),
          target_language_code: targetLanguageCode
        }
      }).toPromise().then(response => response.translated_text);
  }
}

angular.module('oppia').factory(
  'MachineTranslatedTextBackendApiService',
  downgradeInjectable(MachineTranslatedTextBackendApiService));
