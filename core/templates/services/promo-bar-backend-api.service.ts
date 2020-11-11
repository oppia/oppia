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
 * @fileoverview The backend API service to fetch promo bar data.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ServicesConstants } from 'services/services.constants';

export interface PromoBar {
  promoBarEnabled: boolean;
  promoBarMessage: string;
}

@Injectable({
  providedIn: 'root'
})
export class PromoBarBackendApiService {
  constructor(private http: HttpClient) {}

  async getPromoBarDataAsync(): Promise<PromoBar> {
    const promoBar = {
      promoBarEnabled: false,
      promoBarMessage: ''
    };
    if (!ServicesConstants.ENABLE_PROMO_BAR) {
      return new Promise((resolve, reject) => {
        resolve(promoBar);
      });
    }
    return new Promise((resolve, reject) => {
      this.http.get<PromoBar>(
        ServicesConstants.PROMO_BAR_URL, {}
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }
}

angular.module('oppia').factory(
  'PromoBarBackendApiService',
  downgradeInjectable(PromoBarBackendApiService)
);
