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
  instant(key: string, interpolateParams: Object | undefined): string {
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
        param_changes: [],
        solicit_answer_details: false,
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
        param_changes: [],
        solicit_answer_details: false,
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

  it('should get a random i18n key when message kind is specified', () => {
    spyOn(Math, 'random').and.returnValue(0.45);

    expect(checkpointCelebrationUtilityService.getRandomI18nKey(
      'KEY_PREFIX', 10, 'KIND_A')).toEqual('KEY_PREFIX_KIND_A_5');
  });

  it('should get a random i18n key when message kind is not specified', () => {
    spyOn(Math, 'random').and.returnValue(0.45);

    expect(checkpointCelebrationUtilityService.getRandomI18nKey(
      'KEY_PREFIX', 10, null)).toEqual('KEY_PREFIX_5');
  });

  it('should get the right kind of checkpoint message i18n key', () => {
    spyOn(Math, 'random').and.returnValue(0.45);

    expect(
      checkpointCelebrationUtilityService.getCheckpointMessageI18nKey(1, 8))
      .toEqual('I18N_CONGRATULATORY_CHECKPOINT_MESSAGE_FIRST_2');
    expect(
      checkpointCelebrationUtilityService.getCheckpointMessageI18nKey(1, 5))
      .toEqual('I18N_CONGRATULATORY_CHECKPOINT_MESSAGE_FIRST_2');
    expect(
      checkpointCelebrationUtilityService.getCheckpointMessageI18nKey(2, 8))
      .toEqual('I18N_CONGRATULATORY_CHECKPOINT_MESSAGE_SECOND_2');
    expect(
      checkpointCelebrationUtilityService.getCheckpointMessageI18nKey(2, 5))
      .toEqual('I18N_CONGRATULATORY_CHECKPOINT_MESSAGE_SECOND_2');
    expect(
      checkpointCelebrationUtilityService.getCheckpointMessageI18nKey(4, 8))
      .toEqual('I18N_CONGRATULATORY_CHECKPOINT_MESSAGE_MIDWAY_2');
    expect(
      checkpointCelebrationUtilityService.getCheckpointMessageI18nKey(2, 5))
      .toEqual('I18N_CONGRATULATORY_CHECKPOINT_MESSAGE_SECOND_2');
    expect(
      checkpointCelebrationUtilityService.getCheckpointMessageI18nKey(3, 5))
      .toEqual('I18N_CONGRATULATORY_CHECKPOINT_MESSAGE_MIDWAY_2');
    expect(
      checkpointCelebrationUtilityService.getCheckpointMessageI18nKey(4, 5))
      .toEqual('I18N_CONGRATULATORY_CHECKPOINT_MESSAGE_ONE_REMAINING_2');
    expect(
      checkpointCelebrationUtilityService.getCheckpointMessageI18nKey(3, 7))
      .toEqual('I18N_CONGRATULATORY_CHECKPOINT_MESSAGE_GENERIC_2');
    expect(
      checkpointCelebrationUtilityService.getCheckpointMessageI18nKey(4, 7))
      .toEqual('I18N_CONGRATULATORY_CHECKPOINT_MESSAGE_MIDWAY_2');
    expect(
      checkpointCelebrationUtilityService.getCheckpointMessageI18nKey(5, 7))
      .toEqual('I18N_CONGRATULATORY_CHECKPOINT_MESSAGE_TWO_REMAINING_2');
    expect(
      checkpointCelebrationUtilityService.getCheckpointMessageI18nKey(6, 8))
      .toEqual('I18N_CONGRATULATORY_CHECKPOINT_MESSAGE_TWO_REMAINING_2');
    expect(
      checkpointCelebrationUtilityService.getCheckpointMessageI18nKey(7, 8))
      .toEqual('I18N_CONGRATULATORY_CHECKPOINT_MESSAGE_ONE_REMAINING_2');
    expect(
      checkpointCelebrationUtilityService.getCheckpointMessageI18nKey(3, 8))
      .toEqual('I18N_CONGRATULATORY_CHECKPOINT_MESSAGE_GENERIC_2');
  });

  it('should get the checkpoint message', () => {
    spyOn(checkpointCelebrationUtilityService, 'getCheckpointMessageI18nKey')
      .and.returnValue('DUMMY_CHECKPOINT_MESSAGE_KEY');
    spyOn(translateService, 'instant').and.callThrough();

    expect(checkpointCelebrationUtilityService.getCheckpointMessage(
      2, 8)).toEqual('DUMMY_CHECKPOINT_MESSAGE_KEY');
    expect(checkpointCelebrationUtilityService.getCheckpointMessageI18nKey)
      .toHaveBeenCalledWith(2, 8);
    expect(translateService.instant).toHaveBeenCalledWith(
      'DUMMY_CHECKPOINT_MESSAGE_KEY');
  });

  it('should get a random checkpoint title i18n key', () => {
    spyOn(Math, 'random').and.returnValue(0.45);
    spyOn(checkpointCelebrationUtilityService, 'getRandomI18nKey')
      .and.callThrough();

    expect(checkpointCelebrationUtilityService.getCheckpointTitleI18nKey())
      .toEqual('I18N_CONGRATULATORY_CHECKPOINT_TITLE_3');
  });

  it('should get the checkpoint title', () => {
    spyOn(checkpointCelebrationUtilityService, 'getCheckpointTitleI18nKey')
      .and.returnValue('DUMMY_CHECKPOINT_TITLE_I18N_KEY');
    spyOn(translateService, 'instant').and.callThrough();

    expect(checkpointCelebrationUtilityService.getCheckpointTitle())
      .toEqual('DUMMY_CHECKPOINT_TITLE_I18N_KEY');
    expect(checkpointCelebrationUtilityService.getCheckpointTitleI18nKey)
      .toHaveBeenCalled();
    expect(translateService.instant).toHaveBeenCalledWith(
      'DUMMY_CHECKPOINT_TITLE_I18N_KEY');
  });

  it('should correctly set and retrieve isOnCheckpointedState value', () => {
    expect(checkpointCelebrationUtilityService.getIsOnCheckpointedState())
      .toBe(false);

    checkpointCelebrationUtilityService.setIsOnCheckpointedState(true);

    expect(checkpointCelebrationUtilityService.getIsOnCheckpointedState())
      .toBe(true);

    checkpointCelebrationUtilityService.setIsOnCheckpointedState(false);

    expect(checkpointCelebrationUtilityService.getIsOnCheckpointedState())
      .toBe(false);
  });

  it('should get emitter meant to open the lesson info modal', () => {
    let mockLessonInfoModalEmitter = new EventEmitter<void>();

    expect(
      checkpointCelebrationUtilityService.getOpenLessonInformationModalEmitter()
    ).toEqual(mockLessonInfoModalEmitter);
  });

  it('should emit the lesson info modal open event', () => {
    spyOn(
      checkpointCelebrationUtilityService
        .getOpenLessonInformationModalEmitter(), 'emit');

    checkpointCelebrationUtilityService.openLessonInformationModal();

    expect(
      checkpointCelebrationUtilityService
        .getOpenLessonInformationModalEmitter().emit).toHaveBeenCalled();
  });
});
