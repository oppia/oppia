// Copyright 2020 The Oppia Authors. All Rights Reserved.
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

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

/**
 * @fileoverview Unit tests for HTML Select Component.
 */

describe('HTML Select Component', () => {
  let $scope = null;
  let $rootScope = null;
  let ctrl = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    ctrl = $componentController('htmlSelect', {
      $scope: $scope
    });
  }));

  it('should set selection ID', () => {
    expect(ctrl.selection).toBe(undefined);
    $scope.select('12');
    expect(ctrl.selection).toBe('12');
  });

  it('should get selection index', () => {
    ctrl.options = [{id: '12'}, {id: '21'}];
    ctrl.selection = '21';

    expect($scope.getSelectionIndex()).toBe(1);
  });
});
