// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Services for mapping state names to classifier details.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AppService } from 'services/app.service';
import { Classifier } from 'domain/classifier/classifier.model';
import { ClassifierDataBackendApiService } from 'services/classifier-data-backend-api.service';
import { LoggerService } from 'services/contextual/logger.service';

interface StateClassifierMapping {
  // The classifier corresponding to a state will be null if machine learning
  // classification is not enabled for that state.
  [state: string]: Classifier | null;
}

@Injectable({
  providedIn: 'root'
})
export class StateClassifierMappingService {
  _explorationId!: string;
  _explorationVersion!: number;
  stateClassifierMapping!: StateClassifierMapping;

  constructor(
    private appService: AppService,
    private classifierDataService: ClassifierDataBackendApiService,
    private loggerService: LoggerService) {}

  init(explorationId: string, explorationVersion: number): void {
    this.loggerService.info('Initializing state classifier mapping service');
    this._explorationId = explorationId;
    this._explorationVersion = explorationVersion;
    this.stateClassifierMapping = {};
  }

  async initializeClassifierDataForState(stateName: string): Promise<void> {
    if (this.appService.isMachineLearningClassificationEnabled()) {
      this.stateClassifierMapping[stateName] = null;
      this.loggerService.info('Fetching classifier data for ' + stateName);
      try {
        const classifier = (
          await this.classifierDataService.getClassifierDataAsync(
            this._explorationId, this._explorationVersion, stateName));
        this.stateClassifierMapping[stateName] = classifier;
      } catch (error) {
        this.loggerService.error(
          'Fetching classifier data for ' + stateName +
          ' failed with error: ' + error);
      }
    }
  }

  hasClassifierData(stateName: string): boolean {
    if (!this.appService.isMachineLearningClassificationEnabled()) {
      return false;
    }
    return this.stateClassifierMapping &&
           stateName in this.stateClassifierMapping &&
           this.stateClassifierMapping[stateName] !== null;
  }

  // Function returns null if Machine Learning Classification is not enabled.
  getClassifier(stateName: string): Classifier | null {
    if (this.stateClassifierMapping[stateName] &&
        this.appService.isMachineLearningClassificationEnabled() &&
        this.hasClassifierData(stateName)) {
      return this.stateClassifierMapping[stateName];
    }
    return null;
  }

  // NOTE TO DEVELOPERS: This method should only be used for tests.
  testOnlySetClassifierData(
      stateName: string, classifierData: Classifier): void {
    this.stateClassifierMapping[stateName] = classifierData;
  }
}

angular.module('oppia').factory(
  'StateClassifierMappingService',
  downgradeInjectable(StateClassifierMappingService));
