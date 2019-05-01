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
 * @fileoverview Service for checking the correctness feedback for an
 * exploration.
 */

oppia.factory('ExplorationCorrectnessFeedbackService', [
  'ExplorationPropertyService', function(ExplorationPropertyService) {
    var child = Object.create(ExplorationPropertyService);
    child.propertyName = 'correctness_feedback_enabled';

    child._isValid = function(value) {
      return (typeof value === 'boolean');
    };

    child.isEnabled = function() {
      return child.savedMemento;
    };

    child.toggleCorrectnessFeedback = function() {
      child.displayed = !child.displayed;
      child.saveDisplayedValue();
    };

    return child;
  }
]);
