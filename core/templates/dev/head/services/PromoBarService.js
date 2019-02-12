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

oppia.factory('PromoBarService', [
  '$http', '$q', 'ENABLE_PROMO_BAR',
  function($http, $q, ENABLE_PROMO_BAR) {
    return {
      getPromoBarData: function() {
        var promoBarData = {
          promoBarEnabled: false,
          promoBarMessage: ''
        };

        if (ENABLE_PROMO_BAR) {
          return $http.get('/promo_bar_handler', {}).then(
            function(response) {
              promoBarData.promoBarEnabled = response.data.promo_bar_enabled;
              promoBarData.promoBarMessage = response.data.promo_bar_message;
              return promoBarData;
            }
          );
        } else {
          return $q.resolve(promoBarData);
        }
      }
    };
  }
]);
