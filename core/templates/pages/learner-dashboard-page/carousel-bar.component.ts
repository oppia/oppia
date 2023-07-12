// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for Carouselbar in the Learner Dashboard page.
 */

import { Component, Input, OnInit } from '@angular/core';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { Subscription } from 'rxjs';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

import './carousel-bar.component.css';

@Component({
  selector: 'oppia-carousel-bar',
  templateUrl: './carousel-bar.component.html',
  styleUrls: ['./carousel-bar.component.css']
})
export class CarouselBarComponent implements OnInit {
  CarouselScrollWidthPx: number;
  CarouselClientWidthPx: number;
  untrackedTopicTiles: boolean = true;
  carouselScrollPositionPx: number = 0;
  disableLeftButton: boolean = true;
  disableRightButton: boolean = false;
 @Input() carouselClassname: string;
 @Input() scrollUntrackedTopics: boolean = false;

 // These properties are initialized using Angular lifecycle hooks
 // and we need to do non-null assertion. For more information, see
 // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
 translateSubscription!: Subscription;
 resizeSubscription!: Subscription;

 constructor(
    private windowDimensionService: WindowDimensionsService,
    private urlInterpolationService: UrlInterpolationService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private deviceInfoService: DeviceInfoService) {
 }

 // These properties are initialized using Angular lifecycle hooks
 // and we need to do non-null assertion. For more information, see
 // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1


 windowIsNarrow: boolean = false;
 directiveSubscriptions = new Subscription();

 ngOnInit(): void {
   this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
   this.directiveSubscriptions.add(
     this.windowDimensionService.getResizeEvent().subscribe(() => {
       this.isScrollable();
       let classname = this.carouselClassname + '.tiles';
       let carouselSelector = document.querySelector(classname) as HTMLElement;
       carouselSelector.scrollTo(0, 0);
       this.carouselScrollPositionPx = 0;
       this.disableLeftButton = true;
       this.disableRightButton = false;
       this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
     }));
 }



 scroll(isLeftScroll: boolean): void {
   let classname = this.carouselClassname + '.tiles';
   let carouselSelector = document.querySelector(classname) as HTMLElement;
   this.CarouselScrollWidthPx = carouselSelector.scrollWidth;
   this.CarouselClientWidthPx = carouselSelector.clientWidth;

   let direction = isLeftScroll ? -1 : 1;

   if (this.scrollUntrackedTopics && ((this.carouselScrollPositionPx === 0) ||
     (this.carouselScrollPositionPx >
       (this.CarouselScrollWidthPx - this.CarouselClientWidthPx)))) {
     this.carouselScrollPositionPx = this.carouselScrollPositionPx +
        (direction * 190);
     carouselSelector.scrollBy({
       top: 0,
       left: (direction * 190),
       behavior: 'smooth',
     });
   } else {
     this.carouselScrollPositionPx = this.carouselScrollPositionPx +
        (direction * 230);
     carouselSelector.scrollBy({
       top: 0,
       left: (direction * 230),
       behavior: 'smooth',
     });
   }

   if (this.carouselScrollPositionPx <= 0) {
     this.disableLeftButton = true;
     this.carouselScrollPositionPx = 0;
   } else {
     this.disableLeftButton = false;
   }

   if (
     this.carouselScrollPositionPx >
      (this.CarouselScrollWidthPx - this.CarouselClientWidthPx)) {
     this.disableRightButton = true;
   } else {
     this.disableRightButton = false;
   }
 }

 isScrollable(): boolean {
   let classname = this.carouselClassname + '.tiles';
   let carouselSelector = document.querySelector(classname) as HTMLElement;
   let carouselScrollWidthPx = carouselSelector.scrollWidth;
   let carouselClientWidthPx = carouselSelector.clientWidth;
   return (carouselScrollWidthPx > carouselClientWidthPx);
 }
}
