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
 * @fileoverview Unit test for Hint Editor Component.
 */

import { EventEmitter } from '@angular/core';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('HintEditorComponent', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;

  let EditabilityService = null;
  let ExternalSaveService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    EditabilityService = $injector.get('EditabilityService');
    ExternalSaveService = $injector.get('ExternalSaveService');

    ctrl = $componentController('hintEditor', {
      $scope: $scope
    }, {
      getOnSaveFn: () => {
        return () => {};
      },
      showMarkAllAudioAsNeedingUpdateModalIfRequired: () => {}
    });
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should set component properties on initialization', () => {
    spyOn(EditabilityService, 'isEditable').and.returnValue(true);

    expect(ctrl.hintMemento).toBe(undefined);
    expect(ctrl.isEditable).toBe(undefined);
    expect(ctrl.hintEditorIsOpen).toBe(undefined);

    ctrl.$onInit();

    expect(ctrl.hintMemento).toBe(null);
    expect(ctrl.isEditable).toBe(true);
    expect(ctrl.hintEditorIsOpen).toBe(false);
  });

  it('should save hint when external save event is triggered', () => {
    let onExternalSaveEmitter = new EventEmitter();
    spyOnProperty(ExternalSaveService, 'onExternalSave')
      .and.returnValue(onExternalSaveEmitter);
    spyOn(ctrl, 'showMarkAllAudioAsNeedingUpdateModalIfRequired');

    ctrl.$onInit();

    ctrl.hintEditorIsOpen = true;
    ctrl.editHintForm = {
      $valid: true
    };
    ctrl.hintMemento = {
      hintContent: {
        html: '<p> Hint </p>'
      }
    };
    ctrl.hint = {
      hintContent: {
        contentId: 'contentID',
        html: '<p> Hint Changed </p>'
      }
    };

    onExternalSaveEmitter.emit();
    $scope.$apply();

    expect(ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired)
      .toHaveBeenCalledWith(['contentID']);
  });

  it('should open hint editor when user clicks on \'Edit hint\'', () => {
    ctrl.isEditable = true;
    ctrl.hintMemento = {
      hintContent: {
        html: '<p> Hint Original</p>'
      }
    };
    ctrl.hint = {
      hintContent: {
        html: '<p> Hint After Edit </p>'
      }
    };
    ctrl.hintEditor = false;

    ctrl.openHintEditor();

    expect(ctrl.hintMemento).toEqual(ctrl.hint);
    expect(ctrl.hintEditorIsOpen).toBe(true);
  });

  it('should cancel hint edit if user clicks on \'Cancel\'', () => {
    ctrl.hintEditorIsOpen = true;
    ctrl.hintMemento = {
      hintContent: {
        html: '<p> Hint Original</p>'
      }
    };
    ctrl.hint = {
      hintContent: {
        contentId: 'contentID',
        html: '<p> Hint After Edit </p>'
      }
    };

    ctrl.cancelThisHintEdit();

    expect(ctrl.hint.hintContent).toEqual({
      html: '<p> Hint Original</p>'
    });
    expect(ctrl.hintMemento).toBe(null);
    expect(ctrl.hintEditorIsOpen).toBe(false);
  });
});
