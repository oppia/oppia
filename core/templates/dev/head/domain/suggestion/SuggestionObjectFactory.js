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
 * @fileoverview Factory for creating new frontend instances of suggestion
   domain objects.
 */

oppia.factory('SuggestionObjectFactory', [function() {
  var Suggestion = function(
      suggestionType, suggestionId, targetType, targetId, status, authorName,
      stateName, newValue, oldValue, lastUpdated) {
    this.suggestionType = suggestionType;
    this.suggestionId = suggestionId;
    this.targetType = targetType;
    this.targetId = targetId;
    this.status = status;
    this.authorName = authorName;
    this.stateName = stateName;
    this.newValue = newValue;
    this.oldValue = oldValue;
    this.lastUpdated = lastUpdated;
  };

  Suggestion.prototype.getThreadId = function() {
    return this.suggestionId;
  };

  Suggestion.createFromBackendDict = function(suggestionBackendDict) {
    return new Suggestion(
      suggestionBackendDict.suggestion_type,
      suggestionBackendDict.suggestion_id, suggestionBackendDict.target_type,
      suggestionBackendDict.target_id, suggestionBackendDict.status,
      suggestionBackendDict.author_name,
      suggestionBackendDict.change.state_name,
      suggestionBackendDict.change.new_value,
      suggestionBackendDict.change.old_value,
      suggestionBackendDict.last_updated);
  };

  return Suggestion;
}]);
