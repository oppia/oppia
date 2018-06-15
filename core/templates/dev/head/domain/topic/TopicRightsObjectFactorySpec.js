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
 * @fileoverview Tests for TopicRightsObjectFactory.
 */

describe('Topic rights object factory', function() {
  var TopicRightsObjectFactory = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    TopicRightsObjectFactory = $injector.get('TopicRightsObjectFactory');
    var initialTopicRightsBackendObject = {
      topic_id: 'topic_id',
      is_published: false,
      can_edit_topic: true
    };

    sampleTopicRights = TopicRightsObjectFactory.create(
      initialTopicRightsBackendObject);
  }));

  it('should be able to publish and unpublish topic when user can edit it',
    function() {
      expect(sampleTopicRights.getIsPublished()).toBe(false);

      sampleTopicRights.publishTopic();
      expect(sampleTopicRights.getIsPublished()).toBe(true);

      sampleTopicRights.unpublishTopic();
      expect(sampleTopicRights.getIsPublished()).toBe(false);
    });

  it('should throw error and not be able to publish or unpublish topic when ' +
    'user cannot edit topic',
  function() {
    expect(sampleTopicRights.getIsPublished()).toBe(false);

    var exampleTopicRightsBackendObject = {
      topic_id: 'topic_id',
      is_published: false,
      can_edit_topic: false
    };

    exampleTopicRights = TopicRightsObjectFactory.create(
      exampleTopicRightsBackendObject);

    expect(function() {
      exampleTopicRights.publishTopic();
    }).toThrow(new Error('User is not allowed to edit this topic.'));

    expect(function() {
      exampleTopicRights.unpublishTopic();
    }).toThrow(new Error('User is not allowed to edit this topic.'));
  });

  it('should create an empty topic rights object', function() {
    var emptyTopicRightsBackendObject = (
      TopicRightsObjectFactory.createEmptyTopicRights());

    expect(
      emptyTopicRightsBackendObject.getTopicId()).toBeUndefined();
    expect(emptyTopicRightsBackendObject.getIsPublished()).toBeUndefined();
    expect(emptyTopicRightsBackendObject.getCanEditTopic()).toBeUndefined();
  });

  it('should make a copy from another topic rights', function() {
    var emptyTopicRightsBackendObject = (
      TopicRightsObjectFactory.createEmptyTopicRights());

    emptyTopicRightsBackendObject.copyFromTopicRights(sampleTopicRights);
    expect(
      emptyTopicRightsBackendObject.getTopicId()).toEqual('topic_id');
    expect(emptyTopicRightsBackendObject.getIsPublished()).toEqual(false);
    expect(emptyTopicRightsBackendObject.getCanEditTopic()).toEqual(true);
  });
});
