// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ReadOnlyExplorationBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {
  ReadOnlyExplorationBackendApiService,
  FetchExplorationBackendResponse,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {VersionedExplorationCachingService} from 'pages/exploration-editor-page/services/versioned-exploration-caching.service';

describe('Read only exploration backend API service', () => {
  let roebas: ReadOnlyExplorationBackendApiService;
  let httpTestingController: HttpTestingController;
  let versionedExplorationCachingService: VersionedExplorationCachingService;
  let sampleDataResults: FetchExplorationBackendResponse = {
    exploration_id: '0',
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
      next_content_id_index: 5,
      objective: 'To learn',
      states: {
        Introduction: {
          param_changes: [],
          classifier_model_id: null,
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                en: {
                  filename: 'test.mp3',
                  file_size_bytes: 100,
                  needs_update: false,
                  duration_secs: 0.1,
                },
              },
            },
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
    furthest_reached_checkpoint_state_name: 'State B',
    most_recently_reached_checkpoint_state_name: 'State A',
    most_recently_reached_checkpoint_exp_version: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    roebas = TestBed.inject(ReadOnlyExplorationBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    versionedExplorationCachingService = TestBed.inject(
      VersionedExplorationCachingService
    );
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing exploration from the backend', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    roebas.fetchExplorationAsync('0', null).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/explorehandler/init/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should successfully fetch an existing exploration with version from' +
      ' the backend and cache it if not already',
    fakeAsync(() => {
      spyOn(
        versionedExplorationCachingService,
        'cacheVersionedExplorationData'
      ).and.callThrough();
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      roebas.fetchExplorationAsync('0', 1).then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/explorehandler/init/0?v=1');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
      expect(
        versionedExplorationCachingService.cacheVersionedExplorationData
      ).toHaveBeenCalledWith('0', 1, sampleDataResults);
    })
  );

  it(
    'should use cached exploration data with version if the data is ' +
      'already cached',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      versionedExplorationCachingService.cacheVersionedExplorationData(
        '0',
        1,
        sampleDataResults
      );
      roebas.fetchExplorationAsync('0', 1).then(successHandler, failHandler);

      httpTestingController.expectNone('/explorehandler/init/0?v=1');
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        versionedExplorationCachingService.retrieveCachedVersionedExplorationData(
          '0',
          1
        )
      );
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should successfully fetch an existing exploration from a unique' +
      ' URL progress id',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      roebas
        .fetchExplorationAsync('0', null, '123456')
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/explorehandler/init/0?pid=123456'
      );
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should load an existing exploration from the backend', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    roebas.loadExplorationAsync('0', 0).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/explorehandler/init/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler if the backend request failed', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    roebas.loadExplorationAsync('0', 0).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/explorehandler/init/0');
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: 'Error loading exploration 0.',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error loading exploration 0.');
  }));

  it('should report caching and support clearing the cache', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    // The exploration should not currently be cached.
    expect(roebas.isCached('0')).toBe(false);

    roebas.loadLatestExplorationAsync('0').then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/explorehandler/init/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();

    // The exploration should now be cached.
    expect(roebas.isCached('0')).toBe(true);

    // The exploration should be loadable from the cache.
    roebas.loadLatestExplorationAsync('0').then(successHandler, failHandler);
    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();

    // Resetting the cache will cause another fetch from the backend.
    roebas.clearExplorationCache();
    expect(roebas.isCached('0')).toBe(false);

    roebas.loadLatestExplorationAsync('0').then(successHandler, failHandler);

    req = httpTestingController.expectOne('/explorehandler/init/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should report a cached exploration after caching it', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    // The exploration should not currently be cached.
    expect(roebas.isCached('0')).toBe(false);

    // Cache a exploration.
    roebas.cacheExploration('0', {
      can_edit: true,
      exploration: {
        init_state_name: 'state_name',
        param_changes: [],
        param_specs: {},
        states: {},
        title: '',
        language_code: '',
        objective: '',
        next_content_id_index: 1,
      },
      exploration_metadata: {
        title: '',
        category: '',
        objective: '',
        language_code: 'en',
        tags: [],
        blurb: '',
        author_notes: '',
        states_schema_version: 50,
        init_state_name: '',
        param_specs: {},
        param_changes: [],
        auto_tts_enabled: false,
        edits_allowed: true,
      },
      exploration_id: '0',
      is_logged_in: true,
      session_id: 'sessionId',
      version: 1,
      preferred_audio_language_code: 'en',
      auto_tts_enabled: false,
      displayable_language_codes: [],
      record_playthrough_probability: 1,
      draft_change_list_id: 0,
      preferred_language_codes: [],
      has_viewed_lesson_info_modal_once: false,
      furthest_reached_checkpoint_exp_version: 1,
      furthest_reached_checkpoint_state_name: 'State B',
      most_recently_reached_checkpoint_state_name: 'State A',
      most_recently_reached_checkpoint_exp_version: 1,
    });

    // It should now be cached.
    expect(roebas.isCached('0')).toBe(true);

    // A new exploration should not have been fetched from the backend. Also,
    // the returned exploration should match the expected exploration object.
    roebas.loadLatestExplorationAsync('0').then(successHandler, failHandler);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith({
      can_edit: true,
      exploration: {
        init_state_name: 'state_name',
        param_changes: [],
        param_specs: {},
        states: {},
        title: '',
        language_code: '',
        objective: '',
        next_content_id_index: 1,
      },
      exploration_metadata: {
        title: '',
        category: '',
        objective: '',
        language_code: 'en',
        tags: [],
        blurb: '',
        author_notes: '',
        states_schema_version: 50,
        init_state_name: '',
        param_specs: {},
        param_changes: [],
        auto_tts_enabled: false,
        edits_allowed: true,
      },
      exploration_id: '0',
      is_logged_in: true,
      session_id: 'sessionId',
      version: 1,
      preferred_audio_language_code: 'en',
      auto_tts_enabled: false,
      record_playthrough_probability: 1,
      draft_change_list_id: 0,
      displayable_language_codes: [],
      preferred_language_codes: [],
      has_viewed_lesson_info_modal_once: false,
      furthest_reached_checkpoint_exp_version: 1,
      furthest_reached_checkpoint_state_name: 'State B',
      most_recently_reached_checkpoint_state_name: 'State A',
      most_recently_reached_checkpoint_exp_version: 1,
    });
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should delete a exploration from cache', fakeAsync(() => {
    expect(roebas.isCached('0')).toBe(false);

    roebas.cacheExploration('0', {
      can_edit: true,
      exploration: {
        init_state_name: 'state_name',
        param_changes: [],
        param_specs: {},
        states: {},
        title: '',
        language_code: '',
        objective: '',
        next_content_id_index: 1,
      },
      exploration_metadata: {
        title: '',
        category: '',
        objective: '',
        language_code: 'en',
        tags: [],
        blurb: '',
        author_notes: '',
        states_schema_version: 50,
        init_state_name: '',
        param_specs: {},
        param_changes: [],
        auto_tts_enabled: false,
        edits_allowed: true,
      },
      exploration_id: '0',
      is_logged_in: true,
      session_id: 'sessionId',
      version: 1,
      preferred_audio_language_code: 'en',
      auto_tts_enabled: false,
      record_playthrough_probability: 1,
      draft_change_list_id: 0,
      preferred_language_codes: [],
      has_viewed_lesson_info_modal_once: false,
      furthest_reached_checkpoint_exp_version: 1,
      furthest_reached_checkpoint_state_name: 'State B',
      most_recently_reached_checkpoint_state_name: 'State A',
      most_recently_reached_checkpoint_exp_version: 1,
      displayable_language_codes: [],
    });
    expect(roebas.isCached('0')).toBe(true);

    roebas.deleteExplorationFromCache('0');
    expect(roebas.isCached('0')).toBe(false);
  }));
});
