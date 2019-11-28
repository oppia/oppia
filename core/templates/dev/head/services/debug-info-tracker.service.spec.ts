// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for DebugInfoTrackerService.
 */

import { UpgradedServices } from 'services/UpgradedServices';

require('services/debug-info-tracker.service.ts');

describe('DebugInfoTrackerService', function() {
  var DebugInfoTrackerService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    DebugInfoTrackerService = $injector.get('DebugInfoTrackerService');
  }));

  it('should add new actions', function() {
    DebugInfoTrackerService.addAction({
      index: 1,
      interactionId: 'Continue'
    });
    DebugInfoTrackerService.addAction({
      index: 2,
      interactionId: 'MultipleChoiceInput'
    });
    expect(DebugInfoTrackerService.getSequenceOfActions()).toEqual([{
      index: 1,
      interactionId: 'Continue'
    }, {
      index: 2,
      interactionId: 'MultipleChoiceInput'
    }]);
  });

  it('should reset the sequence correctly', function() {
    DebugInfoTrackerService.addAction({
      index: 1,
      interactionId: 'Continue'
    });
    expect(DebugInfoTrackerService.getSequenceOfActions()).toEqual([{
      index: 1,
      interactionId: 'Continue'
    }]);
    DebugInfoTrackerService.reset();
    expect(DebugInfoTrackerService.getSequenceOfActions()).toEqual([]);
  });
});
