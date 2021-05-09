// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for roles-and-actions-visualizer directive.
 */

require('pages/admin-page/roles-tab/roles-and-actions-visualizer.directive.ts');

describe('Roles and actions visualizer directive', function() {
  var ctrl = null;
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    var $rootScope = $injector.get('$rootScope');
    var $scope = $rootScope.$new();

    ctrl = $componentController('rolesAndActionsVisualizer', {
      scope: $scope
    });
    ctrl.roleToActions = {
      guest: ['allowed action 1', 'allowed action 2'],
      learner: ['allowed action 3', 'allowed action 4']
    };
  }));

  it('should intialize correct active role', function() {
    ctrl.$onInit();

    expect(ctrl.activeRole).toEqual('Guest');
  });

  it('should intialize roles with all the roles', function() {
    ctrl.$onInit();

    expect(ctrl.roles).toEqual(['Guest', 'Learner']);
  });

  it('should intialize roleToActions correctly', function() {
    ctrl.$onInit();

    expect(ctrl.roleToActions).toEqual({
      Guest: ['Allowed action 1', 'Allowed action 2'],
      Learner: ['Allowed action 3', 'Allowed action 4']
    });
  });

  it('should set active role correctly', function() {
    ctrl.$onInit();

    expect(ctrl.activeRole).toEqual('Guest');

    ctrl.setActiveRole('Learner');
    expect(ctrl.activeRole).toEqual('Learner');
  });
});
