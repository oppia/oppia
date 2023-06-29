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
 * @fileoverview Component for Carouselbar in the Learner Dashboard page.
 */

import { AppConstants } from 'app.constants';
import { Component, OnInit } from '@angular/core';
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
  tileDisplayCount: number;
  leftmostCardIndices: number;
  isAnyCarouselCurrentlyScrolling: boolean;
  scrolledLeft: number;
  offSetWidth: number;
  scrollWidth: number;
  clientWidth: number;
  disableBtn: boolean = true;
  howMuchtoScroll: number;
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  translateSubscription!: Subscription;
  resizeSubscription!: Subscription;

  constructor(
    private windowDimensionService: WindowDimensionsService,
    private windowDimensionsService: WindowDimensionsService,
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
    setTimeout(() => {
      let carouselSelector = document.querySelector('.tiles') as HTMLElement;
      this.scrollWidth = carouselSelector.scrollWidth;
      this.clientWidth = carouselSelector.clientWidth;
      let scrollRatio = this.clientWidth / this.scrollWidth;
      var maxScrollPosition = this.scrollWidth - this.clientWidth;
      var scrollPosition = scrollRatio * maxScrollPosition;
      console.error(scrollPosition, 'scroll position...');
    },);
    this.directiveSubscriptions.add(
      this.windowDimensionService.getResizeEvent().subscribe(() => {
        // This.offSetWidth = carouselSelector.offsetWidth;
        // console.error(this.offSetWidth, 'off set width....');
        // this.scrollWidth = carouselSelector.scrollWidth;
        // console.error(this.scrollWidth, 'scroll widhth .....');
        // this.clientWidth = carouselSelector.clientWidth;
        // console.error(this.clientWidth, 'client width ....');
        this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
      }));
  }

  // ngAfterViewInit(): void {
    
  // }



  scroll(isLeftScroll: boolean): void {
    let carouselSelector = document.querySelector('.tiles') as HTMLElement;

    let direction = isLeftScroll ? -1 : 1;

    let carouselScrollPositionPx = (
      carouselSelector).scrollLeft || 0;

    carouselScrollPositionPx = Math.max(0, carouselScrollPositionPx);
    let newScrollPositionPx = carouselScrollPositionPx +
    (1 * AppConstants.LEARN_SOMETHING_NEW_TILE_WIDTH_PX * direction);

    console.error(newScrollPositionPx);
    console.error(carouselScrollPositionPx, 'scroll left.....');
    console.error(this.clientWidth, 'clientwidth ....');
    console.error(this.scrollWidth, 'scroll width....');
    if ((carouselScrollPositionPx) >= this.scrollWidth - this.clientWidth) {
      console.error('right - disable--->>>true');
    } else {
      console.error('right--disable--->>>false');
    }

    $(carouselSelector).animate({
      scrollLeft: newScrollPositionPx
    }, {
      duration: 800,
      queue: false,
      start: () => {
        this.isAnyCarouselCurrentlyScrolling = true;
      },
      complete: () => {
        this.isAnyCarouselCurrentlyScrolling = false;
      }
    });
  }
}
