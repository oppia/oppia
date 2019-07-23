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
 * @fileoverview Unit tests for the learner answer info service.
 */

import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory.ts';
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory.ts';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory.ts';
import { ExplorationFeaturesService } from
  'services/ExplorationFeaturesService.ts';
import { PredictionResultObjectFactory } from
  'domain/classifier/PredictionResultObjectFactory.ts';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory.ts';
import { TopicRightsObjectFactory } from
  'domain/topic/TopicRightsObjectFactory.ts';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory.ts';

require('services/ContextService.ts');
require(
  'pages/exploration-player-page/services/learner-answer-info.service.ts');



describe('Learner answer info service', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'AnswerClassificationResultObjectFactory',
      new AnswerClassificationResultObjectFactory());
    $provide.value('ClassifierObjectFactory', new ClassifierObjectFactory());
    $provide.value(
      'ExplorationDraftObjectFactory', new ExplorationDraftObjectFactory());
    $provide.value(
      'ExplorationFeaturesService', new ExplorationFeaturesService());
    $provide.value(
      'PredictionResultObjectFactory', new PredictionResultObjectFactory());
    $provide.value('RuleObjectFactory', new RuleObjectFactory());
    $provide.value('TopicRightsObjectFactory', new TopicRightsObjectFactory());
    $provide.value(
      'WrittenTranslationObjectFactory',
      new WrittenTranslationObjectFactory());
  }));

  var ExplorationEngineService = null;
  var LearnerAnswerInfoService = null;
  var ContextService = null;

  beforeEach(angular.mock.inject(function(
    _LearnerAnswerInfoService_, _ExplorationEngineService_, _ContextService_) {
      ContextService = _ContextService_;
      ExplorationEngineService = _ExplorationEngineService_;
      LearnerAnswerInfoService = _LearnerAnswerInfoService_;
    }));

    beforeEach(function() {
      this.EXP_ID = '7';
      spyOn(ContextService, 'getExplorationId').and.returnValue(this.EXP_ID);
    });
  

  it('should increment number of attempts correctly', function() {
    expect(
      LearnerAnswerInfoService.canAskLearnerForAnswerInfo()).toEqual(false);
  });

  it('should ', function() {
    expect(LearnerAnswerInfoService.getCurrentAnswer()).toBeNull();
  });

  it('should ', function() {
    expect(
      LearnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toEqual(false);
  });
});
