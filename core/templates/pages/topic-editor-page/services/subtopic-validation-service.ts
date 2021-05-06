// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to validate subtopic name.
 */

require('pages/topic-editor-page/services/topic-editor-state.service.ts');

// TODO(#9186): Change variable name to 'constants' once this file
// is migrated to Angular.
import subtopicValidationConstants from 'assets/constants';

angular.module('oppia').factory('SubtopicValidationService', [
  'TopicEditorStateService', function(
      TopicEditorStateService) {
    const VALID_URL_FRAGMENT_REGEX = new RegExp(
      subtopicValidationConstants.VALID_URL_FRAGMENT_REGEX);
    var checkValidSubtopicName = function(title) {
      var subtopicTitles = [];
      var topic = TopicEditorStateService.getTopic();
      topic.getSubtopics().forEach(
        function(subtopic) {
          subtopicTitles.push(subtopic.getTitle());
        });
      return subtopicTitles.indexOf(title) === -1;
    };

    var doesSubtopicWithUrlFragmentExist = function(urlFragment) {
      var topic = TopicEditorStateService.getTopic();
      return topic.getSubtopics().some(
        subtopic => subtopic.getUrlFragment() === urlFragment);
    };

    var isUrlFragmentValid = function(urlFragment) {
      return VALID_URL_FRAGMENT_REGEX.test(urlFragment);
    };

    return {
      checkValidSubtopicName: checkValidSubtopicName,
      doesSubtopicWithUrlFragmentExist: doesSubtopicWithUrlFragmentExist,
      isUrlFragmentValid: isUrlFragmentValid
    };
  }
]);
