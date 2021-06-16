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
 * @fileoverview Services for storing exploration properties for
 * the specification of the parameters.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { AlertsService } from 'services/alerts.service';
import { LoggerService } from 'services/contextual/logger.service';
import { ChangeListService } from './change-list.service';
import { ExplorationPropertyService } from './exploration-property.service';

@Injectable({providedIn: 'root'})
export class ExplorationParamSpecsService extends ExplorationPropertyService {
  constructor(
      alertsService: AlertsService,
      changeListService: ChangeListService,
      loggerService: LoggerService,
  ) {
    super(alertsService, changeListService, loggerService);
    this.propertyName = 'param_specs';
  }
}
angular.module('oppia').factory(
  'ExplorationParamSpecsService', downgradeInjectable(
    ExplorationParamSpecsService));

