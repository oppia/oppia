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
 * @fileoverview Tests for TopicValidationService.
 */

describe('Topic validation service', function() {
  var TopicValidationService = null;
  var TopicObjectFactory = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    TopicValidationService = $injector.get('TopicValidationService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');

    var sampleTopicBackendObject = {
      topicDict: {
        id: 'sample_topic_id',
        name: 'Topic name',
        description: 'Topic description',
        version: 1,
        uncategorized_skill_ids: ['skill_1'],
        canonical_story_ids: ['story_1'],
        additional_story_ids: ['story_2'],
        subtopics: [{
          id: 1,
          title: 'Title',
          skill_ids: ['skill_2']
        }],
        next_subtopic_id: 2,
        language_code: 'en'
      },
      skillIdToDescriptionDict: {
        skill_1: 'Description 1',
        skill_2: 'Description 2'
      }
    };
    _sampleTopic = TopicObjectFactory.create(
      sampleTopicBackendObject.topicDict,
      sampleTopicBackendObject.skillIdToDescriptionDict);
  }));

  var _findValidationIssues = function() {
    return TopicValidationService.findValidationIssuesForTopic(_sampleTopic);
  };

  it('should not find issues with a valid topic', function() {
    var issues = _findValidationIssues();
    expect(issues).toEqual([]);
  });

  it('should validate the topic and subtopic', function() {
    _sampleTopic.setName('');
    _sampleTopic.addCanonicalStoryId('story_2');
    _sampleTopic.getSubtopics()[0].setTitle('');
    _sampleTopic.getSubtopics()[0].addSkill('skill_1');

    var issues = _findValidationIssues();
    expect(issues).toEqual([
      'Topic name should not be empty.',
      'The story with id story_2 is present in both canonical ' +
      'and additional stories.',
      'Subtopic title should not be empty',
      'The skill with id skill_1 is duplicated in the topic'
    ]);
  });
});
