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
 * @fileoverview Unit tests for Schema Based Editor Directive
 */

import { importAllAngularServices} from 'tests/unit-test-utils.ajs';

describe('Schema Based Expression Editor Directive', () => {
  let ctrl = null;
  let $rootScope = null;
  let $timeout = null;
  let $scope = null;
  let directive = null;
  let FocusManagerService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    FocusManagerService = $injector.get('FocusManagerService');
    $scope = $rootScope.$new();

    $scope.labelForFocusTarget = () => {};
    directive = $injector.get('schemaBasedExpressionEditorDirective')[0];
    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope
    });

    ctrl.schema = () => {
      return {
        choices: ['Choice 1']
      };
    };
  }));

  it('should initialize the schema', () => {
    spyOn(FocusManagerService, 'setFocusWithoutScroll');

    ctrl.$onInit();
    $timeout.flush(50);

    expect(FocusManagerService.setFocusWithoutScroll).toHaveBeenCalled();
  });
});
