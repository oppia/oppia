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

export interface ExplorationDataDict {
  'param_changes': ParamChanges[] | [];
  states: {
    [propsName : string]: {
      'param_changes': ParamChanges[] | []
    }
  };
}

export interface ParamChanges {
  name: string;
  'generator_id': string;
  'customization_args': {
    'parse_with_jinja': boolean,
    value: string
  };
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationFeaturesService {
  /**
   * Static type variable to initialize a service
   * by setting it to true or false.
   */
  static serviceIsInitialized = false;
  static settings = {
    areParametersEnabled: false,
    isPlaythroughRecordingEnabled: false
  };

  /**
   * For enabling the parameters by checking whether the service
   * has been initialized or not.
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
      featuresData.isExplorationWhitelisted;
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
   * @returns - Whether a service is initialized or not.
   */
  isInitialized(): boolean {
    return ExplorationFeaturesService.serviceIsInitialized;
  }

  /**
   * @returns - Checks whether the parameters are enabled or not.
   */
  areParametersEnabled(): boolean {
    return ExplorationFeaturesService.settings.areParametersEnabled;
  }

  /**
   * @returns - Whether the play through recording is enabled or not.
   */
  isPlaythroughRecordingEnabled(): boolean {
    return ExplorationFeaturesService.settings.isPlaythroughRecordingEnabled;
  }

  /**
   * Enabling the parameters by setting them to true.
   */
  enableParameters(): void {
    ExplorationFeaturesService.settings.areParametersEnabled = true;
  }
}

angular.module('oppia').factory(
  'ExplorationFeaturesService',
  downgradeInjectable(ExplorationFeaturesService));
