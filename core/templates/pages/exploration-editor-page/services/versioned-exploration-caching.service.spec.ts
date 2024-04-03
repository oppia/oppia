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
 * @fileoverview Unit tests for versioned exploration caching service.
 */

import {TestBed} from '@angular/core/testing';
import {FetchExplorationBackendResponse} from 'domain/exploration/read-only-exploration-backend-api.service';
import {VersionedExplorationCachingService} from './versioned-exploration-caching.service';

describe('Versioned exploration caching service', () => {
  let versionedExplorationCachingService: VersionedExplorationCachingService;
  const testVersionedExplorationData: FetchExplorationBackendResponse = {
    exploration_id: 'exp_1',
    is_logged_in: true,
    session_id: 'KERH',
    draft_change_list_id: 0,
    displayable_language_codes: [],
    exploration: {
      init_state_name: 'Introduction',
      param_changes: [],
      param_specs: {},
      title: 'Exploration',
      language_code: 'en',
      objective: 'To learn',
      next_content_id_index: 5,
      states: {
        Introduction: {
          param_changes: [],
          classifier_model_id: null,
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          solicit_answer_details: true,
          card_is_checkpoint: true,
          linked_skill_id: null,
          content: {
            html: '',
            content_id: 'content',
          },
          interaction: {
            customization_args: {},
            answer_groups: [],
            solution: null,
            hints: [],
            default_outcome: {
              param_changes: [],
              dest: 'Introduction',
              dest_if_really_stuck: null,
              feedback: {
                html: '',
                content_id: 'content',
              },
              labelled_as_correct: true,
              refresher_exploration_id: 'exp',
              missing_prerequisite_skill_id: null,
            },
            confirmed_unclassified_answers: [],
            id: null,
          },
        },
      },
    },
    exploration_metadata: {
      title: 'Exploration',
      category: 'Algebra',
      objective: 'To learn',
      language_code: 'en',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 50,
      init_state_name: 'Introduction',
      param_specs: {},
      param_changes: [],
      auto_tts_enabled: false,
      edits_allowed: true,
    },
    version: 1,
    can_edit: true,
    preferred_audio_language_code: 'en',
    preferred_language_codes: [],
    auto_tts_enabled: true,
    record_playthrough_probability: 1,
    has_viewed_lesson_info_modal_once: false,
    furthest_reached_checkpoint_exp_version: 1,
    furthest_reached_checkpoint_state_name: 'State A',
    most_recently_reached_checkpoint_state_name: 'State A',
    most_recently_reached_checkpoint_exp_version: 1,
  };

  beforeEach(() => {
    versionedExplorationCachingService = TestBed.inject(
      VersionedExplorationCachingService
    );

    versionedExplorationCachingService.cacheVersionedExplorationData(
      'exp_1',
      1,
      testVersionedExplorationData
    );
  });

  afterEach(() => {
    versionedExplorationCachingService.clearCache();
  });

  it('should check if data is already cached for given id and version', () => {
    expect(versionedExplorationCachingService.isCached('exp_1', 1)).toBeTrue();
    expect(versionedExplorationCachingService.isCached('exp_2', 1)).toBeFalse();
  });

  it('should add fetched exploration data to the cache', () => {
    expect(versionedExplorationCachingService.isCached('exp_1', 2)).toBeFalse();

    versionedExplorationCachingService.cacheVersionedExplorationData(
      'exp_1',
      2,
      testVersionedExplorationData
    );

    expect(versionedExplorationCachingService.isCached('exp_1', 2)).toBeTrue();
  });

  it('should retrieve cached exploration data', () => {
    expect(versionedExplorationCachingService.isCached('exp_1', 2)).toBeFalse();

    versionedExplorationCachingService.cacheVersionedExplorationData(
      'exp_1',
      2,
      testVersionedExplorationData
    );

    expect(versionedExplorationCachingService.isCached('exp_1', 2)).toBeTrue();
    expect(
      versionedExplorationCachingService.retrieveCachedVersionedExplorationData(
        'exp_1',
        2
      )
    ).toEqual(testVersionedExplorationData);
  });

  it('should remove cached exploration data', () => {
    expect(versionedExplorationCachingService.isCached('exp_1', 2)).toBeFalse();

    versionedExplorationCachingService.cacheVersionedExplorationData(
      'exp_1',
      2,
      testVersionedExplorationData
    );

    expect(versionedExplorationCachingService.isCached('exp_1', 2)).toBeTrue();

    versionedExplorationCachingService.removeCachedVersionedExplorationData(
      'exp_1',
      2
    );

    expect(versionedExplorationCachingService.isCached('exp_1', 2)).toBeFalse();
  });
});
