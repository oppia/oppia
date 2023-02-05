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
 * @fileoverview A data service that stores the exploration language code.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ExplorationPropertyService } from './exploration-property.service';
import { AlertsService } from 'services/alerts.service';
import { ChangeListService } from './change-list.service';
import { LoggerService } from 'services/contextual/logger.service';
import { ContextService } from 'services/context.service';

import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class ExplorationLanguageCodeService extends ExplorationPropertyService {
  propertyName: string = 'language_code';
  constructor(
    private contextService: ContextService,
    protected alertsService: AlertsService,
    protected changeListService: ChangeListService,
    protected loggerService: LoggerService
  ) {
    super(alertsService, changeListService, loggerService);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  getSupportedContentLanguages() {
    if (this.contextService.isExplorationLinkedToStory()) {
      return AppConstants.SUPPORTED_CONTENT_LANGUAGES_FOR_ANDROID;
    }
    return AppConstants.SUPPORTED_CONTENT_LANGUAGES;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  getCurrentLanguageDescription() {
    for (var i = 0; i < AppConstants.SUPPORTED_CONTENT_LANGUAGES.length; i++) {
      if (AppConstants.SUPPORTED_CONTENT_LANGUAGES[i].code === this.displayed) {
        return AppConstants.SUPPORTED_CONTENT_LANGUAGES[i].description;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  _isValid(value: string) {
    return AppConstants.SUPPORTED_CONTENT_LANGUAGES.some((elt) => {
      return elt.code === value;
    });
  }
}

angular.module('oppia').factory(
  'ExplorationLanguageCodeService', downgradeInjectable(
    ExplorationLanguageCodeService));
