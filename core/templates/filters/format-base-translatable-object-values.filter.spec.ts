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
 * @fileoverview Tests formatBaseTranslatableObjectValues filter.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('filters/format-base-translatable-object-values.filter');

const DEFAULT_OBJECT_VALUES = require('objects/object_defaults.json');

describe('formatBaseTranslatableObjectValues filter', function() {
  const filterName = 'formatBaseTranslatableObjectValues';

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', ($provide) => {
    const upgradedServices = new UpgradedServices();
    for (let [key, value] of Object.entries(
      upgradedServices.getUpgradedServices())
    ) {
      $provide.value(key, value);
    }
  }));

  it('should be accessible', angular.mock.inject(($filter) => {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should cover all translatable objects', angular.mock.inject(
    ($filter) => {
      Object.keys(DEFAULT_OBJECT_VALUES).forEach(objName => {
        if (objName.indexOf('Translatable') !== 0) {
          return;
        }
        expect(() => {
          $filter(filterName)(
            DEFAULT_OBJECT_VALUES[objName],
            objName);
        }).not.toThrowError();
      });
    }
  ));

  it('should format TranslatableSetOfNormalizedString values',
    angular.mock.inject(function($filter) {
      const result = $filter(filterName)(
        {normalizedStrSet: ['input1', 'input2']},
        'TranslatableSetOfNormalizedString'
      );
      expect(result).toEqual('[input1, input2]');
    })
  );

  it('should format TranslatableSetOfUnicodeString values',
    angular.mock.inject(function($filter) {
      const result = $filter(filterName)(
        {unicodeStrSet: ['input1', 'input2']},
        'TranslatableSetOfUnicodeString'
      );
      expect(result).toEqual('[input1, input2]');
    })
  );

  it('should throw an error on invalid type',
    angular.mock.inject(function($filter) {
      expect(() => {
        $filter(filterName)(
          ['input1', 'input2'],
          'NotImplemented'
        );
      }).toThrowError('The NotImplemented type is not implemented.');
    })
  );
});
