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
 * @fileoverview Factory for creating new frontend instances of Fallback
 * domain objects.
 */

oppia.factory('FallbackObjectFactory', [
  'OutcomeObjectFactory',
  function(OutcomeObjectFactory) {
    var Fallback = function(trigger, outcome) {
      this.trigger = trigger;
      this.outcome = outcome;
    };

    Fallback.prototype.toBackendDict = function() {
      return {
        trigger: this.trigger,
        outcome: this.outcome.toBackendDict()
      };
    };

    Fallback.createFromBackendDict = function(fallbackBackendDict) {
      return new Fallback(
        fallbackBackendDict.trigger,
        OutcomeObjectFactory.createFromBackendDict(
          fallbackBackendDict.outcome));
    };

    Fallback.createDefault = function(dest) {
      return new Fallback(
        {
          trigger_type: 'NthResubmission',
          customization_args: {
            num_submits: {
              value: 3
            }
          }
        },
        OutcomeObjectFactory.createNew(dest, [], []));
    };

    return Fallback;
  }
]);
