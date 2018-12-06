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
  'StateContentIdsToAudioTranslationsService', 'COMPONENT_NAME_FEEDBACK',
  'COMPONENT_NAME_HINT', 'COMPONENT_NAME_WORKED_EXAMPLE', function(
      StateContentIdsToAudioTranslationsService, COMPONENT_NAME_FEEDBACK,
      COMPONENT_NAME_HINT, COMPONENT_NAME_WORKED_EXAMPLE) {
    var generateIdForComponent = function(existingComponentIds, componentName) {
      var contentIdList = angular.copy(existingComponentIds);
      var searchKey = componentName + '_';
      var count = 0;
      for (contentId in contentIdList) {
        if (contentIdList[contentId].indexOf(searchKey) === 0) {
          var splitContentId = contentIdList[contentId].split('_');
          var tempCount =
            parseInt(splitContentId[splitContentId.length - 1]);
          if (tempCount > count) {
            count = tempCount;
          }
        }
      }
      return (searchKey + String(count + 1));
    };

    var _getNextId = function(existingComponentIds, componentName) {
      if (componentName === COMPONENT_NAME_FEEDBACK ||
          componentName === COMPONENT_NAME_HINT ||
          componentName === COMPONENT_NAME_WORKED_EXAMPLE) {
        return generateIdForComponent(existingComponentIds, componentName);
      } else {
        throw Error('Unknown component name provided.');
      }
    };
    return {
      getNextId: function(existingComponentIds, componentName) {
        return _getNextId(existingComponentIds, componentName);
      }
    };
  }]);
