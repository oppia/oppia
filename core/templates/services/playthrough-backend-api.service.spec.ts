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
 * @fileoverview Unit tests for the playthrough backend api service.
 */

import { HttpClientTestingModule, HttpTestingController }
  from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { PlaythroughBackendApiService } from
  'services/playthrough-backend-api.service';
import { Playthrough, PlaythroughObjectFactory } from
  'domain/statistics/PlaythroughObjectFactory';

describe('PlaythroughBackendApiService', function() {
  let playthroughBackendApiService: PlaythroughBackendApiService;
  let playthroughObjectFactory: PlaythroughObjectFactory;
  let httpTestingController: HttpTestingController;

  let playthrough: Playthrough;
  const expId = '123ABC';
  const expVersion = 1;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [HttpClientTestingModule]});
    playthroughBackendApiService = TestBed.get(PlaythroughBackendApiService);
    playthroughObjectFactory = TestBed.get(PlaythroughObjectFactory);
    httpTestingController = TestBed.get(HttpTestingController);

    playthrough = playthroughObjectFactory.createNew(
      null, expId, expVersion, null, {}, []);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should return new playthrough id provided if storage succeeded',
    fakeAsync(() => {
      playthrough.playthroughId = null;

      playthroughBackendApiService.storePlaythrough(playthrough)
        .then(playthroughId => expect(playthroughId).toEqual('XYZ'));

      const req = httpTestingController.expectOne(
        '/explorehandler/store_playthrough/123ABC');
      expect(req.request.method).toEqual('POST');
      req.flush({playthrough_id: 'XYZ', playthrough_stored: true});
      flushMicrotasks();
    }));

  it('should return same playthrough id provided if storage succeeded',
    fakeAsync(() => {
      playthrough.playthroughId = '123';

      playthroughBackendApiService.storePlaythrough(playthrough)
        .then(playthroughId => expect(playthroughId).toEqual('123'));

      const req = httpTestingController.expectOne(
        '/explorehandler/store_playthrough/123ABC');
      expect(req.request.method).toEqual('POST');
      req.flush({playthrough_id: 'XYZ', playthrough_stored: false});
      flushMicrotasks();
    }));
});
