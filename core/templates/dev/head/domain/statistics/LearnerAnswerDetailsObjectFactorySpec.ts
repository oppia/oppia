// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for LearnerAnswerDetailsObjectFactory.
 */

require('domain/statistics/LearnerAnswerInfoObjectFactory.ts');
require('domain/statistics/LearnerAnswerDetailsObjectFactory.ts');

describe('Learner answer details object factory', function() {
  var LearnerAnswerDetailsObjectFactory = null;
  var LearnerAnswerInfoObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    LearnerAnswerDetailsObjectFactory = $injector.get(
      'LearnerAnswerDetailsObjectFactory');
    LearnerAnswerInfoObjectFactory = $injector.get(
      'LearnerAnswerInfoObjectFactory');
  }));

  it('should create a default learner answer details object', function() {
    var learnerAnswerInfo = (
      LearnerAnswerInfoObjectFactory.createDefaultLearnerAnswerInfo(
        'This is answer', 'This is answer details'));
    var learnerAnswerDetails = (
      LearnerAnswerDetailsObjectFactory.createDefaultLearnerAnswerDetails(
        'fakeExpId', 'fakeStateName', 'fakeInteractionId',
        'fakeCustomizationArgs', [learnerAnswerInfo]));

    expect(learnerAnswerDetails.getExpId()).toEqual('fakeExpId');
    expect(learnerAnswerDetails.getStateName()).toEqual('fakeStateName');
    expect(learnerAnswerDetails.getLearnerAnswerInfoData()).toEqual(
      [learnerAnswerInfo]);
  });
});
