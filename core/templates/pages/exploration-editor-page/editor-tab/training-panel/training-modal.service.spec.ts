// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TrainingModalService.
 */

import { EventEmitter } from '@angular/core';

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Training Modal Service', function() {
  var $rootScope;
  var TrainingModalService = null;
  var AlertsService = null;
  var RouterService = null;

  var mockExternalSaveEventEmitter = new EventEmitter();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('RouterService', {
      onExternalSave: mockExternalSaveEventEmitter
    });
  }));

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    TrainingModalService = $injector.get(
      'TrainingModalService');
    AlertsService = $injector.get('AlertsService');
    RouterService = $injector.get('RouterService');
  }));

  it('should open $uibModal', function() {
    spyOn(mockExternalSaveEventEmitter, 'emit').and.callThrough();
    var clearWarningsSpy = spyOn(AlertsService, 'clearWarnings')
      .and.callThrough();
    TrainingModalService.openTrainUnresolvedAnswerModal();

    expect(clearWarningsSpy).toHaveBeenCalled();
    expect(mockExternalSaveEventEmitter.emit).toHaveBeenCalled();
  });
});
