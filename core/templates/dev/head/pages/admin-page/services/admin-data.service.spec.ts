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
 * @fileoverview Tests for AdminDataService.
 */

import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';

import { AdminDataService } from 'pages/admin-page/services/admin-data.service';

describe('Admin Data Service', function() {
  let adminDataService: AdminDataService = null;
  let httpTestingController: HttpTestingController;
  let sampleAdminData = {
    property: 'value'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminDataService]
    });

    adminDataService = TestBed.get(AdminDataService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should return the correct admin data', fakeAsync( () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    adminDataService.getDataAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleAdminData);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should cache the response and not make a second request',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      adminDataService.getDataAsync().then(successHandler,
        (error: HttpErrorResponse) => {
          failHandler(error.error);
        });

      let req = httpTestingController.expectOne('/adminhandler');
      expect(req.request.method).toEqual('GET');
      req.flush('Error loading admin handler', {
        status: 500, statusText: 'Invalid Request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Error loading admin handler');
    }));
});
