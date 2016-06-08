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
    var scope, ctrl, $httpBackend;
    var explorationsList = [{
      category: 'Private category',
      id: 'private_exp_id',
      num_open_threads: 0,
      num_total_threads: 0,
      status: 'private',
      title: 'Private exploration'
    }, {
      category: 'Featured category',
      id: 'featured_exp_id',
      num_open_threads: 2,
      num_total_threads: 3,
      status: 'publicized',
      title: 'Featured exploration'
    }];

    beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/dashboardhandler/data').respond({
        explorations_list: explorationsList
      });
      scope = $rootScope.$new();
      ctrl = $controller('Dashboard', {
        $scope: scope,
        alertsService: null
      });
    }));

    it('should have the correct set of explorations', function() {
      $httpBackend.flush();
      expect(scope.explorationsList).toEqual(explorationsList);
    });
  });
});
