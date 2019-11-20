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
 * @fileoverview Tests for TopicSummaryObjectFactory.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('domain/topic/TopicSummaryObjectFactory.ts');

describe('Topic summary object factory', function() {
  var TopicSummaryObjectFactory = null;
  var _sampleTopicSummary = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    TopicSummaryObjectFactory = $injector.get('TopicSummaryObjectFactory');

    var sampleTopicSummaryBackendDict = {
      id: 'sample_topic_id',
      name: 'Topic Name',
      subtopic_count: 5,
      canonical_story_count: 4,
      total_skill_count: 10,
      uncategorized_skill_count: 3
    };
    _sampleTopicSummary = TopicSummaryObjectFactory.createFromBackendDict(
      sampleTopicSummaryBackendDict);
  }));

  it('should be able to get all the values', function() {
    expect(_sampleTopicSummary.getId()).toEqual('sample_topic_id');
    expect(_sampleTopicSummary.getName()).toEqual('Topic Name');
    expect(_sampleTopicSummary.getSubtopicCount()).toEqual(5);
    expect(_sampleTopicSummary.getCanonicalStoryCount()).toEqual(4);
    expect(_sampleTopicSummary.getTotalSkillCount()).toEqual(10);
    expect(_sampleTopicSummary.getUncategorizedSkillCount()).toEqual(3);
  });
});
