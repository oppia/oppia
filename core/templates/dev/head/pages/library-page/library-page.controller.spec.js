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

describe('Library controller', function() {
  beforeEach(module('oppia'));

  describe('Library', function() {
    var scope, ctrl, rootScope, $httpBackend;

    beforeEach(function() {
      module('ui.bootstrap');
    });

    beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    beforeEach(inject(function($controller, _$httpBackend_, $rootScope) {
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

      scope = $rootScope.$new();
      rootScope = $rootScope;
      ctrl = $controller('Library', {
        $scope: scope,
        AlertsService: null,
        DateTimeFormatService: null
      });
    }));

    it('should show correct explorations', function() {
      // TODO(sll): Write tests for the library pages.
    });
  });
});
