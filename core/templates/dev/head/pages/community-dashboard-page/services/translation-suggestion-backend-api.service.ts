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
 * @fileoverview A backend API service for translation suggestions
 */

angular.module('oppia').factory('TranslateTextBackendService', [
  '$http', '$q',
  function($http, $q) {
    var fetchTranslatableText = function(expId, languageCode, successCallback,
        errorCallback) {
      $http.get(
        '/gettranslatabletexthandler', { params: {
          exp_id: expId,
          language_code: languageCode
        }})
        .then(function(response) {
          if (successCallback) {
            successCallback(
              response.data.state_names_to_content_id_mapping,
              response.data.version);
          }
        }, function() {
          if (errorCallback) {
            errorCallback();
          }
        });
    };

    var suggestTranslation = function(data, successCallback,
        errorCallback) {
      $http.post('/suggestionhandler/', data).then(function(response) {
        if (successCallback) {
          successCallback(response.data);
        }
      }, function() {
        if (errorCallback) {
          errorCallback();
        }
      });
    };

    return {
      getTranslatableText: function(expId, languageCode) {
        return $q(function(resolve, reject) {
          fetchTranslatableText(expId, languageCode, resolve, reject);
        });
      },
      suggestTranslation: function(
          translationHtml, languageCode, expId,
          expVersion, contentId, stateName,
          contentHtml) {
        var data = {
          suggestion_type: 'translate_content',
          target_type: 'exploration',
          description: 'Adds translation',
          target_id: expId,
          target_version_at_submission: expVersion,
          assigned_reviewer_id: null,
          final_reviewer_id: null,
          change: {
            cmd: 'add_translation',
            content_id: contentId,
            state_name: stateName,
            language_code: languageCode,
            content_html: contentHtml,
            translation_html: translationHtml
          }
        };
        return $q(function(resolve, reject) {
          suggestTranslation(data, resolve, reject);
        });
      }
    };
  }
]);
