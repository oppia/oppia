// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service Promo bar.
 */
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { PromoBarBackendApiService } from 'services/promo-bar-bakend-api.service';
import { ServicesConstants } from 'services/services.constants';
@Injectable({
  providedIn: 'root'
})
export class PromoBarService {
  constructor() {}
  static getPromoBarData(): Promise<{}> {
    var promoBarData = {
      promoBarEnabled: false,
      promoBarMessage: ''
    };
    if (ServicesConstants.ENABLE_PROMO_BAR) {
      return PromoBarBackendApiService.makeRequest();
    } else {
      return Promise.resolve(promoBarData);
    }
  }
}
angular.module('oppia').factory('PromoBarService',
  downgradeInjectable(PromoBarService));
