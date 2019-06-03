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

require('filters/parameterize-rule-description.filter.ts');

describe('Testing filters', function() {
  var filterName = 'parameterizeRuleDescription';
  beforeEach(angular.mock.module('oppia'));

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
});