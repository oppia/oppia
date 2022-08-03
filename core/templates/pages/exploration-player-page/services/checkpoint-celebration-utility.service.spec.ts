// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the checkpoint celebration utility service.
 */

import { TestBed } from '@angular/core/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { CheckpointCelebrationUtilityService } from 'pages/exploration-player-page/services/checkpoint-celebration-utility.service';
import { ComputeGraphService } from 'services/compute-graph.service';
import { StateObjectsBackendDict } from 'domain/exploration/StatesObjectFactory';
import { StatesObjectFactory } from 'domain/exploration/StatesObjectFactory';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('Checkpoint celebration utility service', () => {
  let checkpointCelebrationUtilityService: CheckpointCelebrationUtilityService;
  let translateService: TranslateService;
  let computeGraphService: ComputeGraphService;
  let statesObjectFactory: StatesObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CheckpointCelebrationUtilityService,
        StatesObjectFactory,
        ComputeGraphService,
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
  });

  beforeEach(() => {
    checkpointCelebrationUtilityService = TestBed.inject(
      CheckpointCelebrationUtilityService);
    translateService = TestBed.inject(TranslateService);
    computeGraphService = TestBed.inject(ComputeGraphService);
    statesObjectFactory = TestBed.inject(StatesObjectFactory);
  });

  it('should get the state list for checkpoint messages', () => {
    const statesBackendDict: StateObjectsBackendDict = {
      'First State': {
        classifier_model_id: null,
        content: {
          content_id: 'content',
          html: ''
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {}
          }
        },
        interaction: {
          answer_groups: [],
          confirmed_unclassified_answers: [],
          customization_args: {
            buttonText: {
              value: 'Continue'
            }
          },
          default_outcome: {
            dest: 'End State',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            param_changes: [],
            labelled_as_correct: true,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null
          },
          hints: [],
          solution: null,
          id: 'Continue'
        },
        linked_skill_id: null,
        next_content_id_index: 0,
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {}
          }
        },
        card_is_checkpoint: true
      },
      'End State': {
        classifier_model_id: null,
        content: {
          content_id: 'content',
          html: ''
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {}
          }
        },
        interaction: {
          answer_groups: [],
          confirmed_unclassified_answers: [],
          customization_args: {
            recommendedExplorationIds: {
              value: []
            }
          },
          default_outcome: null,
          hints: [],
          solution: null,
          id: 'EndExploration'
        },
        linked_skill_id: null,
        next_content_id_index: 0,
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {}
          }
        },
        card_is_checkpoint: false
      }
    };
    const states = statesObjectFactory.createFromBackendDict(
      statesBackendDict);
    spyOn(computeGraphService, 'computeBfsTraversalOfStates').and.returnValue([
      'First State', 'End State']);

    expect(
      checkpointCelebrationUtilityService.getStateListForCheckpointMessages(
        statesBackendDict, 'First State')).toEqual(['First State']);
    expect(computeGraphService.computeBfsTraversalOfStates)
      .toHaveBeenCalledWith('First State', states, 'First State');
  });
});
