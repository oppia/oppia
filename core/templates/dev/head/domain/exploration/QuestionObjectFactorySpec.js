// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for QuestionObjectFactory.
 */

describe('Question object factory', function() {
  var AnswerGroupObjectFactory;
  var InteractionObjectFactory;
  var QuestionObjectFactory;
  var sampleQuestion;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    AnswerGroupObjectFactory = $injector.get('AnswerGroupObjectFactory');
    InteractionObjectFactory = $injector.get('InteractionObjectFactory');
    QuestionObjectFactory = $injector.get('QuestionObjectFactory');

    sampleQuestion = QuestionObjectFactory.create(
      'First state',
      InteractionObjectFactory.create({
        answer_groups: [{
          correct: false,
          outcome: {
            dest: 'Second state',
            feedback: ['Some feedback'],
            param_changes: []
          },
          rule_specs: [{
            inputs: {
              x: 0
            }
          }]
        }],
        confirmed_unclassified_answers: [],
        customization_args: {
          choices: {
            value: [
              'Choice 1',
              'Choice 2'
            ]
          }
        },
        default_outcome: {
          dest: 'First state',
          feedback: ['Try again.'],
          param_changes: []
        },
        fallbacks: [],
        id: 'MultipleChoiceInput'
      }),
      'Second state content'
    );
  }));

  it('should be able to retrieve the properties of a question', function() {
    expect(sampleQuestion.getStateName()).toEqual('First state');
    expect(sampleQuestion.getInteractionId()).toEqual('MultipleChoiceInput');
    expect(sampleQuestion.getInteractionCustomizationArgs()).toEqual({
      choices: {
        value: [
          'Choice 1',
          'Choice 2'
        ]
      }
    });
    expect(sampleQuestion.getAnswerGroups()).toEqual([
      AnswerGroupObjectFactory.createFromBackendDict({
        correct: false,
        outcome: {
          dest: 'Second state',
          feedback: ['Some feedback'],
          param_changes: []
        },
        rule_specs: [{
          inputs: {
            x: 0
          }
        }]
      })
    ]);
    expect(sampleQuestion.getDefaultOutcome()).toEqual({
      dest: 'First state',
      feedback: ['Try again.'],
      param_changes: []
    });
    expect(sampleQuestion.getDestinationStateName()).toEqual('Second state');
    expect(sampleQuestion.getBridgeHtml()).toEqual('Second state content');
  });

  it('should allow customization args to be set', function() {
    expect(sampleQuestion.getInteractionCustomizationArgs()).toEqual({
      choices: {
        value: [
          'Choice 1',
          'Choice 2'
        ]
      }
    });
    sampleQuestion.setInteractionCustomizationArgs({
      choices: {
        value: [
          'New choice 1'
        ]
      }
    });
    expect(sampleQuestion.getInteractionCustomizationArgs()).toEqual({
      choices: {
        value: [
          'New choice 1'
        ]
      }
    });
  });

  it('should allow answer groups to be set', function() {
    expect(sampleQuestion.getAnswerGroups()).toEqual([
      AnswerGroupObjectFactory.createFromBackendDict({
        correct: false,
        outcome: {
          dest: 'Second state',
          feedback: ['Some feedback'],
          param_changes: []
        },
        rule_specs: [{
          inputs: {
            x: 0
          }
        }]
      })
    ]);
    sampleQuestion.setAnswerGroups([
      AnswerGroupObjectFactory.createFromBackendDict({
        correct: false,
        outcome: {
          dest: 'Second state',
          feedback: ['New feedback'],
          param_changes: []
        },
        rule_specs: [{
          inputs: {
            x: 1
          }
        }]
      })
    ]);
    expect(sampleQuestion.getAnswerGroups()).toEqual([
      AnswerGroupObjectFactory.createFromBackendDict({
        correct: false,
        outcome: {
          dest: 'Second state',
          feedback: ['New feedback'],
          param_changes: []
        },
        rule_specs: [{
          inputs: {
            x: 1
          }
        }]
      })
    ]);
  });

  it('should allow the default outcome to be set', function() {
    expect(sampleQuestion.getDefaultOutcome()).toEqual({
      dest: 'First state',
      feedback: ['Try again.'],
      param_changes: []
    });
    sampleQuestion.setDefaultOutcome({
      dest: 'Second state',
      feedback: ['Carry on.'],
      param_changes: []
    });
    expect(sampleQuestion.getDefaultOutcome()).toEqual({
      dest: 'Second state',
      feedback: ['Carry on.'],
      param_changes: []
    });
  });

  it('should allow the bridge HTML to be set', function() {
    expect(sampleQuestion.getBridgeHtml()).toEqual('Second state content');
    sampleQuestion.setBridgeHtml('New content');
    expect(sampleQuestion.getBridgeHtml()).toEqual('New content');
  });

  it('should correctly test whether there are answer groups', function() {
    sampleQuestion.setAnswerGroups([
      AnswerGroupObjectFactory.createFromBackendDict({
        correct: false,
        outcome: {
          dest: 'Second state',
          feedback: ['New feedback'],
          param_changes: []
        },
        rule_specs: [{
          inputs: {
            x: 1
          }
        }]
      })
    ]);
    expect(sampleQuestion.hasAnswerGroups()).toBe(true);

    sampleQuestion.setAnswerGroups([]);
    expect(sampleQuestion.hasAnswerGroups()).toBe(false);
  });
});
