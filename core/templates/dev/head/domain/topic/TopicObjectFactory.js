// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * topic domain objects.
 */

oppia.factory('TopicObjectFactory', [
  function() {
    var Topic = function(topicBackendObject) {
      this._id = topicBackendObject.id;
      this._name = topicBackendObject.name;
      this._description = topicBackendObject.description;
      this._languageCode = topicBackendObject.language_code;
      this._canonicalStoryIds = topicBackendObject.canonical_story_ids;
      this._additionalStoryIds = topicBackendObject.additional_story_ids;
      this._uncategorizedSkillIds = topicBackendObject.uncategorized_skill_ids;
      this._subtopics = topicBackendObject.subtopics;
      this._version = topicBackendObject.version;
    };

    // Instance methods

    Topic.prototype.getId = function() {
      return this._id;
    };

    Topic.prototype.getName = function() {
      return this._name;
    };

    Topic.prototype.setName = function(name) {
      this._name = name;
    };

    Topic.prototype.getDescription = function() {
      return this._description;
    };

    Topic.prototype.setDescription = function(description) {
      this._description = description;
    };

    Topic.prototype.getLanguageCode = function() {
      return this._languageCode;
    };

    Topic.prototype.setLanguageCode = function(languageCode) {
      this._languageCode = languageCode;
    };

    Topic.prototype.getVersion = function() {
      return this._version;
    };

    Topic.prototype.addCanonicalStoryId = function(storyId) {
      if (this._canonicalStoryIds.indexOf(storyId) === -1) {
        this._canonicalStoryIds.push(storyId);
        return true;
      }
      return false;
    };

    Topic.prototype.removeCanonicalStoryId = function(storyId) {
      var index = this._canonicalStoryIds.indexOf(storyId);
      if (index > -1) {
        this._canonicalStoryIds.splice(index, 1);
      }
    };

    Topic.prototype.clearCanonicalStoryIds = function() {
      this._canonicalStoryIds.length = 0;
    };

    Topic.prototype.getCanonicalStoryIds = function() {
      return this._canonicalStoryIds.slice();
    };

    Topic.prototype.addAdditionalStoryId = function(storyId) {
      if (this._additionalStoryIds.indexOf(storyId) === -1) {
        this._additionalStoryIds.push(storyId);
        return true;
      }
      return false;
    };

    Topic.prototype.removeAdditionalStoryId = function(storyId) {
      var index = this._additionalStoryIds.indexOf(storyId);
      if (index > -1) {
        this._additionalStoryIds.splice(index, 1);
      }
    };

    Topic.prototype.clearAdditionalStoryIds = function() {
      this._additionalStoryIds.length = 0;
    };

    Topic.prototype.getAdditionalStoryIds = function() {
      return this._additionalStoryIds.slice();
    };

    Topic.prototype.addUncategorizedSkillId = function(skillId) {
      if (this._uncategorizedSkillIds.indexOf(skillId) === -1) {
        this._uncategorizedSkillIds.push(skillId);
        return true;
      }
      return false;
    };

    Topic.prototype.removeUncategorizedSkillId = function(skillId) {
      var index = this._uncategorizedSkillIds.indexOf(skillId);
      if (index > -1) {
        this._uncategorizedSkillIds.splice(index, 1);
      }
    };

    Topic.prototype.clearUncategorizedSkillIds = function() {
      this._uncategorizedSkillIds.length = 0;
    };

    Topic.prototype.getUncategorizedSkillIds = function() {
      return this._uncategorizedSkillIds.slice();
    };

    Topic.prototype.clearSubtopics = function() {
      this._subtopics.length = 0;
    };

    Topic.prototype.getSubtopics = function() {
      return this._subtopics.slice();
    };


    // Reassigns all values within this topic to match the existing
    // topic. This is performed as a deep copy such that none of the
    // internal, bindable objects are changed within this topic.
    Topic.prototype.copyFromTopic = function(otherTopic) {
      this._id = otherTopic.getId();
      this.setName(otherTopic.getName());
      this.setDescription(otherTopic.getDescription());
      this.setLanguageCode(otherTopic.getLanguageCode());
      this._version = otherTopic.getVersion();
      this.clearAdditionalStoryIds();
      this.clearCanonicalStoryIds();
      this.clearUncategorizedSkillIds();
      this.clearSubtopics();

      var canonicalStoryIds = otherTopic.getCanonicalStoryIds();
      for (var i = 0; i < canonicalStoryIds.length; i++) {
        this.addCanonicalStoryId(angular.copy(canonicalStoryIds[i]));
      }

      var additionalStoryIds = otherTopic.getAdditionalStoryIds();
      for (var i = 0; i < additionalStoryIds.length; i++) {
        this.addAdditionalStoryId(angular.copy(additionalStoryIds[i]));
      }

      var uncategorizedSkillIds = otherTopic.getUncategorizedSkillIds();
      for (var i = 0; i < uncategorizedSkillIds.length; i++) {
        this.addUncategorizedSkillId(angular.copy(uncategorizedSkillIds[i]));
      }
    };

    // Static class methods. Note that "this" is not available in static
    // contexts. This function takes a JSON object which represents a backend
    // topic python dict.
    Topic.create = function(topicBackendObject) {
      return new Topic(topicBackendObject);
    };

    // Create a new, empty topic. This is not guaranteed to pass validation
    // tests.
    Topic.createEmptyTopic = function() {
      return new Topic({
        additional_story_ids: [],
        canonical_story_ids: [],
        uncategorized_skill_ids: [],
        subtopics: []
      });
    };

    return Topic;
  }
]);
