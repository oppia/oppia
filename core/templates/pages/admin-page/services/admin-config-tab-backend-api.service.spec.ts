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
 * @fileoverview Unit tests for AdminConfigTabBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { CsrfTokenService } from 'services/csrf-token.service';
import { AdminConfigTabBackendApiService } from
  'pages/admin-page/services/admin-config-tab-backend-api.service';

describe('Admin Config Tab Backend API service', () => {
  let adminConfigTabBackendApiService: AdminConfigTabBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminConfigTabBackendApiService]
    });
    httpTestingController = TestBed.get(HttpTestingController);
    adminConfigTabBackendApiService = TestBed.get(
      AdminConfigTabBackendApiService
    );
    csrfService = TestBed.get(CsrfTokenService);

    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should revert specified config property to default value',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');
      adminConfigTabBackendApiService.revertConfigProperty(
        'promo_bar_enabled').then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/adminhandler');
      expect(req.request.method).toEqual('POST');
      req.flush(200);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));
  it('should save new config properties',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');
      adminConfigTabBackendApiService.saveConfigProperties({
        promo_bar_enabled: true
      }).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/adminhandler');
      expect(req.request.method).toEqual('POST');
      req.flush(200);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));
});
