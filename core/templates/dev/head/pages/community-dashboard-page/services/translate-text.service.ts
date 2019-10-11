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
 * @fileoverview A service for handling contribution opportunities in different
 * fields.
 */

angular.module('oppia').factory('TranslateTextService', [
  '$http', function($http) {
    var stateWiseContents = null;
    var stateWiseContentIds = {};
    var activeStateName = null;
    var activeContentId = null;
    var stateNamesList = [];
    var activeExpId = null;
    var activeExpVersion = null;

    var getNextContentId = function() {
      return stateWiseContentIds[activeStateName].pop();
    };
    var getNextState = function() {
      var currentIndex = stateNamesList.indexOf(activeStateName);
      return stateNamesList[currentIndex + 1];
    };

    var getNextText = function() {
      activeContentId = getNextContentId();
      if (!activeContentId) {
        activeStateName = getNextState();
        if (!activeStateName) {
          return null;
        }
        activeContentId = getNextContentId();
      }
      return stateWiseContents[activeStateName][activeContentId];
    };

    var isMoreTextAvailableForTranslation = function() {
      return !(
        stateNamesList.indexOf(activeStateName) + 1 === stateNamesList.length &&
          stateWiseContentIds[activeStateName].length === 0);
    };

    return {
      init: function(expId, languageCode, successCallback) {
        stateWiseContents = null;
        stateWiseContentIds = {};
        activeStateName = null;
        activeContentId = null;
        stateNamesList = [];
        activeExpId = expId;
        activeExpVersion = null;
        $http.get(
          '/gettranslatabletexthandler', {
            params: {
              exp_id: expId,
              language_code: languageCode
            }
          }).then(
          function(response) {
            stateWiseContents = response.data.state_names_to_content_id_mapping;
            activeExpVersion = response.data.version;
            for (var stateName in stateWiseContents) {
              stateNamesList.push(stateName);
              var contentIds = [];
              for (var contentId in stateWiseContents[stateName]) {
                contentIds.push(contentId);
              }
              stateWiseContentIds[stateName] = contentIds;
            }
            activeStateName = stateNamesList[0];
            successCallback();
          });
      },
      getTextToTranslate: function() {
        return {
          text: getNextText(),
          more: isMoreTextAvailableForTranslation()
        };
      },
      suggestTranslatedText: function(
          translationHtml, languageCode, successCallback) {
        var url = '/suggestionhandler/';
        var data = {
          suggestion_type: 'translate_content',
          target_type: 'exploration',
          description: 'Adds translation',
          target_id: activeExpId,
          target_version_at_submission: activeExpVersion,
          assigned_reviewer_id: null,
          final_reviewer_id: null,
          change: {
            cmd: 'add_translation',
            content_id: activeContentId,
            state_name: activeStateName,
            language_code: languageCode,
            content_html: stateWiseContents[activeStateName][activeContentId],
            translation_html: translationHtml
          }
        };
        $http.post(url, data).then(successCallback);
      }
    };
  }]);
