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
  controller: [function() {
    const ctrl = this;
    var guppyDivElt, guppyInstance: Guppy;

    ctrl.$onInit = function() {
      ctrl.alwaysEditable = true;

      guppyDivElt = $('.guppy-div');
      // Dynamically assigns a unique id to the guppy-div.
      guppyDivElt.attr('id', 'guppy_' + Math.floor(Math.random() * 100000000));
      guppyInstance = new Guppy(guppyDivElt.attr('id'), {});
      Guppy.event('change', (e) => {
        ctrl.value = guppyInstance.asciimath();
      });
      guppyInstance.render();
    };
  }]
});
