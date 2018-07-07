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
 * topic domain objects.
 */

oppia.factory('TopicObjectFactory', [
  'SubtopicObjectFactory', 'SkillSummaryObjectFactory',
  function(SubtopicObjectFactory, SkillSummaryObjectFactory) {
    var Topic = function(
        id, name, description, languageCode, canonicalStoryIds,
        additionalStoryIds, uncategorizedSkillIds,
        nextSubtopicId, version, subtopics, skillIdToDescriptionMap) {
      this._id = id;
      this._name = name;
      this._description = description;
      this._languageCode = languageCode;
      this._canonicalStoryIds = canonicalStoryIds;
      this._additionalStoryIds = additionalStoryIds;
      this._uncategorizedSkillSummaries = uncategorizedSkillIds.map(
        function(skillId) {
          return SkillSummaryObjectFactory.create(
            skillId, skillIdToDescriptionMap[skillId]);
        });
      this._nextSubtopicId = nextSubtopicId;
      this._version = version;
      this._subtopics = angular.copy(subtopics);
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

    Topic.prototype.getNextSubtopicId = function() {
      return this._nextSubtopicId;
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

    Topic.prototype.getSubtopicById = function(subtopicId) {
      for (var i = 0; i < this._subtopics.length; i++) {
        var id = this._subtopics[i].getId();
        if (id === subtopicId) {
          return this._subtopics[i];
        }
      }
      return null;
    };

    // Adds a new frontend subtopic domain object to this topic.
    Topic.prototype.addSubtopic = function(title) {
      var newSubtopic = SubtopicObjectFactory.createFromTitle(
        this._nextSubtopicId, title);
      this._subtopics.push(newSubtopic);
      this._nextSubtopicId++;
    };

    // Attempts to remove a subtopic from this topic given the
    // subtopic ID.
    Topic.prototype.deleteSubtopic = function(subtopicId, isNewlyCreated) {
      var subtopicDeleted = false;
      for (var i = 0; i < this._subtopics.length; i++) {
        if (this._subtopics[i].getId() === subtopicId) {
          // When a subtopic is deleted, all the skills in it are moved to
          // uncategorized skill ids.
          var skillSummaries = this._subtopics[i].getSkillSummaries();
          for (var j = 0; j < skillSummaries.length; j++) {
            var skillId = skillSummaries[j].getId();
            var skillDescription = skillSummaries[j].getDescription();
            if (!this.hasUncategorizedSkill(skillId)) {
              this._uncategorizedSkillSummaries.push(
                SkillSummaryObjectFactory.create(skillId, skillDescription));
            }
          }
          this._subtopics.splice(i, 1);
          subtopicDeleted = true;
          break;
        }
      }
      if (!subtopicDeleted) {
        throw Error('Subtopic to delete does not exist');
      }
      if (isNewlyCreated) {
        for (var i = 0; i < this._subtopics.length; i++) {
          if (this._subtopics[i].getId() > subtopicId) {
            this._subtopics[i].decrementId();
          }
        }
        this._nextSubtopicId--;
      }
    };

    Topic.prototype.clearSubtopics = function() {
      this._subtopics.length = 0;
    };

    Topic.prototype.getSubtopics = function() {
      return this._subtopics.slice();
    };

    Topic.prototype.addCanonicalStoryId = function(storyId) {
      if (this._canonicalStoryIds.indexOf(storyId) !== -1) {
        throw Error(
          'Given story id already present in canonical story ids.');
      }
      this._canonicalStoryIds.push(storyId);
    };

    Topic.prototype.removeCanonicalStoryId = function(storyId) {
      var index = this._canonicalStoryIds.indexOf(storyId);
      if (index === -1) {
        throw Error(
          'Given story id not present in canonical story ids.');
      }
      this._canonicalStoryIds.splice(index, 1);
    };

    Topic.prototype.clearCanonicalStoryIds = function() {
      this._canonicalStoryIds.length = 0;
    };

    Topic.prototype.getCanonicalStoryIds = function() {
      return this._canonicalStoryIds.slice();
    };

    Topic.prototype.addAdditionalStoryId = function(storyId) {
      if (this._additionalStoryIds.indexOf(storyId) !== -1) {
        throw Error(
          'Given story id already present in additional story ids.');
      }
      this._additionalStoryIds.push(storyId);
    };

    Topic.prototype.removeAdditionalStoryId = function(storyId) {
      var index = this._additionalStoryIds.indexOf(storyId);
      if (index === -1) {
        throw Error(
          'Given story id not present in additional story ids.');
      }
      this._additionalStoryIds.splice(index, 1);
    };

    Topic.prototype.clearAdditionalStoryIds = function() {
      this._additionalStoryIds.length = 0;
    };

    Topic.prototype.getAdditionalStoryIds = function() {
      return this._additionalStoryIds.slice();
    };

    Topic.prototype.hasUncategorizedSkill = function(skillId) {
      return this._uncategorizedSkillSummaries.some(function(skillSummary) {
        return skillSummary.getId() === skillId;
      });
    };

    Topic.prototype.addUncategorizedSkill = function(
        skillId, skillDescription) {
      var skillIsPresentInSomeSubtopic = false;
      for (var i = 0; i < this._subtopics.length; i++) {
        if (this._subtopics[i].hasSkill(skillId)) {
          skillIsPresentInSomeSubtopic = true;
          break;
        }
      }
      if (skillIsPresentInSomeSubtopic) {
        throw Error('Given skillId is already present in a subtopic.');
      }
      if (this.hasUncategorizedSkill(skillId)) {
        throw Error('Given skillId is already an uncategorized skill.');
      }
      this._uncategorizedSkillSummaries.push(
        SkillSummaryObjectFactory.create(skillId, skillDescription));
    };

    Topic.prototype.removeUncategorizedSkill = function(skillId) {
      var index = this._uncategorizedSkillSummaries.map(function(skillSummary) {
        return skillSummary.getId();
      }).indexOf(skillId);
      if (index === -1) {
        throw Error('Given skillId is not an uncategorized skill.');
      }
      this._uncategorizedSkillSummaries.splice(index, 1);
    };

    Topic.prototype.clearUncategorizedSkills = function() {
      this._uncategorizedSkillSummaries.length = 0;
    };

    Topic.prototype.getUncategorizedSkillSummaries = function() {
      return this._uncategorizedSkillSummaries.slice();
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
      this._nextSubtopicId = otherTopic.getNextSubtopicId();
      this.clearAdditionalStoryIds();
      this.clearCanonicalStoryIds();
      this.clearUncategorizedSkills();
      this.clearSubtopics();

      var canonicalStoryIds = otherTopic.getCanonicalStoryIds();
      for (var i = 0; i < canonicalStoryIds.length; i++) {
        this.addCanonicalStoryId(canonicalStoryIds[i]);
      }

      var additionalStoryIds = otherTopic.getAdditionalStoryIds();
      for (var i = 0; i < additionalStoryIds.length; i++) {
        this.addAdditionalStoryId(additionalStoryIds[i]);
      }

      var uncategorizedSkillSummaries =
        otherTopic.getUncategorizedSkillSummaries();
      for (var i = 0; i < uncategorizedSkillSummaries.length; i++) {
        this.addUncategorizedSkill(
          uncategorizedSkillSummaries[i].getId(),
          uncategorizedSkillSummaries[i].getDescription());
      }

      this._subtopics = angular.copy(otherTopic.getSubtopics());
    };

    // Static class methods. Note that "this" is not available in static
    // contexts. This function takes a JSON object which represents a backend
    // topic python dict.
    Topic.create = function(topicBackendDict, skillIdToDescriptionDict) {
      var subtopics = topicBackendDict.subtopics.map(function(subtopic) {
        return SubtopicObjectFactory.create(subtopic, skillIdToDescriptionDict);
      });
      return new Topic(
        topicBackendDict.id, topicBackendDict.name,
        topicBackendDict.description, topicBackendDict.language_code,
        topicBackendDict.canonical_story_ids,
        topicBackendDict.additional_story_ids,
        topicBackendDict.uncategorized_skill_ids,
        topicBackendDict.next_subtopic_id, topicBackendDict.version,
        subtopics, skillIdToDescriptionDict
      );
    };

    // Create an interstitial topic that would be displayed in the editor until
    // the actual topic is fetched from the backend.
    Topic.createInterstitialTopic = function() {
      return new Topic(
        null, 'Topic name loading', 'Topic description loading',
        'en', [], [], [], 1, 1, [], {}
      );
    };
    return Topic;
  }
]);
