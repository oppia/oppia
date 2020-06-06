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

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { StorePlaythroughResponse, PlaythroughBackendApiService } from
  'domain/statistics/playthrough-backend-api.service';
import { PlaythroughObjectFactory } from
  'domain/statistics/PlaythroughObjectFactory';

describe('Playthrough backend api service', () => {
  let pbas: PlaythroughBackendApiService;
  let pof: PlaythroughObjectFactory;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    pbas = TestBed.get(PlaythroughBackendApiService);
    pof = TestBed.get(PlaythroughObjectFactory);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should correctly store playthroughs', fakeAsync(() => {
    let backendResposne = {
      playthrough_stored: true,
      playthrough_id: 'pId'
    };

    let expectedObject = new StorePlaythroughResponse(true, 'pId');

    let playthroughDict = {
      playthrough_id: 'playthroughId1',
      exp_id: 'expId1',
      exp_version: 1,
      issue_type: 'EarlyQuit',
      issue_customization_args: {},
      actions: [{
        action_type: 'AnswerSubmit',
        action_customization_args: {},
        schema_version: 1
      }]
    };
    let playthorughObject = pof.createFromBackendDict(playthroughDict);

    pbas.storePlaythrough(playthorughObject, 1, 'pId').then((response) => {
      expect(response).toEqual(expectedObject);
    });

    let req = httpTestingController.expectOne(
      '/explorehandler/store_playthrough/expId1');
    expect(req.request.method).toEqual('POST');
    req.flush(backendResposne);

    flushMicrotasks();
  }));
});
