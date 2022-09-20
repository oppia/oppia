// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to fetch and store EntityTranslation for the given
 * entity in a given langauge.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { EntityTranslation } from 'domain/translation/EntityTranslationObjectFactory';
import { EntityTranslationBackendApiService } from 'pages/exploration-editor-page/services/entity-translation-backend-api.service';


@Injectable({
  providedIn: 'root'
})
export class EntityTranslationsService {
  private entityId: string = null;
  private entityType: string = null;
  private entityVersion: number = null;
  public entityTranslation: EntityTranslation = null;
  constructor(
    private entityTranslationBackendApiService: (
      EntityTranslationBackendApiService)
  ) {}

  init(
      entityId: string,
      entityType: string,
      entityVersion: number
  ): void {
    this.entityType = entityType;
    this.entityVersion = entityVersion;
    this.entityId = entityId;
  }

  async refreshEntityTranslationsAsync(languageCode: string):
      Promise<EntityTranslation> {
    return new Promise((resolve, reject) => {
      this.entityTranslationBackendApiService.fetchEntityTranslationAsync(
        this.entityType,
        this.entityId,
        this.entityVersion,
        languageCode
      ).then((entityTranslation) => {
        this.entityTranslation = entityTranslation;
        resolve(entityTranslation);
      });
    });
  }
}

angular.module('oppia').factory(
  'EntityTranslationsService',
  downgradeInjectable(EntityTranslationsService));
