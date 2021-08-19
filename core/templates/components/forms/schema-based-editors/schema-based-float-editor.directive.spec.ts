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
 * @fileoverview Unit tests for Schema Based Float Editor Directive
 */

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Schema Based Float Editor Directive', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  let $timeout = null;
  let directive = null;
  let SchemaFormSubmittedService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    SchemaFormSubmittedService = $injector.get('SchemaFormSubmittedService');
    $timeout = $injector.get('$timeout');
    $scope = $rootScope.$new();

    $scope.labelForFocusTarget = () => {};

    directive = $injector.get('schemaBasedFloatEditorDirective')[0];
    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope
    });
    ctrl.onInputFocus = () => {};
    ctrl.onInputBlur = () => {};
    ctrl.validators = () => {
      return [
        {
          id: 'is_at_least',
          min_value: 1.1
        },
        {
          id: 'is_at_most',
          max_value: 3.5
        }
      ];
    };
  }));

  it('should set directive properties on initialization', () => {
    expect(ctrl.hasLoaded).toBe(undefined);
    expect(ctrl.isUserCurrentlyTyping).toBe(undefined);
    expect(ctrl.hasFocusedAtLeastOnce).toBe(undefined);
    expect(ctrl.errorString).toBe(undefined);
    expect(ctrl.localValue).toBe(undefined);

    ctrl.$onInit();
    $timeout.flush(50);

    expect(ctrl.hasLoaded).toBe(true);
    expect(ctrl.isUserCurrentlyTyping).toBe(false);
    expect(ctrl.hasFocusedAtLeastOnce).toBe(false);
    expect(ctrl.errorString).toBe('');
    expect(ctrl.localValue).toBe(0.0);
  });

  it('should validate float value', () => {
    expect(ctrl.validate(undefined)).toBe(false);
    expect(ctrl.validate(null)).toBe(false);
    expect(ctrl.validate('')).toBe(false);
    expect(ctrl.validate(7.7)).toBe(true);
  });

  it('should call input focus when user selects the input field', () => {
    spyOn(ctrl, 'onInputFocus');

    ctrl.onFocus();

    expect(ctrl.onInputFocus).toHaveBeenCalled();
  });

  it('should call input blur user deselects the input field', () => {
    spyOn(ctrl, 'onInputBlur');

    ctrl.onBlur();

    expect(ctrl.onInputBlur).toHaveBeenCalled();
  });

  it('should get minimum and maximum values', () => {
    expect(ctrl.getMinValue()).toBe(1.1);
    expect(ctrl.getMaxValue()).toBe(3.5);
  });

  it('should not register keyboard event when user is typing', () => {
    let evt = new KeyboardEvent('', {
      keyCode: 14
    });

    ctrl.isUserCurrentlyTyping = false;

    ctrl.onKeypress(evt);

    expect(ctrl.isUserCurrentlyTyping).toBe(true);
  });

  it('should not submit form if there is an error', () => {
    spyOn(SchemaFormSubmittedService.onSubmittedSchemaBasedForm, 'emit');
    ctrl.floatForm = {
      floatValue: {
        $error: 'Error exists'
      }
    };
    let evt = new KeyboardEvent('', {
      keyCode: 13
    });
    ctrl.isUserCurrentlyTyping = true;

    ctrl.onKeypress(evt);

    expect(ctrl.isUserCurrentlyTyping).toBe(false);
    expect(SchemaFormSubmittedService.onSubmittedSchemaBasedForm.emit)
      .not.toHaveBeenCalled();
  });

  it('should not submit form if there is an error', () => {
    spyOn(SchemaFormSubmittedService.onSubmittedSchemaBasedForm, 'emit');
    ctrl.floatForm = {
      floatValue: {
        $error: ''
      }
    };
    let evt = new KeyboardEvent('', {
      keyCode: 13
    });

    ctrl.onKeypress(evt);

    expect(SchemaFormSubmittedService.onSubmittedSchemaBasedForm.emit)
      .toHaveBeenCalled();
  });

  it('should generate error for wrong input', () => {
    ctrl.localValue = null;

    ctrl.generateErrors();

    expect(ctrl.errorString)
      .toBe(
        'The answer can contain at most 15 digits (0-9) or symbols (. or -).');
  });
});
