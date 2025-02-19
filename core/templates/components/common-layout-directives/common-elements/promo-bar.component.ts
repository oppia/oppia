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
 * @fileoverview Component for a promo bar that appears at the top of the
 * screen. The bar is configurable with a message and whether the promo is
 * dismissible.
 */

import {Component, OnInit} from '@angular/core';

import {WindowRef} from 'services/contextual/window-ref.service';
import {PromoBarBackendApiService} from 'services/promo-bar-backend-api.service';

@Component({
  selector: 'oppia-promo-bar',
  templateUrl: './promo-bar.component.html',
})
export class PromoBarComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  promoIsVisible!: boolean;
  promoBarIsEnabled!: boolean;
  promoBarMessage!: string;

  constructor(
    private promoBarBackendApiService: PromoBarBackendApiService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.promoBarBackendApiService.getPromoBarDataAsync().then(promoBar => {
      this.promoBarIsEnabled = promoBar.promoBarEnabled;
      this.promoBarMessage = promoBar.promoBarMessage;
    });
    this.promoIsVisible = !this.isPromoDismissed();
  }

  isPromoDismissed(): boolean {
    if (!this.isSessionStorageAvailable()) {
      return false;
    }
    let promoIsDismissed =
      this.windowRef.nativeWindow.sessionStorage.promoIsDismissed;
    if (typeof promoIsDismissed !== 'undefined') {
      return JSON.parse(promoIsDismissed);
    }
    return false;
  }

  setPromoDismissed(promoIsDismissed: boolean): boolean {
    if (!this.isSessionStorageAvailable()) {
      return false;
    }
    this.windowRef.nativeWindow.sessionStorage.promoIsDismissed =
      JSON.stringify(promoIsDismissed);
    return true;
  }

  isSessionStorageAvailable(): boolean {
    // This is to ensure sessionStorage is accessible.
    const testKey = 'Oppia';
    try {
      this.windowRef.nativeWindow.sessionStorage.setItem(testKey, testKey);
      this.windowRef.nativeWindow.sessionStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  dismissPromo(): void {
    this.promoIsVisible = false;
    this.setPromoDismissed(true);
  }
}
