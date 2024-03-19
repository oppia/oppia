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

// TODO(#7222): Remove the following block of unnnecessary imports once
// all the rules are upgraded to Angular 8.
import {CodeNormalizerService} from 'services/code-normalizer.service';
import {GraphUtilsService} from 'interactions/GraphInput/directives/graph-utils.service';
import {UnitsObjectFactory} from 'domain/objects/UnitsObjectFactory';
import {SetInputRulesService} from 'interactions/SetInput/directives/set-input-rules.service';
import {NumericInputRulesService} from 'interactions/NumericInput/directives/numeric-input-rules.service';
import {InteractiveMapRulesService} from 'interactions/InteractiveMap/directives/interactive-map-rules.service';
import {MusicNotesInputRulesService} from 'interactions/MusicNotesInput/directives/music-notes-input-rules.service';
import {AlgebraicExpressionInputRulesService} from 'interactions/AlgebraicExpressionInput/directives/algebraic-expression-input-rules.service';
import {DragAndDropSortInputRulesService} from 'interactions/DragAndDropSortInput/directives/drag-and-drop-sort-input-rules.service';
import {MultipleChoiceInputRulesService} from 'interactions/MultipleChoiceInput/directives/multiple-choice-input-rules.service';
import {ItemSelectionInputRulesService} from 'interactions/ItemSelectionInput/directives/item-selection-input-rules.service';
import {MathEquationInputRulesService} from 'interactions/MathEquationInput/directives/math-equation-input-rules.service';
import {NumberWithUnitsRulesService} from 'interactions/NumberWithUnits/directives/number-with-units-rules.service';
import {NumberWithUnitsObjectFactory} from 'domain/objects/NumberWithUnitsObjectFactory';
import {NumericExpressionInputRulesService} from 'interactions/NumericExpressionInput/directives/numeric-expression-input-rules.service';
import {FractionInputRulesService} from 'interactions/FractionInput/directives/fraction-input-rules.service';
import {GraphInputRulesService} from 'interactions/GraphInput/directives/graph-input-rules.service';
import {RatioExpressionInputRulesService} from 'interactions/RatioExpressionInput/directives/ratio-expression-input-rules.service';
import {UtilsService} from 'services/utils.service';
import {UpgradedServices} from 'services/UpgradedServices';
import {ImageClickAnswer} from './answer-defs';
import {ImageClickRuleInputs} from './rule-input-defs';
import {MathInteractionsService} from 'services/math-interactions.service';
// ^^^ This block is to be removed.

describe('Rule spec services', function () {
  var rulesServices = {};
  var ruleTemplates: RuleTemplates;

  beforeEach(function () {
    angular.mock.module('oppia');
  });

  beforeEach(
    angular.mock.module('oppia', function ($provide) {
      $provide.value('CodeNormalizerService', new CodeNormalizerService());
      $provide.value('CodeNormalizerService', new CodeNormalizerService());
      $provide.value('GraphUtilsService', new GraphUtilsService());
      $provide.value('SetInputRulesService', new SetInputRulesService());
      $provide.value(
        'AlgebraicExpressionInputRulesService',
        new AlgebraicExpressionInputRulesService(
          new MathInteractionsService(),
          new NumericExpressionInputRulesService()
        )
      );
      $provide.value(
        'RatioExpressionInputRulesService',
        new RatioExpressionInputRulesService()
      );
      $provide.value(
        'DragAndDropSortInputRulesService',
        new DragAndDropSortInputRulesService()
      );
      $provide.value(
        'MathEquationInputRulesService',
        new MathEquationInputRulesService(
          new AlgebraicExpressionInputRulesService(
            new MathInteractionsService(),
            new NumericExpressionInputRulesService()
          )
        )
      );
      $provide.value(
        'MultipleChoiceInputRulesService',
        new MultipleChoiceInputRulesService()
      );
      $provide.value(
        'NumericInputRulesService',
        new NumericInputRulesService()
      );
      $provide.value(
        'InteractiveMapRulesService',
        new InteractiveMapRulesService()
      );
      $provide.value(
        'MusicNotesInputRulesService',
        new MusicNotesInputRulesService(new UtilsService())
      );
      $provide.value(
        'ItemSelectionInputRulesService',
        new ItemSelectionInputRulesService()
      );
      $provide.value(
        'NumberWithUnitsRulesService',
        new NumberWithUnitsRulesService(
          new NumberWithUnitsObjectFactory(new UnitsObjectFactory()),
          new UtilsService()
        )
      );
      $provide.value(
        'NumericExpressionInputRulesService',
        new NumericExpressionInputRulesService()
      );
      $provide.value(
        'FractionInputRulesService',
        new FractionInputRulesService(new UtilsService())
      );
      $provide.value(
        'GraphInputRulesService',
        new GraphInputRulesService(new GraphUtilsService(), new UtilsService())
      );
      // This service is not mocked by using its actual class instance since the
      // services are tested in an iterative way and this causes problems since
      // a class instance and a function cannot be tested in the same way. The
      // test needs to have consistency and thus have to be all initialized the
      // same way. Therefore, this service has to be mocked to its full
      // functionality rather than importing its class.
      $provide.value('ContinueRulesService', {});
      $provide.value('EndExplorationRulesService', {});
      $provide.value('ImageClickInputRulesService', {
        IsInRegion: function (
          answer: ImageClickAnswer,
          inputs: ImageClickRuleInputs
        ) {
          return answer.clickedRegions.indexOf(inputs.x) !== -1;
        },
      });
      $provide.value('UnitsObjectFactory', new UnitsObjectFactory());
    })
  );
  beforeEach(
    angular.mock.module('oppia', function ($provide) {
      var ugs = new UpgradedServices();
      for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
        $provide.value(key, value);
      }
    })
  );

  var getRulesServiceName = function (interactionId) {
    return interactionId + 'RulesService';
  };

  beforeEach(
    angular.mock.inject(function ($injector) {
      ruleTemplates =
        window.__fixtures__['extensions/interactions/rule_templates'];
      Object.keys(ruleTemplates).forEach(function (interactionId) {
        var serviceName = getRulesServiceName(interactionId);
        rulesServices[serviceName] = $injector.get(serviceName);
      });
    })
  );

  it('should include evaluation methods for all explicit rules', function () {
    Object.keys(ruleTemplates).forEach(function (interactionId) {
      var serviceName = getRulesServiceName(interactionId);
      Object.keys(ruleTemplates[interactionId]).forEach(function (ruleName) {
        expect(rulesServices[serviceName][ruleName]).toBeDefined(
          '. ERROR: ' + ruleName + ' not found in service ' + serviceName
        );
      });
    });
  });
});
