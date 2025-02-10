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

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {ContributorDashboardAdminBackendApiService} from './contributor-dashboard-admin-backend-api.service';
import {CsrfTokenService} from 'services/csrf-token.service';

describe('Contributor dashboard admin backend api service', () => {
  let cdabas: ContributorDashboardAdminBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    cdabas = TestBed.get(ContributorDashboardAdminBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
    csrfService = TestBed.get(CsrfTokenService);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');

    spyOn(csrfService, 'getTokenAsync').and.callFake(async () => {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it(
    'should add contribution rights to the user given the' +
      'name when calling addContributionReviewerAsync',
    fakeAsync(() => {
      let category = 'translation';
      let languageCode = 'en';
      let username = 'validUser';
      let payload = {
        username: username,
        language_code: languageCode,
      };
      cdabas
        .addContributionReviewerAsync(category, username, languageCode)
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/contributionrightshandler/translation'
      );
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(payload);

      req.flush({status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should fail to add contribution rights to the user when user does' +
      'not exist when calling addContributionReviewerAsync',
    fakeAsync(() => {
      let category = 'translation';
      let languageCode = 'en';
      let username = 'InvalidUser';
      let payload = {
        username: username,
        language_code: languageCode,
      };
      cdabas
        .addContributionReviewerAsync(category, username, languageCode)
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/contributionrightshandler/translation'
      );
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(
        {error: 'User with given username does not exist'},
        {status: 500, statusText: 'Internal Server Error'}
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'User with given username does not exist'
      );
    })
  );

  it(
    'should get the data of contribution rights given the role' +
      'when calling viewContributionReviewersAsync',
    fakeAsync(() => {
      let category = 'translation';
      let languageCode = 'en';
      let result = ['validUsername'];
      cdabas
        .viewContributionReviewersAsync(category, languageCode)
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/getcontributorusershandler/translation?language_code=en'
      );
      expect(req.request.method).toEqual('GET');

      req.flush(['validUsername'], {status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(result);
      expect(failHandler).not.toHaveBeenCalled();

      category = 'question';

      cdabas
        .viewContributionReviewersAsync(category, null)
        .then(successHandler, failHandler);

      req = httpTestingController.expectOne(
        '/getcontributorusershandler/question'
      );
      expect(req.request.method).toEqual('GET');

      req.flush(['validUsername'], {status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(result);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should fail to get the data of contribution rights when category does' +
      'not exist when calling viewContributionReviewersAsync',
    fakeAsync(() => {
      let category = 'InvalidCategory';
      let languageCode = 'en';
      cdabas
        .viewContributionReviewersAsync(category, languageCode)
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/getcontributorusershandler/InvalidCategory?language_code=en'
      );
      expect(req.request.method).toEqual('GET');

      req.flush(
        {
          error: 'Invalid Category',
        },
        {
          status: 500,
          statusText: 'Internal Server Error',
        }
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Invalid Category');
    })
  );

  it(
    'should get the data of contribution rights given the' +
      'username when calling contributionReviewerRightsAsync',
    fakeAsync(() => {
      let username = 'validUsername';
      let result = {
        can_review_questions: false,
        can_submit_questions: false,
      };
      cdabas
        .contributionReviewerRightsAsync(username)
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/contributionrightsdatahandler' + '?username=validUsername'
      );
      expect(req.request.method).toEqual('GET');

      req.flush(
        {
          can_review_questions: false,
          can_submit_questions: false,
        },
        {
          status: 200,
          statusText: 'Success.',
        }
      );
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(result);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should fail to get the data of contribution rights when username does' +
      'not exist when calling contributionReviewerRightsAsync',
    fakeAsync(() => {
      let username = 'InvalidUsername';
      cdabas
        .contributionReviewerRightsAsync(username)
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/contributionrightsdatahandler' + '?username=InvalidUsername'
      );
      expect(req.request.method).toEqual('GET');

      req.flush(
        {
          error: 'User with given username does not exist.',
        },
        {
          status: 500,
          statusText: 'Internal Server Error',
        }
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'User with given username does not exist.'
      );
    })
  );

  it(
    'should remove user contribution rights given the username' +
      'when calling removeContributionReviewerAsync',
    fakeAsync(() => {
      let category = 'translation';
      let languageCode = 'en';
      let username = 'validUser';
      let payload = {
        username: username,
        language_code: languageCode,
      };
      cdabas
        .removeContributionReviewerAsync(category, username, languageCode)
        .then(successHandler, failHandler);

      const query = new URLSearchParams(payload);
      const url =
        '/contributionrightshandler/' + category + '?' + query.toString();
      const req = httpTestingController.expectOne(url);
      expect(req.request.method).toEqual('DELETE');
      req.flush({status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should fail to remove user contribution rights when user does' +
      'not exist when calling removeContributionReviewerAsync',
    fakeAsync(() => {
      let category = 'translation';
      let languageCode = 'en';
      let username = 'InvalidUser';
      let payload = {
        username: username,
        language_code: languageCode,
      };
      cdabas
        .removeContributionReviewerAsync(category, username, languageCode)
        .then(successHandler, failHandler);

      const query = new URLSearchParams(payload);
      const url =
        '/contributionrightshandler/' + category + '?' + query.toString();
      const req = httpTestingController.expectOne(url);
      expect(req.request.method).toEqual('DELETE');

      req.flush(
        {
          error: 'User with given username does not exist.',
        },
        {
          status: 500,
          statusText: 'Internal Server Error',
        }
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'User with given username does not exist.'
      );
    })
  );

  it(
    'should remove specific contribution rights given the' +
      'username when calling removeContributionReviewerAsync',
    fakeAsync(() => {
      let category = 'submit_question';
      let username = 'validUser';
      let payload = {
        username: username,
      };
      cdabas
        .removeContributionReviewerAsync(category, username, null)
        .then(successHandler, failHandler);

      const query = new URLSearchParams(payload);
      const url =
        '/contributionrightshandler/' + category + '?' + query.toString();
      const req = httpTestingController.expectOne(url);
      expect(req.request.method).toEqual('DELETE');
      req.flush({status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should return translation contribution stats given the username when ' +
      'calling viewTranslationContributionStatsAsync',
    fakeAsync(() => {
      const username = 'validUsername';
      const result = {
        translation_contribution_stats: [
          {
            language: 'English',
            topic_name: 'Topic Name',
            submitted_translations_count: 2,
            submitted_translation_word_count: 50,
            accepted_translations_count: 1,
            accepted_translations_without_reviewer_edits_count: 1,
            accepted_translation_word_count: 50,
            rejected_translations_count: 1,
            rejected_translation_word_count: 150,
            contribution_months: ['May 2021', 'Jun 2021'],
          },
        ],
      };
      cdabas
        .viewTranslationContributionStatsAsync(username)
        .then(successHandler, failHandler);

      const req = httpTestingController.expectOne(
        '/translationcontributionstatshandler' + '?username=' + username
      );
      expect(req.request.method).toEqual('GET');
      req.flush(result, {
        status: 200,
        statusText: 'Success.',
      });
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(result);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should fail to get translation contribution stats for invalid username' +
      ' when calling viewTranslationContributionStatsAsync',
    fakeAsync(() => {
      const username = 'InvalidUsername';
      cdabas
        .viewTranslationContributionStatsAsync(username)
        .then(successHandler, failHandler);

      const req = httpTestingController.expectOne(
        '/translationcontributionstatshandler' + '?username=' + username
      );
      expect(req.request.method).toEqual('GET');
      const errorMessage = 'Invalid username: ' + username;
      req.flush(
        {
          error: errorMessage,
        },
        {
          status: 500,
          statusText: 'Internal Server Error',
        }
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(errorMessage);
    })
  );

  it(
    'should add question reviewer rights given the username ' +
      'when calling updateQuestionRightsAsync',
    fakeAsync(() => {
      let username = 'validUser';
      cdabas
        .updateQuestionRightsAsync(username, true, true, true, false)
        .then(successHandler, failHandler);

      const url = '/contributionrightshandler/' + 'question';
      const req = httpTestingController.expectOne(url);
      expect(req.request.method).toEqual('POST');
      req.flush({status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should remove question reviewer rights given the username ' +
      'when calling updateQuestionRightsAsync',
    fakeAsync(() => {
      let username = 'validUser';
      let payload = {
        username: username,
      };
      cdabas
        .updateQuestionRightsAsync(username, true, false, true, true)
        .then(successHandler, failHandler);
      const query = new URLSearchParams(payload);
      const url =
        '/contributionrightshandler/' + 'question' + '?' + query.toString();
      const req = httpTestingController.expectOne(url);
      expect(req.request.method).toEqual('DELETE');
      req.flush({status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should add question submitter rights given the username ' +
      'when calling updateQuestionRightsAsync',
    fakeAsync(() => {
      let username = 'validUser';
      cdabas
        .updateQuestionRightsAsync(username, true, true, false, true)
        .then(successHandler, failHandler);

      const url = '/contributionrightshandler/' + 'submit_question';
      const req = httpTestingController.expectOne(url);
      expect(req.request.method).toEqual('POST');
      req.flush({status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should remove question submitter rights given the username ' +
      'when calling updateQuestionRightsAsync',
    fakeAsync(() => {
      let username = 'validUser';
      let payload = {
        username: username,
      };
      cdabas
        .updateQuestionRightsAsync(username, false, true, true, true)
        .then(successHandler, failHandler);
      const query = new URLSearchParams(payload);
      const url =
        '/contributionrightshandler/' +
        'submit_question' +
        '?' +
        query.toString();
      const req = httpTestingController.expectOne(url);
      expect(req.request.method).toEqual('DELETE');
      req.flush({status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should add question submitter and reviewer rights given the username ' +
      'when calling updateQuestionRightsAsync',
    fakeAsync(() => {
      let username = 'validUser';
      cdabas
        .updateQuestionRightsAsync(username, true, true, false, false)
        .then(successHandler, failHandler);

      const url = '/contributionrightshandler/' + 'submit_question';
      const req = httpTestingController.expectOne(url);
      expect(req.request.method).toEqual('POST');
      req.flush({status: 200, statusText: 'Success.'});
      flushMicrotasks();
      const urlTwo = '/contributionrightshandler/' + 'question';
      const reqTwo = httpTestingController.expectOne(urlTwo);
      expect(reqTwo.request.method).toEqual('POST');
      reqTwo.flush({status: 200, statusText: 'Success.'});
      flushMicrotasks();
      httpTestingController.verify();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
