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
 * @fileoverview Tests for ParameterizeRuleDescription filter for Oppia.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// parameterize-rule-description.filter.ts is upgraded to Angular 8.
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('filters/parameterize-rule-description.filter.ts');
require('filters/string-utility-filters/convert-to-plain-text.filter.ts');

describe('Testing filters', function() {
  var filterName = 'parameterizeRuleDescription';
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('FractionObjectFactory', new FractionObjectFactory());
    $provide.value('UnitsObjectFactory', new UnitsObjectFactory());
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should correctly parameterize rule description filter',
    angular.mock.inject(function($filter) {
      var ruleMultipleChoice = {
        type: 'Equals',
        inputs: {
          x: 0
        }
      };
      var interactionIdMultipleChoice = 'TextInput';
      var choicesMultipleChoice = [
        {
          label: '$10 should not become $$10',
          val: 0
        }
      ];
      expect($filter('parameterizeRuleDescription')(ruleMultipleChoice,
        interactionIdMultipleChoice, choicesMultipleChoice)
      ).toEqual('is equal to \'$10 should not become $$10\'');

      choicesMultipleChoice = [
        {
          label: '$xyz should not become $$xyz',
          val: 0
        }
      ];
      expect($filter('parameterizeRuleDescription')(ruleMultipleChoice,
        interactionIdMultipleChoice, choicesMultipleChoice)
      ).toEqual('is equal to \'$xyz should not become $$xyz\'');
    }));

  it('should correctly display RTE components in Answer Group Header',
    angular.mock.inject(function($filter) {
      var ruleMath = {
        type: 'Equals',
        inputs: {
          x: 2
        }
      };
      var interactionIdMath = 'TextInput';
      var choicesMath = [
        {
          label: '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;' +
            'x^3 - a x^2 - b x - c&amp;quot;"></oppia-noninteractive-math>',
          val: 0
        }, {
          label: '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;' +
            'x^3 + (a+b+c)x^2 + (ab+bc+ca)x + abc&amp;quot;">' +
            '</oppia-noninteractive-math>',
          val: 1
        }, {
          label: '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;' +
            'x^3 - (a+b+c)x^2 + (ab+bc+ca)x - abc&amp;quot;">' +
            '</oppia-noninteractive-math>',
          val: 2
        }, {
          label: '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;' +
            'x^3 + (a+b+c)x^2 - (ab+bc+ca)x + abc&amp;quot;">' +
            '</oppia-noninteractive-math>',
          val: 3
        },
      ];

      var ruleMixed = {
        type: 'Equals',
        inputs: {
          x: 0
        }
      };
      var interactionIdMixed = 'TextInput';
      var choicesMixed = [
        {
          label: '<p><oppia-noninteractive-image alt-with-value="&amp;' +
            'quot;f&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"' +
            'filepath-with-value="&amp;quot;img_20180112_170413_5jxq15ngmd' +
            '.png&amp;quot;"></oppia-noninteractive-image>This is a text ' +
            'input.</p><p><oppia-noninteractive-image alt-with-value="&amp;' +
            'quot;f&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"' +
            'filepath-with-value="&amp;quot;img_20180112_170436_k7sz3xtvyy.' +
            'png&amp;quot;"></oppia-noninteractive-image></p><p><oppia-' +
            'noninteractive-link text-with-value="&amp;quot;&amp;quot;"' +
            'url-with-value="&amp;quot;https://www.example.com&amp;quot;">' +
            '</oppia-noninteractive-link><br><br></p>',
          val: 0
        }, {
          label: '<p><oppia-noninteractive-image alt-with-value="&amp;quot;' +
            'g&amp;quot;" caption-with-value="&amp;quot;&amp;quot;" filepath-' +
            'with-value="&amp;quot;img_20180112_170500_926cssn398.png&amp;' +
            'quot;"></oppia-noninteractive-image><br></p>',
          val: 1
        }
      ];

      expect($filter('convertToPlainText')($filter('formatRtePreview')(
        $filter('parameterizeRuleDescription')(ruleMath, interactionIdMath,
          choicesMath)))
      ).toEqual('is ' + 'equal to \'[Math]\'');

      expect($filter('convertToPlainText')($filter('formatRtePreview')(
        $filter('parameterizeRuleDescription')(ruleMixed, interactionIdMixed,
          choicesMixed)))
      ).toEqual('is ' + 'equal to \'[Image] This is a text ' +
        'input. [Image]  [Link]\'');
    })
  );
});
