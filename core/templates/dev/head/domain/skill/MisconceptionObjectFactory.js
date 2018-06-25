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
 * @fileoverview Object factory for creating frontend instances of
 * misconceptions.
 */

oppia.factory('MisconceptionObjectFactory', [
  function() {
    var Misconception = function(id, name, notes, feedback) {
      this.id = id;
      this.name = name;
      this.notes = notes;
      this.feedback = feedback;
    };

    Misconception.prototype.toBackendDict = function() {
      return {
        id: this.id,
        name: this.name,
        notes: this.notes,
        feedback: this.feedback
      };
    };

    Misconception.createFromBackendDict = function(misconceptionBackendDict) {
      return new Misconception(
        misconceptionBackendDict.id,
        misconceptionBackendDict.name,
        misconceptionBackendDict.notes,
        misconceptionBackendDict.feedback);
    };

    Misconception.create = function(id, name, notes, feedback) {
      return new Misconception(id, name, notes, feedback);
    };

    Misconception.prototype.getId = function() {
      return this.id;
    };

    Misconception.prototype.getName = function() {
      return this.name;
    };

    Misconception.prototype.setName = function(newName) {
      this.name = newName;
    };

    Misconception.prototype.getNotes = function() {
      return this.notes;
    };

    Misconception.prototype.setNotes = function(newNotes) {
      this.notes = newNotes;
    };

    Misconception.prototype.getFeedback = function() {
      return this.feedback;
    };

    Misconception.prototype.setFeedback = function(newFeedback) {
      this.feedback = newFeedback;
    };

    return Misconception;
  }
]);