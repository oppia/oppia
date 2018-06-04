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
  'stateContentIdsToAudioTranslationsService', function(
      stateContentIdsToAudioTranslationsService) {
    var generateRandomString = function() {
      randomString = '';
      while (randomString.length !== 6){
        randomString = Math.random().toString(36).substring(2, 8);
      }
      return randomString;
    };
    var _generateUniqueId = function() {
      var ContentIdList = stateContentIdsToAudioTranslationsService
        .displayed.getAllContentId();
      var uniqueId = generateRandomString();
      while (ContentIdList.indexOf(uniqueId) >= 0) {
        uniqueId = generateRandomString();
      }
      return uniqueId;
    };

    return {
      generateUniqueId: function() {
        return _generateUniqueId();
      }
    };
  }]);
