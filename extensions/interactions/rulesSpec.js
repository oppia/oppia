// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests to check that all the relevant rules exist.
 */

describe('Rule spec services', function() {
  var rulesServices = {};
  var ruleTemplates;

  beforeEach(function() {
    module('oppia');
  });

  var getRulesServiceName = function(interactionId) {
    return (
      interactionId[0].toLowerCase() + interactionId.substr(1) + 'RulesService'
    );
  };

  beforeEach(inject(function($injector) {
    ruleTemplates =
      window.__fixtures__['extensions/interactions/rule_templates'];
    Object.keys(ruleTemplates).forEach(function(interactionId) {
      var serviceName = getRulesServiceName(interactionId);
      rulesServices[serviceName] = $injector.get(serviceName);
    });
  }));

  it('should include evaluation methods for all explicit rules', function() {
    Object.keys(ruleTemplates).forEach(function(interactionId) {
      var serviceName = getRulesServiceName(interactionId);
      Object.keys(ruleTemplates[interactionId]).forEach(function(ruleName) {
        expect(rulesServices[serviceName][ruleName]).toBeDefined(
          '. ERROR: ' + ruleName + ' not found in service ' + serviceName);
      });
    });
  });
});
