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
 * @fileoverview Unit tests for EditableExplorationBackendApiService.
 */

import { EditableExplorationBackendApiService } from
  'domain/exploration/editable-exploration-backend-api.service';
import { ReadOnlyExplorationBackendApiService } from
  'domain/exploration/read-only-exploration-backend-api.service';
import { CsrfTokenService } from 'services/csrf-token.service';

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { HttpTestingController, HttpClientTestingModule } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';

describe('Editable exploration backend API service', function() {
  let editableExplorationBackendApiService:
  EditableExplorationBackendApiService = null;
  let readOnlyExplorationBackendApiService:
  ReadOnlyExplorationBackendApiService = null;
  let httpTestingController: HttpTestingController;
  let sampleDataResults = null;
  let csrfService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(()=> {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    editableExplorationBackendApiService = TestBed.inject(
      EditableExplorationBackendApiService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
    csrfService = TestBed.inject(CsrfTokenService);
    httpTestingController = TestBed.inject(HttpTestingController);

    spyOn(csrfService, 'getTokenAsync').and.callFake(async() => {
      return Promise.resolve('sample-csrf-token');
    });

    // Sample exploration object returnable from the backend.
    sampleDataResults = {
      exploration_id: '0',
      init_state_name: 'Introduction',
      language_code: 'en',
      states: {
        Introduction: {
          param_changes: [],
          content: {
            html: '',
            audio_translations: {}
          },
          unresolved_answers: {},
          interaction: {
            customization_args: {},
            answer_groups: [],
            default_outcome: {
              param_changes: [],
              dest: 'Introduction',
              dest_if_really_stuck: null,
              feedback: {
                html: '',
                audio_translations: {}
              }
            },
            confirmed_unclassified_answers: [],
            id: null
          }
        }
      },
      username: 'test',
      user_email: 'test@example.com',
      version: 1
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing exploration from ' +
    'the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    editableExplorationBackendApiService.fetchExplorationAsync('0').then(
      successHandler, failHandler);

    const req = httpTestingController.expectOne('/createhandler/data/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  })
  );

  it('should fetch and apply the draft of an exploration', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    // Loading a exploration the first time should fetch it from the backend.
    editableExplorationBackendApiService.fetchApplyDraftExplorationAsync(
      '0').then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      '/createhandler/data/0?apply_draft=true');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler if the backend ' +
    'request failed', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    // Loading a exploration the first time should fetch it from the backend.
    editableExplorationBackendApiService.fetchExplorationAsync('1').then(
      successHandler, failHandler);

    const req = httpTestingController.expectOne('/createhandler/data/1');
    const errorResponse = new HttpErrorResponse({
      error: 'Error loading exploration 1.',
      status: 500,
      statusText: 'Internal Server Error'
    });
    expect(req.request.method).toEqual('GET');
    req.error(new ErrorEvent('Error'), errorResponse);

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should update a exploration after fetching it from ' +
    'the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = null;

    // Loading a exploration the first time should fetch it from the backend.
    editableExplorationBackendApiService.fetchExplorationAsync('0').then(
      function(data) {
        exploration = data;
      });

    let req = httpTestingController.expectOne('/createhandler/data/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    exploration.title = 'New Title';
    exploration.version = '2';

    editableExplorationBackendApiService.updateExplorationAsync(
      exploration.exploration_id, exploration.version,
      exploration.title, []
    ).then(successHandler, failHandler);

    req = httpTestingController.expectOne('/createhandler/data/0');
    expect(req.request.method).toEqual('PUT');
    // Send a request to update exploration.
    req.flush(exploration);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(exploration);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should not cache exploration from backend into ' +
    'read only service', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = null;

    readOnlyExplorationBackendApiService.loadLatestExplorationAsync('0').then(
      (data) => {
        exploration = data;
      });

    let req = httpTestingController.expectOne('/explorehandler/init/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(readOnlyExplorationBackendApiService.isCached('0')).toBe(true);

    exploration.title = 'New Title';
    exploration.version = '2';

    editableExplorationBackendApiService.updateExplorationAsync(
      exploration.exploration_id,
      exploration.version,
      exploration.title, []
    ).then(successHandler, failHandler);

    req = httpTestingController.expectOne('/createhandler/data/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(exploration);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(exploration);
    expect(failHandler).not.toHaveBeenCalled();
    expect(readOnlyExplorationBackendApiService.isCached('0')).toBe(false);
  }));

  it('should delete exploration from the backend', fakeAsync(()=> {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = null;

    editableExplorationBackendApiService.fetchExplorationAsync('0')
      .then(data => {
        exploration = data;
      });

    let req = httpTestingController.expectOne(
      '/createhandler/data/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    exploration.title = 'New Title';
    exploration.version = '2';

    // Send a request to update exploration.
    editableExplorationBackendApiService.updateExplorationAsync(
      exploration.exploration_id,
      exploration.version,
      'Minor edits', []
    ).then(successHandler, failHandler);

    req = httpTestingController.expectOne(
      '/createhandler/data/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(exploration);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(exploration);
    expect(failHandler).not.toHaveBeenCalled();

    editableExplorationBackendApiService
      .deleteExplorationAsync(exploration.exploration_id)
      .then(successHandler, failHandler);

    req = httpTestingController.expectOne(
      '/createhandler/data/0');
    expect(req.request.method).toEqual('DELETE');
    req.flush({});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith({});
    expect(failHandler).not.toHaveBeenCalled();
    expect(readOnlyExplorationBackendApiService.isCached('0')).toBe(false);
  }));

  it('should update most recently reached checkpoint state name and most' +
    ' recently reached checkpoint exploration version for logged-in learner',
  fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let explorationId = '0';
    let mostRecentlyReachedCheckpointExpVersion = 1;
    let mostRecentlyReachedCheckpointStateName = 'State A';

    let payload = {
      most_recently_reached_checkpoint_exp_version:
        mostRecentlyReachedCheckpointExpVersion,
      most_recently_reached_checkpoint_state_name:
        mostRecentlyReachedCheckpointStateName
    };

    editableExplorationBackendApiService.
      recordMostRecentlyReachedCheckpointAsync(
        explorationId,
        mostRecentlyReachedCheckpointExpVersion,
        mostRecentlyReachedCheckpointStateName,
        true
      ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/explorehandler/checkpoint_reached/' + explorationId);
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should update most recently reached checkpoint state name and most' +
  ' recently reached checkpoint exploration version for logged-out learner',
  fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let explorationId = '0';
    let mostRecentlyReachedCheckpointExpVersion = 1;
    let mostRecentlyReachedCheckpointStateName = 'State A';

    editableExplorationBackendApiService.
      recordMostRecentlyReachedCheckpointAsync(
        explorationId,
        mostRecentlyReachedCheckpointExpVersion,
        mostRecentlyReachedCheckpointStateName,
        false,
        '123456'
      ).then(successHandler, failHandler);

    let loggedOutPayload = {
      unique_progress_url_id: '123456',
      most_recently_reached_checkpoint_exp_version:
       mostRecentlyReachedCheckpointExpVersion,
      most_recently_reached_checkpoint_state_name:
       mostRecentlyReachedCheckpointStateName
    };

    let req = httpTestingController.expectOne(
      '/explorehandler/checkpoint_reached_by_logged_out_user/' + explorationId);
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(loggedOutPayload);

    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should record checkpoint progress and return unique progress' +
    ' id of logged out learner', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let explorationId = '0';
    let mostRecentlyReachedCheckpointExpVersion = 1;
    let mostRecentlyReachedCheckpointStateName = 'State A';

    let payload = {
      most_recently_reached_checkpoint_exp_version:
        mostRecentlyReachedCheckpointExpVersion,
      most_recently_reached_checkpoint_state_name:
        mostRecentlyReachedCheckpointStateName
    };

    editableExplorationBackendApiService.
      recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner(
        explorationId,
        mostRecentlyReachedCheckpointExpVersion,
        mostRecentlyReachedCheckpointStateName
      ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/explorehandler/checkpoint_reached_by_logged_out_user/' + explorationId);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should convert logged out progress to logged in progress ' +
    'successfully', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let explorationId = '0';
    let payload = {
      unique_progress_url_id: 'abcdef'
    };

    editableExplorationBackendApiService
      .changeLoggedOutProgressToLoggedInProgressAsync(explorationId, 'abcdef')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/sync_logged_out_and_logged_in_progress/' + explorationId);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should reset the exploration progress successfully',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      let explorationId = '0';

      let payload = {
        most_recently_reached_checkpoint_state_name: null
      };

      editableExplorationBackendApiService.resetExplorationProgressAsync(
        explorationId,
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/explorehandler/restart/' + explorationId);
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(payload);

      req.flush(
        { status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should mark lesson info viewed once by the learner',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      let payload = {
        user_has_viewed_lesson_info_modal_once: true
      };

      editableExplorationBackendApiService
        .recordLearnerHasViewedLessonInfoModalOnce()
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/userinfohandler/data');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(payload);

      req.flush(
        { status: 200 });
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use the rejection handler if the backend ' +
    'request failed', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    let exploration = null;

    editableExplorationBackendApiService.fetchExplorationAsync('0')
      .then(data => {
        exploration = data;
      });

    let req = httpTestingController.expectOne(
      '/createhandler/data/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    editableExplorationBackendApiService
      .deleteExplorationAsync(exploration.exploration_id)
      .then(successHandler, failHandler);

    req = httpTestingController.expectOne(
      '/createhandler/data/0');
    expect(req.request.method).toEqual('DELETE');
    req.flush(
      {error: 'Error deleting exploration 1.'},
      {status: 500, statusText: 'Internal Server Error'});

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));
});
