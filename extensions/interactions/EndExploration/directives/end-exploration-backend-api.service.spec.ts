// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for EndExplorationBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {fakeAsync, flushMicrotasks, TestBed} from '@angular/core/testing';
import {EndExplorationBackendApiService} from './end-exploration-backend-api.service';

describe('End Exploration Backend Api Service', () => {
  let service: EndExplorationBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler = jasmine.createSpy('success');
  let failHandler = jasmine.createSpy('fail');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EndExplorationBackendApiService],
    });
    httpTestingController = TestBed.get(HttpTestingController);
    service = TestBed.get(EndExplorationBackendApiService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should get data when getRecommendExplorationsData function called', fakeAsync(() => {
    const explorationIds = ['0'];
    const requestUrl =
      '/explorationsummarieshandler/data?' +
      'stringified_exp_ids=' +
      encodeURI(JSON.stringify(explorationIds));

    service
      .getRecommendExplorationsData(explorationIds)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush([]);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
