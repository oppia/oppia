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
 *
 * @author sll@google.com (Sean Lip)
 */

describe('MyExplorations controller', function() {
  beforeEach(module('oppia'));

  describe('MyExplorations', function() {
    var scope, ctrl, $httpBackend;
    var explorationsList = [{
      id: 'private_exp_id',
      category: 'Private category',
      status: 'private',
      title: 'Private exploration',
      num_open_threads: 0,
      num_total_threads: 0
    }, {
      id: 'featured_exp_id',
      category: 'Featured category',
      status: 'publicized',
      title: 'Featured exploration',
      num_open_threads: 2,
      num_total_threads: 3
    }];

    beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/myexplorationshandler/data').respond({
        explorations_list: explorationsList
      });
      scope = $rootScope.$new();
      ctrl = $controller('MyExplorations', {
        $scope: scope,
        warningsData: null,
        createExplorationButtonService: {
          showCreateExplorationModal: null,
          showUploadExplorationModal: null
        }
      });
    }));

    it('should have the correct set of explorations', function() {
      $httpBackend.flush();
      expect(scope.explorationsList).toEqual(explorationsList);
    });
  });
});
