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
 * @fileoverview Unit tests for Schema Based Unicode Editor Directive
 */

import { EventEmitter } from '@angular/core';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Schema Based Unicode Editor Directive', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  let $timeout = null;
  let directive = null;
  let StateCustomizationArgsService = null;
  let SchemaFormSubmittedService = null;
  let DeviceInfoService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    $scope = $rootScope.$new();

    StateCustomizationArgsService = $injector.get(
      'StateCustomizationArgsService');
    SchemaFormSubmittedService = $injector.get(
      'SchemaFormSubmittedService');
    DeviceInfoService = $injector.get(
      'DeviceInfoService');

    directive = $injector.get('schemaBasedUnicodeEditorDirective')[0];
    $scope.labelForFocusTarget = () => {};

    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope
    });
    ctrl.uiConfig = () => {
      return {
        coding_mode: 'python',
        rows: 5,
        placeholder: 'Placeholder text'
      };
    };
    ctrl.isDisabled = () => true;

    spyOn(DeviceInfoService, 'hasTouchEvents').and.returnValue(true);
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should instantiate codemirror on initialization', () => {
    let cm = {
      getOption: () => 2,
      replaceSelection: () => {},
      getDoc: () => {
        return {
          getCursor: () => {},
          setCursor: () => {}
        };
      }
    };
    spyOn(cm, 'replaceSelection');

    expect(ctrl.codemirrorOptions).toBe(undefined);

    ctrl.$onInit();
    expect(ctrl.codemirrorStatus).toBe(false);
    $timeout.flush(200);

    // Call function to convert tabs into spaces for codemirror.
    ctrl.codemirrorOptions.extraKeys.Tab(cm);

    expect(ctrl.codemirrorOptions.indentWithTabs).toBe(false);
    expect(ctrl.codemirrorOptions.lineNumbers).toBe(true);
    expect(cm.replaceSelection).toHaveBeenCalled();
    expect(ctrl.codemirrorOptions.mode).toBe('python');
    expect(ctrl.codemirrorStatus).toBe(true);
  });

  it('should flip the codemirror status flag when form view is opened', () => {
    let onSchemaBasedFormsShownEmitter = new EventEmitter();
    spyOnProperty(StateCustomizationArgsService, 'onSchemaBasedFormsShown')
      .and.returnValue(onSchemaBasedFormsShownEmitter);

    ctrl.$onInit();
    $timeout.flush(200);

    expect(ctrl.codemirrorStatus).toBe(true);

    onSchemaBasedFormsShownEmitter.emit();
    $timeout.flush(200);

    expect(ctrl.codemirrorStatus).toBe(false);
  });

  it('should update local value', () => {
    ctrl.localValue = 'old value';

    ctrl.updateLocalValue('new value');

    expect(ctrl.localValue).toBe('new value');
  });

  it('should get the displayed value', () => {
    ctrl.localValue = '📚';

    expect(ctrl.getDisplayedValue().toString()).toEqual('&#128218;');
  });

  it('should get coding mode', () => {
    expect(ctrl.getCodingMode()).toBe('python');

    ctrl.uiConfig = () => undefined;

    expect(ctrl.getCodingMode()).toBe(null);
  });

  it('should get the number of rows', () => {
    expect(ctrl.getRows()).toBe(5);

    ctrl.uiConfig = () => undefined;

    expect(ctrl.getRows()).toBe(null);
  });

  it('should get the placeholder value', () => {
    expect(ctrl.getPlaceholder()).toBe('Placeholder text');

    ctrl.uiConfig = () => {
      return {
        placeholder: ''
      };
    };

    expect(ctrl.getPlaceholder()).toBe(
      'I18N_PLAYER_DEFAULT_MOBILE_PLACEHOLDER');

    ctrl.uiConfig = () => undefined;

    expect(ctrl.getPlaceholder()).toBe('');
  });

  it('should submit form on keypress', () => {
    spyOn(SchemaFormSubmittedService.onSubmittedSchemaBasedForm, 'emit');
    let evt = new KeyboardEvent('', {
      keyCode: 13
    });

    ctrl.onKeypress(evt);

    expect(SchemaFormSubmittedService.onSubmittedSchemaBasedForm.emit)
      .toHaveBeenCalled();
  });
});
