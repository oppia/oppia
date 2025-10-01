// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the CheckpointProgressService.
 */

import {TestBed, waitForAsync, fakeAsync, tick} from '@angular/core/testing';
import {CheckpointProgressService} from './checkpoint-progress.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TranslateModule} from '@ngx-translate/core';
import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {PageContextService} from 'services/page-context.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {ExplorationEngineService} from './exploration-engine.service';

describe('CheckpointProgressService', () => {
  let checkpointProgressService: CheckpointProgressService;
  let readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService;
  let pageContextService: PageContextService;
  let playerTranscriptService: PlayerTranscriptService;
  let explorationEngineService: ExplorationEngineService;

  const mockExplorationResponse: FetchExplorationBackendResponse = {
    exploration: {
      id: 'exp123',
      title: 'Test Exploration',
      category: 'Test',
      objective: 'Test objective',
      language_code: 'en',
      init_state_name: 'Introduction',
      states: {
        Introduction: {
          content: {
            content_id: 'content',
            html: '<p>Introduction</p>',
          },
          interaction: {
            id: 'Continue',
            customization_args: {},
            answer_groups: [],
            default_outcome: {
              dest: 'Checkpoint1',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'default_outcome',
                html: '',
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            hints: [],
            solution: null,
          },
          param_changes: [],
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          card_is_checkpoint: false,
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {},
          },
          linked_skill_id: null,
          next_content_id_index: 0,
        },
        Checkpoint1: {
          content: {
            content_id: 'content',
            html: '<p>First checkpoint</p>',
          },
          interaction: {
            id: 'Continue',
            customization_args: {},
            answer_groups: [],
            default_outcome: {
              dest: 'MiddleState',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'default_outcome',
                html: '',
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            hints: [],
            solution: null,
          },
          param_changes: [],
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          card_is_checkpoint: true,
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {},
          },
          linked_skill_id: null,
          next_content_id_index: 0,
        },
        MiddleState: {
          content: {
            content_id: 'content',
            html: '<p>Middle state</p>',
          },
          interaction: {
            id: 'Continue',
            customization_args: {},
            answer_groups: [],
            default_outcome: {
              dest: 'Checkpoint2',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'default_outcome',
                html: '',
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            hints: [],
            solution: null,
          },
          param_changes: [],
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          card_is_checkpoint: false,
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {},
          },
          linked_skill_id: null,
          next_content_id_index: 0,
        },
        Checkpoint2: {
          content: {
            content_id: 'content',
            html: '<p>Second checkpoint</p>',
          },
          interaction: {
            id: 'EndExploration',
            customization_args: {},
            answer_groups: [],
            default_outcome: null,
            hints: [],
            solution: null,
          },
          param_changes: [],
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          card_is_checkpoint: true,
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {},
          },
          linked_skill_id: null,
          next_content_id_index: 0,
        },
      },
      param_specs: {},
      param_changes: [],
      version: 1,
      auto_tts_enabled: false,
      correctness_feedback_enabled: false,
      draft_change_list_id: 0,
    },
    exploration_metadata: {
      title: 'Test Exploration',
      category: 'Test',
      objective: 'Test objective',
      language_code: 'en',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 50,
      init_state_name: 'Introduction',
      param_specs: {},
      param_changes: [],
      auto_tts_enabled: false,
      correctness_feedback_enabled: false,
      edits_allowed: true,
    },
    version: 1,
    is_logged_in: false,
    session_id: 'session123',
    in_story_mode: false,
    story_url_fragment: null,
    story_id: null,
    can_edit: false,
    preferred_audio_language_code: 'en',
    preferred_language_codes: ['en'],
    auto_tts_enabled: false,
    correctness_feedback_enabled: false,
    record_playthrough_probability: 1.0,
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [CheckpointProgressService],
    }).compileComponents();
  }));

  beforeEach(() => {
    checkpointProgressService = TestBed.inject(CheckpointProgressService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService
    );
    pageContextService = TestBed.inject(PageContextService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    explorationEngineService = TestBed.inject(ExplorationEngineService);
  });

  it('should be created', () => {
    expect(checkpointProgressService).toBeTruthy();
  });

  it('should fetch checkpoint count correctly', fakeAsync(() => {
    spyOn(pageContextService, 'getExplorationId').and.returnValue('exp123');
    spyOn(
      readOnlyExplorationBackendApiService,
      'fetchExplorationAsync'
    ).and.returnValue(Promise.resolve(mockExplorationResponse));

    let result: number;
    checkpointProgressService.fetchCheckpointCount().then(count => {
      result = count;
    });
    tick();

    expect(pageContextService.getExplorationId).toHaveBeenCalled();
    expect(
      readOnlyExplorationBackendApiService.fetchExplorationAsync
    ).toHaveBeenCalledWith('exp123', null);
    expect(result).toBe(2);
  }));

  it('should get most recently reached checkpoint index correctly', () => {
    const mockCards = [
      {getStateName: () => 'Introduction'},
      {getStateName: () => 'Checkpoint1'},
      {getStateName: () => 'MiddleState'},
      {getStateName: () => 'Checkpoint2'},
    ];

    spyOn(playerTranscriptService, 'getNumCards').and.returnValue(4);
    spyOn(playerTranscriptService, 'getCard').and.callFake((index: number) => {
      return mockCards[index];
    });
    spyOn(explorationEngineService, 'getStateFromStateName').and.callFake(
      (stateName: string) => {
        const checkpointStates = ['Checkpoint1', 'Checkpoint2'];
        return {cardIsCheckpoint: checkpointStates.includes(stateName)};
      }
    );

    const checkpointIndex =
      checkpointProgressService.getMostRecentlyReachedCheckpointIndex();

    expect(playerTranscriptService.getNumCards).toHaveBeenCalled();
    expect(playerTranscriptService.getCard).toHaveBeenCalledTimes(4);
    expect(
      explorationEngineService.getStateFromStateName
    ).toHaveBeenCalledTimes(4);
    expect(checkpointIndex).toBe(2);
  });

  it('should get most recently reached checkpoint index with no checkpoints', () => {
    const mockCards = [
      {getStateName: () => 'Introduction'},
      {getStateName: () => 'MiddleState'},
    ];

    spyOn(playerTranscriptService, 'getNumCards').and.returnValue(2);
    spyOn(playerTranscriptService, 'getCard').and.callFake((index: number) => {
      return mockCards[index];
    });
    spyOn(explorationEngineService, 'getStateFromStateName').and.returnValue({
      cardIsCheckpoint: false,
    });

    const checkpointIndex =
      checkpointProgressService.getMostRecentlyReachedCheckpointIndex();

    expect(checkpointIndex).toBe(0);
  });

  it('should throw an error when setting a null checkpoint', () => {
    expect(() => {
      checkpointProgressService.setMostRecentlyReachedCheckpoint(null);
    }).toThrowError('Checkpoint state name cannot be null.');
  });

  it('should throw an error when checking if a null checkpoint is visited', () => {
    expect(() => {
      checkpointProgressService.checkIfCheckpointIsVisited(null);
    }).toThrowError('Checkpoint state name cannot be null.');
  });

  it('should set and get most recently reached checkpoint correctly', () => {
    const checkpointStateName = 'checkpoint_1';
    checkpointProgressService.setMostRecentlyReachedCheckpoint(
      checkpointStateName
    );
    expect(checkpointProgressService.getMostRecentlyReachedCheckpoint()).toBe(
      checkpointStateName
    );
  });

  it('should throw error if most recently reached checkpoint is not set', () => {
    expect(() =>
      checkpointProgressService.getMostRecentlyReachedCheckpoint()
    ).toThrowError('Last completed checkpoint is not set.');
  });

  it('should return visited checkpoint state names when they exist', () => {
    const expectedStateNames = ['checkpoint1', 'checkpoint2'];
    checkpointProgressService.visitedCheckpointStateNames = expectedStateNames;
    const result = checkpointProgressService.getVisitedCheckpointStateNames();
    expect(result).toEqual(expectedStateNames);
  });

  it('should throw an error when no checkpoints have been visited', () => {
    checkpointProgressService.visitedCheckpointStateNames = [];
    expect(() => {
      checkpointProgressService.getVisitedCheckpointStateNames();
    }).toThrowError('No checkpoints have been visited yet.');
  });

  it('should set visited checkpoint state names correctly', () => {
    const checkpointStateName = 'checkpoint1';

    checkpointProgressService.setVisitedCheckpointStateNames(
      checkpointStateName
    );

    expect(checkpointProgressService.visitedCheckpointStateNames).toContain(
      checkpointStateName
    );
    expect(checkpointProgressService.visitedCheckpointStateNames.length).toBe(
      1
    );
  });

  it('should not add duplicate checkpoint state names', () => {
    const checkpointStateName = 'checkpoint1';

    checkpointProgressService.setVisitedCheckpointStateNames(
      checkpointStateName
    );
    checkpointProgressService.setVisitedCheckpointStateNames(
      checkpointStateName
    );

    expect(checkpointProgressService.visitedCheckpointStateNames.length).toBe(
      1
    );
    expect(checkpointProgressService.visitedCheckpointStateNames).toEqual([
      checkpointStateName,
    ]);
  });

  it('should reset visited checkpoint state names correctly', () => {
    const checkpointStateNames = ['checkpoint1', 'checkpoint2'];
    checkpointProgressService.visitedCheckpointStateNames =
      checkpointStateNames;

    checkpointProgressService.resetVisitedCheckpointStateNames();

    expect(checkpointProgressService.visitedCheckpointStateNames).toEqual([]);
  });

  it('should check if checkpoint is visited correctly when checkpoint is visited', () => {
    const checkpointStateName = 'checkpoint1';
    checkpointProgressService.visitedCheckpointStateNames = [
      checkpointStateName,
      'checkpoint2',
    ];

    const result =
      checkpointProgressService.checkIfCheckpointIsVisited(checkpointStateName);

    expect(result).toBe(true);
  });

  it('should check if checkpoint is visited correctly when checkpoint is not visited', () => {
    const checkpointStateName = 'checkpoint3';
    checkpointProgressService.visitedCheckpointStateNames = [
      'checkpoint1',
      'checkpoint2',
    ];

    const result =
      checkpointProgressService.checkIfCheckpointIsVisited(checkpointStateName);

    expect(result).toBe(false);
  });
});
