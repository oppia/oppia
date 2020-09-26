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
      submitSuggestion: function(
          question, associatedSkill, skillDifficulty, imagesData, onSuccess) {
        var url = '/suggestionhandler/';
        var postData = {
          suggestion_type: 'add_question',
          target_type: 'skill',
          description: 'Add new question',
          target_id: associatedSkill.getId(),
          target_version_at_submission: associatedSkill.getVersion(),
          change: {
            cmd: 'create_new_fully_specified_question',
            question_dict: question.toBackendDict(true),
            skill_id: associatedSkill.getId(),
            skill_difficulty: skillDifficulty,
          }
        };
        let body = new FormData();
        body.append('payload', JSON.stringify(postData));
        let filenames = imagesData.map(obj => obj.filename);
        let imageBlobs = imagesData.map(obj => obj.imageBlob);
        for (let idx in imageBlobs) {
          body.append(filenames[idx], imageBlobs[idx]);
        }
        $http.post(url, body, {
          // The actual header to be added is 'multipart/form-data', But
          // adding it manually won't work because we will miss the boundary
          // parameter. When we keep 'Content-Type' as undefined the browser
          // automatically fills the boundary parameter according to the form
          // data. Refer https://stackoverflow.com/questions/37039852/. and
          // https://stackoverflow.com/questions/34983071/.
          // Note: This should be removed and a convetion similar to
          // SkillCreationBackendApiService should be followed once this service
          // is migrated to Angular 8.
          headers: {
            'Content-Type': undefined
          }
        }).then(onSuccess);
      }
    };
  }]);
