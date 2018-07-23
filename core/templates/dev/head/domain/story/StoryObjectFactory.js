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
 * story domain objects.
 */

oppia.factory('StoryObjectFactory', ['StoryContentsObjectFactory',
  function(StoryContentsObjectFactory) {
    var Story = function(
        id, title, description, notes, storyContents, languageCode, version) {
      this._id = id;
      this._title = title;
      this._description = description;
      this._notes = notes;
      this._storyContents = storyContents;
      this._languageCode = languageCode;
      this._version = version;
    };

    // Instance methods

    Story.prototype.getId = function() {
      return this._id;
    };

    Story.prototype.getTitle = function() {
      return this._title;
    };

    Story.prototype.setTitle = function(title) {
      this._title = title;
    };

    Story.prototype.getDescription = function() {
      return this._description;
    };

    Story.prototype.setDescription = function(description) {
      this._description = description;
    };

    Story.prototype.getNotes = function() {
      return this._notes;
    };

    Story.prototype.setNotes = function(notes) {
      this._notes = notes;
    };

    Story.prototype.getLanguageCode = function() {
      return this._languageCode;
    };

    Story.prototype.setLanguageCode = function(languageCode) {
      this._languageCode = languageCode;
    };

    Story.prototype.getVersion = function() {
      return this._version;
    };

    Story.prototype.getStoryContents = function() {
      return this._storyContents;
    };

    Story.prototype.validate = function() {
      var issues = [];
      if (this._title === '') {
        issues.push('Story title should not be empty');
      }
      issues = issues.concat(this._storyContents.validate());
      return issues;
    };

    // Reassigns all values within this story to match the existing
    // story. This is performed as a deep copy such that none of the
    // internal, bindable objects are changed within this story.
    Story.prototype.copyFromStory = function(otherStory) {
      this._id = otherStory.getId();
      this.setTitle(otherStory.getTitle());
      this.setDescription(otherStory.getDescription());
      this.setNotes(otherStory.getNotes());
      this.setLanguageCode(otherStory.getLanguageCode());
      this._version = otherStory.getVersion();
      this._storyContents = otherStory.getStoryContents();
    };

    // Static class methods. Note that "this" is not available in static
    // contexts. This function takes a JSON object which represents a backend
    // story python dict.
    Story.createFromBackendDict = function(storyBackendDict) {
      return new Story(
        storyBackendDict.id, storyBackendDict.title,
        storyBackendDict.description, storyBackendDict.notes,
        StoryContentsObjectFactory.createFromBackendDict(
          storyBackendDict.story_contents),
        storyBackendDict.language_code,
        storyBackendDict.version
      );
    };

    // Create an interstitial story that would be displayed in the editor until
    // the actual story is fetched from the backend.
    Story.createInterstitialStory = function() {
      return new Story(
        null, 'Story title loading', 'Story description loading',
        'Story notes loading', null, 'en', 1
      );
    };
    return Story;
  }
]);
