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
 * @fileoverview Tests for FormatRtePreview filter for Oppia.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('filters/format-rte-preview.filter.ts');

describe('Testing filters', function() {
  var filterName = 'formatRtePreview';
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should get correct list of RTE components from HTML input',
    angular.mock.inject(function($filter) {
      var filter = $filter('formatRtePreview');
      expect(
        filter('<p>Text input</p>')
      ).toEqual('Text input');
      expect(
        filter('<p><oppia-noninteractive-math attr1=value1>' +
        '</oppia-noninteractive-math>Text input</p>')
      ).toEqual('[Math] Text input');
      expect(
        filter('<p><oppia-noninteractive-math></oppia-noninteractive-math>' +
        'Text input<oppia-noninteractive-collapsible>' +
        '</oppia-noninteractive-collapsible>Text input 2</p>')
      ).toEqual('[Math] Text input [Collapsible] Text input 2');
      expect(
        filter('<p><oppia-noninteractive-math></oppia-noninteractive-math>' +
        'Text&nbsp;input<sample_tag><oppia-noninteractive-collapsible>' +
        '</oppia-noninteractive-collapsible><a><sample_tag>Text input 2' +
        '</sample_tag></a></p>')
      ).toEqual('[Math] Text input [Collapsible] Text input 2');
      expect(
        filter('<oppia-noninteractive-math></oppia-noninteractive-math>' +
        'Text input<oppia-noninteractive-collapsible>' +
        '</oppia-noninteractive-collapsible>Text input 2' +
        '<oppia-noninteractive-image>' +
        '</oppia-noninteractive-image> Text Input 3 ')
      ).toEqual('[Math] Text input [Collapsible] Text input 2 [Image]  ' +
      'Text Input 3');
    }));
});
