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
 * @fileoverview Unit tests for the number attempts service.
 */

require('pages/exploration-player-page/services/learner-answer-info.service.ts');

describe('Learner answer info service', function() {
  beforeEach(angular.mock.module('oppia'));

  var LearnerAnswerInfoService = null;
  beforeEach(angular.mock.inject(function($injector) {
    LearnerAnswerInfoService = $injector.get('LearnerAnswerInfoService');
  }));

  it('should increment number of attempts correctly', function() {
    expect(LearnerAnswerInfoService.canAskLearnerForAnswerInfo()).toEqual(false);
  });

  it('should ', function() {
    expect(LearnerAnswerInfoService.getCurrentAnswer()).toBeNull();
  });

  it('should ', function() {
    expect(LearnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toEqual(false);
  });
});
