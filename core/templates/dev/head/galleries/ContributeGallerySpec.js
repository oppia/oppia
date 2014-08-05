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
 * @fileoverview Unit tests for the controller of the 'contribute' gallery page.
 *
 * @author sll@google.com (Sean Lip)
 */

describe('Gallery controller', function() {
  beforeEach(module('oppia'));

  describe('ContributeGallery', function() {
    var scope, ctrl, $httpBackend;

    beforeEach(function() {
      module('ui.bootstrap');
    });

    beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/contributehandler/data').respond({
        allow_yaml_file_upload: false,
        categories: {
          Geography: [{
            can_edit: false,
            id: '5',
            is_cloned: false,
            is_community_owned: false,
            is_private: false,
            is_public: true,
            is_publicized: false,
            title: 'Landmarks'
          }, {
            can_edit: false,
            id: '3',
            is_cloned: false,
            is_community_owned: false,
            is_private: false,
            is_public: true,
            is_publicized: false,
            title: 'Geography 2'
          }],
          Personal: [{
            can_edit: true,
            id: '6',
            is_cloned: false,
            is_community_owned: false,
            is_private: false,
            is_public: true,
            is_publicized: false,
            title: 'My Exploration'
          }]
        }
      });
      scope = $rootScope.$new();
      ctrl = $controller('ContributeGallery', {
        $scope: scope,
        warningsData: null,
        validatorsService: null
      });
    }));

    it('should show correct categories', function() {
      $httpBackend.flush();
      expect(scope.categoryList).toEqual(['Geography', 'Personal']);
    });
  });
});
