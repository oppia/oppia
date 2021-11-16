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
 * @fileoverview Component for the side navigation bar.
 */

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';

 @Component({
   selector: 'oppia-side-navigation-bar',
   templateUrl: './side-navigation-bar.component.html'
 })
export class SideNavigationBarComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion, for more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
   @Input() display!: boolean;
   currentUrl!: string;
   classroomSubmenuIsShownLEARN: boolean = true;
   classroomSubmenuIsShownINVOLVED: boolean = false;
   PAGES_REGISTERED_WITH_FRONTEND = (
     AppConstants.PAGES_REGISTERED_WITH_FRONTEND);

   constructor(
     private windowRef: WindowRef,
     private urlInterpolationService: UrlInterpolationService
   ) {}

   getStaticImageUrl(imagePath: string): string {
     return this.urlInterpolationService.getStaticImageUrl(imagePath);
   }

   ngOnInit(): void {
     this.currentUrl = this.windowRef.nativeWindow.location.pathname;
   }

   toggleClassroomSubmenuLearn(): void {
     this.classroomSubmenuIsShownLEARN = !this.classroomSubmenuIsShownLEARN;
     var expandiconLEARN = document.querySelector('.expand-icon-learn');
     var bordertoggleEleLEARN = document.querySelector('.bordertoggle-learn');
     expandiconLEARN.classList.toggle('oppia-sidebar-menu-icon-transition');
     bordertoggleEleLEARN.classList.toggle('oppia-sidebar-submenu-toggle');
   }

   toggleClassroomSubmenuINVOLVED(): void {
     this.classroomSubmenuIsShownINVOLVED =
     !this.classroomSubmenuIsShownINVOLVED;
     this.classroomSubmenuIsShownLEARN = false;
     var expandiconINVOLVED = document.querySelector('.expand-icon-involved');
     var bordertoggleEleINVOLVED = (
       document.querySelector(
         '.bordertoggle-involved'));
     expandiconINVOLVED.classList.toggle('oppia-sidebar-menu-icon-transition');
     bordertoggleEleINVOLVED.classList.toggle('oppia-sidebar-submenu-toggle');

     var expandiconLEARN = document.querySelector('.expand-icon-learn');
     var bordertoggleEleLEARN = document.querySelector('.bordertoggle-learn');
     expandiconLEARN.classList.remove('oppia-sidebar-menu-icon-transition');
     bordertoggleEleLEARN.classList.remove('oppia-sidebar-submenu-toggle');
   }
}

angular.module('oppia').directive('oppiaSideNavigationBar',
   downgradeComponent({
     component: SideNavigationBarComponent
   }) as angular.IDirectiveFactory);
