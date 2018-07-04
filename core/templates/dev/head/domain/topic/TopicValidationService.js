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
  'TopicObjectFactory', 'SubtopicObjectFactory', 'SkillSummaryObjectFactory',
  function(
      TopicObjectFactory, SubtopicObjectFactory, SkillSummaryObjectFactory) {
    var _validateSubtopic = function(subtopic) {
      var issues = [];
      if (!(subtopic instanceof SubtopicObjectFactory)) {
        issues.push('All subtopics should be Subtopic objects');
        return issues;
      }
      if (typeof subtopic.getId() !== 'number') {
        issues.push('Subtopic id should be a number');
      }
      if (typeof subtopic.getTitle() !== 'string') {
        issues.push('Subtopic title should be a string');
      }
      if (subtopic.getSkillSummaries().constructor !== Array) {
        issues.push('The skill summaries for subtopic should be a list.');
      }
      var skillSummaries = subtopic.getSkillSummaries();
      if (skillSummaries.constructor !== Array) {
        issues.push('Subtopic skill summaries should be an array.');
      }
      if (
        skillSummaries.some(function(skillSummary) {
          return !(skillSummary instanceof SkillSummaryObjectFactory);
        })) {
        issues.push(
          'Each subtopic skill summary should be a SkillSummary object');
      }
      if (
        skillSummaries.some(function(skillSummary) {
          return (typeof skillSummary.getId() !== 'string');
        })) {
        issues.push(
          'Each subtopic skill id should be a string');
      }
      if (
        skillSummaries.some(function(skillSummary) {
          return (
            typeof skillSummary.getDescription() !== 'string' &&
            skillSummary.getDescription() !== null);
        })) {
        issues.push(
          'Each subtopic skill description should be a string or null');
      }
      var skillIds = skillSummaries.map(function(skillSummary) {
        return skillSummary.getId();
      });
      if ((new Set(skillIds)).size !== skillIds.length) {
        issues.push('All subtopic skills should be distinct');
      }
      return issues;
    };

    var _validateTopic = function(topic) {
      var issues = [];
      if (!(topic instanceof TopicObjectFactory)) {
        issues.push('The topic should be a Topic object');
        return issues;
      }
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
      var canonicalStoryIds = topic.getCanonicalStoryIds();
      var additionalStoryIds = topic.getAdditionalStoryIds();
      var uncategorizedSkillSummaries = topic.getUncategorizedSkillSummaries();
      for (var i = 0; i < subtopics.length; i++) {
        issues = issues.concat(_validateSubtopic(subtopics[i]));
      }

      if (canonicalStoryIds.constructor !== Array) {
        issues.push('Canonical story ids should be an array.');
      }
      if (new Set(canonicalStoryIds).size !== canonicalStoryIds.length) {
        issues.push('All canonical stories should be distinct.');
      }
      if (
        canonicalStoryIds.some(function(storyId) {
          return typeof storyId !== 'string';
        })) {
        issues.push('Each canonical story id should be a string');
      }

      if (additionalStoryIds.constructor !== Array) {
        issues.push('Additional story ids should be an array.');
      }
      if (new Set(additionalStoryIds).size !== additionalStoryIds.length) {
        issues.push('All additional stories should be distinct.');
      }
      if (
        additionalStoryIds.some(function(storyId) {
          return typeof storyId !== 'string';
        })) {
        issues.push('Each additional story id should be a string');
      }

      for (var i = 0; i < canonicalStoryIds.length; i++) {
        if (additionalStoryIds.indexOf(canonicalStoryIds[i]) !== -1) {
          issues.push('Canonical and additional stories should be mutually' +
          ' exclusive and should not have any common stories between them.');
        }
      }

      if (uncategorizedSkillSummaries.constructor !== Array) {
        issues.push('Uncategorized skill summaries should be an array.');
      }
      if (
        uncategorizedSkillSummaries.some(function(skillSummary) {
          return !(skillSummary instanceof SkillSummaryObjectFactory);
        })) {
        issues.push(
          'Each uncategorized skill summary should be a SkillSummary object');
      }
      if (
        uncategorizedSkillSummaries.some(function(skillSummary) {
          return (typeof skillSummary.getId() !== 'string');
        })) {
        issues.push(
          'Each uncategorized skill id should be a string');
      }
      if (
        uncategorizedSkillSummaries.some(function(skillSummary) {
          return (
            typeof skillSummary.getDescription() !== 'string' &&
            skillSummary.getDescription() !== null);
        })) {
        issues.push(
          'Each uncategorized skill description should be a string or null');
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
