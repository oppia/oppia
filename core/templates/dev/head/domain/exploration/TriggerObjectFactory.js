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
 * @fileoverview Factory for creating new frontend instances of Trigger
 * domain objects.
 */

oppia.factory('TriggerObjectFactory', [function() {
  var Trigger = function(type, customizationArgs) {
    this.type = type;
    this.customizationArgs = customizationArgs;
  };

  Trigger.prototype.toBackendDict = function() {
    return {
      trigger_type: this.type,
      customization_args: this.customizationArgs
    };
  };

  Trigger.createFromBackendDict = function(triggerBackendDict) {
    return new Trigger(
      triggerBackendDict.trigger_type,
      triggerBackendDict.customization_args);
  };

  return Trigger;
}]);
