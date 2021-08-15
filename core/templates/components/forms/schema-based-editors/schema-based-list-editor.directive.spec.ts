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
 * @fileoverview Unit tests for Schema Based List Editor Directive
 */

import { EventEmitter } from '@angular/core';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Schema Based List Editor Directive', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  let directive = null;

  let SchemaDefaultValueService = null;
  let SchemaFormSubmittedService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    SchemaDefaultValueService = $injector.get('SchemaDefaultValueService');
    SchemaFormSubmittedService = $injector.get('SchemaFormSubmittedService');

    directive = $injector.get('schemaBasedListEditorDirective')[0];
    $scope.labelForFocusTarget = () => {};
    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope
    });
    $scope.uiConfig = () => {
      return {
        add_element_text: 'Add element'
      };
    };
    $scope.itemSchema = () => {
      return {
        type: 'not_unicode'
      };
    };
    $scope.validators = () => {
      return [
        {
          id: 'has_length_at_most',
          max_value: 11
        }
      ];
    };
    $scope.localValue = ['item1'];
    ctrl.$onInit();

    spyOn(SchemaDefaultValueService, 'getDefaultValue')
      .and.returnValue('default');
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should show and hide add item button', () => {
    $scope.localValue = ['item1', ''];
    ctrl.$onInit();

    expect($scope.isAddItemButtonPresent).toBe(true);

    $scope.hideAddItemButton();

    expect($scope.isAddItemButtonPresent).toBe(false);

    $scope.showAddItemButton();

    expect($scope.isAddItemButtonPresent).toBe(true);
  });

  it('should delete last element if user clicks outside the text input box' +
    ' without entering any text', () => {
    $scope.localValue = ['item1', undefined];

    $scope.lastElementOnBlur();

    expect($scope.localValue).toEqual(['item1']);
  });

  it('should add element to the item list', () => {
    $scope.isOneLineInput = true;
    $scope.localValue = ['item1'];

    $scope.addElement();

    expect($scope.localValue).toEqual(['item1', 'default']);
  });

  it('should check if the item list has duplicate values or not', () => {
    $scope.localValue = ['item1', 'item2', 'item3'];

    expect($scope.hasDuplicates()).toBe(false);

    $scope.localValue = ['item1', 'item3', 'item3'];

    expect($scope.hasDuplicates()).toBe(true);
  });

  it('should set validity of list item if duplicates warning is shown', () => {
    $scope.validators = () => {
      return [
        {
          id: 'is_uniquified'
        }
      ];
    };
    $scope.listEditorForm = {
      $setValidity: () => {}
    };
    spyOn($scope.listEditorForm, '$setValidity');

    ctrl.$onInit();

    $scope.localValue = ['new_item'];
    $scope.$apply();

    expect($scope.listEditorForm.$setValidity).toHaveBeenCalled();
  });

  it('should set one line input as false if editor is in coding mode', () => {
    $scope.isOneLineInput = true;

    $scope.itemSchema = () => {
      return {
        type: 'unicode',
        ui_config: {
          coding_mode: true
        }
      };
    };
    ctrl.$onInit();

    expect($scope.isOneLineInput).toBe(false);
  });

  it('should set one line input as false if editor has rows', () => {
    $scope.isOneLineInput = true;

    $scope.itemSchema = () => {
      return {
        type: 'unicode',
        ui_config: {
          rows: 3
        }
      };
    };
    ctrl.$onInit();

    expect($scope.isOneLineInput).toBe(false);
  });

  it('should fill item list with dummy elements if list length is less than' +
    ' minimum length', () => {
    $scope.validators = () => {
      return [
        {
          id: 'has_length_at_least',
          min_value: 3
        }
      ];
    };
    $scope.localValue = ['item1'];
    ctrl.$onInit();

    expect($scope.localValue).toEqual(['item1', 'default', 'default']);
  });

  it('should hide item button if last added element is empty', () => {
    $scope.isAddItemButtonPresent = true;
    $scope.localValue = [''];

    ctrl.$onInit();

    expect($scope.isAddItemButtonPresent).toBe(false);
  });

  it('should delete empty elements from items list', () => {
    $scope.localValue = ['', '', 'item'];

    $scope.showAddItemButton();

    expect($scope.localValue).toEqual(['item']);
  });

  it('should add element on child form submission when form submission' +
    ' happens on the last item of the set', () => {
    let onChildFormSubmitEmitter = new EventEmitter();
    spyOnProperty(SchemaFormSubmittedService, 'onSubmittedSchemaBasedForm')
      .and.returnValue(onChildFormSubmitEmitter);
    $scope.validators = () => {
      return [
        {
          id: 'has_length_at_least',
          min_value: 3
        }
      ];
    };

    ctrl.$onInit();

    $scope.localValue = ['item'];
    $scope.isAddItemButtonPresent = false;

    onChildFormSubmitEmitter.emit();

    expect($scope.localValue).toEqual(['item', 'default']);
  });

  it('should remove focus from element when form submission' +
    ' does not happen on the last item of the set', () => {
    let element: HTMLElement = document.createElement('button');
    element.setAttribute('class', 'oppia-skip-to-content');
    document.body.append(element);
    element.focus();
    spyOn(element, 'blur');
    let onChildFormSubmitEmitter = new EventEmitter();
    spyOnProperty(SchemaFormSubmittedService, 'onSubmittedSchemaBasedForm')
      .and.returnValue(onChildFormSubmitEmitter);

    ctrl.$onInit();

    onChildFormSubmitEmitter.emit();

    expect(element.blur).toHaveBeenCalled();
  });

  it('should throw error list editor length is invalid', () => {
    $scope.len = -1;

    expect(() => ctrl.$onInit())
      .toThrowError('Invalid length for list editor: -1');

    $scope.len = 5;
    $scope.localValue = ['a'];

    expect(() => ctrl.$onInit())
      .toThrowError(
        'List editor length does not match length of input value: 5 a');
  });
});
