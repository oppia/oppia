// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the side navigation bar.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').directive('sideNavigationBar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./side-navigation-bar.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$window', function($window) {
        var ctrl = this;
        ctrl.getStaticImageUrl = function(imagePath) {
          return UrlInterpolationService.getStaticImageUrl(imagePath);
        };
        ctrl.$onInit = function() {
          ctrl.currentUrl = $window.location.pathname;
        };
      }]
    };
  }]);

  @Component({
    selector: 'side-navigation-bar',
    templateUrl: './side-navigation-bar.directive.html',
    styleUrls: []
  })
  export class SideNavigationBarComponent implements OnInit {
    currentUrl: string = '';
    constructor(
      private urlInterpolationService: UrlInterpolationService,
      private windowRef: WindowRef
    ) {}

    ngOnInit(): void {
      this.currentUrl = this.windowRef.nativeWindow.location.pathname;
    }

    getStaticImageUrl(imagePath: string): string {
      return this.urlInterpolationService.getStaticImageUrl(imagePath);
    } 

  }
  angular.module('oppia').directive(
    'sideNavigationBar', downgradeComponent(
      {component: SideNavigationBarComponent}));
