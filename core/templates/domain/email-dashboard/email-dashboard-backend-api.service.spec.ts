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

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { EmailDashboardBackendApiService } from
  'domain/email-dashboard/email-dashboard-backend-api.service';
import { EmailDashboardQueryObjectFactory } from
  'domain/email-dashboard/email-dashboard-query-object.factory';
import { EmailDashboardQueryResultsObjectFactory } from
  'domain/email-dashboard/email-dashboard-query-results-object.factory';

describe('Email dashboard backend api service', () => {
  let httpTestingController: HttpTestingController;
  let edbas: EmailDashboardBackendApiService;
  let edqof: EmailDashboardQueryObjectFactory;
  let edqrof: EmailDashboardQueryResultsObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    httpTestingController = TestBed.get(HttpTestingController);
    edbas = TestBed.get(EmailDashboardBackendApiService);
    edqof = TestBed.get(EmailDashboardQueryObjectFactory);
    edqrof = TestBed.get(EmailDashboardQueryResultsObjectFactory);
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
          num_qualified_users: 0
        }
      ]
    };

    let expectedObject = edqrof.createFromBackendDict(backendResponse);

    edbas.fetchQueriesPage(10, 'test').then((queryResults) => {
      expect(queryResults).toEqual(expectedObject);
    });

    let req = httpTestingController.expectOne(
      req => (/.*?emaildashboarddatahandler?.*/g).test(req.url));
    expect(req.request.method).toEqual('GET');
    req.flush(backendResponse);

    flushMicrotasks();
  }));

  it('should correctly fetch query.', fakeAsync(() => {
    let backendResponse = {
      query: {
        created_on: '04-06-20 14:34:46',
        status: 'processing',
        submitter_username: 'testUser',
        id: 'buQW4Qhoxpjg',
        num_qualified_users: 0
      }
    };

    let expectedObject = edqof.createFromBackendDict(backendResponse);

    edbas.fetchQuery('q1').then((query) => {
      expect(query).toEqual(expectedObject);
    });

    let req = httpTestingController.expectOne(
      req => (/.*?querystatuscheck?.*/g).test(req.url));
    expect(req.request.method).toEqual('GET');
    req.flush(backendResponse);

    flushMicrotasks();
  }));

  it('should correctly submit query.', fakeAsync(() => {
    let postData = {
      hasNotLoggedInForNDays: '1',
      inactiveInLastNDays: '2',
      createdAtLeastNExps: '1',
      createdFewerThanNExps: '1',
      editedAtLeastNExps: '0',
      editedFewerThanNExps: '3'
    };

    let backendResponse = {
      query: {
        created_on: '04-06-20 14:34:46',
        status: 'processing',
        submitter_username: 'testUser',
        id: 'buQW4Qhoxpjg',
        num_qualified_users: 0
      }
    };

    let expectedObject = edqof.createFromBackendDict(backendResponse);

    edbas.submitQuery(postData).then((query) => {
      expect(query).toEqual(expectedObject);
    });

    let req = httpTestingController.expectOne(
      req => (/.*?emaildashboarddatahandler?.*/g).test(req.url));
    expect(req.request.method).toEqual('POST');
    req.flush(backendResponse);

    flushMicrotasks();
  }));
});
