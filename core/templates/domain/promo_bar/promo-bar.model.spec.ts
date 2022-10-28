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
 * @fileoverview Unit tests for promo bar model.
 */

import { PromoBar } from 'domain/promo_bar/promo-bar.model';

describe('Promo bar model', () => {
  var samplePromoBarBackendObject = {
    promo_bar_enabled: true,
    promo_bar_message: 'hello'
  };

  it('should create correct PromoBar object from backend dict', () => {
    var promoBar = PromoBar.createFromBackendDict(
      samplePromoBarBackendObject);

    expect(promoBar.promoBarEnabled).toBe(true);
    expect(promoBar.promoBarMessage).toBe('hello');
  });

  it('should create correct default PromoBar object', () => {
    var promoBar = PromoBar.createEmpty();

    expect(promoBar.promoBarEnabled).toBe(false);
    expect(promoBar.promoBarMessage).toBe('');
  });

  it('should set and get correct promoBarEnabled value', () => {
    var promoBar = PromoBar.createEmpty();

    expect(promoBar.promoBarEnabled).toBe(false);
    expect(promoBar.promoBarMessage).toBe('');

    promoBar.promoBarEnabled = true;

    expect(promoBar.promoBarEnabled).toBe(true);
    expect(promoBar.promoBarMessage).toBe('');
  });

  it('should set and get correct promoBarMessage value', () => {
    var promoBar = PromoBar.createEmpty();

    expect(promoBar.promoBarEnabled).toBe(false);
    expect(promoBar.promoBarMessage).toBe('');

    promoBar.promoBarMessage = 'New message';

    expect(promoBar.promoBarEnabled).toBe(false);
    expect(promoBar.promoBarMessage).toBe('New message');
  });
});
