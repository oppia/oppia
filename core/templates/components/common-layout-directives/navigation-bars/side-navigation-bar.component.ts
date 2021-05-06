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
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';

 @Component({
   selector: 'oppia-side-navigation-bar',
   templateUrl: './side-navigation-bar.component.html'
 })
export class SideNavigationBarComponent {
   @Input() display: boolean;
   currentUrl: string;
   classroomSubmenuIsShown: boolean = false;

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

   toggleClassroomSubmenu(): void {
     this.classroomSubmenuIsShown = !this.classroomSubmenuIsShown;
   }
}

angular.module('oppia').directive('oppiaSideNavigationBar',
   downgradeComponent({
     component: SideNavigationBarComponent
   }) as angular.IDirectiveFactory);
