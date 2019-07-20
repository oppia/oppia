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

// TODO(YashJipkate) Remove the following block of unnnecessary imports once
// all the rules are upgraded to Angular 8.
import { CodeNormalizerService } from 'services/CodeNormalizerService.ts';
import { GraphUtilsService } from
  'interactions/GraphInput/directives/GraphUtilsService.ts';
// ^^^ This block is to be removed.

describe('Rule spec services', function() {
  var rulesServices = {};
  var ruleTemplates;

  beforeEach(function() {
    angular.mock.module('oppia');
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('CodeNormalizerService', new CodeNormalizerService());
    $provide.value('GraphUtilsService', new GraphUtilsService());
    // The below services are not mocked by using their actual class instance
    // since the services are tested in an iterative way and this causes
    // problems since a class instance and a function cannot be tested in the
    // same way. Therefore, these services has to be mocked to its full
    // functionality.
    $provide.value('ContinueRulesService', {});
    $provide.value('EndExplorationRulesService', {});
    $provide.value('ImageClickInputRulesService', {
      IsInRegion: function(answer, inputs) {
        return answer.clickedRegions.indexOf(inputs.x) !== -1;
      }
    });
    $provide.value('MathExpressionInputRulesService', {
      IsMathematicallyEquivalentTo: function(answer, inputs) {
        return (
          MathExpression.fromLatex(answer.latex).equals(
            MathExpression.fromLatex(inputs.x)));
      }
    })
  }));

  var getRulesServiceName = function(interactionId) {
    return (
      interactionId + 'RulesService'
    );
  };

  beforeEach(angular.mock.inject(function($injector) {
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
