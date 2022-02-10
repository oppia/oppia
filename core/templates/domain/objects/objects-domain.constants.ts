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

export const ObjectsDomainConstants = {
  FRACTION_PARSING_ERROR_I18N_KEYS: {
    INVALID_CHARS_LENGTH: 'I18N_INTERACTIONS_FRACTIONS_INVALID_CHARS_LENGTH',
    INVALID_CHARS: 'I18N_INTERACTIONS_FRACTIONS_INVALID_CHARS',
    INVALID_FORMAT: 'I18N_INTERACTIONS_FRACTIONS_INVALID_FORMAT',
    DIVISION_BY_ZERO: 'I18N_INTERACTIONS_FRACTIONS_DIVISION_BY_ZERO'
  },

  NUMBER_WITH_UNITS_PARSING_ERROR_I18N_KEYS: {
    INVALID_VALUE: 'I18N_INTERACTIONS_NUMBER_WITH_UNITS_INVALID_VALUE',
    INVALID_CURRENCY: 'I18N_INTERACTIONS_NUMBER_WITH_UNITS_INVALID_CURRENCY',
    INVALID_CURRENCY_FORMAT:
      'I18N_INTERACTIONS_NUMBER_WITH_UNITS_INVALID_CURRENCY_FORMAT',
    INVALID_UNIT_CHARS: 'I18N_INTERACTIONS_NUMBER_WITH_UNITS_INVALID_UNIT_CHARS'
  },

  CURRENCY_UNITS: {
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
  },

  RATIO_PARSING_ERROR_I18N_KEYS: {
    INVALID_COLONS: 'I18N_INTERACTIONS_RATIO_INVALID_COLONS',
    INVALID_CHARS: 'I18N_INTERACTIONS_RATIO_INVALID_CHARS',
    INVALID_FORMAT: 'I18N_INTERACTIONS_RATIO_INVALID_FORMAT',
    NON_INTEGER_ELEMENTS: 'I18N_INTERACTIONS_RATIO_NON_INTEGER_ELEMENTS',
    INCLUDES_ZERO: 'I18N_INTERACTIONS_RATIO_INCLUDES_ZERO',
    EMPTY_STRING: 'I18N_INTERACTIONS_RATIO_EMPTY_STRING',
  }
} as const;
