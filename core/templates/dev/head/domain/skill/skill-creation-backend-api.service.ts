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
 * @fileoverview Backend service for creating a new skills
 */

angular.module('oppia').factory('SkillCreationBackendApiService', [
  '$http', '$q',
  function($http, $q) {
    var _createSkill = function(successCallback, errorCallback,
        description, rubrics, explanation, linkedTopicIds) {
      let postData = {
        description: description,
        linked_topic_ids: linkedTopicIds,
        explanation_dict: explanation,
        rubrics: rubrics
      };
      $http.post('/skill_editor_handler/create_new', postData)
        .then(function(response) {
          let skillId = response.data.skill_id;
          if (successCallback) {
            successCallback(skillId);
          }
        }, function(errorResponse) {
          if (errorCallback) {
            errorCallback(errorResponse.data);
          }
        });
    };

    return {
      createSkill: function(description, rubrics, explanation, linkedTopicIds) {
        return $q(function(resolve, reject) {
          _createSkill(resolve, reject, description,
            rubrics, explanation, linkedTopicIds);
        });
      }
    };
  }
]);
