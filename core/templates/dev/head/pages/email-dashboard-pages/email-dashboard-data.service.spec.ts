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

import { EmailDashboardDataService } from
  'pages/email-dashboard-pages/email-dashboard-data.service.ts';

class MockCsrfService {
  getTokenAsync() {
    var promise = new Promise((resolve, reject) => {
      resolve('sample-csrf-token');
    });
    return promise.then((value) => {
      return value;
    });
  }
}

describe('Email Dashboard Services', () => {
  describe('Email Dashboard Services', () => {
    var recentQueries;
    let CsrfService: MockCsrfService, csrfService: MockCsrfService;
    let service: EmailDashboardDataService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          EmailDashboardDataService,
          {
            provide: CsrfService, useClass: MockCsrfService
          }
        ]
      });
      service = TestBed.get(EmailDashboardDataService);
      csrfService = TestBed.get(CsrfService);

      httpTestingController = TestBed.get(HttpTestingController);
    });

    it('should fetch correct data from backend', fakeAsync(() => {
      var recentQueries = [{
        id: 'q123',
        status: 'processing'
      },
      {
        id: 'q456',
        status: 'processing'
      }];
      service.getNextQueries();
      var req = httpTestingController.expectOne({ method: 'GET' });
      expect(req.request.url).toMatch(/.*?emaildashboarddatahandler?.*/g);
      req.flush({
        recent_queries: recentQueries,
        cursor: null
      });

      flushMicrotasks();

      expect(service.getQueries().length).toEqual(2);
      expect(service.getQueries()).toEqual(recentQueries);
      expect(service.getCurrentPageIndex()).toEqual(0);
      expect(service.getLatestCursor()).toBe(null);
    }));

    it('should post correct data to backend', fakeAsync(() => {
      var data = {
        param1: 'value1',
        param2: 'value2'
      };
      var queryData = {
        id: 'qnew',
        status: 'processing'
      };
      var expectedQueries = [queryData];

      service.submitQuery(data);
      var req = httpTestingController.expectOne('/emaildashboarddatahandler');
      expect(req.request.method).toEqual('POST');
      req.flush({
        query: queryData
      });

      flushMicrotasks();

      expect(service.getQueries().length).toEqual(1);
      expect(service.getQueries()).toEqual(expectedQueries);
    }));

    it('should replace correct query in queries list', fakeAsync(() => {
      var recentQueries = [{
        id: 'q123',
        status: 'processing'
      },
      {
        id: 'q456',
        status: 'processing'
      }];
      var expectedQueries = [{
        id: 'q123',
        status: 'completed'
      },
      {
        id: 'q456',
        status: 'processing'
      }];

      service.getNextQueries();
      var req = httpTestingController.expectOne({ method: 'GET' });
      expect(req.request.url).toMatch(/.*?emaildashboarddatahandler?.*/g);
      req.flush({
        recent_queries: recentQueries,
        cursor: null
      });

      flushMicrotasks();

      expect(service.getQueries().length).toEqual(2);
      expect(service.getQueries()).toEqual(recentQueries);
      service.fetchQuery('q123').then(function(query) {
        expect(query.id).toEqual('q123');
        expect(query.status).toEqual('completed');
      });

      var req = httpTestingController.expectOne({ method: 'GET' });
      expect(req.request.url).toMatch(/.*?querystatuscheck?.*/g);
      req.flush({
        query: {
          id: 'q123',
          status: 'completed'
        }
      });

      flushMicrotasks();

      expect(service.getQueries().length).toEqual(2);
      expect(service.getQueries()).toEqual(expectedQueries);
    }));

    it('should check simulation', fakeAsync(() => {
      // Get next page of queries.
      service.getNextQueries();
      var req = httpTestingController.expectOne({ method: 'GET' });
      expect(req.request.url).toMatch(/.*?emaildashboarddatahandler?.*/g);
      req.flush({
        recent_queries: [],
        cursor: null
      });

      flushMicrotasks();

      expect(service.getQueries().length).toEqual(0);
      expect(service.getQueries()).toEqual([]);
      expect(service.getCurrentPageIndex()).toEqual(0);

      var data = {
        param1: 'value1',
        param2: 'value2'
      };
      // Maintain list of all submitted queries for cross checking.
      var totalQueries = [];
      // Submit 25 new queries.
      for (var i = 0; i < 25; i++) {
        var queryData = {
          id: 'q' + i,
          status: 'processing'
        };
        service.submitQuery(data).then((success) => {
          totalQueries.unshift(queryData);
        });
        var req = httpTestingController.expectOne('/emaildashboarddatahandler');
        expect(req.request.method).toEqual('POST');
        req.flush({
          query: queryData
        });
        flushMicrotasks();
      }
      expect(service.getQueries().length).toEqual(25);
      expect(service.getCurrentPageIndex()).toEqual(0);
      expect(service.getQueries()).toEqual(totalQueries);

      // Check that queries on page 1 are correct.
      service.getNextQueries().then(function(queries) {
        expect(queries.length).toEqual(10);
        expect(queries).toEqual(totalQueries.slice(10, 20));
      });
      expect(service.getCurrentPageIndex()).toEqual(1);

      // Check that queries on page 2 are correct.
      service.getNextQueries().then(function(queries) {
        expect(queries.length).toEqual(5);
        expect(queries).toEqual(totalQueries.slice(20, 25));
      });
      expect(service.getCurrentPageIndex()).toEqual(2);

      // Go back to page 1 and check again.
      expect(service.getPreviousQueries()).toEqual(totalQueries.slice(10, 20));
      expect(service.getCurrentPageIndex()).toEqual(1);

      // Submit a new query.
      var queryData = {
        id: 'q25',
        status: 'processing'
      };
      service.submitQuery(data);
      var req = httpTestingController.expectOne('/emaildashboarddatahandler');
      expect(req.request.method).toEqual('POST');
      req.flush({
        query: queryData
      });
      flushMicrotasks();
      totalQueries.unshift(queryData);
      expect(service.getQueries().length).toEqual(26);
      expect(service.getQueries()).toEqual(totalQueries);

      // Check that new query is added on the top of fetched queries.
      expect(service.getQueries()[0]).toEqual(queryData);

      // Check queries on page 2.
      service.getNextQueries().then(function(queries) {
        expect(queries.length).toEqual(6);
        expect(queries).toEqual(totalQueries.slice(20, 26));
      });
      expect(service.getCurrentPageIndex()).toEqual(2);

      // Check queries on page 1.
      expect(service.getPreviousQueries()).toEqual(totalQueries.slice(10, 20));
      expect(service.getCurrentPageIndex()).toEqual(1);

      // Check queries on page 0.
      expect(service.getPreviousQueries()).toEqual(totalQueries.slice(0, 10));
      expect(service.getCurrentPageIndex()).toEqual(0);
    }));
  });
});
