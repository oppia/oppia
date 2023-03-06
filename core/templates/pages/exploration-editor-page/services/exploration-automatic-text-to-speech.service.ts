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
 * text to speech data.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ExplorationPropertyService } from 'pages/exploration-editor-page/services/exploration-property.service';
import { AlertsService } from 'services/alerts.service';
import { LoggerService } from 'services/contextual/logger.service';
import { ChangeListService } from './change-list.service';

@Injectable({
  providedIn: 'root'
})
export class ExplorationAutomaticTextToSpeechService
  extends ExplorationPropertyService {
  propertyName: string = 'auto_tts_enabled';

  constructor(
    protected alertsService: AlertsService,
    protected changeListService: ChangeListService,
    protected loggerService: LoggerService,
  ) {
    super(alertsService, changeListService, loggerService);
  }

  // Type unknown is used here to check validity of the input.
  _isValid(value: unknown): boolean {
    return (typeof value === 'boolean');
  }

  isAutomaticTextToSpeechEnabled(): boolean {
    return (this.savedMemento as boolean);
  }

  toggleAutomaticTextToSpeech(): void {
    this.displayed = !this.displayed;
    this.saveDisplayedValue();
  }
}

angular.module('oppia').factory(
  'ExplorationAutomaticTextToSpeechService',
  downgradeInjectable(
    ExplorationAutomaticTextToSpeechService));
