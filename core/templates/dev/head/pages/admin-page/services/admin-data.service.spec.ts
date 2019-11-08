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

import {fakeAsync, flushMicrotasks, TestBed} from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { AdminDataService } from './admin-data.service';

fdescribe('Admin Data Service', function() {
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

  it('should cache the response and not make a second request', fakeAsync(() => {
    $httpBackend.expect('GET', '/adminhandler').respond(
      200, sampleAdminData);
    AdminDataService.getDataAsync();
    $httpBackend.flush();

    $httpBackend.whenGET('/adminhandler').respond(
      200, {property: 'another value'});

    AdminDataService.getDataAsync().then(function(response) {
      expect(response).toEqual(sampleAdminData);
    });

    expect($httpBackend.flush).toThrow();

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('GET');
    req.flush({property: 'another value'});

    req = httpTestingController.expectOne('/adminhandler');
    req.flush();

    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let req = adminDataService.getDataAsync();
    req.flush();

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));
});
