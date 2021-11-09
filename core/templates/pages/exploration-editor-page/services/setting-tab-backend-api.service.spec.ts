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
 * @fileoverview Unit tests for Backend api service for Setting tab.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed, waitForAsync} from '@angular/core/testing';
import { SettingTabBackendApiService } from './setting-tab-backend-api.service';

describe('History Tab Backend Api Service', () => {
  let service: SettingTabBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler = jasmine.createSpy('success');
  let failHandler = jasmine.createSpy('fail');

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SettingTabBackendApiService]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(SettingTabBackendApiService);
  }));

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should get setting tab data when getData is called',
    fakeAsync(() => {
      let moderatorEmailDraftUrl = 'check';
      service.getData(
        moderatorEmailDraftUrl
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne('check');
      expect(req.request.method).toEqual('GET');
      req.flush([]);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
