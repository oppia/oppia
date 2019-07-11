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
 * @fileoverview Unit tests for the controller of the library page.
 */

import { LearnerDashboardActivityIds } from
  'domain/learner_dashboard/LearnerDashboardActivityIdsObjectFactory.ts';
import { UserInfo } from 'domain/user/UserInfoObjectFactory.ts';

require('pages/library-page/library-page.directive.ts');

describe('Library controller', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('Library', function() {
    var scope, ctrl, $httpBackend;
    var $componentController;

    beforeEach(function() {
      angular.mock.module('ui.bootstrap');
    });

    beforeEach(
      angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('LearnerDashboardActivityIdsObjectFactory', {
        createFromBackendDict(learnerDashboardActivityIdsDict) {
          return new LearnerDashboardActivityIds(
            learnerDashboardActivityIdsDict.incomplete_exploration_ids,
            learnerDashboardActivityIdsDict.incomplete_collection_ids,
            learnerDashboardActivityIdsDict.completed_exploration_ids,
            learnerDashboardActivityIdsDict.completed_collection_ids,
            learnerDashboardActivityIdsDict.exploration_playlist_ids,
            learnerDashboardActivityIdsDict.collection_playlist_ids);
        }
      });
      $provide.value('PageTitleService', {
        setPageTitle(title) {
          // A null value is returned since $document cannot be used as it needs
          // to be taken from $injector which once created disallows
          // registration of more modules by $provide.
          return null;
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

    beforeEach(angular.mock.inject(function(
        _$componentController_, _$httpBackend_) {
      $componentController = _$componentController_;
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/searchhandler/data').respond({
        allow_yaml_file_upload: false,
        explorations_list: [{
          id: '3',
          title: 'Geography 2',
          category: 'Geography',
          objective: 'can view more maps',
          language: 'español',
          last_updated: 12345678912345,
          community_owned: false,
          status: 'featured'
        }, {
          id: '5',
          title: 'Landmarks',
          category: 'Geography',
          objective: 'can view maps',
          language: 'English',
          last_updated: 12345678911111,
          community_owned: false,
          status: 'public'
        }, {
          id: '6',
          title: 'My Exploration',
          category: 'Personal',
          objective: 'can be for myself',
          language: 'English',
          last_updated: 12345678954322,
          community_owned: false,
          status: 'public'
        }],
        preferred_language_codes: ['en']
      });

      ctrl = $componentController('libraryPage', {
        AlertsService: null,
        DateTimeFormatService: null
      }, {});
    }));

    it('should show correct explorations', function() {
      // TODO(sll): Write tests for the library pages.
    });
  });
});
