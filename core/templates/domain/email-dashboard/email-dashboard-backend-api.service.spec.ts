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
 * @fileoverview Unit tests for EmailDashboardBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {
  EmailDashboardBackendApiService,
  QueryData,
} from 'domain/email-dashboard/email-dashboard-backend-api.service';
import {EmailDashboardQuery} from 'domain/email-dashboard/email-dashboard-query.model';
import {EmailDashboardQueryResults} from 'domain/email-dashboard/email-dashboard-query-results.model';

describe('Email dashboard backend api service', () => {
  let httpTestingController: HttpTestingController;
  let edbas: EmailDashboardBackendApiService;
  let defaultData: QueryData = {
    inactive_in_last_n_days: 0,
    has_not_logged_in_for_n_days: 0,
    created_at_least_n_exps: 0,
    created_fewer_than_n_exps: 0,
    edited_at_least_n_exps: 0,
    edited_fewer_than_n_exps: 0,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    httpTestingController = TestBed.get(HttpTestingController);
    edbas = TestBed.get(EmailDashboardBackendApiService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should correctly fetch queries page.', fakeAsync(() => {
    let backendResponse = {
      cursor: 'test',
      recent_queries: [
        {
          created_on: '04-06-20 14:34:46',
          status: 'processing',
          submitter_username: 'testUser',
          id: 'buQW4Qhoxpjg',
          num_qualified_users: 0,
        },
      ],
    };

    let expectedObject =
      EmailDashboardQueryResults.createFromBackendDict(backendResponse);

    edbas.fetchQueriesPageAsync(10, 'test').then(queryResults => {
      expect(queryResults).toEqual(expectedObject);
    });

    let req = httpTestingController.expectOne(req =>
      /.*?emaildashboarddatahandler?.*/g.test(req.url)
    );
    expect(req.request.method).toEqual('GET');
    req.flush(backendResponse);

    flushMicrotasks();
  }));

  it('should use the rejection handler if the backend request failed.', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    edbas.fetchQueriesPageAsync(10, 'test').then(successHandler, failHandler);

    let req = httpTestingController.expectOne(req =>
      /.*?emaildashboarddatahandler?.*/g.test(req.url)
    );
    expect(req.request.method).toEqual('GET');
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

  it('should correctly fetch query.', fakeAsync(() => {
    let backendResponse = {
      query: {
        created_on: '04-06-20 14:34:46',
        status: 'processing',
        submitter_username: 'testUser',
        id: 'buQW4Qhoxpjg',
        num_qualified_users: 0,
      },
    };

    let expectedObject =
      EmailDashboardQuery.createFromBackendDict(backendResponse);

    edbas.fetchQueryAsync('q1').then(query => {
      expect(query).toEqual(expectedObject);
    });

    let req = httpTestingController.expectOne(req =>
      /.*?querystatuscheck?.*/g.test(req.url)
    );
    expect(req.request.method).toEqual('GET');
    req.flush(backendResponse);

    flushMicrotasks();
  }));

  it('should use the rejection handler if the backend request for query failed', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    edbas.fetchQueryAsync('q1').then(successHandler, failHandler);

    let req = httpTestingController.expectOne(req =>
      /.*?querystatuscheck?.*/g.test(req.url)
    );
    expect(req.request.method).toEqual('GET');
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

  it('should correctly submit query.', fakeAsync(() => {
    var postData = defaultData;
    postData.inactive_in_last_n_days = 10;

    let backendResponse = {
      query: {
        created_on: '04-06-20 14:34:46',
        status: 'processing',
        submitter_username: 'testUser',
        id: 'buQW4Qhoxpjg',
        num_qualified_users: 0,
      },
    };

    let expectedObject =
      EmailDashboardQuery.createFromBackendDict(backendResponse);

    edbas.submitQueryAsync(postData).then(query => {
      expect(query).toEqual(expectedObject);
    });

    let req = httpTestingController.expectOne(req =>
      /.*?emaildashboarddatahandler?.*/g.test(req.url)
    );
    expect(req.request.method).toEqual('POST');
    req.flush(backendResponse);

    flushMicrotasks();
  }));

  it('should use the rejection handler if the query submission failed.', fakeAsync(() => {
    var postData = defaultData;
    postData.inactive_in_last_n_days = 10;

    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    edbas.submitQueryAsync(postData).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(req =>
      /.*?emaildashboarddatahandler?.*/g.test(req.url)
    );
    expect(req.request.method).toEqual('POST');
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
});
