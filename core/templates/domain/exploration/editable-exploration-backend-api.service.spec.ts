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
 * @fileoverview Unit tests for EditableExplorationBackendApiService
 */

import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {HttpErrorResponse} from '@angular/common/http';

import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {CsrfTokenService} from 'services/csrf-token.service';
import {ExplorationBackendDict} from 'domain/exploration/exploration.model';

describe('EditableExplorationBackendApiService', () => {
  let editableExplorationBackendApiService: EditableExplorationBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService;

  let sampleDataResults: ExplorationBackendDict;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EditableExplorationBackendApiService, CsrfTokenService],
    });

    editableExplorationBackendApiService = TestBed.inject(
      EditableExplorationBackendApiService
    );
    csrfService = TestBed.inject(CsrfTokenService);
    httpTestingController = TestBed.inject(HttpTestingController);

    spyOn(csrfService, 'getTokenAsync').and.returnValue(
      Promise.resolve('sample-csrf-token')
    );

    sampleDataResults = {
      auto_tts_enabled: false,
      draft_changes: [],
      is_version_of_draft_valid: true,
      init_state_name: 'Introduction',
      param_changes: [],
      param_specs: {
        x: {
          obj_type: 'UnicodeString',
        },
      },
      states: {
        Introduction: {
          param_changes: [],
          content: {
            html: '',
            content_id: 'content',
          },
          interaction: {
            id: null,
            customization_args: {},
            answer_groups: [],
            default_outcome: {
              param_changes: [],
              dest: 'Introduction',
              dest_if_really_stuck: null,
              feedback: {
                html: '',
                content_id: 'feedback',
              },
              labelled_as_correct: false,
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            confirmed_unclassified_answers: [],
            hints: [],
            solution: null,
          },
          classifier_model_id: null,
          solicit_answer_details: false,
          card_is_checkpoint: false,
          linked_skill_id: null,
          inapplicable_skill_misconception_ids: [],
        },
      },
      title: 'Sample exploration',
      language_code: 'en',
      draft_change_list_id: 0,
      next_content_id_index: 1,
      exploration_metadata: {
        title: 'Sample exploration',
        category: 'Sample',
        objective: 'Objective',
        language_code: 'en',
        tags: [],
        blurb: '',
        author_notes: '',
        edits_allowed: true,
        states_schema_version: 0,
        init_state_name: 'Introduction',
        param_specs: {},
        param_changes: [],
        auto_tts_enabled: false,
      },
      version: 1,
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing exploration', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    editableExplorationBackendApiService
      .fetchExplorationAsync('0')
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne('/createhandler/data/0');
    expect(req.request.method).toBe('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler on backend failure', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    editableExplorationBackendApiService
      .fetchExplorationAsync('1')
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne('/createhandler/data/1');
    req.error(
      new ErrorEvent('Error'),
      new HttpErrorResponse({
        error: 'Error loading exploration 1',
        status: 500,
        statusText: 'Internal Server Error',
      })
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should update exploration after fetch', fakeAsync(() => {
    let exploration: ExplorationBackendDict | undefined;

    editableExplorationBackendApiService
      .fetchExplorationAsync('0')
      .then((data: ExplorationBackendDict) => {
        exploration = data;
      });

    const fetchReq = httpTestingController.expectOne('/createhandler/data/0');
    fetchReq.flush(sampleDataResults);
    flushMicrotasks();

    if (exploration === undefined) {
      fail('Expected exploration to be defined after fetch');
      return;
    }

    editableExplorationBackendApiService
      .updateExplorationAsync(
        '0',
        exploration.version,
        'Updated exploration',
        []
      )
      .then(() => {});

    const updateReq = httpTestingController.expectOne('/createhandler/data/0');
    expect(updateReq.request.method).toBe('PUT');
    updateReq.flush(sampleDataResults);

    flushMicrotasks();
  }));

  it('should delete exploration', fakeAsync(() => {
    editableExplorationBackendApiService
      .deleteExplorationAsync('0')
      .then(() => {});

    const deleteReq = httpTestingController.expectOne('/createhandler/data/0');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({});

    flushMicrotasks();
  }));
});
