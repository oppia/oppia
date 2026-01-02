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

import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {HttpErrorResponse} from '@angular/common/http';

import {EditableExplorationBackendApiService} from
  'domain/exploration/editable-exploration-backend-api.service';
import {ReadOnlyExplorationBackendApiService} from
  'domain/exploration/read-only-exploration-backend-api.service';
import {CsrfTokenService} from 'services/csrf-token.service';

describe('EditableExplorationBackendApiService', () => {
  let editableExplorationBackendApiService:
    EditableExplorationBackendApiService;
  let readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService;

  let sampleDataResults: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EditableExplorationBackendApiService,
        ReadOnlyExplorationBackendApiService,
        CsrfTokenService,
      ],
    });

    editableExplorationBackendApiService = TestBed.inject(
      EditableExplorationBackendApiService
    );
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService
    );
    csrfService = TestBed.inject(CsrfTokenService);
    httpTestingController = TestBed.inject(HttpTestingController);

    spyOn(csrfService, 'getTokenAsync').and.returnValue(
      Promise.resolve('sample-csrf-token')
    );

    sampleDataResults = {
      exploration_id: '0',
      init_state_name: 'Introduction',
      language_code: 'en',
      states: {
        Introduction: {
          param_changes: [],
          content: {
            html: '',
            audio_translations: {},
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
                audio_translations: {},
              },
            },
            confirmed_unclassified_answers: [],
            id: null,
          },
        },
      },
      username: 'test',
      user_email: 'test@example.com',
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
    expect(req.request.method).toEqual('GET');
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
    const errorResponse = new HttpErrorResponse({
      error: 'Error loading exploration 1.',
      status: 500,
      statusText: 'Internal Server Error',
    });

    req.error(new ErrorEvent('Error'), errorResponse);
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should update exploration after fetch', fakeAsync(() => {
    let exploration: any;

    editableExplorationBackendApiService
      .fetchExplorationAsync('0')
      .then((data: any) => {
        exploration = data;
      });

    const req = httpTestingController.expectOne('/createhandler/data/0');
    req.flush(sampleDataResults);
    flushMicrotasks();

    exploration.title = 'New Title';
    exploration.version = '2';

    editableExplorationBackendApiService
      .updateExplorationAsync(
        exploration.exploration_id,
        exploration.version,
        exploration.title,
        []
      )
      .then(() => {});

    const updateReq = httpTestingController.expectOne('/createhandler/data/0');
    expect(updateReq.request.method).toEqual('PUT');
    updateReq.flush(exploration);
    flushMicrotasks();
  }));

  it('should delete exploration', fakeAsync(() => {
    let exploration: any;

    editableExplorationBackendApiService
      .fetchExplorationAsync('0')
      .then((data: any) => {
        exploration = data;
      });

    const req = httpTestingController.expectOne('/createhandler/data/0');
    req.flush(sampleDataResults);
    flushMicrotasks();

    editableExplorationBackendApiService
      .deleteExplorationAsync(exploration.exploration_id)
      .then(() => {});

    const deleteReq = httpTestingController.expectOne('/createhandler/data/0');
    expect(deleteReq.request.method).toEqual('DELETE');
    deleteReq.flush({});
    flushMicrotasks();
  }));
});
