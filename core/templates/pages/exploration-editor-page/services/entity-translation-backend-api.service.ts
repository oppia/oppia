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
 * @fileoverview Service to send changes to a entity-translation to the backend.
 */

import { HttpClient, HttpSentEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EntityTranslationBackendDict } from 'domain/translation/EntityTranslationObjectFactory';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class EntityTranslationBackendApiService {
    constructor(
        private httpClient: HttpClient,
        private urlInterpolationService: UrlInterpolationService
    ) {}

    private async _fetchEntityTranslationAsync(
        entityId, entityType, entityVersion, languageCode
    ): Promise<EntityTranslationBackendDict> {
        return this.httpClient.get<EntityTranslationBackendDict>(
            this._getUrl(
            entityId, entityType, entityVersion, languageCode)).then((response) => {
              // return domain Object.
            });
    }
  private _getUrl(
    entityId, entityType, entityVersion, languageCode
  ) {
    return this.urlInterpolationService.interpolateUrl(
      AppConstants.ENTITY_TRANSLATIONS_HANDLER_URL_TEMPLATE, {
        'entity_id': entityId,
        'entity_type': entityType,
        'entity_version': entityVersion,
        'language_code': languageCode
      }
    );
  }


    async fetchEntityTranslationAsync(
        entityId, entityType, entityVersion, languageCode
        ): Promise<EntityTranslationBackendDict> {
        return this._fetchEntityTranslationAsync(
            entityId, entityType, entityVersion, languageCode);
    }


}
