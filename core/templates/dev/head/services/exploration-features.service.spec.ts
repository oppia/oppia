// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for exporation-feature-service
 */
import { ExplorationFeaturesService } from
  'services/exploration-features.service';
import { TestBed } from '@angular/core/testing';

describe('ExplorationFeatureService', () => {
  let explorationFeatureService;
  let featureData;
  let explorationData;
  let explorationData2;

  beforeEach(() => {
    explorationFeatureService = TestBed.get(ExplorationFeaturesService);
    featureData = {
      is_improvements_tab_enabled: true,
      is_exploration_whitelisted: true
    };
    explorationData = {
      param_changes: ['param_1', 'param_2']
    };
    explorationData2 = {
      param_changes: [],
      state: [{
        param_changes: ['param_1', 'param_2']
      }]
    };
  });

  it('should init the exploration from param change', () => {
    explorationFeatureService.init(explorationData, featureData);
    expect(explorationFeatureService.isInitialized()).toEqual(true);
    expect(explorationFeatureService.areParametersEnabled()).toEqual(true);
    expect(explorationFeatureService.isImprovementsTabEnabled()).toEqual(true);
    expect(explorationFeatureService.isPlaythroughRecordingEnabled())
      .toEqual(true);
  });
  it('should init the exploration from state', () => {
    explorationFeatureService.init(explorationData2, featureData);
    expect(explorationFeatureService.isInitialized()).toEqual(true);
    expect(explorationFeatureService.areParametersEnabled()).toEqual(true);
    expect(explorationFeatureService.isImprovementsTabEnabled()).toEqual(true);
    expect(explorationFeatureService.isPlaythroughRecordingEnabled())
      .toEqual(true);
  });
});
