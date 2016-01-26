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

describe('oppiaInteractiveGraphInputValidator', function() {
  var WARNING_TYPES, validator;
  var currentState, customizationArguments, answerGroups, goodDefaultOutcome;

  beforeEach(function() {
    module('oppia');
  });

  beforeEach(inject(function($rootScope, $controller, $injector) {
    WARNING_TYPES = $injector.get('WARNING_TYPES');
    validator = $injector.get('$filter')('oppiaInteractiveGraphInputValidator');

    currentState = 'First State';
    goodDefaultOutcome = {
      dest: 'Second State',
      feedback: []
    };

    customizationArguments = {
      graph: {
        value: {
          vertices: new Array(10),
          isWeighted: false,
          isLabeled: false
        }
      },
      canEditEdgeWeight: {
        value: false
      },
      canEditVertexLabel: {
        value: false
      }
    };

    var answerGroup = {
      outcome: goodDefaultOutcome,
      rule_specs: [{
        inputs: {
          g: {
            vertices: new Array(10)
          }
        },
        rule_type: 'IsIsomorphicTo'
      }, {
        inputs: {
          g: {
            vertices: new Array(10)
          }
        },
        rule_type: 'IsIsomorphicTo'
      }]
    };
    answerGroups = [answerGroup, angular.copy(answerGroup)];
  }));

  it('should be able to perform basic validation', function() {
    var warnings = validator(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should expect graph and edit customization arguments', function() {
    expect(function() {
      validator(currentState, {}, answerGroups, goodDefaultOutcome);
    }).toThrow('Expected customization arguments to have properties: ' +
      'graph, canEditEdgeWeight, canEditVertexLabel');
  });

  it('The graph used in customization exceeds supported maximum number of ' +
    'vertices of 50.',
    function() {
      customizationArguments.graph.value.vertices = new Array(51);
      var warnings = validator(
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
    function() {
      answerGroups[0].rule_specs[0].inputs.g.vertices = new Array(11);
      answerGroups[0].rule_specs[1].inputs.g.vertices = new Array(11);
      answerGroups[1].rule_specs[0].inputs.g.vertices = new Array(11);
      var warnings = validator(
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

  it('should verify edge weight edit permissions make sense', function() {
    customizationArguments.graph.value.isWeighted = false;
    customizationArguments.canEditEdgeWeight.value = true;
    var warnings = validator(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: (
        'The learner cannot edit edge weights for an unweighted graph.')
    }]);
  });

  it('should verify vertex label edit permissions make sense', function() {
    customizationArguments.graph.value.isLabeled = false;
    customizationArguments.canEditVertexLabel.value = true;
    var warnings = validator(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: (
        'The learner cannot edit vertex labels for an unlabeled graph.')
    }]);
  });
});
