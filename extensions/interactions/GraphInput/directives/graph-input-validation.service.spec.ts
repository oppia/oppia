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
import { Rule } from 'domain/exploration/rule.model';
import { GraphAnswer } from 'interactions/answer-defs';

import { AppConstants } from 'app.constants';
import { GraphInputCustomizationArgs } from
  'interactions/customization-args-defs';

describe('GraphInputValidationService', () => {
  let WARNING_TYPES: typeof AppConstants.WARNING_TYPES;
  let validatorService: GraphInputValidationService;
  let currentState: string;
  let customizationArguments: GraphInputCustomizationArgs;
  let answerGroups: AnswerGroup[], goodDefaultOutcome: Outcome;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GraphInputValidationService]
    });

    WARNING_TYPES = AppConstants.WARNING_TYPES;
    validatorService = TestBed.get(GraphInputValidationService);
    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
    currentState = 'First State';
    goodDefaultOutcome = oof.createFromBackendDict({
      dest: 'Second State',
      dest_if_really_stuck: null,
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

    var answerGroup = agof.createNew(
      [Rule.createFromBackendDict({
        inputs: {
          g: {
            vertices: new Array(10)
          }
        },
        rule_type: 'IsIsomorphicTo'
      }, 'GraphInput'), Rule.createFromBackendDict({
        inputs: {
          g: {
            vertices: new Array(10)
          }
        },
        rule_type: 'IsIsomorphicTo'
      }, 'GraphInput')],
      goodDefaultOutcome,
      [],
      null);
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
        // This throws "Argument of type '{}'. We need to suppress this error
        // because ..  oppia/comment-style is not assignable to parameter of
        // type 'GraphInputCustomizationArgs'." We are purposely assigning the
        // wrong type of customization args in order to test validations.
        // @ts-expect-error
        currentState, {}, answerGroups, goodDefaultOutcome);
    }).toThrowError(
      'Expected customization arguments to have properties: ' +
      'graph, canEditEdgeWeight, canEditVertexLabel');
  });

  it('should validate the maximum number of vertices in the graph', () => {
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

  it('should validate the maximum number of vertices in the graph for an ' +
    'isomorphism check', () => {
    (answerGroups[0].rules[0].inputs.g as GraphAnswer).vertices = new Array(11);
    (answerGroups[0].rules[1].inputs.g as GraphAnswer).vertices = new Array(11);
    (answerGroups[1].rules[0].inputs.g as GraphAnswer).vertices = new Array(11);
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'The graph used in the learner answer 1 in Oppia response ' +
          '1 exceeds supported maximum number of vertices of ' +
          '10 for isomorphism check.'
    }, {
      type: WARNING_TYPES.CRITICAL,
      message: 'The graph used in the learner answer 2 in Oppia response ' +
          '1 exceeds supported maximum number of vertices of ' +
          '10 for isomorphism check.'
    }, {
      type: WARNING_TYPES.CRITICAL,
      message: 'The graph used in the learner answer 1 in Oppia response ' +
          '2 exceeds supported maximum number of vertices of ' +
          '10 for isomorphism check.'
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

  it('should not verify vertex graph that has \'HasGraphProperty\'' +
  ' rule type', () => {
    var answerGroup = agof.createNew(
      [Rule.createNew('HasGraphProperty', {
        g: {
          vertices: new Array(10)
        }
      }, { g: ''})],
      goodDefaultOutcome,
      [],
      null);
    answerGroups = [answerGroup, cloneDeep(answerGroup)];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should validate the maximum number of vertices in the graph', () => {
    var answerGroup = agof.createNew(
      [Rule.createNew('rule', {
        g: {
          vertices: new Array(52)
        }
      }, { g: ''})],
      goodDefaultOutcome,
      [],
      null);
    answerGroups = [answerGroup, cloneDeep(answerGroup)];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: AppConstants.WARNING_TYPES.CRITICAL,
      message: (
        'The graph used in the learner answer 1 in Oppia response 1 ' +
        'exceeds supported maximum number of vertices of 50.')
    }, {
      type: AppConstants.WARNING_TYPES.CRITICAL,
      message: (
        'The graph used in the learner answer 1 in Oppia response 2 ' +
        'exceeds supported maximum number of vertices of 50.')
    }]);
  });

  it('should throw error when rule is invalid', () => {
    var answerGroup = agof.createNew(
      [new Rule(new Error('Error') as unknown as string, {}, {})],
      goodDefaultOutcome,
      [],
      null);
    answerGroups = [answerGroup, cloneDeep(answerGroup)];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: AppConstants.WARNING_TYPES.CRITICAL,
      message: (
        'Learner answer 1 in Oppia response 1 is invalid.')
    }, {
      type: AppConstants.WARNING_TYPES.CRITICAL,
      message: (
        'Learner answer 1 in Oppia response 2 is invalid.')
    }]);
  });
});
