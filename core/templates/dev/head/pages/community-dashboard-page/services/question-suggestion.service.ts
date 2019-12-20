// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A service for handling question suggestions.
 */

angular.module('oppia').factory('QuestionSuggestionService', [
  '$http', function($http) {
    return {
      submitSuggestion: function(question, associatedSkill, topicName) {
        var url = '/suggestionhandler/';
        var data = {
          suggestion_type: 'add_question',
          target_type: 'skill',
          description: 'Add new question',
          target_id: associatedSkill.getId(),
          target_version_at_submission: associatedSkill.getVersion(),
          assigned_reviewer_id: '',
          final_reviewer_id: '',
          change: {
            cmd: 'create_new_fully_specified_question',
            question_dict: question.toBackendDict(true),
            skill_id: associatedSkill.getId(),
            topic_name: topicName,
          }
        };
        $http.post(url, data);
      }
    };
  }]);
