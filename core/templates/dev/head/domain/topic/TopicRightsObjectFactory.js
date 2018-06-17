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
 * @fileoverview Factory for creating and mutating instances of frontend
 * topic rights domain objects.
 */

oppia.factory('TopicRightsObjectFactory', [
  function() {
    var TopicRights = function(topicRightsBackendObject) {
      this._published = topicRightsBackendObject.published;
      this._canPublishTopic = topicRightsBackendObject.can_publish_topic;
      this._canEditTopic = topicRightsBackendObject.can_edit_topic;
    };

    // Instance methods

    TopicRights.prototype.canEditTopic = function() {
      return this._canEditTopic;
    };

    TopicRights.prototype.isPublished = function() {
      return this._published;
    };

    TopicRights.prototype.canPublishTopic = function() {
      return this._canPublishTopic;
    };

    // Currently only admins can publish/unpublish a topic or edit it's name.
    TopicRights.prototype.canEditName = function() {
      return this._canPublishTopic;
    };

    // Sets _isPublished to true only if the user can publish the
    // corresponding topic.
    TopicRights.prototype.markTopicAsPublished = function() {
      if (this._canPublishTopic) {
        this._published = true;
      } else {
        throw new Error('User is not allowed to publish this topic.');
      }
    };

    // Sets _isPublished to false if user can unpublish the topic.
    TopicRights.prototype.markTopicAsUnpublished = function() {
      if (this._canPublishTopic) {
        this._published = false;
      } else {
        throw new Error('User is not allowed to unpublish this topic.');
      }
    };

    // This function takes a JSON object which represents a backend
    // topic python dict.
    TopicRights.create = function(topicRightsBackendObject) {
      return new TopicRights(angular.copy(topicRightsBackendObject));
    };

    // Reassigns all values within this topic to match the existing
    // topic rights. This is performed as a deep copy such that none of the
    // internal, bindable objects are changed within this topic rights.
    TopicRights.prototype.copyFromTopicRights = function(otherTopicRights) {
      this._published = otherTopicRights.isPublished();
      this._canEditTopic = otherTopicRights.canEditTopic();
      this._canPublishTopic = otherTopicRights.canPublishTopic();
    };

    // Create a new, empty topic rights object. This is not guaranteed to
    // pass validation tests.
    TopicRights.createEmptyTopicRights = function() {
      return new TopicRights({
        published: null,
        can_publish_topic: null,
        can_edit_topic: null
      });
    };

    return TopicRights;
  }
]);
