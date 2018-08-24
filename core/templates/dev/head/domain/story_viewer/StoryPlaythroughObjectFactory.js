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
 * story playthrough domain objects.
 */

oppia.factory('StoryPlaythroughObjectFactory', [function() {
  // Stores information about a current playthrough of a story for a
  // user.
  var StoryPlaythrough = function(
      nextExplorationId, completedExplorationIds) {
    this._nextExplorationId = nextExplorationId;
    this._completedExplorationIds = completedExplorationIds;
  };

  // Returns the upcoming exploration ID. Changes to this are not
  // reflected in the story.
  StoryPlaythrough.prototype.getNextExplorationId = function() {
    return this._nextExplorationId;
  };

  //   StoryPlaythrough.prototype.getNextRecommendedStoryNodeCount =
  //     function() {
  //       // As the story is linear, only a single node would be available,
  //       // after any node.
  //       return 1;
  //     };

  StoryPlaythrough.hasFinishedStory = function() {
    return this._nextExplorationId === null;
  };

  // Returns a list of explorations completed that are related to this
  // story. Changes to this list are not reflected in this story.
  StoryPlaythrough.prototype.getCompletedExplorationIds = function() {
    return angular.copy(this._completedExplorationIds);
  };

  StoryPlaythrough.prototype.getCompletedExplorationNodeCount =
    function() {
      return this._completedExplorationIds.length;
    };

  StoryPlaythrough.prototype.hasStartedStory = function() {
    return this._completedExplorationIds.length !== 0;
  };

  // Static class methods. Note that "this" is not available in static
  // contexts. This function takes a JSON object which represents a backend
  // story playthrough python dict.
  StoryPlaythrough.createFromBackendObject = function(
      storyPlaythroughBackendObject) {
    return new StoryPlaythrough(
      storyPlaythroughBackendObject.next_exploration_id,
      storyPlaythroughBackendObject.completed_exploration_ids);
  };

  StoryPlaythrough.create = function(
      nextExplorationId, completedExplorationIds) {
    return new StoryPlaythrough(
      nextExplorationId, angular.copy(completedExplorationIds));
  };

  return StoryPlaythrough;
}]);
