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
 * @fileoverview Unit tests for Schema Based Int Editor Directive
 */

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Schema Based Int Editor Directive', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  let $timeout = null;
  let directive = null;
  let FocusManagerService = null;
  let SchemaFormSubmittedService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    FocusManagerService = $injector.get('FocusManagerService');
    SchemaFormSubmittedService = $injector.get('SchemaFormSubmittedService');
    $timeout = $injector.get('$timeout');
    $scope = $rootScope.$new();

    $scope.labelForFocusTarget = () => {};

    directive = $injector.get('schemaBasedIntEditorDirective')[0];
    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope
    });
  }));

  it('should set local value on initialization and set focus' +
    ' on the input field', () => {
    spyOn(FocusManagerService, 'setFocusWithoutScroll');
    expect(ctrl.localValue).toBe(undefined);

    ctrl.$onInit();
    $timeout.flush(50);

    expect(ctrl.localValue).toBe(0);
    expect(FocusManagerService.setFocusWithoutScroll).toHaveBeenCalled();
  });

  it('should submit form on key press', () => {
    spyOn(SchemaFormSubmittedService.onSubmittedSchemaBasedForm, 'emit');
    let evt = new KeyboardEvent('', {
      keyCode: 13
    });

    ctrl.onKeypress(evt);

    expect(SchemaFormSubmittedService.onSubmittedSchemaBasedForm.emit)
      .toHaveBeenCalled();
  });
});
