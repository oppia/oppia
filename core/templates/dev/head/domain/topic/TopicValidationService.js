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
 * @fileoverview Service to validate the consistency of a topic. These
 * checks are performable in the frontend to avoid sending a potentially invalid
 * topic to the backend, which performs similar validation checks to these
 * in topic_domain.Topic and subsequent domain objects.
 */

oppia.factory('TopicValidationService', [
  function() {
    var _validateSubtopic = function(subtopic) {
      var issues = [];
      if (typeof subtopic.getId() !== 'number') {
        issues.push('Subtopic id should be a number');
      }
      if (typeof subtopic.getTitle() !== 'string') {
        issues.push('Subtopic title should be a string');
      }
      if (subtopic.getSkillSummaries().constructor !== Array) {
        issues.push('The skill summaries for subtopic should be a list.');
      }
      var skillIds = subtopic.getSkillSummaries().map(function(skillSummary) {
        return skillSummary.getId();
      });
      if (new Set(skillIds).size !== skillIds.length) {
        issues.push('All skills in a subtopic should be distinct.');
      }
      return issues;
    };

    var _validateTopic = function(topic) {
      var issues = [];
      if (typeof topic.getName() !== 'string' || topic.getName() === '') {
        issues.push('Topic name should be a non empty string');
      }
      if (typeof topic.getDescription() !== 'string') {
        issues.push('Topic description should be a string');
      }
      if (typeof topic.getNextSubtopicId() !== 'number') {
        issues.push('Next subtopic id should be a number');
      }
      if (typeof topic.getLanguageCode() !== 'string') {
        issues.push('Language code should be a string');
      }
      if (topic.getSubtopics().constructor !== Array) {
        issues.push('Subtopics should be an array.');
      }

      var subtopics = topic.getSubtopics();
      for (var i = 0; i < subtopics.length; i++) {
        issues = issues.concat(_validateSubtopic(subtopics[i]));
      }

      if (topic.getCanonicalStoryIds().constructor !== Array) {
        issues.push('Canonical story ids should be an array.');
      }
      if (new Set(topic.getCanonicalStoryIds()).size !==
          topic.getCanonicalStoryIds().length) {
        issues.push('All canonical stories should be distinct.');
      }
      if (topic.getAdditionalStoryIds().constructor !== Array) {
        issues.push('Additional story ids should be an array.');
      }
      if (new Set(topic.getAdditionalStoryIds()).size !==
          topic.getAdditionalStoryIds().length) {
        issues.push('All additional stories should be distinct.');
      }
      var canonicalStoryIds = topic.getCanonicalStoryIds();
      for (var i = 0; i < canonicalStoryIds.length; i++) {
        if (topic.getAdditionalStoryIds().indexOf(
          canonicalStoryIds[i]) !== -1) {
          issues.push('Canonical and additional stories should be mutually' +
          ' exclusive and should not have any common stories between them.');
        }
      }
      if (topic.getUncategorizedSkillSummaries().constructor !== Array) {
        issues.push('Uncategorized skill ids should be an array.');
      }
      return issues;
    };

    return {
      /**
       * Returns a list of error strings found when validating the provided
       * topic. The validation methods used in this function are written to
       * match the validations performed in the backend.
       */
      findValidationIssuesForTopic: function(topic) {
        return _validateTopic(topic);
      }
    };
  }]);
