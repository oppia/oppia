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
 * @fileoverview Unit tests for android updates backend API service.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {MailingListBackendApiService} from './mailing-list-backend-api.service';

describe('Android updates backend api service', () => {
  let aubas: MailingListBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    aubas = TestBed.inject(MailingListBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should use the rejection handler if the backend request failed.', fakeAsync(() => {
    aubas
      .subscribeUserToMailingList('email@example.com', 'name', 'Web')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/mailinglistsubscriptionhandler'
    );
    expect(req.request.method).toEqual('PUT');

    req.flush(
      {
        error: 'Some error in the backend.',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
  }));

  it(
    'should subscribe user to android list' +
      'when calling subscribeUserToMailingList',
    fakeAsync(() => {
      let email = 'email@example.com';
      let name = 'username';
      let payload = {
        email: email,
        name: name,
        tag: 'Android',
      };
      aubas
        .subscribeUserToMailingList(email, name, 'Android')
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/mailinglistsubscriptionhandler'
      );
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(payload);

      req.flush({status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
