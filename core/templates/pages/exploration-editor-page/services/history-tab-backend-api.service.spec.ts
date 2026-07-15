// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for HistoryTabBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {fakeAsync, flushMicrotasks, TestBed} from '@angular/core/testing';
import {HistoryTabBackendApiService} from './history-tab-backend-api.service';

describe('History Tab Backend Api Service', () => {
  let service: HistoryTabBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler = jasmine.createSpy('success');
  let failHandler = jasmine.createSpy('fail');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HistoryTabBackendApiService],
    });
    httpTestingController = TestBed.get(HttpTestingController);
    service = TestBed.get(HistoryTabBackendApiService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should get history data when getData called', fakeAsync(() => {
    let stringifiedExpIds = 'check';
    service.getData(stringifiedExpIds).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('check');
    expect(req.request.method).toEqual('GET');
    req.flush([]);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should get check revert valid data when getCheckRevertValidData called', fakeAsync(() => {
    const url = 'url';
    service.getCheckRevertValidData(url).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(url);
    expect(req.request.method).toEqual('GET');
    req.flush([]);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should post history data when postData called', fakeAsync(() => {
    let data = {
      revertExplorationUrl: 'check',
      currentVersion: 5,
      revertToVersion: 3,
    };
    let recivedData = {
      current_version: 5,
      revert_to_version: 3,
    };

    service.postData(data).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('check');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(recivedData);
    req.flush([]);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
