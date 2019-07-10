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
 * skills with their difficulty for a question.
 */

var oppia = require('AppInit.ts').module;

oppia.factory('SkillDifficultyObjectFactory', [
  function() {
    var SkillDifficulty = function(id, description, difficulty) {
      this._id = id;
      this._description = description;
      this._difficulty = difficulty;
    };

    SkillDifficulty.prototype.toBackendDict = function() {
      return {
        id: this._id,
        description: this._description,
        difficulty: this._difficulty,
      };
    };

    /* eslint-disable dot-notation */
    SkillDifficulty['create'] = function(id, description, difficulty) {
    /* eslint-enable dot-notation */
      return new SkillDifficulty(id, description, difficulty);
    };

    SkillDifficulty.prototype.getId = function() {
      return this._id;
    };

    SkillDifficulty.prototype.getDescription = function() {
      return this._description;
    };

    SkillDifficulty.prototype.setDescription = function(newDescription) {
      this._description = newDescription;
    };

    SkillDifficulty.prototype.getDifficulty = function() {
      return this._difficulty;
    };

    SkillDifficulty.prototype.setDifficulty = function(newDifficulty) {
      this._difficulty = newDifficulty;
    };

    return SkillDifficulty;
  }
]);
