// Copyright 2015 The Oppia Authors. All Rights Reserved.
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

require('domain/story_viewer/ReadOnlyStoryNodeObjectFactory.ts');

var oppia = require('AppInit.ts').module;

oppia.factory('StoryPlaythroughObjectFactory', [
  'ReadOnlyStoryNodeObjectFactory', function(ReadOnlyStoryNodeObjectFactory) {
    // Stores information about a current playthrough of a story for a
    // user.
    var StoryPlaythrough = function(nodes) {
      this._nodes = nodes;
    };

    StoryPlaythrough.prototype.getInitialNode = function() {
      return this._nodes[0];
    };

    StoryPlaythrough.prototype.getStoryNodeCount = function() {
      return this._nodes.length;
    };

    StoryPlaythrough.prototype.getStoryNodes = function() {
      return this._nodes;
    };

    StoryPlaythrough.prototype.hasFinishedStory = function() {
      return this._nodes.slice(-1)[0].isCompleted();
    };

    StoryPlaythrough.prototype.getNextPendingNodeId = function() {
      for (var i = 0; i < this._nodes.length; i++) {
        if (!this._nodes[i].isCompleted()) {
          return this._nodes[i].getId();
        }
      }
    };

    StoryPlaythrough.prototype.hasStartedStory = function() {
      return this._nodes[0].isCompleted();
    };

    // Static class methods. Note that "this" is not available in static
    // contexts. This function takes a JSON object which represents a backend
    // story playthrough python dict.
    // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    StoryPlaythrough['createFromBackendDict'] = function(
    /* eslint-enable dot-notation */
        storyPlaythroughBackendObject) {
      var nodeObjects = [];

      nodeObjects = storyPlaythroughBackendObject.story_nodes.map(
        function(node) {
          return ReadOnlyStoryNodeObjectFactory.createFromBackendDict(node);
        }
      );

      return new StoryPlaythrough(nodeObjects);
    };

    return StoryPlaythrough;
  }]);
