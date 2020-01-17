// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ExplorationCorrectnessFeedbackService
 */

import { UpgradedServices } from 'services/UpgradedServices';

/* eslint-disable max-len */
require('pages/exploration-editor-page/services/exploration-correctness-feedback.service');
/* eslint-enable max-len */
require('pages/exploration-editor-page/services/exploration-property.service');

describe('Exploration Correctness Feedback Service', function() {
  var ExplorationCorrectnessFeedbackService, ExplorationPropertyService;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('ExplorationDataService', {
        autosaveChangeList: function() {}
      });
    });
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector) {
    ExplorationPropertyService = $injector.get('ExplorationPropertyService');
    ExplorationCorrectnessFeedbackService = $injector.get(
      'ExplorationCorrectnessFeedbackService');
  }));

  it('should toggle correctness feedback display', function() {
    var isValidSpy = spyOn(
      ExplorationCorrectnessFeedbackService, '_isValid').and.callThrough();

    // isEnabled() returns undefined in the first time.
    expect(ExplorationCorrectnessFeedbackService.isEnabled()).toBeFalsy();

    ExplorationCorrectnessFeedbackService.toggleCorrectnessFeedback();
    ExplorationCorrectnessFeedbackService.isEnabled();
    expect(ExplorationCorrectnessFeedbackService.isEnabled()).toBe(true);

    ExplorationCorrectnessFeedbackService.toggleCorrectnessFeedback();
    expect(ExplorationCorrectnessFeedbackService.isEnabled()).toBe(false);

    expect(isValidSpy).toHaveBeenCalledTimes(2);
  });
});
