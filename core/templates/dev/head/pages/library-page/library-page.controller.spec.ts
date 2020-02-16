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

// TODO(#7222): Remove the following block of unnnecessary imports once
// library-page.controller.ts is upgraded to Angular 8.
import { LearnerDashboardActivityIdsObjectFactory } from
  'domain/learner_dashboard/LearnerDashboardActivityIdsObjectFactory';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { UserInfoObjectFactory } from 'domain/user/UserInfoObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { TranslatorProviderForTests } from 'tests/test.extras';
import { WindowRef } from 'services/contextual/window-ref.service';

require('pages/library-page/library-page.directive.ts');

describe('Library controller', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('Library', function() {
    var scope, ctrl, $httpBackend;
    var $componentController;

    beforeEach(function() {
      angular.mock.module('ui.bootstrap');
    });
    beforeEach(angular.mock.module('oppia', function($provide) {
      var ugs = new UpgradedServices();
      for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
        $provide.value(key, value);
      }
    }));

    beforeEach(
      angular.mock.module('oppia', TranslatorProviderForTests));
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value(
        'LearnerDashboardActivityIdsObjectFactory',
        new LearnerDashboardActivityIdsObjectFactory());
      $provide.factory(
        'LearnerDashboardIdsBackendApiService', ['$http', function($http) {
          return {
            fetchLearnerDashboardIds: function() {
              return $http.get('/learnerdashboardidshandler/data');
            }
          };
        }]);
      $provide.value('WindowDimensionsService', new WindowDimensionsService(
        new WindowRef()
      ));
      $provide.value('UserInfoObjectFactory', new UserInfoObjectFactory());
      $provide.value('PageTitleService', {
        setPageTitle(title) {
          // A null value is returned since $document cannot be used as it needs
          // to be taken from $injector which once created disallows
          // registration of more modules by $provide.
          return null;
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
