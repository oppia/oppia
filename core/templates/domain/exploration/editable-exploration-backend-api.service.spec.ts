// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { EditableExplorationBackendApiService } from
  'domain/exploration/editable-exploration-backend-api.service';
import { ReadOnlyExplorationBackendApiService } from
  'domain/exploration/read-only-exploration-backend-api.service';

describe('Editable exploration backend API service', function() {
  let editableExplorationBackendApiService = null;
  let readOnlyExplorationBackendApiService = null;
  let httpTestingController = null;
  let sampleDataResults = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    editableExplorationBackendApiService = TestBed.get(
      EditableExplorationBackendApiService);
    readOnlyExplorationBackendApiService = TestBed.get(
      ReadOnlyExplorationBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);

    // Sample exploration object returnable from the backend
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

  afterEach(function() {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing exploration from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      editableExplorationBackendApiService.fetchExploration('0').then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne('/createhandler/data/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should fetch and apply the draft of an exploration',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      // Loading a exploration the first time should fetch it from the backend.
      editableExplorationBackendApiService.fetchApplyDraftExploration(
        '0').then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/createhandler/data/0?apply_draft=true');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use the rejection handler if the backend request failed',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a exploration the first time should fetch it from the backend.
      editableExplorationBackendApiService.fetchExploration('1').then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne('/createhandler/data/1');
      expect(req.request.method).toEqual('GET');
      req.flush('Error loading exploration 1.', {
        status: 500, statusText: 'Invalid request'
      });
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading exploration 1.');
    })
  );

  it('should update a exploration after fetching it from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var exploration = null;

      // Loading a exploration the first time should fetch it from the backend.
      editableExplorationBackendApiService.fetchExploration('0').then(
        function(data) {
          exploration = data;
        });
      let req = httpTestingController.expectOne('/createhandler/data/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);
      flushMicrotasks();

      exploration.title = 'New Title';
      exploration.version = '2';

      // Send a request to update exploration
      editableExplorationBackendApiService.updateExploration(
        exploration.exploration_id, exploration.version,
        exploration.title, []
      ).then(successHandler, failHandler);
      req = httpTestingController.expectOne('/createhandler/data/0');
      expect(req.request.method).toEqual('PUT');
      req.flush(exploration);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(exploration);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should not cache exploration from backend into read only service',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var exploration = null;

      readOnlyExplorationBackendApiService.loadLatestExploration('0', null)
        .then(function(data) {
          exploration = data;
        });
      var req = httpTestingController.expectOne(
        '/explorehandler/init/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(readOnlyExplorationBackendApiService.isCached('0')).toBe(true);

      exploration.title = 'New Title';
      exploration.version = '2';

      // Send a request to update exploration
      editableExplorationBackendApiService.updateExploration(
        exploration.exploration_id, exploration.version,
        exploration.title, []
      ).then(successHandler, failHandler);
      req = httpTestingController.expectOne('/createhandler/data/0');
      expect(req.request.method).toEqual('PUT');
      req.flush(exploration);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(exploration);
      expect(failHandler).not.toHaveBeenCalled();

      expect(readOnlyExplorationBackendApiService.isCached('0')).toBe(false);
    })
  );

  it('should delete exploration from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var exploration = null;

      editableExplorationBackendApiService.fetchExploration('0')
        .then(function(data) {
          exploration = data;
        });
      let req = httpTestingController.expectOne('/createhandler/data/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);
      flushMicrotasks();

      exploration.title = 'New Title';
      exploration.version = '2';

      editableExplorationBackendApiService.updateExploration(
        exploration.exploration_id,
        exploration.version,
        'Minor edits', []
      ).then(successHandler, failHandler);
      req = httpTestingController.expectOne('/createhandler/data/0');
      expect(req.request.method).toEqual('PUT');
      req.flush(exploration);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(exploration);
      expect(failHandler).not.toHaveBeenCalled();

      editableExplorationBackendApiService
        .deleteExploration(exploration.exploration_id)
        .then(successHandler, failHandler);
      req = httpTestingController.expectOne('/createhandler/data/0');
      req.flush({});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith({});
      expect(failHandler).not.toHaveBeenCalled();

      expect(readOnlyExplorationBackendApiService.isCached('0')).toBe(false);
    })
  );
});
