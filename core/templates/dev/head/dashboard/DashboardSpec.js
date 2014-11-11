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
 * @fileoverview Unit tests for the controller of the user dashboard.
 *
 * @author sll@google.com (Sean Lip)
 */

describe('Dashboard controller', function() {
  beforeEach(module('oppia'));

  describe('Dashboard', function() {
    var scope, ctrl, $httpBackend;

    beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/dashboardhandler/data').respond({
        explorations: {
          'private_exp_id': {
            category: 'Private category',
            status: 'private',
            title: 'Private exploration'
          },
          'featured_exp_id': {
            category: 'Featured category',
            status: 'publicized',
            title: 'Featured exploration'
          }
        }
      });
      scope = $rootScope.$new();
      ctrl = $controller('Dashboard', {
        $scope: scope,
        warningsData: null,
        createExplorationButtonService: {
          showCreateExplorationModal: null,
          showUploadExplorationModal: null
        }
      });
    }));

    it('should classify explorations correctly', function() {
      $httpBackend.flush();
      expect(scope.privateExplorationIds).toEqual(['private_exp_id']);
      expect(scope.publicExplorationIds).toEqual([]);
      expect(scope.featuredExplorationIds).toEqual(['featured_exp_id']);
    });
  });
});
