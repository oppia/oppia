// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the controller of the page showing the
 * user's explorations.
 */

describe('Creator dashboard controller', function() {
  describe('Dashboard', function() {
    var scope, ctrl;
    var mockDashboardBackendApiService;
    var dashboardData = {
      explorationsList: [{
        category: 'Featured category',
        id: 'featured_exp_id',
        num_open_threads: 2,
        num_total_threads: 3,
        status: 'publicized',
        title: 'Featured exploration'
      }, {
        category: 'Private category',
        id: 'private_exp_id',
        num_open_threads: 0,
        num_total_threads: 0,
        status: 'private',
        title: 'Private exploration'
      }],
      collectionsList: [],
      dashboardStats: {
        total_plays: 2,
        average_ratings: 3,
        num_ratings: 2,
        total_open_feedback: 1
      },
      lastWeekStats: {
        total_plays: 1,
        average_ratings: 4,
        num_ratings: 1,
        total_open_feedback: 0
      }
    };

    beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    beforeEach(function() {
      module('oppia');
      module(function($provide) {
        $provide.factory('DashboardBackendApiService', ['$q', function($q) {
          var fetchDashboardData = function() {
            return $q.resolve(dashboardData);
          };
          return {
            fetchDashboardData: fetchDashboardData
          };
        }]);
      });
    });

    beforeEach(inject(
      function($rootScope, $controller, DashboardBackendApiService) {
        mockDashboardBackendApiService = DashboardBackendApiService;
        spyOn(mockDashboardBackendApiService, 'fetchDashboardData')
          .andCallThrough();
        scope = $rootScope.$new();
        ctrl = $controller('Dashboard', {
          $scope: scope,
          alertsService: null,
          DashboardBackendApiService: mockDashboardBackendApiService
        });
      }
    ));

    it('should have the correct data for creator dashboard', function() {
      expect(scope.explorationsList).toEqual(dashboardData.explorations_list);
      expect(scope.collectionsList).toEqual(dashboardData.collections_list);
      expect(scope.dashboardStats).toEqual(dashboardData.dashboard_stats);
      expect(scope.lastWeekStats).toEqual(dashboardData.last_week_stats);
    });
  });
});
