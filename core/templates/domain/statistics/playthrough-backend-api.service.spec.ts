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
 * @fileoverview Unit tests for PlaythroughBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {PlaythroughBackendApiService} from 'domain/statistics/playthrough-backend-api.service';
import {PlaythroughIssueType} from 'domain/statistics/playthrough-issue.model';
import {
  Playthrough,
  PlaythroughBackendDict,
} from 'domain/statistics/playthrough.model';
import {LearnerActionType} from 'domain/statistics/learner-action.model';

describe('Playthrough backend api service', () => {
  let pbas: PlaythroughBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    pbas = TestBed.get(PlaythroughBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should correctly store playthroughs', fakeAsync(() => {
    let backendResposne = {
      playthrough_stored: true,
    };

    let playthroughDict: PlaythroughBackendDict = {
      exp_id: 'expId1',
      exp_version: 1,
      issue_type: PlaythroughIssueType.MultipleIncorrectSubmissions,
      issue_customization_args: {
        state_name: {
          value: 'stateName',
        },
        num_times_answered_incorrectly: {
          value: 14,
        },
      },
      actions: [
        {
          action_type: LearnerActionType.AnswerSubmit,
          action_customization_args: {
            state_name: {
              value: '',
            },
            dest_state_name: {
              value: '',
            },
            interaction_id: {
              value: '',
            },
            submitted_answer: {
              value: '',
            },
            feedback: {
              value: '',
            },
            time_spent_state_in_msecs: {
              value: 0,
            },
          },
          schema_version: 1,
        },
      ],
    };
    let playthorughObject = Playthrough.createFromBackendDict(playthroughDict);

    let onSuccess = jasmine.createSpy('onSuccess');
    let onFailure = jasmine.createSpy('onFailure');
    pbas.storePlaythroughAsync(playthorughObject, 1).then(onSuccess, onFailure);

    let req = httpTestingController.expectOne(
      '/explorehandler/store_playthrough/expId1'
    );
    expect(req.request.method).toEqual('POST');
    req.flush(backendResposne);

    flushMicrotasks();
  }));
});
