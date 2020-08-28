// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the email dashboard page.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { CsrfTokenService } from
  'services/csrf-token.service';
import { EmailDashboardDataService } from
  'pages/email-dashboard-pages/email-dashboard-data.service';
import { EmailDashboardQueryObjectFactory } from
  'domain/email-dashboard/email-dashboard-query-object.factory';

describe('Email Dashboard Services', () => {
  describe('Email Dashboard Services', () => {
    let csrfService: CsrfTokenService = null;
    let emailDashboardDataService: EmailDashboardDataService = null;
    let httpTestingController: HttpTestingController;
    let emailDashboardQueryObjectFactory: EmailDashboardQueryObjectFactory;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [EmailDashboardDataService, EmailDashboardQueryObjectFactory]
      });
      csrfService = TestBed.get(CsrfTokenService);
      emailDashboardDataService = TestBed.get(EmailDashboardDataService);
      httpTestingController = TestBed.get(HttpTestingController);
      emailDashboardQueryObjectFactory = TestBed.get(
        EmailDashboardQueryObjectFactory);

      spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
        return new Promise((resolve) => {
          resolve('sample-csrf-token');
        });
      });
    });

    it('should fetch correct data from backend',
      fakeAsync(() => {
        var recentQueries = [
          {
            query: {
              id: 'q123',
              status: 'processing'
            }
          },
          {
            query: {
              id: 'q456',
              status: 'processing'
            }
          }].map(emailDashboardQueryObjectFactory.createFromBackendDict);

        emailDashboardDataService.getNextQueries();

        var req = httpTestingController.expectOne(
          req => (/.*?emaildashboarddatahandler?.*/g).test(req.url));
        expect(req.request.method).toEqual('GET');
        req.flush({
          recent_queries: recentQueries,
          cursor: null
        });

        flushMicrotasks();

        expect(emailDashboardDataService.getQueries().length).toEqual(2);
        expect(emailDashboardDataService.getQueries()).toEqual(recentQueries);
        expect(emailDashboardDataService.getCurrentPageIndex()).toEqual(0);
        expect(emailDashboardDataService.getLatestCursor()).toBe(null);
      })
    );

    it('should post correct data to backend',
      fakeAsync(() => {
        var data = {
          hasNotLoggedInForNDays: 'value1',
          inactiveInLastNDays: null,
          createdAtLeastNExps: null,
          createdFewerThanNExps: null,
          editedAtLeastNExps: null,
          editedFewerThanNExps: null
        };
        var queryData = emailDashboardQueryObjectFactory.createFromQueryDict({
          id: 'qnew',
          status: 'processing'
        });
        var expectedQueries = [queryData];

        emailDashboardDataService.submitQuery(data);

        var req = httpTestingController.expectOne('/emaildashboarddatahandler');
        expect(req.request.method).toEqual('POST');
        req.flush({
          query: queryData
        });

        flushMicrotasks();

        expect(emailDashboardDataService.getQueries().length).toEqual(1);
        expect(emailDashboardDataService.getQueries()).toEqual(expectedQueries);
      })
    );

    it('should replace correct query in queries list',
      fakeAsync(() => {
        var recentQueries = [{
          id: 'q123',
          status: 'processing'
        },
        {
          id: 'q456',
          status: 'processing'
        }].map(emailDashboardQueryObjectFactory.createFromQueryDict);
        var expectedQueries = [{
          id: 'q123',
          status: 'completed'
        },
        {
          id: 'q456',
          status: 'processing'
        }].map(emailDashboardQueryObjectFactory.createFromQueryDict);

        emailDashboardDataService.getNextQueries();

        var req = httpTestingController.expectOne(
          req => (/.*?emaildashboarddatahandler?.*/g).test(req.url));
        expect(req.request.method).toEqual('GET');
        req.flush({
          recent_queries: [{
            id: 'q123',
            status: 'processing'
          },
          {
            id: 'q456',
            status: 'processing'
          }],
          cursor: null
        });

        flushMicrotasks();

        expect(emailDashboardDataService.getQueries().length).toEqual(2);
        expect(emailDashboardDataService.getQueries()).toEqual(recentQueries);

        emailDashboardDataService.fetchQuery('q123').then((query) => {
          expect(query.id).toEqual('q123');
          expect(query.status).toEqual('completed');
        });

        var req = httpTestingController.expectOne(
          req => (/.*?querystatuscheck?.*/g).test(req.url)
        );
        expect(req.request.method).toEqual('GET');
        req.flush({
          query: {
            id: 'q123',
            status: 'completed'
          }
        });

        flushMicrotasks();

        expect(emailDashboardDataService.getQueries().length).toEqual(2);
        expect(emailDashboardDataService.getQueries()).toEqual(expectedQueries);
      })
    );

    it('should check simulation',
      fakeAsync(() => {
        // Get next page of queries.
        emailDashboardDataService.getNextQueries();

        var req = httpTestingController.expectOne(
          req => (/.*?emaildashboarddatahandler?.*/g).test(req.url));
        expect(req.request.method).toEqual('GET');
        req.flush({
          recent_queries: [],
          cursor: null
        });

        flushMicrotasks();

        expect(emailDashboardDataService.getQueries().length).toEqual(0);
        expect(emailDashboardDataService.getQueries()).toEqual([]);
        expect(emailDashboardDataService.getCurrentPageIndex()).toEqual(0);

        var data = {
          hasNotLoggedInForNDays: 'value1',
          inactiveInLastNDays: null,
          createdAtLeastNExps: null,
          createdFewerThanNExps: null,
          editedAtLeastNExps: null,
          editedFewerThanNExps: null
        };
        // Maintain list of all submitted queries for cross checking.
        var totalQueries = [];
        // Submit 25 new queries.
        for (var i = 0; i < 25; i++) {
          var queryData = {
            id: 'q' + i,
            status: 'processing'
          };

          emailDashboardDataService.submitQuery(data);
          totalQueries.unshift(queryData);

          var req = httpTestingController.expectOne(
            '/emaildashboarddatahandler');
          expect(req.request.method).toEqual('POST');
          req.flush({
            query: queryData
          });

          flushMicrotasks();
        }

        let totalQueriesResponse = totalQueries.map(
          emailDashboardQueryObjectFactory.createFromQueryDict);
        expect(emailDashboardDataService.getQueries().length).toEqual(25);
        expect(emailDashboardDataService.getCurrentPageIndex()).toEqual(0);
        expect(emailDashboardDataService.getQueries()).toEqual(
          totalQueriesResponse);

        // Check that queries on page 1 are correct.
        emailDashboardDataService.getNextQueries().then(
          (queries) => {
            expect(queries.length).toEqual(10);
            expect(queries).toEqual(totalQueriesResponse.slice(10, 20));
          });
        expect(emailDashboardDataService.getCurrentPageIndex()).toEqual(1);

        // Check that queries on page 2 are correct.
        emailDashboardDataService.getNextQueries().then(
          (queries) => {
            expect(queries.length).toEqual(5);
            expect(queries).toEqual(totalQueriesResponse.slice(20, 25));
          });
        expect(emailDashboardDataService.getCurrentPageIndex()).toEqual(2);

        // Go back to page 1 and check again.
        expect(emailDashboardDataService.getPreviousQueries()).toEqual(
          totalQueriesResponse.slice(10, 20));
        expect(emailDashboardDataService.getCurrentPageIndex()).toEqual(1);

        // Submit a new query.
        var queryData = {
          id: 'q25',
          status: 'processing'
        };

        emailDashboardDataService.submitQuery(data);

        var req = httpTestingController.expectOne(
          '/emaildashboarddatahandler');
        expect(req.request.method).toEqual('POST');
        req.flush({
          query: queryData
        });

        flushMicrotasks();

        totalQueries.unshift(queryData);
        let queryDataResponse = (
          emailDashboardQueryObjectFactory.createFromQueryDict(queryData));
        totalQueriesResponse.unshift(queryDataResponse);

        expect(emailDashboardDataService.getQueries().length).toEqual(26);
        expect(emailDashboardDataService.getQueries()).toEqual(
          totalQueriesResponse);

        // Check that new query is added on the top of fetched queries.
        expect(emailDashboardDataService.getQueries()[0]).toEqual(
          queryDataResponse);

        // Check queries on page 2.
        emailDashboardDataService.getNextQueries().then(
          (queries) => {
            expect(queries.length).toEqual(6);
            expect(queries).toEqual(totalQueriesResponse.slice(20, 26));
          });
        expect(emailDashboardDataService.getCurrentPageIndex()).toEqual(2);

        // Check queries on page 1.
        expect(emailDashboardDataService.getPreviousQueries()).toEqual(
          totalQueriesResponse.slice(10, 20));
        expect(emailDashboardDataService.getCurrentPageIndex()).toEqual(1);

        // Check queries on page 0.
        expect(emailDashboardDataService.getPreviousQueries()).toEqual(
          totalQueriesResponse.slice(0, 10));
        expect(emailDashboardDataService.getCurrentPageIndex()).toEqual(0);
      })
    );
  });
});
