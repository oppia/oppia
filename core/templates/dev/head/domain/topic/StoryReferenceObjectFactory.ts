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
 * @fileoverview Factory for creating and mutating instances of frontend
 * story reference domain objects.
 */

angular.module('oppia').factory('StoryReferenceObjectFactory', [function() {
  var StoryReference = function(storyId, storyIsPublished) {
    this._storyId = storyId;
    this._storyIsPublished = storyIsPublished;
  };

  // Instance methods

  // Returns the story id.
  StoryReference.prototype.getStoryId = function() {
    return this._storyId;
  };

  // Returns whether the story is published.
  StoryReference.prototype.isStoryPublished = function() {
    return this._storyIsPublished;
  };

  // TODO (ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  StoryReference['createFromBackendDict'] = function(
  /* eslint-enable dot-notation */
      storyReferenceBackendDict, skillIdToDescriptionMap) {
    return new StoryReference(
      storyReferenceBackendDict.story_id,
      storyReferenceBackendDict.story_is_published);
  };

  // TODO (ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  StoryReference['createFromStoryId'] = function(storyId) {
  /* eslint-enable dot-notation */
    // TODO (ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    return new StoryReference(storyId, false);
  };

  return StoryReference;
}]);
