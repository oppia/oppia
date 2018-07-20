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
      this._id = id;
      this._name = name;
      this._notes = notes;
      this._feedback = feedback;
    };

    Misconception.prototype.toBackendDict = function() {
      return {
        id: this._id,
        name: this._name,
        notes: this._notes,
        feedback: this._feedback
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
      return this._id;
    };

    Misconception.prototype.getName = function() {
      return this._name;
    };

    Misconception.prototype.setName = function(newName) {
      this._name = newName;
    };

    Misconception.prototype.getNotes = function() {
      return this._notes;
    };

    Misconception.prototype.setNotes = function(newNotes) {
      this._notes = newNotes;
    };

    Misconception.prototype.getFeedback = function() {
      return this._feedback;
    };

    Misconception.prototype.setFeedback = function(newFeedback) {
      this._feedback = newFeedback;
    };

    return Misconception;
  }
]);
