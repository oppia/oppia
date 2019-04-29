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
 * @fileoverview Services for storing exploration properties for
 * text to speech data.
 */

oppia.factory('ExplorationAutomaticTextToSpeechService', [
  'ExplorationPropertyService', function(ExplorationPropertyService) {
    var child = Object.create(ExplorationPropertyService);
    child.propertyName = 'auto_tts_enabled';

    child._isValid = function(value) {
      return (typeof value === 'boolean');
    };

    child.isAutomaticTextToSpeechEnabled = function() {
      return child.savedMemento;
    };

    child.toggleAutomaticTextToSpeech = function() {
      child.displayed = !child.displayed;
      child.saveDisplayedValue();
    };

    return child;
  }
]);
