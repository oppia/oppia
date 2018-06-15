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
    var TopicRights = function(topicRightsObject) {
      this._topicId = topicRightsObject.topic_id;
      this._isPublished = topicRightsObject.is_published;
      this._canEditTopic = topicRightsObject.can_edit_topic;
    };

    // Instance methods

    TopicRights.prototype.getTopicId = function() {
      return this._topicId;
    };

    TopicRights.prototype.getCanEditTopic = function() {
      return this._canEditTopic;
    };

    TopicRights.prototype.getIsPublished = function() {
      return this._isPublished;
    };

    // Sets _isPublished to true only if the user can edit the
    // corresponding topic.
    TopicRights.prototype.publishTopic = function() {
      if (this._canEditTopic) {
        this._isPublished = true;
      } else {
        throw new Error('User is not allowed to edit this topic.');
      }
    };

    // Sets _isPublished to false if user can edit the topic.
    TopicRights.prototype.unpublishTopic = function() {
      if (this._canEditTopic) {
        this._isPublished = false;
      } else {
        throw new Error('User is not allowed to edit this topic.');
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
      this._topicId = otherTopicRights.getTopicId();
      this._isPublished = otherTopicRights.getIsPublished();
      this._canEditTopic = otherTopicRights.getCanEditTopic();
    };

    // Create a new, empty topic rights object. This is not guaranteed to
    // pass validation tests.
    TopicRights.createEmptyTopicRights = function() {
      return new TopicRights({});
    };

    return TopicRights;
  }
]);
