// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to fetch all translations for an entity from the backend.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {LanguageCodeToEntityTranslations} from 'services/entity-translations.services';
import {
  EntityTranslation,
  LanguageCodeToEntityTranslationBackendDict,
} from 'domain/translation/EntityTranslationObjectFactory';

@Injectable({
  providedIn: 'root',
})
export class EntityBulkTranslationsBackendApiService {
  ENTITY_TRANSLATIONS_BULK_HANDLER_URL_TEMPLATE: string =
    '/entity_translations_bulk_handler/<entity_type>/<entity_id>/<entity_version>';

  constructor(
    private httpClient: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  private _getUrl(entityId: string, entityType: string, entityVersion: number) {
    return this.urlInterpolationService.interpolateUrl(
      this.ENTITY_TRANSLATIONS_BULK_HANDLER_URL_TEMPLATE,
      {
        entity_id: entityId,
        entity_type: entityType,
        entity_version: String(entityVersion),
      }
    );
  }

  async fetchEntityBulkTranslationsAsync(
    entityId: string,
    entityType: string,
    entityVersion: number
  ): Promise<LanguageCodeToEntityTranslations> {
    return new Promise((resolve, reject) => {
      this.httpClient
        .get<LanguageCodeToEntityTranslationBackendDict>(
          this._getUrl(entityId, entityType, entityVersion)
        )
        .toPromise()
        .then(
          response => {
            let languageCodeToEntityTranslations: LanguageCodeToEntityTranslations =
              {};
            for (let language in response) {
              languageCodeToEntityTranslations[language] =
                EntityTranslation.createFromBackendDict(response[language]);
            }
            resolve(languageCodeToEntityTranslations);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }
}
