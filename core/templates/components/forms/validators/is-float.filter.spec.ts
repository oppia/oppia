// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Validator to check if input is float.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('components/forms/validators/is-float.filter.ts');

describe('Normalizer tests', function() {
  var filterName = 'isFloat';

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  it('should have the relevant filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should validate floats correctly', angular.mock.inject(function($filter) {
    var filter = $filter('isFloat');
    expect(filter('1.23')).toEqual(1.23);
    expect(filter('-1.23')).toEqual(-1.23);
    expect(filter('0')).toEqual(0);
    expect(filter('-1')).toEqual(-1);
    expect(filter('-1.0')).toEqual(-1);
    expect(filter('1,5')).toEqual(1.5);
    expect(filter('1%')).toEqual(0.01);
    expect(filter('1.5%')).toEqual(0.015);
    expect(filter('-5%')).toEqual(-0.05);
    expect(filter('.35')).toEqual(0.35);
    expect(filter(',3')).toEqual(0.3);
    expect(filter('.3%')).toEqual(0.003);
    expect(filter('2,5%')).toEqual(0.025);
    expect(filter('3.2% ')).toEqual(0.032);
    expect(filter(' 3.2% ')).toEqual(0.032);
    expect(filter('0.')).toEqual(0);

    expect(filter('3%%')).toBeUndefined();
    expect(filter('-')).toBeUndefined();
    expect(filter('.')).toBeUndefined();
    expect(filter(',')).toBeUndefined();
    expect(filter('5%,')).toBeUndefined();
    expect(filter('')).toBeUndefined();
    expect(filter('1.23a')).toBeUndefined();
    expect(filter('abc')).toBeUndefined();
    expect(filter('2+3')).toBeUndefined();
    expect(filter('--1.23')).toBeUndefined();
    expect(filter('=1.23')).toBeUndefined();
    expect(filter(undefined)).toBeUndefined();
  }));
});
