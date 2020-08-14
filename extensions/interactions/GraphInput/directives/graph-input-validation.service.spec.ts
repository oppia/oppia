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
 * @fileoverview Unit tests for graph input validation service.
 */

import cloneDeep from 'lodash/cloneDeep';

import { TestBed } from '@angular/core/testing';

import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { GraphInputValidationService } from
  'interactions/GraphInput/directives/graph-input-validation.service';
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';

import { AppConstants } from 'app.constants';
import { WARNING_TYPES_CONSTANT } from 'app-type.constants';
import { GraphInputCustomizationArgs } from
  'interactions/customization-args-defs';
import { GraphIsomorphicRuleInputs } from 'interactions/rule-input-defs';

describe('GraphInputValidationService', () => {
  let WARNING_TYPES: WARNING_TYPES_CONSTANT;
  let validatorService: GraphInputValidationService;
  let currentState: string;
  let customizationArguments: GraphInputCustomizationArgs;
  let answerGroups: AnswerGroup[], goodDefaultOutcome: Outcome;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory;
  let rof: RuleObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GraphInputValidationService]
    });

    WARNING_TYPES = AppConstants.WARNING_TYPES;
    validatorService = TestBed.get(GraphInputValidationService);
    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
    rof = TestBed.get(RuleObjectFactory);
    currentState = 'First State';
    goodDefaultOutcome = oof.createFromBackendDict({
      dest: 'Second State',
      feedback: {
        html: '',
        content_id: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });

    customizationArguments = {
      graph: {
        value: {
          vertices: new Array(10),
          isWeighted: false,
          isLabeled: false,
          isDirected: false,
          edges: []
        }
      },
      canEditEdgeWeight: {
        value: false
      },
      canEditVertexLabel: {
        value: false
      },
      canMoveVertex: {
        value: false
      },
      canDeleteVertex: {
        value: false
      },
      canDeleteEdge: {
        value: false
      },
      canAddVertex: {
        value: false
      },
      canAddEdge: {
        value: false
      }
    };

    var answerGroup = agof.createNew(goodDefaultOutcome, null, null);
    answerGroup.updateRuleTypesToInputs(
      [rof.createFromBackendDict({
        inputs: {
          g: {
            vertices: new Array(10)
          }
        },
        rule_type: 'IsIsomorphicTo'
      }), rof.createFromBackendDict({
        inputs: {
          g: {
            vertices: new Array(10)
          }
        },
        rule_type: 'IsIsomorphicTo'
      })]
    );
    answerGroups = [answerGroup, cloneDeep(answerGroup)];
  });

  it('should be able to perform basic validation', () => {
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should expect graph and edit customization arguments', () => {
    expect(() => {
      validatorService.getAllWarnings(
        // This throws "Argument of type '{}' is not assignable to
        // parameter of type 'GraphInputCustomizationArgs'." We are purposely
        // assigning the wrong type of customization args in order to test
        // validations.
        // @ts-expect-error
        currentState, {}, answerGroups, goodDefaultOutcome);
    }).toThrowError(
      'Expected customization arguments to have properties: ' +
      'graph, canEditEdgeWeight, canEditVertexLabel');
  });

  it('The graph used in customization exceeds supported maximum number of ' +
    'vertices of 50.',
  () => {
    customizationArguments.graph.value.vertices = new Array(51);
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'The graph used in customization exceeds supported maximum ' +
          'number of vertices of 50.'
    }]);
  });

  it('The graph used in the rule x in group y exceeds supported maximum ' +
    'number of vertices of 10 for isomorphism check.',
  () => {
    (<GraphIsomorphicRuleInputs>
      answerGroups[0].ruleTypesToInputs.IsIsomorphicTo[0]
    ).g.vertices = new Array(11);
    (<GraphIsomorphicRuleInputs>
      answerGroups[0].ruleTypesToInputs.IsIsomorphicTo[1]
    ).g.vertices = new Array(11);
    (<GraphIsomorphicRuleInputs>
      answerGroups[1].ruleTypesToInputs.IsIsomorphicTo[0]
    ).g.vertices = new Array(11);
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'The graph used in the rule 1 in group 1 exceeds supported ' +
          'maximum number of vertices of 10 for isomorphism check.'
    }, {
      type: WARNING_TYPES.CRITICAL,
      message: 'The graph used in the rule 2 in group 1 exceeds supported ' +
          'maximum number of vertices of 10 for isomorphism check.'
    }, {
      type: WARNING_TYPES.CRITICAL,
      message: 'The graph used in the rule 1 in group 2 exceeds supported ' +
          'maximum number of vertices of 10 for isomorphism check.'
    }]);
  });

  it('should verify edge weight edit permissions make sense', () => {
    customizationArguments.graph.value.isWeighted = false;
    customizationArguments.canEditEdgeWeight.value = true;
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: (
        'The learner cannot edit edge weights for an unweighted graph.')
    }]);
  });

  it('should verify vertex label edit permissions make sense', () => {
    customizationArguments.graph.value.isLabeled = false;
    customizationArguments.canEditVertexLabel.value = true;
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: (
        'The learner cannot edit vertex labels for an unlabeled graph.')
    }]);
  });
});
