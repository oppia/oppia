// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TrainingDataEditorPanelService.
 */

import { EventEmitter } from '@angular/core';
import { importAllAngularServices } from 'tests/unit-test-utils';

describe('Training Data Editor Panel Service', function() {
  importAllAngularServices();

  var TrainingDataEditorPanelService = null;
  var $uibModal = null;
  var AlertsService = null;

  var mockExternalSaveEventEmitter = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    mockExternalSaveEventEmitter = new EventEmitter();
    $provide.value('ExternalSaveService', {
      onExternalSave: mockExternalSaveEventEmitter
    });
  }));

  beforeEach(angular.mock.inject(function($injector) {
    TrainingDataEditorPanelService = $injector.get(
      'TrainingDataEditorPanelService');
    $uibModal = $injector.get('$uibModal');
    AlertsService = $injector.get('AlertsService');
    spyOn(mockExternalSaveEventEmitter, 'emit');
  }));

  it('should call $uibModal when opening training data editor', function() {
    var uibModalSpy = spyOn($uibModal, 'open').and.callThrough();
    var clearWarningsSpy = spyOn(AlertsService, 'clearWarnings').and
      .callThrough();
    TrainingDataEditorPanelService.openTrainingDataEditor();
    expect(uibModalSpy).toHaveBeenCalled();
    expect(clearWarningsSpy).toHaveBeenCalled();
    expect(mockExternalSaveEventEmitter.emit).toHaveBeenCalled();
  });
});
