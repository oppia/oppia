// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for ui-leaflet.
 */

import { Directive, ElementRef, Injector, Input } from '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';
require('third-party-imports/leaflet.import');

angular.module('oppia').directive('oppiaLeaflet', [function() {
  return {
    restrict: 'E',
    scope: {},
    bindToController: {
      identification: '@',
      classes: '@',
      eventBroadcast: '<',
      lfCenter: '<',
      markers: '<'
    },
    template: require('./leaflet.directive.html'),
    controllerAs: '$ctrl',
    controller: ['$scope', function($scope) {
      var ctrl = this;
      ctrl.getClass = function() {
        let classes = {};
        classes[ctrl.classes] = true;
        return classes;
      };

      ctrl.$onInit = function() {
        $scope.$applyAsync();
      };
    }],
  };
}]);

@Directive({
  selector: 'oppia-leaflet'
})
export class LeafletComponent extends UpgradeComponent {
  @Input() identification;
  @Input() classes;
  @Input() eventBroadcast;
  @Input() lfCenter;
  @Input() markers;

  constructor(elementRef: ElementRef, injector: Injector) {
    super('oppiaLeaflet', elementRef, injector);
  }
}
