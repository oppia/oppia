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

// import { Component, OnInit } from '@angular/core';

// @Component({
//   selector: 'on-screen-keyboard',
//   templateUrl: './on-screen-keyboard.component.html',
//   styleUrls: []
// })
// export class OnScreenKeyboard implements OnInit {
//   constructor() {}

//   ngOnInit(): void {}
// }


angular.module('oppia').component('onScreenKeyboard', {
  template: require('./on-screen-keyboard.component.html'),
  controller: ['$scope',
    function($scope) {
      const ctrl = this;

      ctrl.$onInit = function() {
        console.log('oninit called');
      };
    }
  ]
});
