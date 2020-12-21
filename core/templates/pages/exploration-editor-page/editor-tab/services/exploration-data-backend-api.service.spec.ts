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
 * @fileoverview Unit tests for the Exploration data backend api service.
 */

import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import {ResolveAnswerResponse, ExplorationAutosaveChangeListRequest} from 'pages/exploration-editor-page/services/exploration-data.service';
import { ExplorationDataBackendApiService } from 'pages/exploration-editor-page/services/exploration-data-backend-api.service';
import { CsrfTokenService } from 'services/csrf-token.service';

describe('Exploration data Backend Api Service', function() {
  let explorationDataBackendApiService:ExplorationDataBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfTokenService: CsrfTokenService;
  let sampleDataResults = {
    draft_change_list_id: 3,
    version: 1,
    exploration: {
      init_state_name: 'Introduction',
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
      }
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    explorationDataBackendApiService =
      TestBed.get(ExplorationDataBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
    csrfTokenService = TestBed.get(CsrfTokenService);

    spyOn(csrfTokenService, 'getTokenAsync').and.callFake(() => {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should discard draft', fakeAsync(() => {
    let discardUrl = '/createhandler/autosave_draft/0';
    explorationDataBackendApiService.setDiscardDraft(
      discardUrl).then(response => {
      expect(response).toEqual(200);
    });

    let req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toEqual('POST');
    req.flush(200);
    flushMicrotasks();
  }));

  it('should use reject handler when discard draft fails', fakeAsync(() => {
    let discardDraftUrl = '/createhandler/autosave_draft/0';
    explorationDataBackendApiService.setDiscardDraft(
      discardDraftUrl).then(
      response => {},
      errorResponse => {
        expect(errorResponse.status).toEqual(500);
        expect(errorResponse.statusText).toEqual('Internal Server Error');
      });

    let req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toEqual('POST');
    req.flush({
      error: ''},
    {status: 500, statusText: 'Internal Server Error'});
    flushMicrotasks();
  }));

  it('should resolve answers', fakeAsync(() => {
    let stateName = 'First State';
    let resolveAnswerUrl =
      '/createhandler/resolved_answers/0/' + encodeURIComponent(stateName);
    let resolveAnswerDict: ResolveAnswerResponse;

    explorationDataBackendApiService.setResolveAnswer(
      resolveAnswerUrl, resolveAnswerDict).then(response => {
      expect(response).toEqual(200);
    });

    let req = httpTestingController.expectOne(
      '/createhandler/resolved_answers/0/' + encodeURIComponent(stateName));
    expect(req.request.method).toEqual('PUT');
    req.flush(200);
    flushMicrotasks();
  }));

  it('should use reject handler when resolve answers fails', fakeAsync(() => {
    let stateName = 'First State';
    let resolveAnswerUrl =
      '/createhandler/resolved_answers/0/' + encodeURIComponent(stateName);
    let resolveAnswerDict: ResolveAnswerResponse;


    explorationDataBackendApiService.setResolveAnswer(
      resolveAnswerUrl, resolveAnswerDict).then(
      response => {},
      errorResponse => {
        expect(errorResponse.status).toEqual(500);
        expect(errorResponse.statusText).toEqual('Internal Server Error');
      });
    let req = httpTestingController.expectOne(
      '/createhandler/resolved_answers/0/' + encodeURIComponent(stateName));
    expect(req.request.method).toEqual('PUT');
    req.flush({
      error: ''},
    {status: 500, statusText: 'Internal Server Error'});
    flushMicrotasks();
  }));

  it('should autosave draft changes', fakeAsync(() => {
    let autosaveChangeUrl = '/createhandler/autosave_draft/0';
    let autosaveChangeListRequest: ExplorationAutosaveChangeListRequest =
    {
      change_list: [],
      version: 0
    };
    explorationDataBackendApiService.setAutoSaveChangeList(
      autosaveChangeUrl, autosaveChangeListRequest).then(response => {
      expect(
        response.draft_change_list_id).toEqual(
        sampleDataResults.draft_change_list_id);
    });

    let req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(sampleDataResults);
    flushMicrotasks();
  }));

  it('should use rejection handler when autosave draft fails', fakeAsync(() => {
    let autosaveChangeUrl = '/createhandler/autosave_draft/0';
    let autosaveChangeListRequest: ExplorationAutosaveChangeListRequest =
    {
      change_list: [],
      version: 0
    };

    explorationDataBackendApiService.setAutoSaveChangeList(
      autosaveChangeUrl, autosaveChangeListRequest
    ).then(response => {}, errorResponse => {
      expect(
        errorResponse.error.error).toEqual('setAutoSaveChangeList error');
      expect(errorResponse.status).toEqual(500);
    });

    let req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toEqual('PUT');
    req.flush({
      error: 'setAutoSaveChangeList error'},
    {status: 500, statusText: 'Internal Server Error'});
    flushMicrotasks();
  }));
});
