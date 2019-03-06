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
 * @fileoverview Factory for creating Playthrough Cards in the Improvements Tab.
 *
 * NOTE: For testing and organizational purposes, improvement card object
 * factories should be registered in the ImprovementCardRegistryService! See
 * the corresponding file to see what functions are expected from cards, and how
 * to add new ones as necessary.
 */

oppia.factory('PlaythroughImprovementCardObjectFactory', [function() {
  /** @constructor */
  var PlaythroughImprovementCard = function() {
    this._isArchived = false;

    var that = this;
    var archiveCardAction = {
      name: "Archive Card",
      resolve: function() {
        that._isArchived = true;
      },
    };
    // TODO(brianrodri): Create a "goToState" action.
    this._resolutionActions = [archiveCardAction];
  };

  PlaythroughImprovementCard.prototype.isResolved = function() {
    return this._isArchived;
  };

  PlaythroughImprovementCard.prototype.getTitle = function() {
    return "Test";
  };

  PlaythroughImprovementCard.prototype.getContentHtml = function() {
    return "<b>TODO</b>: Fill with hexagons!";
  };

  PlaythroughImprovementCard.prototype.getResolutionActions = function() {
    return this._resolutionActions;
  };

  return {
    createNew: function() {
      return new PlaythroughImprovementCard();
    },
    fetchCards: function() {
      return Promise.resolve([1, 2, 3]);
    },
  };
}]);
