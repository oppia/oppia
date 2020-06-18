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
 * @fileoverview Component for math editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

angular.module('oppia').component('mathEditor', {
  bindings: {
    value: '='
  },
  template: require('./math-editor.component.html'),
  controller: ['$scope', function($scope) {
    const ctrl = this;
    const SYMBOLS_TO_REMOVE = [
      'norm', 'utf8', 'text', 'sym_name', 'eval', 'floor', 'factorial', 'sub',
      'int', 'defi', 'deriv', 'sum', 'prod', 'root', 'vec', 'point',
      'infinity', 'leq', 'less', 'geq', 'greater', 'neq'];

    ctrl.initializeGuppy = function() {
      var guppyDivs = document.querySelectorAll('.guppy-div');
      var divId, guppyInstance;
      for (var i = 0; i < guppyDivs.length; i++) {
        divId = 'guppy_' + Math.floor(Math.random() * 100000000);
        // Dynamically assigns a unique id to the guppy div.
        guppyDivs[i].setAttribute('id', divId);
        // Create a new guppy instance for that div.
        guppyInstance = new Guppy(divId, {});
        guppyInstance.event('change', (e) => {
          ctrl.value = guppyInstance.asciimath();
          // Need to manually trigger the digest cycle
          // to make any 'watchers' aware of changes in ctrl.value.
          $scope.$apply();
        });
        guppyInstance.configure('buttons', ['controls']);
        guppyInstance.configure(
          'empty_content',
          '\\color{grey}{\\text{\\small{Type a formula here.}}}');
      }
    };

    ctrl.$onInit = function() {
      ctrl.alwaysEditable = true;
      ctrl.initializeGuppy();

      // Remove symbols since they are not supported.
      for (var symbol of SYMBOLS_TO_REMOVE) {
        Guppy.remove_global_symbol(symbol);
      }
    };
  }]
});
