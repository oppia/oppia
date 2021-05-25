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
 * @fileoverview Unit tests for ContributorDashboardAdminBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ContributorDashboardAdminBackendApiService } from './contributor-dashboard-admin-backend-api.service';
import { CsrfTokenService } from 'services/csrf-token.service';

describe('Contributor dashboard admin backend api service', () => {
  let cdabas: ContributorDashboardAdminBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService = null;
  let successHandler = null;
  let failHandler = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    cdabas = TestBed.get(ContributorDashboardAdminBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
    csrfService = TestBed.get(CsrfTokenService);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');

    spyOn(csrfService, 'getTokenAsync').and.callFake(async() => {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should add contribution rights to the user given the' +
    'name when calling addContributionReviewerAsync', fakeAsync(() => {
    let category = 'voiceover';
    let languageCode = 'en';
    let username = 'validUser';
    let payload = {
      category: category,
      username: username,
      language_code: languageCode
    };
    cdabas.addContributionReviewerAsync(
      category, username, languageCode
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/addcontributionrightshandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to add contribution rights to the user when user does' +
    'not exists when calling addContributionReviewerAsync', fakeAsync(() => {
    let category = 'voiceover';
    let languageCode = 'en';
    let username = 'InvalidUser';
    let payload = {
      category: category,
      username: username,
      language_code: languageCode
    };
    cdabas.addContributionReviewerAsync(
      category, username, languageCode
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/addcontributionrightshandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(
      { error: 'User with given username does not exist'},
      { status: 500, statusText: 'Internal Server Error'});
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'User with given username does not exist');
  }));

  it('should get the data of contribution rights given the role' +
    'when calling viewContributionReviewersAsync', fakeAsync(() => {
    let category = 'voiceover';
    let languageCode = 'en';
    let result = ['validUsername'];
    cdabas.viewContributionReviewersAsync(
      category, languageCode
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/getcontributorusershandler' +
      '?category=voiceover&language_code=en');
    expect(req.request.method).toEqual('GET');

    req.flush(
      ['validUsername'],
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(result);
    expect(failHandler).not.toHaveBeenCalled();

    category = 'question';
    languageCode = null;

    cdabas.viewContributionReviewersAsync(
      category, languageCode
    ).then(successHandler, failHandler);

    req = httpTestingController.expectOne(
      '/getcontributorusershandler' +
      '?category=question');
    expect(req.request.method).toEqual('GET');

    req.flush(
      ['validUsername'],
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(result);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to get the data of contribution rights when category does' +
  'not exists when calling viewContributionReviewersAsync', fakeAsync(() => {
    let category = 'InvalidCategory';
    let languageCode = 'en';
    cdabas.viewContributionReviewersAsync(
      category, languageCode
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/getcontributorusershandler' +
      '?category=InvalidCategory&language_code=en');
    expect(req.request.method).toEqual('GET');

    req.flush({
      error: 'Invalid Category'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Invalid Category');
  }));

  it('should get the data of contribution rights given the' +
    'username when calling contributionReviewerRightsAsync', fakeAsync(() => {
    let username = 'validUsername';
    let result = {
      can_review_questions: false,
      can_review_translation_for_language_codes: ['en'],
      can_review_voiceover_for_language_codes: [],
      can_submit_questions: false
    };
    cdabas.contributionReviewerRightsAsync(username)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/contributionrightsdatahandler' +
      '?username=validUsername');
    expect(req.request.method).toEqual('GET');

    req.flush({
      can_review_questions: false,
      can_review_translation_for_language_codes: ['en'],
      can_review_voiceover_for_language_codes: [],
      can_submit_questions: false
    }, {
      status: 200, statusText: 'Success.'
    });
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(result);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to get the data of contribution rights when username does' +
  'not exists when calling contributionReviewerRightsAsync', fakeAsync(() => {
    let username = 'InvalidUsername';
    cdabas.contributionReviewerRightsAsync(username)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/contributionrightsdatahandler' +
      '?username=InvalidUsername');
    expect(req.request.method).toEqual('GET');

    req.flush({
      error: 'User with given username does not exist.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'User with given username does not exist.');
  }));

  it('should remove all contribution rights given the username' +
    'when calling emoveContributionReviewerAsync', fakeAsync(() => {
    let category = 'voiceover';
    let languageCode = null;
    let username = 'validUser';
    let method = 'all';
    let payload = {
      username: username,
      removal_type: method,
      category: category,
      language_code: languageCode
    };
    cdabas.removeContributionReviewerAsync(
      username, method, category, languageCode
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/removecontributionrightshandler');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to remove all contribution rights when user does' +
    'not exists when calling removeContributionReviewerAsync', fakeAsync(() => {
    let category = 'voiceover';
    let languageCode = null;
    let username = 'InvalidUser';
    let method = 'all';
    let payload = {
      username: username,
      removal_type: method,
      category: category,
      language_code: languageCode
    };
    cdabas.removeContributionReviewerAsync(
      username, method, category, languageCode
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/removecontributionrightshandler');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush({
      error: 'User with given username does not exist.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'User with given username does not exist.');
  }));

  it('should remove specific contribution rights given the' +
    'username when calling removeContributionReviewerAsync', fakeAsync(() => {
    let category = 'voiceover';
    let languageCode = 'en';
    let username = 'validUser';
    let method = 'specific';
    let payload = {
      username: username,
      removal_type: method,
      category: category,
      language_code: languageCode
    };
    cdabas.removeContributionReviewerAsync(
      username, method, category, languageCode
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/removecontributionrightshandler');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to remove specific contribution rights when username does' +
    'not exists when calling removeContributionReviewerAsync', fakeAsync(() => {
    let category = 'voiceover';
    let languageCode = 'en';
    let username = 'InvalidUser';
    let method = 'specific';
    let payload = {
      username: username,
      removal_type: method,
      category: category,
      language_code: languageCode
    };
    cdabas.removeContributionReviewerAsync(
      username, method, category, languageCode
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/removecontributionrightshandler');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush({
      error: 'User with given username does not exist.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'User with given username does not exist.');
  }));
});
