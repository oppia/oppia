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
 * @fileoverview Unit tests for
 * * SuggestionModalForCreatorDashboardBackendApiService.
 */
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { SuggestionModalForCreatorDashboardBackendApiService } from
  './suggestion-modal-for-creator-dashboard-backend-api.service';
import { SuggestionObjectFactory } from
  'domain/suggestion/SuggestionObjectFactory';

describe('SuggestionModalForCreatorDashboardBackendApiService', () => {
  let sugBackendApiService: SuggestionModalForCreatorDashboardBackendApiService;
  let httpTestingController: HttpTestingController;
  let suggestionObjectFactory: SuggestionObjectFactory;
  let suggestionBackendDict = {
    suggestion_id: '1',
    suggestion_type: 'edit_exploration_state_content',
    target_type: 'exploration',
    target_id: '2',
    target_version_at_submission: 1,
    status: 'accepted',
    author_name: 'author',
    change: {
      cmd: 'edit_state_property',
      property_name: 'content',
      state_name: 'state_1',
      new_value: {
        html: 'new suggestion content'
      },
      old_value: {
        html: 'old suggestion content'
      }
    },
    last_updated_msecs: 1000
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SuggestionModalForCreatorDashboardBackendApiService]
    });

    httpTestingController = TestBed.get(HttpTestingController);
    suggestionObjectFactory = TestBed.get(SuggestionObjectFactory);
    sugBackendApiService = TestBed
      .get(SuggestionModalForCreatorDashboardBackendApiService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should make a request to update the suggestion in the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let suggestion = suggestionObjectFactory.createFromBackendDict(
      suggestionBackendDict);
    let backendResponse = {
      suggestion: suggestionBackendDict
    };

    let urlDetails = {
      targetType: 'exploration',
      targetId: 0,
      suggestionId: 0
    };

    let updateData = {
      action: 'accept',
      commitMessage: 'commit message',
      reviewMessage: 'review message'
    };

    sugBackendApiService.updateSuggestion(
      urlDetails, updateData).then(successHandler, failHandler);
    
    let req = httpTestingController
      .expectOne('/suggestionactionhandler/exploration/0/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(backendResponse);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(suggestion);
    expect(failHandler).not.toHaveBeenCalled();
  })
  );

  it('should use rejection handler if suggestion update in the backend failed', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let urlDetails = {
      targetType: 'exploration',
      targetId: 0,
      suggestionId: 0
    };

    let updateData = {
      action: 'accept',
      commitMessage: 'commit message',
      reviewMessage: 'review message'
    };

    sugBackendApiService.updateSuggestion(
      urlDetails, updateData).then(successHandler, failHandler);

    let req = httpTestingController
      .expectOne('/suggestionactionhandler/exploration/0/0');
    expect(req.request.method).toEqual('PUT');

    req.flush({
      error: 'Error updating suggestion.'
    }, {
      status: 500, statusText: 'Error updating suggestion.'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error updating suggestion.');
  })
  );
});
