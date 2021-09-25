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
 * @fileoverview Unit tests for graph property editor.
 */

require('objects/templates/graph-property-editor.component.ts');

describe('graphPropertyEditor', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    ctrl = $componentController('graphPropertyEditor');

    ctrl.savedSolution = [
      [
        'ca_choices_1'
      ],
      [
        'ca_choices_2',
        'ca_choices_3'
      ],
      [
        'ca_choices_4'
      ]
    ];
  }));

  it('should initialise component when user selects graph property', () => {
    ctrl.value = 'regular';
    ctrl.$onInit();

    expect(ctrl.alwaysEditable).toBeTrue();
    expect(ctrl.graphProperties).toEqual([{
      name: 'regular',
      humanReadableName: 'regular'
    }, {
      name: 'acyclic',
      humanReadableName: 'acyclic'
    }, {
      name: 'strongly_connected',
      humanReadableName: 'strongly connected'
    }, {
      name: 'weakly_connected',
      humanReadableName: 'weakly connected'
    }]);
    expect(ctrl.localValue).toEqual(
      {
        property: {
          name: 'regular',
          humanReadableName: 'regular'
        }
      }
    );
    expect(ctrl.localValue.property).toEqual({
      name: 'regular',
      humanReadableName: 'regular'
    });
  });

  it('should update value when user selects a new option', () => {
    ctrl.value = 'acyclic';

    ctrl.$onInit();

    ctrl.localValue.property = {
      name: 'regular',
      humanReadableName: 'regular'
    };
    $scope.$apply();

    expect(ctrl.value).toBe('regular');
  });
});
