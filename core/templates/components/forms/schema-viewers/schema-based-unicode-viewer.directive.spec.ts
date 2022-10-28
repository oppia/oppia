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
 * @fileoverview Unit tests for Schema Based Unicode Viewer Directive
 */

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Schema Based Unicode Viewer Directive', () => {
  let $rootScope = null;
  let $scope = null;
  let directive = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    directive = $injector.get('schemaBasedUnicodeViewerDirective')[0];
    $injector.instantiate(directive.controller, {
      $scope: $scope
    });
  }));

  it('should the displayed unicode value', () => {
    $scope.localValue = '📚';

    expect($scope.getDisplayedValue().toString()).toEqual('&#128218;');
  });
});
