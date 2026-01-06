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
  let service: EditableExplorationBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService;

  let sampleDataResults: ExplorationBackendDict;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EditableExplorationBackendApiService, CsrfTokenService],
    });

    service = TestBed.inject(EditableExplorationBackendApiService);
    csrfService = TestBed.inject(CsrfTokenService);
    httpTestingController = TestBed.inject(HttpTestingController);

    spyOn(csrfService, 'getTokenAsync').and.resolveTo('csrf-token');

    sampleDataResults = {
      auto_tts_enabled: false,
      draft_changes: [],
      is_version_of_draft_valid: true,
      init_state_name: 'Introduction',
      param_changes: [],
      param_specs: {x: {obj_type: 'UnicodeString'}},
      states: {
        Introduction: {
          param_changes: [],
          content: {html: '', content_id: 'content'},
          interaction: {
            id: null,
            customization_args: {},
            answer_groups: [],
            default_outcome: {
              param_changes: [],
              dest: 'Introduction',
              dest_if_really_stuck: null,
              feedback: {html: '', content_id: 'feedback'},
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

  it('should fetch exploration successfully', fakeAsync(() => {
    let result: ExplorationBackendDict | null = null;

    service
      .fetchExplorationAsync('0')
      .then((res: ExplorationBackendDict) => (result = res));

    const req = httpTestingController.expectOne('/createhandler/data/0');
    expect(req.request.method).toBe('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();
    expect(result).toEqual(sampleDataResults);
  }));

  it('should handle fetch exploration failure', fakeAsync(() => {
    let error: string | null = null;

    service
      .fetchExplorationAsync('1')
      .catch((err: unknown) => (error = String(err)));

    const req = httpTestingController.expectOne('/createhandler/data/1');
    req.error(
      new ErrorEvent('Error'),
      new HttpErrorResponse({
        error: 'Fetch failed',
        status: 500,
        statusText: 'Server Error',
      })
    );

    flushMicrotasks();
    expect(error).toBeTruthy();
  }));

  it('should update exploration successfully', fakeAsync(() => {
    let response: ExplorationBackendDict | null = null;

    service
      .updateExplorationAsync('0', 1, 'Updated', [])
      .then((res: ExplorationBackendDict) => (response = res));

    const req = httpTestingController.expectOne('/createhandler/data/0');
    expect(req.request.method).toBe('PUT');
    req.flush(sampleDataResults);

    flushMicrotasks();
    expect(response).toEqual(sampleDataResults);
  }));

  it('should handle update exploration failure', fakeAsync(() => {
    let error: string | null = null;

    service
      .updateExplorationAsync('0', 1, 'Updated', [])
      .catch((err: unknown) => (error = String(err)));

    const req = httpTestingController.expectOne('/createhandler/data/0');
    req.error(
      new ErrorEvent('Error'),
      new HttpErrorResponse({
        error: 'Update failed',
        status: 500,
        statusText: 'Server Error',
      })
    );

    flushMicrotasks();
    expect(error).toBeTruthy();
  }));

  it('should delete exploration successfully', fakeAsync(() => {
    let success = false;

    service.deleteExplorationAsync('0').then(() => (success = true));

    const req = httpTestingController.expectOne('/createhandler/data/0');
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    flushMicrotasks();
    expect(success).toBeTrue();
  }));

  it('should handle delete exploration failure', fakeAsync(() => {
    let error: string | null = null;

    service
      .deleteExplorationAsync('0')
      .catch((err: unknown) => (error = String(err)));

    const req = httpTestingController.expectOne('/createhandler/data/0');
    req.error(
      new ErrorEvent('Error'),
      new HttpErrorResponse({
        error: 'Delete failed',
        status: 500,
        statusText: 'Server Error',
      })
    );

    flushMicrotasks();
    expect(error).toBeTruthy();
  }));
});
