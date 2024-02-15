// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for PlatformParameterAdminBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { PlatformParameterAdminBackendApiService } from
  'domain/platform-parameter/platform-parameter-admin-backend-api.service';
import { PlatformParameterRule } from
  'domain/platform-parameter/platform-parameter-rule.model';

describe('PlatformParameterAdminBackendApiService', () => {
  let parameterAdminService: PlatformParameterAdminBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    parameterAdminService = TestBed.get(
      PlatformParameterAdminBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should make a request to update the platform param rules',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      const newRules = [
        PlatformParameterRule.createFromBackendDict({
          filters: [],
          value_when_matched: false
        })
      ];

      parameterAdminService.updatePlatformParameter(
        'param_name', 'update message', newRules, false
      ).then(successHandler, failHandler);

      const req = httpTestingController.expectOne('/adminhandler');
      req.flush({});
      expect(req.request.method).toEqual('POST');

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should reject to update platform params if the request fails',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      const newRules = [
        PlatformParameterRule.createFromBackendDict({
          filters: [],
          value_when_matched: false
        })
      ];

      parameterAdminService.updatePlatformParameter(
        'param_name', 'update message', newRules, false
      ).then(successHandler, failHandler);

      const req = httpTestingController.expectOne('/adminhandler');
      req.error(new ErrorEvent('Error'));

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));
});
