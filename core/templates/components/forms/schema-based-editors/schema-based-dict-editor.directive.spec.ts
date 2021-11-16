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
 * @fileoverview Unit tests for Schema Based Dict Editor Directive
 */

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Schema Based Dict Editor Directive', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  let directive = null;
  let IdGenerationService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    IdGenerationService = $injector.get('IdGenerationService');
    $scope = $rootScope.$new();

    directive = $injector.get('schemaBasedDictEditorDirective')[0];
    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope
    });

    $scope.propertySchemas = () => {
      return [
        {
          name: 'Name1'
        },
        {
          name: 'Name2'
        }
      ];
    };
  }));

  it('should set directive properties on initialization', () => {
    spyOn(IdGenerationService, 'generateNewId')
      .and.returnValues('id1', 'id2');
    expect($scope.fieldIds).toBe(undefined);

    ctrl.$onInit();

    expect($scope.fieldIds).toEqual({
      Name1: 'id1',
      Name2: 'id2'
    });
  });

  it('should get human readable property description', () => {
    expect($scope.getHumanReadablePropertyDescription({
      description: 'This is the property description',
      name: 'Property Name'
    })).toBe('This is the property description');

    expect($scope.getHumanReadablePropertyDescription({
      name: 'Property Name'
    })).toBe('[Property Name]');
  });
});
