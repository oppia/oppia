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
        throw Error('All subtopics should be Subtopic objects');
      }
      if (typeof subtopic.getId() !== 'number') {
        throw Error('Subtopic id should be a number');
      }
      if (typeof subtopic.getTitle() !== 'string' ||
          subtopic.getTitle() === '') {
        issues.push('Subtopic title should be a non-empty string');
      }

      var skillSummaries = subtopic.getSkillSummaries();
      if (skillSummaries.constructor !== Array) {
        throw Error('Subtopic skill summaries should be an array.');
      }
      if (
        skillSummaries.some(function(skillSummary) {
          return !(skillSummary instanceof SkillSummaryObjectFactory);
        })) {
        throw Error(
          'Each subtopic skill summary should be a SkillSummary object');
      }
      if (
        skillSummaries.some(function(skillSummary) {
          return (typeof skillSummary.getId() !== 'string');
        })) {
        throw Error(
          'Each subtopic skill id should be a string');
      }
      if (
        skillSummaries.some(function(skillSummary) {
          return (
            typeof skillSummary.getDescription() !== 'string' &&
            skillSummary.getDescription() !== null);
        })) {
        throw Error(
          'Each subtopic skill description should be a string or null');
      }
      var skillIds = skillSummaries.map(function(skillSummary) {
        return skillSummary.getId();
      });
      if ((new Set(skillIds)).size !== skillIds.length) {
        throw Error('All subtopic skills should be distinct');
      }
      return issues;
    };

    var _validateTopic = function(topic) {
      var issues = [];
      if (!(topic instanceof TopicObjectFactory)) {
        throw Error('The topic should be a Topic object');
      }
      if (typeof topic.getName() !== 'string' || topic.getName() === '') {
        issues.push('Topic name should be a non empty string');
      }
      if (typeof topic.getDescription() !== 'string') {
        throw Error('Topic description should be a string');
      }
      if (typeof topic.getNextSubtopicId() !== 'number') {
        throw Error('Next subtopic id should be a number');
      }
      if (typeof topic.getLanguageCode() !== 'string') {
        throw Error('Language code should be a string');
      }
      if (topic.getSubtopics().constructor !== Array) {
        throw Error('Subtopics should be an array.');
      }

      var subtopics = topic.getSubtopics();
      var canonicalStoryIds = topic.getCanonicalStoryIds();
      var additionalStoryIds = topic.getAdditionalStoryIds();
      var uncategorizedSkillSummaries = topic.getUncategorizedSkillSummaries();
      for (var i = 0; i < subtopics.length; i++) {
        issues = issues.concat(_validateSubtopic(subtopics[i]));
      }

      if (canonicalStoryIds.constructor !== Array) {
        throw Error('Canonical story ids should be an array.');
      }
      if (new Set(canonicalStoryIds).size !== canonicalStoryIds.length) {
        throw Error('All canonical stories should be distinct.');
      }
      if (
        canonicalStoryIds.some(function(storyId) {
          return typeof storyId !== 'string';
        })) {
        throw Error('Each canonical story id should be a string');
      }

      if (additionalStoryIds.constructor !== Array) {
        throw Error('Additional story ids should be an array.');
      }
      if (new Set(additionalStoryIds).size !== additionalStoryIds.length) {
        throw Error('All additional stories should be distinct.');
      }
      if (
        additionalStoryIds.some(function(storyId) {
          return typeof storyId !== 'string';
        })) {
        throw Error('Each additional story id should be a string');
      }

      for (var i = 0; i < canonicalStoryIds.length; i++) {
        if (additionalStoryIds.indexOf(canonicalStoryIds[i]) !== -1) {
          issues.push('Canonical and additional stories should be mutually' +
          ' exclusive and should not have any common stories between them.');
        }
      }

      if (uncategorizedSkillSummaries.constructor !== Array) {
        throw Error('Uncategorized skill summaries should be an array.');
      }
      if (
        uncategorizedSkillSummaries.some(function(skillSummary) {
          return !(skillSummary instanceof SkillSummaryObjectFactory);
        })) {
        throw Error(
          'Each uncategorized skill summary should be a SkillSummary object');
      }
      if (
        uncategorizedSkillSummaries.some(function(skillSummary) {
          return (typeof skillSummary.getId() !== 'string');
        })) {
        throw Error(
          'Each uncategorized skill id should be a string');
      }
      if (
        uncategorizedSkillSummaries.some(function(skillSummary) {
          return (
            typeof skillSummary.getDescription() !== 'string' &&
            skillSummary.getDescription() !== null);
        })) {
        throw Error(
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
