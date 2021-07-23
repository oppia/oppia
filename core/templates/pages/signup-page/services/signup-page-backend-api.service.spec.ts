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
 * @fileoverview Unit tests for Signup page backend api service.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { SignupPageBackendApiService } from './signup-page-backend-api.service';

describe('Admin backend api service', () => {
  let spbas: SignupPageBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    spbas = TestBed.inject(SignupPageBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch signup page data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    const resp = {
      can_send_emails: true,
      has_agreed_to_latest_terms: true,
      has_ever_registered: true,
      username: 'test_user'
    };

    spbas.fetchSignupPageDataAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/signuphandler/data');
    expect(req.request.method).toEqual('GET');
    req.flush(resp);

    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith(resp);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should check availability of username', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    const resp = {
      username_is_taken: false
    };

    spbas.checkUsernameAvailableAsync('').then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/usernamehandler/data');
    expect(req.request.method).toEqual('POST');
    req.flush(resp);

    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith(resp);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should update username', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    const resp = {
      bulk_email_signup_message_should_be_shown: true
    };

    let params = {
      agreed_to_terms: true,
      can_receive_email_updates: true,
      default_dashboard: '',
      username: ''
    };

    spbas.updateUsernameAsync(params).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/signuphandler/data');
    expect(req.request.method).toEqual('POST');
    req.flush(resp);

    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith(resp);
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
