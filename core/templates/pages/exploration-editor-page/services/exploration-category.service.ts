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
 * @fileoverview A data service that stores the current exploration category so
 * that it can be displayed and edited in multiple places in the UI.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ExplorationPropertyService } from './exploration-property.service';
import { ExplorationRightsService } from './exploration-rights.service';
import { ValidatorsService } from 'services/validators.service';
import { NormalizeWhitespacePipe } from 'filters/string-utility-filters/normalize-whitespace.pipe';
import { AlertsService } from 'services/alerts.service';
import { ChangeListService } from './change-list.service';
import { LoggerService } from 'services/contextual/logger.service';

@Injectable({
  providedIn: 'root'
})
export class ExplorationCategoryService extends ExplorationPropertyService {
  constructor(
    private validatorsService: ValidatorsService,
    private explorationRightsService: ExplorationRightsService,
    private whitespaceNormalize: NormalizeWhitespacePipe,
    protected alertsService: AlertsService,
    protected changeListService: ChangeListService,
    protected loggerService: LoggerService,
  ) {
    super(alertsService, changeListService, loggerService);
  }

  propertyName: string = 'category';

  _normalize(value: string): string {
    return this.whitespaceNormalize.transform(value);
  }

  _isValid(value: string): boolean {
    return this.validatorsService.isValidEntityName(
      value, true, this.explorationRightsService.isPrivate());
  }
}

angular.module('oppia').factory('ExplorationCategoryService',
  downgradeInjectable(ExplorationCategoryService));
