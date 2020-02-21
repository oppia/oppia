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

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { AdminDataService } from
  'pages/admin-page/services/admin-data.service';

describe('Admin Data Service', () => {
  let adminDataService: AdminDataService = null;
  let httpTestingController: HttpTestingController;
  var sampleAdminData = {
    property: 'value'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminDataService]
    });
    adminDataService = TestBed.get(
      AdminDataService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should return the correct admin data', fakeAsync(() => {
    adminDataService.getDataAsync().then(function(response) {
      expect(response).toEqual(sampleAdminData);
    });

    var req = httpTestingController.expectOne(
      '/adminhandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleAdminData);

    flushMicrotasks();
  }));

  it('should cache the response and not make a second request',
    fakeAsync(() => {
      adminDataService.getDataAsync();

      var req = httpTestingController.expectOne(
        '/adminhandler');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleAdminData);

      flushMicrotasks();

      adminDataService.getDataAsync().then(function(response) {
        expect(response).toEqual(sampleAdminData);
      });

      httpTestingController.expectNone('/adminhandler');
    })
  );
});
