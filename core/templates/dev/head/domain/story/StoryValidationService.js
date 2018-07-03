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
 * @fileoverview Service to validate the consistency of a story. These
 * checks are performable in the frontend to avoid sending a potentially invalid
 * story to the backend, which performs similar validation checks to these
 * in story_domain.Story and subsequent domain objects.
 */

oppia.factory('StoryValidationService', [
  function() {
    var _validateStory = function(story) {
      var issues = [];

      return issues;
    };

    return {
      /**
       * Returns a list of error strings found when validating the provided
       * story. The validation methods used in this function are written to
       * match the validations performed in the backend. This function is
       * expensive, so it should be called sparingly.
       */
      findValidationIssuesStory: function(story) {
        return _validateStory(story);
      }
    };
  }]);
