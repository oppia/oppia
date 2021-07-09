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
 * @fileoverview A data service that stores the name of the exploration's
 * initial state. NOTE: This service does not perform validation. Users of this
 * service should ensure that new initial state names passed to the service are
 * valid.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ExplorationPropertyService } from './exploration-property.service';
import { AlertsService } from 'services/alerts.service';
import { ChangeListService } from './change-list.service';
import { LoggerService } from 'services/contextual/logger.service';
import { ContextService } from 'services/context.service';

@Injectable({
  providedIn: 'root'
})
export class ExplorationInitStateNameService
  extends ExplorationPropertyService {
  propertyName: string = 'init_state_name';
  constructor(
    private contextService: ContextService,
    protected alertsService: AlertsService,
    protected changeListService: ChangeListService,
    protected loggerService: LoggerService
  ) {
    super(alertsService, changeListService, loggerService);
  }
}

angular.module('oppia').factory(
  'ExplorationInitStateNameService', downgradeInjectable(
    ExplorationInitStateNameService));
