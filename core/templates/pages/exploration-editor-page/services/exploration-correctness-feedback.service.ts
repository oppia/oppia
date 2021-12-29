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
 * @fileoverview Service for checking the correctness feedback for an
 * exploration.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ExplorationPropertyService } from 'pages/exploration-editor-page/services/exploration-property.service';
import { AlertsService } from 'services/alerts.service';
import { ChangeListService } from './change-list.service';
import { LoggerService } from 'services/contextual/logger.service';

@Injectable({
  providedIn: 'root'
})
export class ExplorationCorrectnessFeedbackService extends
  ExplorationPropertyService {
  correctnessFeedbackIsEnabled: boolean = false;
  propertyName: string = 'correctness_feedback_enabled';

  constructor(
    protected alertsService: AlertsService,
    protected changeListService: ChangeListService,
    protected loggerService: LoggerService
  ) {
    super(alertsService, changeListService, loggerService);
  }

  isEnabled(): string {
    return this.savedMemento;
  }

  toggleCorrectnessFeedback(): void {
    // Earlier we were using this.displayed = !this.displayed this is wrong.
    // Because we the variable displayed is string type and we were storing
    // boolean init by using !, To overcome this problem JSON.parse('true')
    // and correctnessFeedbackIsEnabled is used.

    this.correctnessFeedbackIsEnabled = !this.correctnessFeedbackIsEnabled;
    if (this.correctnessFeedbackIsEnabled) {
      this.displayed = JSON.parse('true');
      this.saveDisplayedValue();
    } else {
      this.savedMemento = JSON.parse('false');
    }
  }
}

angular.module('oppia').factory('ExplorationCorrectnessFeedbackService',
  downgradeInjectable(ExplorationCorrectnessFeedbackService));
