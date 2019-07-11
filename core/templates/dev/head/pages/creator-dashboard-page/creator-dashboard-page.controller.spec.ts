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

import { Suggestion } from 'domain/suggestion/SuggestionObjectFactory.ts';
import { UserInfo } from 'domain/user/UserInfoObjectFactory.ts';

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
      angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    beforeEach(function() {
      angular.mock.module('oppia');
    });

    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('SuggestionObjectFactory', {
        createFromBackendDict(suggestionBackendDict) {
          return new Suggestion(
            suggestionBackendDict.suggestion_type,
            suggestionBackendDict.suggestion_id,
            suggestionBackendDict.target_type,
            suggestionBackendDict.target_id, suggestionBackendDict.status,
            suggestionBackendDict.author_name,
            suggestionBackendDict.change.state_name,
            suggestionBackendDict.change.new_value,
            suggestionBackendDict.change.old_value,
            suggestionBackendDict.last_updated);
        }
      });
      $provide.value('UserInfoObjectFactory', {
        createFromBackendDict(data) {
          return new UserInfo(
            data.is_moderator, data.is_admin, data.is_super_admin,
            data.is_topic_manager, data.can_create_collections,
            data.preferred_site_language_code, data.username,
            data.user_is_logged_in);
        },
        createDefault() {
          return new UserInfo(
            false, false, false, false, false, null, null, false);
        }
      });
      $provide.value('UtilsService', {
        isEmpty(obj) {
          for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
              return false;
            }
          }
          return true;
        },
        isString(input) {
          return (typeof input === 'string' || input instanceof String);
        }
      });
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
