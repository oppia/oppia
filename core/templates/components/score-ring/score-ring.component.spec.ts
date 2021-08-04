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

/**
 * @fileoverview Unit tests for Score Ring Component.
 */

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Score Ring Component', () => {
  let ctrl = null;
  let $scope = null;
  let $rootScope = null;
  let COLORS_FOR_PASS_FAIL_MODE = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    COLORS_FOR_PASS_FAIL_MODE = $injector.get('COLORS_FOR_PASS_FAIL_MODE');

    ctrl = $componentController('scoreRing', {
      $scope: $scope
    }, {
      getScore: () => 1
    });
  }));

  it('should set component properties on initialization', () => {
    spyOn(document, 'querySelector').and.returnValue({
      // This throws "Argument of type '{ r: { baseVal: { value: number; };
      // }; style: { strokeDasharray: string; strokeDashoffset: string; }; }'
      // is not assignable to parameter of type 'Element'.". We need to
      // suppress this error because we need these values for testing the file.
      // @ts-expect-error
      r: {
        baseVal: {
          value: 125
        }
      },
      style: {
        strokeDasharray: '',
        strokeDashoffset: ''
      }
    });

    ctrl.$onInit();
    $scope.$apply();

    expect(document.querySelector).toHaveBeenCalledWith('.score-ring-circle');
  });

  it('should get score ring color', () => {
    ctrl.testIsPassed = () => true;

    expect(ctrl.getScoreRingColor())
      .toBe(COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR);

    ctrl.testIsPassed = () => false;

    expect(ctrl.getScoreRingColor())
      .toBe(COLORS_FOR_PASS_FAIL_MODE.FAILED_COLOR);
  });

  it('should get score outer ring color', () => {
    ctrl.testIsPassed = () => true;

    expect(ctrl.getScoreOuterRingColor())
      .toBe(COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR_OUTER);

    ctrl.testIsPassed = () => false;

    expect(ctrl.getScoreOuterRingColor())
      .toBe(COLORS_FOR_PASS_FAIL_MODE.FAILED_COLOR_OUTER);
  });
});
