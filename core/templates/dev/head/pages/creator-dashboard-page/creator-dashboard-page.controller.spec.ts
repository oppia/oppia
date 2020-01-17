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

// TODO(#7222): Remove the following block of unnnecessary imports once
// creator-dashboard-page.controller.ts is upgraded to Angular 8.
import { RatingComputationService } from
  'components/ratings/rating-computation/rating-computation.service';
import { SuggestionObjectFactory } from
  'domain/suggestion/SuggestionObjectFactory';
/* eslint-disable max-len */
import { ThreadStatusDisplayService } from
  'pages/exploration-editor-page/feedback-tab/services/thread-status-display.service';
/* eslint-enable max-len */
import { UserInfoObjectFactory } from 'domain/user/UserInfoObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { TranslatorProviderForTests } from 'tests/test.extras';

require('pages/creator-dashboard-page/creator-dashboard-page.controller.ts');

describe('Creator dashboard controller', function() {
  describe('CreatorDashboard', function() {
    var ctrl, $httpBackend, componentController;
    var CREATOR_DASHBOARD_DATA_URL = '/creatordashboardhandler/data';
    var dashboardData = {
      explorations_list: [{
        category: 'Featured category',
        id: 'featured_exp_id',
        num_open_threads: 2,
        num_total_threads: 3,
        status: 'public',
        title: 'Featured exploration'
      }, {
        category: 'Private category',
        id: 'private_exp_id',
        num_open_threads: 0,
        num_total_threads: 0,
        status: 'private',
        title: 'Private exploration'
      }],
      collections_list: [],
      dashboard_stats: {
        total_plays: 2,
        average_ratings: 3,
        num_ratings: 2,
        total_open_feedback: 1
      },
      last_week_stats: {
        total_plays: 1,
        average_ratings: 4,
        num_ratings: 1,
        total_open_feedback: 0
      }
    };

    beforeEach(
      angular.mock.module('oppia', TranslatorProviderForTests));

    beforeEach(function() {
      angular.mock.module('oppia');
    });
    beforeEach(angular.mock.module('oppia', function($provide) {
      var ugs = new UpgradedServices();
      for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
        $provide.value(key, value);
      }
    }));

    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.factory(
        'CreatorDashboardBackendApiService', ['$http', function($http) {
          return {
            fetchDashboardData: function() {
              return $http.get('/creatordashboardhandler/data');
            }
          };
        }]);
      $provide.value(
        'RatingComputationService', new RatingComputationService());
      $provide.value('SuggestionObjectFactory', new SuggestionObjectFactory());
      $provide.value(
        'ThreadStatusDisplayService', new ThreadStatusDisplayService());
      $provide.value('UserInfoObjectFactory', new UserInfoObjectFactory());
    }));

    beforeEach(inject(['$componentController', function(
        $componentController) {
      componentController = $componentController;
    }]));

    beforeEach(angular.mock.inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
    }));

    beforeEach(angular.mock.inject(
      function(CreatorDashboardBackendApiService) {
        $httpBackend.expect('GET', CREATOR_DASHBOARD_DATA_URL).respond(
          dashboardData);
        ctrl = componentController('creatorDashboardPage', null, {
          AlertsService: null,
          CreatorDashboardBackendApiService: CreatorDashboardBackendApiService
        });
        // Refer: https://www.codelord.net/2017/01/09/
        // unit-testing-angular-components-with-%24componentcontroller/
        // Angular and $componentController does not take care of
        // $onInit lifecycle hook, so we need to call it explicitly.
        ctrl.$onInit();
      }
    ));

    it('should have the correct data for creator dashboard', function() {
      $httpBackend.flush();
      expect(ctrl.explorationsList).toEqual(dashboardData.explorations_list);
      expect(ctrl.collectionsList).toEqual(dashboardData.collections_list);
      expect(ctrl.dashboardStats).toEqual(dashboardData.dashboard_stats);
      expect(ctrl.lastWeekStats).toEqual(dashboardData.last_week_stats);
    });
  });
});
