
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
 * @fileoverview Unit test for ExplorationFeaturesService
 */

import { TestBed } from '@angular/core/testing';

import { ExplorationFeaturesService, IExplorationDataDict, IParamChanges } from
  'services/exploration-features.service';

describe('ExplorationFeatureService', () => {
  let explorationFeatureService: ExplorationFeaturesService = null;
  let featureData = null;
  let explorationData: IExplorationDataDict = null;
  let explorationData2: IExplorationDataDict = null;
  let testParamChanges: IParamChanges = null;

  beforeEach(() => {
    explorationFeatureService = TestBed.get(ExplorationFeaturesService);
    ExplorationFeaturesService.settings.areParametersEnabled = false;
    ExplorationFeaturesService.settings.isImprovementsTabEnabled = false;
    ExplorationFeaturesService.settings.isPlaythroughRecordingEnabled = false;
    ExplorationFeaturesService.serviceIsInitialized = false;

    featureData = {
      isImprovementsTabEnabled: true,
      isExplorationWhitelisted: true,
    };
    explorationData = {
      param_changes: [testParamChanges],
      states: {}
    };
    explorationData2 = {
      param_changes: [],
      states: {
        testState: {
          param_changes: [testParamChanges],
        }
      }
    };
    testParamChanges = {
      name: 'param_1',
      generator_id: 'test_id',
      customization_args: {
        parse_with_jinja: true,
        value: '1'
      }
    };
  });

  it('should init the exploration features from param change', () => {
    explorationFeatureService.init(explorationData, featureData);
    expect(explorationFeatureService.isInitialized()).toEqual(true);
    expect(explorationFeatureService.areParametersEnabled()).toEqual(true);
    expect(explorationFeatureService.isImprovementsTabEnabled()).toEqual(true);
    expect(explorationFeatureService.isPlaythroughRecordingEnabled())
      .toEqual(true);
  });

  it('should init the exploration features from states', () => {
    explorationFeatureService.init(explorationData2, featureData);
    expect(explorationFeatureService.isInitialized()).toEqual(true);
    expect(explorationFeatureService.areParametersEnabled()).toEqual(true);
    expect(explorationFeatureService.isImprovementsTabEnabled()).toEqual(true);
    expect(explorationFeatureService.isPlaythroughRecordingEnabled())
      .toEqual(true);
  });

  it('should not init the exploration feature if service is initialized',
    () => {
      ExplorationFeaturesService.serviceIsInitialized = true;
      explorationFeatureService.init(explorationData, featureData);
      expect(explorationFeatureService.isInitialized()).toEqual(true);
      expect(explorationFeatureService.areParametersEnabled()).toEqual(false);
      expect(explorationFeatureService.isImprovementsTabEnabled())
        .toEqual(false);
      expect(explorationFeatureService.isPlaythroughRecordingEnabled())
        .toEqual(false);
    });
});
