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
 * @fileoverview A data service that stores the current exploration title so
 * that it can be displayed and edited in multiple places in the UI.
 */

import {Injectable} from '@angular/core';
import {ExplorationPropertyService} from './exploration-property.service';
import {AlertsService} from 'services/alerts.service';
import {ChangeListService} from './change-list.service';
import {LoggerService} from 'services/contextual/logger.service';
import {ExplorationRightsService} from './exploration-rights.service';
import {ValidatorsService} from 'services/validators.service';
import {NormalizeWhitespacePipe} from 'filters/string-utility-filters/normalize-whitespace.pipe';

@Injectable({
  providedIn: 'root',
})
export class ExplorationTitleService extends ExplorationPropertyService {
  propertyName: string = 'title';
  displayed!: string;
  constructor(
    private validatorService: ValidatorsService,
    private explorationRightsService: ExplorationRightsService,
    private whitespaceNormalizePipe: NormalizeWhitespacePipe,
    protected alertsService: AlertsService,
    protected changeListService: ChangeListService,
    protected loggerService: LoggerService
  ) {
    super(alertsService, changeListService, loggerService);
  }

  _normalize(value: string): string {
    return this.whitespaceNormalizePipe.transform(value);
  }

  _isValid(value: string): boolean {
    return this.validatorService.isValidEntityName(
      value,
      true,
      this.explorationRightsService.isPrivate()
    );
  }
}
