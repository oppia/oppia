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
 * @fileoverview Factory for creating instances of frontend
 * story summary domain objects.
 */

angular.module('oppia').factory('StorySummaryObjectFactory', [function() {
  var StorySummary = function(id, title, nodeCount, storyIsPublished) {
    this._id = id;
    this._title = title;
    this._nodeCount = nodeCount;
    this._storyIsPublished = storyIsPublished;
  };

  // Instance methods

  StorySummary.prototype.getId = function() {
    return this._id;
  };

  StorySummary.prototype.getTitle = function() {
    return this._title;
  };

  StorySummary.prototype.getNodeCount = function() {
    return this._nodeCount;
  };

  StorySummary.prototype.isStoryPublished = function() {
    return this._storyIsPublished;
  };


  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  StorySummary['createFromBackendDict'] = function(storySummaryBackendDict) {
  /* eslint-enable dot-notation */
    return new StorySummary(
      storySummaryBackendDict.id,
      storySummaryBackendDict.title,
      storySummaryBackendDict.node_count,
      storySummaryBackendDict.story_is_published
    );
  };

  return StorySummary;
}]);
