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

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { PromoBarBackendApiService } from
  'services/promo-bar-backend-api.service';
import { WindowRef } from 'services/contextual/window-ref.service';

@Component({
  selector: 'promo-bar',
  templateUrl: './promo-bar.component.html'
})
export class PromoBarComponent implements OnInit {
  promoIsVisible: boolean;
  promoBarIsEnabled: boolean;
  promoBarMessage: string;

  constructor(
    private promoBarBackendApiService: PromoBarBackendApiService,
    private windowRef: WindowRef
  ) {}

  ngOnInit() {
    this.promoBarBackendApiService.getPromoBarDataAsync()
      .then((promoBar) => {
        this.promoBarIsEnabled = promoBar.isPromoBarEnabled();
        this.promoBarMessage = promoBar.getPromoBarMessage();
      });
      this.promoIsVisible = this.isPromoDismissed();
  }

  isPromoDismissed() {
    if (!this.isSessionStorageAvailable()) {
      return false;
    }
    return angular.fromJson(
      this.windowRef.nativeWindow.sessionStorage.promoIsDismissed);
  }

  setPromoDismissed(promoIsDismissed) {
    if (!this.isSessionStorageAvailable()) {
      return false;
    }
    this.windowRef.nativeWindow.sessionStorage.promoIsDismissed =
      angular.toJson(promoIsDismissed);
  }

  isSessionStorageAvailable() {
    // This is to ensure sessionStorage is accessible.
    var testKey = 'Oppia';
    try {
      this.windowRef.nativeWindow.sessionStorage.setItem(testKey, testKey);
      this.windowRef.nativeWindow.sessionStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  dismissPromo() {
    console.log('test')
    this.promoIsVisible = false;
    this.setPromoDismissed(true);
  }
}

angular.module('oppia').directive(
  'promoBar', downgradeComponent(
    {component: PromoBarComponent}));
