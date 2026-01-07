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

import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';
import {CsrfTokenService} from 'services/csrf-token.service';
import {ExplorationBackendDict} from 'domain/exploration/exploration.model';

describe('EditableExplorationBackendApiService', () => {
  let service: EditableExplorationBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService;
  let readOnlyService: ReadOnlyExplorationBackendApiService;

  let sampleDataResults: ExplorationBackendDict;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EditableExplorationBackendApiService,
        ReadOnlyExplorationBackendApiService,
        CsrfTokenService,
      ],
    });

    service = TestBed.inject(EditableExplorationBackendApiService);
    csrfService = TestBed.inject(CsrfTokenService);
    readOnlyService = TestBed.inject(ReadOnlyExplorationBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);

    spyOn(csrfService, 'getTokenAsync').and.resolveTo('csrf-token');
    spyOn(readOnlyService, 'deleteExplorationFromCache');

    sampleDataResults = {
      auto_tts_enabled: false,
      draft_changes: [],
      is_version_of_draft_valid: true,
      init_state_name: 'Introduction',
      param_changes: [],
      param_specs: {},
      states: {},
      title: 'Sample exploration',
      language_code: 'en',
      draft_change_list_id: 0,
      next_content_id_index: 1,
      exploration_metadata:
        {} as ExplorationBackendDict['exploration_metadata'],
      version: 1,
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch exploration successfully', fakeAsync(() => {
    let result: ExplorationBackendDict | null = null;

    service.fetchExplorationAsync('0').then((res: ExplorationBackendDict) => {
      result = res;
    });

    const req = httpTestingController.expectOne('/exploration_handler/data/0');
    expect(req.request.method).toBe('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();
    expect(result).toEqual(sampleDataResults);
  }));

  it('should fetch exploration with draft applied', fakeAsync(() => {
    let result: ExplorationBackendDict | null = null;

    service
      .fetchApplyDraftExplorationAsync('0')
      .then((res: ExplorationBackendDict) => {
        result = res;
      });

    const req = httpTestingController.expectOne(
      '/exploration_handler/data/0?apply_draft=true'
    );
    expect(req.request.method).toBe('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();
    expect(result).toEqual(sampleDataResults);
  }));

  it('should update exploration and clear cache', fakeAsync(() => {
    let response: ExplorationBackendDict | null = null;

    service
      .updateExplorationAsync('0', 1, 'Updated', [])
      .then((res: ExplorationBackendDict) => {
        response = res;
      });

    const req = httpTestingController.expectOne('/exploration_handler/data/0');
    expect(req.request.method).toBe('PUT');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(response).toEqual(sampleDataResults);
    expect(readOnlyService.deleteExplorationFromCache).toHaveBeenCalledWith(
      '0'
    );
  }));

  it('should delete exploration and clear cache', fakeAsync(() => {
    service.deleteExplorationAsync('0');

    const req = httpTestingController.expectOne('/exploration_handler/data/0');
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    flushMicrotasks();

    expect(readOnlyService.deleteExplorationFromCache).toHaveBeenCalledWith(
      '0'
    );
  }));

  it('should record checkpoint for logged-in user', fakeAsync(() => {
    service.recordMostRecentlyReachedCheckpointAsync(
      '0',
      1,
      'Introduction',
      true
    );

    const req = httpTestingController.expectOne(
      '/explorehandler/checkpoint_reached/0'
    );
    expect(req.request.method).toBe('PUT');
    req.flush({});

    flushMicrotasks();
  }));

  it('should record checkpoint for logged-out user with progress id', fakeAsync(() => {
    service.recordMostRecentlyReachedCheckpointAsync(
      '0',
      1,
      'Introduction',
      false,
      'progress_id'
    );

    const req = httpTestingController.expectOne(
      '/explorehandler/checkpoint_reached_by_logged_out_user/0'
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      unique_progress_url_id: 'progress_id',
      most_recently_reached_checkpoint_exp_version: 1,
      most_recently_reached_checkpoint_state_name: 'Introduction',
    });
    req.flush({});

    flushMicrotasks();
  }));

  it('should resolve silently when logged out without progress id', fakeAsync(() => {
    service.recordMostRecentlyReachedCheckpointAsync(
      '0',
      1,
      'Introduction',
      false,
      null
    );

    flushMicrotasks();
  }));

  it('should record progress and fetch unique progress id', fakeAsync(() => {
    let response: {unique_progress_url_id: string} | null = null;

    service
      .recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner(
        '0',
        1,
        'Introduction'
      )
      .then((res: {unique_progress_url_id: string}) => {
        response = res;
      });

    const req = httpTestingController.expectOne(
      '/explorehandler/checkpoint_reached_by_logged_out_user/0'
    );
    expect(req.request.method).toBe('POST');
    req.flush({unique_progress_url_id: 'abc'});

    flushMicrotasks();
    expect(response).toEqual({unique_progress_url_id: 'abc'});
  }));

  it('should change logged out progress to logged in progress', fakeAsync(() => {
    service.changeLoggedOutProgressToLoggedInProgressAsync('0', 'progress_id');

    const req = httpTestingController.expectOne(
      '/sync_logged_out_and_logged_in_progress/0'
    );
    expect(req.request.method).toBe('POST');
    req.flush({});

    flushMicrotasks();
  }));

  it('should reset exploration progress', fakeAsync(() => {
    service.resetExplorationProgressAsync('0');

    const req = httpTestingController.expectOne('/explorehandler/restart/0');
    expect(req.request.method).toBe('PUT');
    req.flush({});

    flushMicrotasks();
  }));

  it('should record learner has viewed lesson info modal once', fakeAsync(() => {
    service.recordLearnerHasViewedLessonInfoModalOnce();

    const req = httpTestingController.expectOne('/userinfohandler/data');
    expect(req.request.method).toBe('PUT');
    req.flush({});

    flushMicrotasks();
  }));
});
