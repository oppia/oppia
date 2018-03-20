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

describe('Email Dashboard Services', function() {
  beforeEach(module('oppia'));

  describe('Email Dashboard Services', function() {
    var service, $httpBackend, recentQueries;

    beforeEach(inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
      service = $injector.get('EmailDashboardDataService');
    }));

    it('should fetch correct data from backend', function() {
      var recentQueries = [
        {
          id: 'q123',
          status: 'processing'
        },
        {
          id: 'q456',
          status: 'processing'
        }];
      $httpBackend.expectGET(/.*?emaildashboarddatahandler?.*/g).respond({
        recent_queries: recentQueries,
        cursor: null
      });
      service.getNextQueries();
      $httpBackend.flush();
      expect(service.getQueries().length).toEqual(2);
      expect(service.getQueries()).toEqual(recentQueries);
      expect(service.getCurrentPageIndex()).toEqual(0);
      expect(service.getLatestCursor()).toBe(null);
    });

    it('should post correct data to backend', function() {
      var data = {
        param1: 'value1',
        param2: 'value2'
      };
      var queryData = {
        id: 'qnew',
        status: 'processing'
      };
      var expectedQueries = [queryData];

      $httpBackend.expectPOST('/emaildashboarddatahandler').respond({
        query: queryData
      });
      service.submitQuery(data);
      $httpBackend.flush();
      expect(service.getQueries().length).toEqual(1);
      expect(service.getQueries()).toEqual(expectedQueries);
    });

    it('should replace correct query in queries list', function() {
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

      $httpBackend.expectGET(/.*?emaildashboarddatahandler?.*/g).respond({
        recent_queries: recentQueries,
        cursor: null
      });
      service.getNextQueries();
      $httpBackend.flush();
      expect(service.getQueries().length).toEqual(2);
      expect(service.getQueries()).toEqual(recentQueries);

      $httpBackend.expectGET(/.*?querystatuscheck?.*/g).respond({
        query: {
          id: 'q123',
          status: 'completed'
        }
      });
      service.fetchQuery('q123').then(function(query) {
        expect(query.id).toEqual('q123');
        expect(query.status).toEqual('completed');
      });
      $httpBackend.flush();

      expect(service.getQueries().length).toEqual(2);
      expect(service.getQueries()).toEqual(expectedQueries);
    });

    it('should check simulation', function() {
      // Get next page of queries.
      $httpBackend.expectGET(/.*?emaildashboarddatahandler?.*/g).respond({
        recent_queries: [],
        cursor: null
      });
      service.getNextQueries();
      $httpBackend.flush();
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
        $httpBackend.expectPOST('/emaildashboarddatahandler').respond({
          query: queryData
        });
        service.submitQuery(data);
        totalQueries.unshift(queryData);
        $httpBackend.flush();
      }
      expect(service.getQueries().length).toEqual(25);
      expect(service.getCurrentPageIndex()).toEqual(0);
      expect(service.getQueries()).toEqual(totalQueries);

      // Check that queries on page 1 are correct.
      service.getNextQueries().then(function(queries) {
        expect(queries.length).toEqual(10);
        except(queries).toEqual(totalQueries.slice(10, 20));
      });
      expect(service.getCurrentPageIndex()).toEqual(1);

      // Check that queries on page 2 are correct.
      service.getNextQueries().then(function(queries) {
        expect(queries.length).toEqual(5);
        except(queries).toEqual(totalQueries.slice(20, 25));
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
      $httpBackend.expectPOST('/emaildashboarddatahandler').respond({
        query: queryData
      });
      service.submitQuery(data);
      $httpBackend.flush();
      totalQueries.unshift(queryData);
      expect(service.getQueries().length).toEqual(26);
      expect(service.getQueries()).toEqual(totalQueries);

      // Check that new query is added on the top of fetched queries.
      expect(service.getQueries()[0]).toEqual(queryData);

      // Check queries on page 2.
      service.getNextQueries().then(function(queries) {
        expect(queries.length).toEqual(6);
        except(queries).toEqual(totalQueries.slice(20, 26));
      });
      expect(service.getCurrentPageIndex()).toEqual(2);

      // Check queries on page 1.
      expect(service.getPreviousQueries()).toEqual(totalQueries.slice(10, 20));
      expect(service.getCurrentPageIndex()).toEqual(1);

      // Check queries on page 0.
      expect(service.getPreviousQueries()).toEqual(totalQueries.slice(0, 10));
      expect(service.getCurrentPageIndex()).toEqual(0);
    });
  });
});
