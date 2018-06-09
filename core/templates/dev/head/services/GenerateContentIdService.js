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
 * @fileoverview A service for generating random and unique content_id for
 * SubtitledHtml domain objects.
 */

oppia.factory('GenerateContentIdService', [
  'stateContentIdsToAudioTranslationsService', 'COMPONENT_NAME_FEEDBACK',
  'COMPONENT_NAME_HINT', function(
      stateContentIdsToAudioTranslationsService, COMPONENT_NAME_FEEDBACK,
      COMPONENT_NAME_HINT) {
    var generateIdForHintOrFeedback = function(componentName) {
      var contentIdList = stateContentIdsToAudioTranslationsService
        .displayed.getAllContentId();
      var searchKey = componentName + '_';
      var count = 0;
      for (contentId in contentIdList) {
        if (contentIdList[contentId].indexOf(searchKey) === 0) {
          var tempCount = parseInt(contentIdList[contentId].split('_')[1]);
          if (tempCount > count) {
            count = tempCount;
          }
        }
      }
      return (searchKey + String(count + 1));
    };

    var _generateUniqueId = function(componentName) {
      if (componentName === COMPONENT_NAME_FEEDBACK ||
          componentName === COMPONENT_NAME_HINT) {
        return generateIdForHintOrFeedback(componentName);
      }
    };
    return {
      generateUniqueId: function(componentName) {
        return _generateUniqueId(componentName);
      }
    };
  }]);
