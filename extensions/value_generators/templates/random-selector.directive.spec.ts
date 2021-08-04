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
 * @fileoverview Unit tests for random selector value generator.
 */

describe('randomSelector', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function(
      $injector, $componentController, $compile) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    ctrl = $componentController('randomSelector', {}, {
      getGeneratorId: () => {
        return 'generatorId';
      }
    });

    let elem = angular.element(
      '<random-selector generator-id="$ctrl.generatorId" ' +
      'customization-args="customizationArgs"></random-selector>');
    $compile(elem)($scope);
    $rootScope.$digest();
  }));

  it('should initialise component', () => {
    ctrl.customizationArgs = {
      list_of_values: ['test']
    };

    ctrl.$onInit();

    expect(ctrl.SCHEMA).toEqual({
      type: 'list',
      items: {
        type: 'unicode'
      },
      ui_config: {
        add_element_text: 'Add New Choice'
      }
    });
    expect(ctrl.generatorId).toBe('generatorId');
    expect(ctrl.customizationArgs.list_of_values).toEqual(['test']);
  });

  it('should initialise list_of_values as an empty array when list_of_values' +
  ' is not defined', () => {
    ctrl.customizationArgs = {
      list_of_values: undefined
    };

    ctrl.$onInit();

    expect(ctrl.customizationArgs.list_of_values).toEqual([]);
  });
});
