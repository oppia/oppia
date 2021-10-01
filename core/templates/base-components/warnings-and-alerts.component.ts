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
 * @fileoverview Component for warning and alerts.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AlertsService, Message, Warning } from 'services/alerts.service';

@Component({
  selector: 'oppia-warnings-and-alerts',
  templateUrl: './warnings-and-alerts.component.html'
})
export class WarningsAndAlertsComponent {
  constructor(
    private alertsService: AlertsService
  ) {}

  getWarnings(): Warning[] {
    return this.alertsService.warnings;
  }

  deleteWarning(warning: Warning): void {
    this.alertsService.deleteWarning(warning);
  }

  getMessages(): Message[] {
    return this.alertsService.messages;
  }
}

angular.module('oppia').directive('oppiaWarningsAndAlerts',
  downgradeComponent({
    component: WarningsAndAlertsComponent
  }) as angular.IDirectiveFactory);
