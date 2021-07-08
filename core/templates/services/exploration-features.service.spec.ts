
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
import { ParamChangeBackendDict } from 'domain/exploration/ParamChangeObjectFactory';

import { ExplorationFeaturesService, ExplorationDataDict} from
  'services/exploration-features.service';
import { ExplorationFeatures } from './exploration-features-backend-api.service';

describe('ExplorationFeatureService', () => {
  let explorationFeatureService: ExplorationFeaturesService;
  let featureData: ExplorationFeatures;
  let explorationData: ExplorationDataDict;
  let explorationData2: ExplorationDataDict;
  let testParamChange: ParamChangeBackendDict;

  beforeEach(() => {
    explorationFeatureService = TestBed.get(ExplorationFeaturesService);
    ExplorationFeaturesService.settings.areParametersEnabled = false;
    ExplorationFeaturesService.settings.isPlaythroughRecordingEnabled = false;
    ExplorationFeaturesService.serviceIsInitialized = false;

    // The property alwaysAskLearnersForAnswerDetails is not used. It is just
    // for complete the ExplorationFeatures interface.
    featureData = {
      isExplorationWhitelisted: true,
      alwaysAskLearnersForAnswerDetails: false
    };
    explorationData = {
      param_changes: [testParamChange],
      states: {}
    };
    explorationData2 = {
      param_changes: [],
      states: {
        testState: {
          param_changes: [testParamChange],
          classifier_model_id: '',
          content: null,
          interaction: null,
          linked_skill_id: null,
          recorded_voiceovers: null,
          solicit_answer_details: false,
          card_is_checkpoint: false,
          written_translations: null,
          next_content_id_index: 1,
        }
      }
    };
    testParamChange = {
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
    expect(explorationFeatureService.isPlaythroughRecordingEnabled())
      .toEqual(true);
  });

  it('should init the exploration features from states', () => {
    explorationFeatureService.init(explorationData2, featureData);
    expect(explorationFeatureService.isInitialized()).toEqual(true);
    expect(explorationFeatureService.areParametersEnabled()).toEqual(true);
    expect(explorationFeatureService.isPlaythroughRecordingEnabled())
      .toEqual(true);
  });

  it('should not init the exploration feature if service is initialized',
    () => {
      ExplorationFeaturesService.serviceIsInitialized = true;
      explorationFeatureService.init(explorationData, featureData);
      expect(explorationFeatureService.isInitialized()).toEqual(true);
      expect(explorationFeatureService.areParametersEnabled()).toEqual(false);
      expect(explorationFeatureService.isPlaythroughRecordingEnabled())
        .toEqual(false);
    });
});
