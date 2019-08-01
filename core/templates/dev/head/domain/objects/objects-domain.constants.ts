// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Constants for objects domain.
 */

angular.module('oppia').constant('FRACTION_PARSING_ERRORS', {
  INVALID_CHARS:
    'Please only use numerical digits, spaces or forward slashes (/)',
  INVALID_FORMAT:
    'Please enter a valid fraction (e.g., 5/3 or 1 2/3)',
  DIVISION_BY_ZERO: 'Please do not put 0 in the denominator'
});

angular.module('oppia').constant('NUMBER_WITH_UNITS_PARSING_ERRORS', {
  INVALID_VALUE:
    'Please ensure that value is either a fraction or a number',
  INVALID_CURRENCY:
    'Please enter a valid currency (e.g., $5 or Rs 5)',
  INVALID_CURRENCY_FORMAT: 'Please write currency units at the beginning',
  INVALID_UNIT_CHARS:
    'Please ensure that unit only contains numbers, alphabets, (, ), *, ^, /, -'
});

angular.module('oppia').constant('CURRENCY_UNITS', {
  dollar: {
    name: 'dollar',
    aliases: ['$', 'dollars', 'Dollars', 'Dollar', 'USD'],
    front_units: ['$'],
    base_unit: null
  },
  rupee: {
    name: 'rupee',
    aliases: ['Rs', 'rupees', '₹', 'Rupees', 'Rupee'],
    front_units: ['Rs ', '₹'],
    base_unit: null
  },
  cent: {
    name: 'cent',
    aliases: ['cents', 'Cents', 'Cent'],
    front_units: [],
    base_unit: '0.01 dollar'
  },
  paise: {
    name: 'paise',
    aliases: ['paisa', 'Paise', 'Paisa'],
    front_units: [],
    base_unit: '0.01 rupee'
  }
});
