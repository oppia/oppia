// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the on-screen keyboard used for math
 * interactions.
 */

require('services/guppy-configuration.service.ts');
require('services/guppy-initialization.service.ts');

angular.module('oppia').component('onScreenKeyboard', {
  template: require('./on-screen-keyboard.component.html'),
  controller: ['$scope', 'GuppyInitializationService',
    function($scope, GuppyInitializationService) {
      const ctrl = this;
      let engine, guppyInstance;

      ctrl.insertString = function(string) {
        engine.insert_string(string);
        guppyInstance.activate();
      };

      ctrl.insertSymbol = function(symbol) {
        engine.insert_symbol(symbol);
        guppyInstance.activate();
      };

      ctrl.delete = function() {
        engine.backspace();
        guppyInstance.activate();
      }

      ctrl.$onInit = function() {
        let guppyInstances = GuppyInitializationService.getGuppyInstances();
        guppyInstance = guppyInstances[guppyInstances.length - 1].guppyInstance;
        engine = guppyInstance.engine;
      };
    }
  ]
});
