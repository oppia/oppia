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
 * @fileoverview Factory for creating PlatformParameterMetadata domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export enum FeatureFlagStage {
  DEV = 'dev',
  TEST = 'test',
  PROD = 'prod',
}

export interface PlatformParameterMetadataBackendDict {
    'is_feature': boolean;
    'feature_stage': FeatureFlagStage | null;
}

export class PlatformParameterMetadata {
  readonly isFeature: boolean;
  readonly featureStage: FeatureFlagStage | null;

  constructor(isFeature: boolean, stage: FeatureFlagStage | null) {
    this.isFeature = isFeature;
    this.featureStage = stage;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PlatformParameterMetadataObjectFactory {
  createFromBackendDict(
      backendDict: PlatformParameterMetadataBackendDict):
      PlatformParameterMetadata {
    return new PlatformParameterMetadata(
      backendDict.is_feature, backendDict.feature_stage);
  }
}

angular.module('oppia').factory(
  'PlatformParameterMetadataObjectFactory',
  downgradeInjectable(PlatformParameterMetadataObjectFactory));
