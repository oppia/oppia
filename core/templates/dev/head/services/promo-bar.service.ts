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

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ServicesConstants } from 'services/services.constants';

@Injectable({
  providedIn: 'root'
})
export class PromoBarService {
  constructor(
    private http: HttpClient
  ) {}

  _getPromoBarData(): Promise<Object> {
    var promoBarData = {
      promoBarEnabled: false,
      promoBarMessage: ''
    };

    if (ServicesConstants.ENABLE_PROMO_BAR) {
      // Had to define data as any because it's keys did not follow camelCasing
      return this.http.get('/promo_bar_handler').toPromise().then(
        (data : any) => {
          promoBarData.promoBarEnabled = data.promo_bar_enabled;
          promoBarData.promoBarMessage = data.promo_bar_message;
          return Promise.resolve(promoBarData);
        }
      );
    } else {
      return Promise.resolve(promoBarData);
    }
  }

  getPromoBarData(): Promise<Object> {
    return this._getPromoBarData();
  }
}

angular.module('oppia').factory(
  'PromoBarService',
  downgradeInjectable(PromoBarService));
