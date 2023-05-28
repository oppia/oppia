// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for determining the visibility of advanced features in
 *               the exploration editor.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ExplorationFeatures } from
  'services/exploration-features-backend-api.service';
import { ParamChangeBackendDict } from 'domain/exploration/ParamChangeObjectFactory';
import { StateObjectsBackendDict } from 'domain/exploration/StatesObjectFactory';

export interface ExplorationDataDict {
  'param_changes': ParamChangeBackendDict[] | [];
  states: StateObjectsBackendDict;
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationFeaturesService {
  /**
   * Variable to keep track of whether the service has been initialised.
   */
  static serviceIsInitialized = false;
  static settings = {
    areParametersEnabled: false,
    isPlaythroughRecordingEnabled: false
  };

  /**
   * Initialises the service by enabling the parameters feature based
   * on whether the exploration contains parameters.
   * @param explorationData - An ExplorationData object.
   * @param featuresData - An ExplorationFeatures object.
   */
  init(
      explorationData: ExplorationDataDict,
      featuresData: ExplorationFeatures): void {
    if (ExplorationFeaturesService.serviceIsInitialized) {
      return;
    }
    ExplorationFeaturesService.settings.isPlaythroughRecordingEnabled =
      featuresData.explorationIsCurated;
    if (explorationData.param_changes &&
        explorationData.param_changes.length > 0) {
      this.enableParameters();
    } else {
      for (var state in explorationData.states) {
        if (explorationData.states[state].param_changes.length > 0) {
          this.enableParameters();
          break;
        }
      }
    }
    ExplorationFeaturesService.serviceIsInitialized = true;
  }

  /**
   * @returns - Whether a service is initialized.
   */
  isInitialized(): boolean {
    return ExplorationFeaturesService.serviceIsInitialized;
  }

  /**
   * @returns - Checks whether the parameters are enabled.
   */
  areParametersEnabled(): boolean {
    return ExplorationFeaturesService.settings.areParametersEnabled;
  }

  /**
   * @returns - Whether the play through recording is enabled.
   */
  isPlaythroughRecordingEnabled(): boolean {
    return ExplorationFeaturesService.settings.isPlaythroughRecordingEnabled;
  }

  /**
   * Enables the parameters feature.
   */
  enableParameters(): void {
    ExplorationFeaturesService.settings.areParametersEnabled = true;
  }
}

angular.module('oppia').factory(
  'ExplorationFeaturesService',
  downgradeInjectable(ExplorationFeaturesService));
