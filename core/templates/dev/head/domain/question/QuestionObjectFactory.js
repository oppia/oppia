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
 * question domain objects.
 */

oppia.factory('QuestionObjectFactory', ['StateObjectFactory',
  function(StateObjectFactory) {
    var Question = function(id, stateData, languageCode, version) {
      this._id = id;
      this._stateData = stateData;
      this._languageCode = languageCode;
      this._version = version;
    };

    // Instance methods

    Question.prototype.getId = function() {
      return this._id;
    };

    Question.prototype.getStateData = function() {
      return this._stateData;
    };

    Question.prototype.setDefaultStateData = function() {

    };

    Question.prototype.getLanguageCode = function() {
      return this._languageCode;
    };

    Question.prototype.setLanguageCode = function(languageCode) {
      this._languageCode = languageCode;
    };

    Question.prototype.getVersion = function() {
      return this._version;
    };

    Question.createFromBackendDict = function(questionBackendDict) {
      return new Question(
        questionBackendDict.id,
        StateObjectFactory.createFromBackendDict(
          'question', questionBackendDict.question_state_data),
        questionBackendDict.language_code, questionBackendDict.version
      );
    };

    return Question;
  }
]);
