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

import {TestBed} from '@angular/core/testing';
import {ParamChangeBackendDict} from 'domain/exploration/ParamChangeObjectFactory';

import {
  ExplorationFeaturesService,
  ExplorationDataDict,
} from 'services/exploration-features.service';
import {ExplorationFeatures} from './exploration-features-backend-api.service';

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
      explorationIsCurated: true,
      alwaysAskLearnersForAnswerDetails: false,
    };
    explorationData = {
      param_changes: [testParamChange],
      states: {},
    };
    explorationData2 = {
      param_changes: [],
      states: {
        testState: {
          param_changes: [testParamChange],
          classifier_model_id: '',
          content: {
            content_id: 'content',
            html: '',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
            },
          },
          interaction: {
            answer_groups: [],
            confirmed_unclassified_answers: [],
            customization_args: {
              buttonText: {
                value: 'Continue',
              },
            },
            default_outcome: {
              dest: 'End State',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'default_outcome',
                html: '',
              },
              param_changes: [],
              labelled_as_correct: true,
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            hints: [],
            solution: null,
            id: 'Continue',
          },
          linked_skill_id: null,
          solicit_answer_details: false,
          card_is_checkpoint: false,
        },
      },
    };
    testParamChange = {
      name: 'param_1',
      generator_id: 'test_id',
      customization_args: {
        parse_with_jinja: true,
        value: '1',
      },
    };
  });

  it('should init the exploration features from param change', () => {
    explorationFeatureService.init(explorationData, featureData);
    expect(explorationFeatureService.isInitialized()).toEqual(true);
    expect(explorationFeatureService.areParametersEnabled()).toEqual(true);
    expect(explorationFeatureService.isPlaythroughRecordingEnabled()).toEqual(
      true
    );
  });

  it('should init the exploration features from states', () => {
    explorationFeatureService.init(explorationData2, featureData);
    expect(explorationFeatureService.isInitialized()).toEqual(true);
    expect(explorationFeatureService.areParametersEnabled()).toEqual(true);
    expect(explorationFeatureService.isPlaythroughRecordingEnabled()).toEqual(
      true
    );
  });

  it('should not init the exploration feature if service is initialized', () => {
    ExplorationFeaturesService.serviceIsInitialized = true;
    explorationFeatureService.init(explorationData, featureData);
    expect(explorationFeatureService.isInitialized()).toEqual(true);
    expect(explorationFeatureService.areParametersEnabled()).toEqual(false);
    expect(explorationFeatureService.isPlaythroughRecordingEnabled()).toEqual(
      false
    );
  });
});
