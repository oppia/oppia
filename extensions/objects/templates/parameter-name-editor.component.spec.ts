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
 * @fileoverview Unit tests for parameter name editor.
 */
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { ParamSpecsObjectFactory } from 'domain/exploration/ParamSpecsObjectFactory';
import { TestBed } from '@angular/core/testing';

describe('parameterNameEditor', () => {
  let ctrl = null;
  var $rootScope = null;
  var $scope = null;
  let explorationParamSpecsService = null;
  var paramSpecsObjectFactory = null;

  importAllAngularServices();
  beforeEach(angular.mock.module('oppia'));
  beforeEach(function() {
    paramSpecsObjectFactory = TestBed.get(ParamSpecsObjectFactory);
  });
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    explorationParamSpecsService =
      $injector.get('ExplorationParamSpecsService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    ctrl = $componentController('parameterNameEditor');

    explorationParamSpecsService.init(
      paramSpecsObjectFactory.createFromBackendDict({
        y: {
          obj_type: 'UnicodeString'
        },
        a: {
          obj_type: 'UnicodeString'
        }
      }));
  }));

  it('should initialise component when user open editor', () => {
    ctrl.$onInit();

    expect(ctrl.availableParamNames).toEqual(['y', 'a']);
    expect(ctrl.localValue).toBe('y');
    expect(ctrl.SCHEMA).toEqual({
      type: 'unicode',
      choices: ['y', 'a']
    });
  });

  it('should return true if the available param names are not empty', () => {
    ctrl.$onInit();

    expect(ctrl.validate()).toBeTrue();
  });

  it('should return false if the available param names is empty', () => {
    spyOn(explorationParamSpecsService.savedMemento, 'getParamNames').
      and.returnValue([]);
    ctrl.$onInit();

    expect(ctrl.validate()).toBeFalse();
  });

  it('should update value when user enter new local value', () => {
    ctrl.$onInit();

    expect(ctrl.localValue).toBe('y');
    expect(ctrl.value).toBeUndefined();

    ctrl.localValue = 'test';
    $scope.$apply();

    expect(ctrl.value).toBe('test');
  });

  it('should update localvalue when value gets updated', () => {
    ctrl.$onInit();

    expect(ctrl.localValue).toBe('y');

    ctrl.value = 'test';
    $scope.$apply();

    expect(ctrl.localValue).toBe('test');
  });
});
