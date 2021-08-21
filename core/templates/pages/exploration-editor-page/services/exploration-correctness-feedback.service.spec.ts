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

import { TestBed } from '@angular/core/testing';
import { ExplorationDataService } from './exploration-data.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
/* eslint-disable-next-line max-len */
require('pages/exploration-editor-page/services/exploration-correctness-feedback.service');

describe('Exploration Correctness Feedback Service', function() {
  var ExplorationCorrectnessFeedbackService;
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: 0,
            autosaveChangeListAsync() {
              return;
            }
          }
        }
      ]
    });
  });


  beforeEach(angular.mock.inject(function($injector) {
    ExplorationCorrectnessFeedbackService = $injector.get(
      'ExplorationCorrectnessFeedbackService');
  }));

  it('should toggle correctness feedback display', function() {
    var isValidSpy = spyOn(
      ExplorationCorrectnessFeedbackService, '_isValid').and.callThrough();

    // Function isEnabled() returns undefined in the first time.
    expect(ExplorationCorrectnessFeedbackService.isEnabled()).toBeFalsy();

    ExplorationCorrectnessFeedbackService.toggleCorrectnessFeedback();
    ExplorationCorrectnessFeedbackService.isEnabled();
    expect(ExplorationCorrectnessFeedbackService.isEnabled()).toBe(true);

    ExplorationCorrectnessFeedbackService.toggleCorrectnessFeedback();
    expect(ExplorationCorrectnessFeedbackService.isEnabled()).toBe(false);

    expect(isValidSpy).toHaveBeenCalledTimes(2);
  });
});
