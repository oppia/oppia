// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for ExplorationFeaturesBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { IEarlyQuitCustomizationArgs, PlaythroughObjectFactory } from
  'domain/statistics/PlaythroughObjectFactory';
import { PlaythroughBackendApiService } from
  'services/playthrough-backend-api.service';

describe('Playthrough backend api service', function() {
  let httpTestingController: HttpTestingController;
  let learnerActionObjectFactory: LearnerActionObjectFactory;
  let playthroughBackendApiService: PlaythroughBackendApiService;
  let playthroughObjectFactory: PlaythroughObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    httpTestingController = TestBed.get(HttpTestingController);
    learnerActionObjectFactory = TestBed.get(LearnerActionObjectFactory);
    playthroughBackendApiService = TestBed.get(PlaythroughBackendApiService);
    playthroughObjectFactory = TestBed.get(PlaythroughObjectFactory);
  });

  it('commits playthrough data to storage', fakeAsync(() => {
    const onSuccess = jasmine.createSpy('success');
    const onFailure = jasmine.createSpy('failure');
    const playthrough = playthroughObjectFactory.createNew(
      'pid', 'eid', 1, 'EarlyQuit',
      <IEarlyQuitCustomizationArgs>{state_name: {value: 'text'}}, [
        learnerActionObjectFactory.createExplorationStartAction({
          state_name: {value: 'Hola'}
        })
      ]);

    playthroughBackendApiService.storePlaythrough(playthrough)
      .then(onSuccess, onFailure);

    const req = (
      httpTestingController.expectOne('/explorehandler/store_playthrough/eid'));
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      playthrough_data: playthrough.toBackendDict(),
      issue_schema_version: 1,
      playthrough_id: 'pid',
    });
    req.flush({playthrough_stored: true, playthrough_id: 'abc'});
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  }));
});
