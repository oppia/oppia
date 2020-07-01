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
 * @fileoverview Service to send and receive changes to a question in the
 *  backend.
 */

require('domain/collection/guest-collection-progress.service.ts');
require('domain/exploration/AnswerGroupObjectFactory.ts');
require('domain/exploration/HintObjectFactory.ts');
require('domain/exploration/OutcomeObjectFactory.ts');
require('domain/exploration/ParamSpecObjectFactory.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/exploration/WrittenTranslationObjectFactory.ts');
require('domain/objects/FractionObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');

require('domain/question/question-domain.constants.ajs.ts');

angular.module('oppia').factory('EditableQuestionBackendApiService', [
  '$http', '$q', 'QuestionObjectFactory',
  'UrlInterpolationService',
  'EDITABLE_QUESTION_DATA_URL_TEMPLATE', 'QUESTION_CREATION_URL',
  'QUESTION_SKILL_LINK_URL_TEMPLATE',
  function(
      $http, $q, QuestionObjectFactory,
      UrlInterpolationService,
      EDITABLE_QUESTION_DATA_URL_TEMPLATE, QUESTION_CREATION_URL,
      QUESTION_SKILL_LINK_URL_TEMPLATE) {
    var _createQuestion = function(
        skillIds, skillDifficulties,
        questionDict, imagesData, successCallback, errorCallback) {
      var postData = {
        question_dict: questionDict,
        skill_ids: skillIds,
        skill_difficulties: skillDifficulties
      };
      let body = new FormData();
      body.append('payload', JSON.stringify(postData));
      let filenames = imagesData.map(obj => obj.filename);
      let imageBlobs = imagesData.map(obj => obj.imageBlob);
      for (let idx in imageBlobs) {
        body.append(filenames[idx], imageBlobs[idx]);
      }
      $http.post(QUESTION_CREATION_URL, (body), {
        // The actual header to be added for form-data is 'multipart/form-data',
        // But adding it manually won't work because we will miss the boundary
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
      }).then(function(response) {
        var questionId = response.data.question_id;
        if (successCallback) {
          successCallback(questionId);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _fetchQuestion = function(questionId, successCallback, errorCallback) {
      var questionDataUrl = UrlInterpolationService.interpolateUrl(
        EDITABLE_QUESTION_DATA_URL_TEMPLATE, {
          question_id: questionId
        });

      $http.get(questionDataUrl).then(function(response) {
        var questionObject =
          QuestionObjectFactory.createFromBackendDict(
            response.data.question_dict);
        var skillDicts = angular.copy(
          response.data.associated_skill_dicts);
        if (successCallback) {
          successCallback({
            questionObject: questionObject,
            associated_skill_dicts: skillDicts
          });
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _updateQuestion = function(
        questionId, questionVersion, commitMessage, changeList,
        successCallback, errorCallback) {
      var editableQuestionDataUrl = UrlInterpolationService.interpolateUrl(
        EDITABLE_QUESTION_DATA_URL_TEMPLATE, {
          question_id: questionId
        });

      var putData = {
        version: questionVersion,
        commit_message: commitMessage,
        change_list: changeList
      };
      $http.put(editableQuestionDataUrl, putData).then(function(response) {
        // The returned data is an updated question dict.
        var questionDict = angular.copy(response.data.question_dict);

        if (successCallback) {
          successCallback(questionDict);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _editQuestionSkillLinks = function(
        questionId, skillIdsTaskArray, difficulty,
        successCallback, errorCallback) {
      var editQuestionSkillLinkUrl = UrlInterpolationService.interpolateUrl(
        QUESTION_SKILL_LINK_URL_TEMPLATE, {
          question_id: questionId
        });
      $http.put(editQuestionSkillLinkUrl, {
        action: 'edit_links',
        difficulty: difficulty,
        skill_ids_task_list: skillIdsTaskArray
      }).then(function(response) {
        if (successCallback) {
          successCallback();
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _changeDifficulty = function(
        questionId, skillId, newDifficulty, successCallback, errorCallback) {
      var changeDifficultyUrl = UrlInterpolationService.interpolateUrl(
        QUESTION_SKILL_LINK_URL_TEMPLATE, {
          question_id: questionId
        });
      var putData = {
        new_difficulty: newDifficulty,
        action: 'update_difficulty',
        skill_id: skillId
      };
      $http.put(changeDifficultyUrl, putData).then(function(response) {
        if (successCallback) {
          successCallback();
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    return {
      createQuestion: function(
          skillIds, skillDifficulties, questionDict, imagesData) {
        return $q(function(resolve, reject) {
          _createQuestion(skillIds, skillDifficulties,
            questionDict, imagesData, resolve, reject);
        });
      },

      fetchQuestion: function(questionId) {
        return $q(function(resolve, reject) {
          _fetchQuestion(questionId, resolve, reject);
        });
      },

      editQuestionSkillLinks: function(
          questionId, skillIdsTaskArray, difficulty) {
        return $q(function(resolve, reject) {
          _editQuestionSkillLinks(
            questionId, skillIdsTaskArray, difficulty, resolve, reject);
        });
      },

      changeDifficulty: function(questionId, skillId, newDifficulty) {
        return $q(function(resolve, reject) {
          _changeDifficulty(
            questionId, skillId, newDifficulty, resolve, reject);
        });
      },

      /**
       * Updates a question in the backend with the provided question ID.
       * The changes only apply to the question of the given version and the
       * request to update the question will fail if the provided question
       * version is older than the current version stored in the backend. Both
       * the changes and the message to associate with those changes are used
       * to commit a change to the question. The new question is passed to
       * the success callback, if one is provided to the returned promise
       * object. Errors are passed to the error callback, if one is provided.
       */
      updateQuestion: function(
          questionId, questionVersion, commitMessage, changeList) {
        return $q(function(resolve, reject) {
          _updateQuestion(
            questionId, questionVersion, commitMessage, changeList,
            resolve, reject);
        });
      }
    };
  }
]);
