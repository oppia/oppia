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
import { EmailDashboardQuery, EmailDashboardQueryDict } from
  'domain/email-dashboard/email-dashboard-query.model';
import { QueryData } from 'domain/email-dashboard/email-dashboard-backend-api.service';

describe('Email Dashboard Services', () => {
  describe('Email Dashboard Services', () => {
    let csrfService: CsrfTokenService;
    let emailDashboardDataService: EmailDashboardDataService;
    let httpTestingController: HttpTestingController;
    let defaultData: QueryData = {
      inactive_in_last_n_days: false,
      has_not_logged_in_for_n_days: false,
      created_at_least_n_exps: false,
      created_fewer_than_n_exps: false,
      edited_at_least_n_exps: false,
      edited_fewer_than_n_exps: false
    };

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [EmailDashboardDataService]
      });
      csrfService = TestBed.inject(CsrfTokenService);
      emailDashboardDataService = TestBed.inject(EmailDashboardDataService);
      httpTestingController = TestBed.inject(HttpTestingController);

      spyOn(csrfService, 'getTokenAsync').and.callFake(async() => {
        return new Promise((resolve) => {
          resolve('sample-csrf-token');
        });
      });
    });

    it('should fetch correct data from backend',
      fakeAsync(() => {
        var recentQueriesDict: EmailDashboardQueryDict[] = [
          {
            id: 'q123',
            status: 'processing',
            num_qualified_users: 0,
            submitter_username: '',
            created_on: ''
          }
          ,
          {
            id: 'q456',
            status: 'processing',
            num_qualified_users: 0,
            submitter_username: '',
            created_on: ''
          }];
        var recentQueries = recentQueriesDict.map(
          EmailDashboardQuery.createFromQueryDict);

        emailDashboardDataService.getNextQueriesAsync();

        var req = httpTestingController.expectOne(
          req => (/.*?emaildashboarddatahandler?.*/g).test(req.url));
        expect(req.request.method).toEqual('GET');
        req.flush({
          recent_queries: recentQueriesDict,
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
        var data = defaultData;
        data.inactive_in_last_n_days = 10;
        var queryDataDict = {
          id: 'qnew',
          status: 'processing',
          num_qualified_users: 0,
          submitter_username: '',
          created_on: ''
        };
        var queryData = EmailDashboardQuery.createFromQueryDict(
          queryDataDict);
        var expectedQueries = [queryData];

        emailDashboardDataService.submitQueryAsync(data);

        var req = httpTestingController.expectOne('/emaildashboarddatahandler');
        expect(req.request.method).toEqual('POST');
        req.flush({
          query: queryDataDict
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
          status: 'processing',
          num_qualified_users: 0,
          submitter_username: '',
          created_on: ''
        },
        {
          id: 'q456',
          status: 'processing',
          num_qualified_users: 0,
          submitter_username: '',
          created_on: ''
        }].map(EmailDashboardQuery.createFromQueryDict);

        var expectedQueries = [{
          id: 'q123',
          status: 'completed',
          num_qualified_users: 0,
          submitter_username: '',
          created_on: ''
        },
        {
          id: 'q456',
          status: 'processing',
          num_qualified_users: 0,
          submitter_username: '',
          created_on: ''
        }].map(EmailDashboardQuery.createFromQueryDict);

        emailDashboardDataService.getNextQueriesAsync();

        var req = httpTestingController.expectOne(
          req => (/.*?emaildashboarddatahandler?.*/g).test(req.url));
        expect(req.request.method).toEqual('GET');
        req.flush({
          recent_queries: [{
            id: 'q123',
            status: 'processing',
            num_qualified_users: 0,
            submitter_username: '',
            created_on: ''
          },
          {
            id: 'q456',
            status: 'processing',
            num_qualified_users: 0,
            submitter_username: '',
            created_on: ''
          }],
          cursor: null
        });

        flushMicrotasks();

        expect(emailDashboardDataService.getQueries().length).toEqual(2);
        expect(emailDashboardDataService.getQueries()).toEqual(recentQueries);

        emailDashboardDataService.fetchQueryAsync('q123').then((query) => {
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
            status: 'completed',
            num_qualified_users: 0,
            submitter_username: '',
            created_on: ''
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
        emailDashboardDataService.getNextQueriesAsync();

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

        var data = defaultData;
        data.inactive_in_last_n_days = 10;
        // Maintain list of all submitted queries for cross checking.
        var totalQueries = [];
        // Submit 25 new queries.
        for (var i = 0; i < 25; i++) {
          var queryData = {
            id: 'q' + i,
            status: 'processing',
            num_qualified_users: 0,
            submitter_username: '',
            created_on: ''
          };

          emailDashboardDataService.submitQueryAsync(data);
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
          EmailDashboardQuery.createFromQueryDict);
        expect(emailDashboardDataService.getQueries().length).toEqual(25);
        expect(emailDashboardDataService.getCurrentPageIndex()).toEqual(0);
        expect(emailDashboardDataService.getQueries()).toEqual(
          totalQueriesResponse);

        // Check that queries on page 1 are correct.
        emailDashboardDataService.getNextQueriesAsync().then(
          (queries) => {
            expect(queries.length).toEqual(10);
            expect(queries).toEqual(totalQueriesResponse.slice(10, 20));
          });
        expect(emailDashboardDataService.getCurrentPageIndex()).toEqual(1);

        // Check that queries on page 2 are correct.
        emailDashboardDataService.getNextQueriesAsync().then(
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
          status: 'processing',
          num_qualified_users: 0,
          submitter_username: '',
          created_on: ''
        };

        emailDashboardDataService.submitQueryAsync(data);

        var req = httpTestingController.expectOne(
          '/emaildashboarddatahandler');
        expect(req.request.method).toEqual('POST');
        req.flush({
          query: queryData
        });

        flushMicrotasks();

        totalQueries.unshift(queryData);
        let queryDataResponse = (
          EmailDashboardQuery.createFromQueryDict(queryData));
        totalQueriesResponse.unshift(queryDataResponse);

        expect(emailDashboardDataService.getQueries().length).toEqual(26);
        expect(emailDashboardDataService.getQueries()).toEqual(
          totalQueriesResponse);

        // Check that new query is added on the top of fetched queries.
        expect(emailDashboardDataService.getQueries()[0]).toEqual(
          queryDataResponse);

        // Check queries on page 2.
        emailDashboardDataService.getNextQueriesAsync().then(
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

    it('should return true if next page is available', () => {
      // This will return true if the number of queries
      // are greater than number of queries per page.
      emailDashboardDataService.queries.length = 30;
      emailDashboardDataService.currentPageIndex = 1;
      let result = emailDashboardDataService.isNextPageAvailable();

      expect(result).toBe(true);
    });

    it('should return false if next page is not available', () => {
      // This will return false if the number of queries
      // are less than number of queries per page.
      emailDashboardDataService.queries.length = 10;
      emailDashboardDataService.currentPageIndex = 1;
      let result = emailDashboardDataService.isNextPageAvailable();

      expect(result).toBe(false);
    });

    it('should return true if previous page is available', () => {
      // This will return true if current page index
      // is greater than zero.
      emailDashboardDataService.currentPageIndex = 1;
      let result = emailDashboardDataService.isPreviousPageAvailable();

      expect(result).toBe(true);
    });

    it('should return true if previous page is not available', () => {
      // This will return true if current page index
      // is less than zero.
      emailDashboardDataService.currentPageIndex = -1;
      let result = emailDashboardDataService.isPreviousPageAvailable();

      expect(result).toBe(false);
    });
  });
});
