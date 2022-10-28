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
 * @fileoverview Frontend Model for the promo bar.
 */

export interface PromoBarBackendDict {
  'promo_bar_enabled': boolean;
  'promo_bar_message': string;
}

export class PromoBar {
  _promoBarEnabled: boolean;
  _promoBarMessage: string;

  constructor(promoBarEnabled: boolean, promoBarMessage: string) {
    this._promoBarEnabled = promoBarEnabled;
    this._promoBarMessage = promoBarMessage;
  }

  static createFromBackendDict(data: PromoBarBackendDict): PromoBar {
    return new PromoBar(data.promo_bar_enabled, data.promo_bar_message);
  }

  static createEmpty(): PromoBar {
    return new PromoBar(false, '');
  }

  get promoBarEnabled(): boolean {
    return this._promoBarEnabled;
  }

  set promoBarEnabled(status: boolean) {
    this._promoBarEnabled = status;
  }

  get promoBarMessage(): string {
    return this._promoBarMessage;
  }

  set promoBarMessage(message: string) {
    this._promoBarMessage = message;
  }
}
