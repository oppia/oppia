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
  var QuestionObjectFactory = null;
  var _sampleQuestion = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    QuestionObjectFactory = $injector.get('QuestionObjectFactory');

    _sampleQuestion = QuestionObjectFactory.create('First state', {
      answer_groups: [{
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
    }, 'Second state content');
  }));

  it('should be able to retrieve the properties of a question', function() {
    expect(_sampleQuestion.getStateName()).toEqual('First state');
    expect(_sampleQuestion.getInteractionId()).toEqual('MultipleChoiceInput');
    expect(_sampleQuestion.getInteractionCustomizationArgs()).toEqual({
      choices: {
        value: [
          'Choice 1',
          'Choice 2'
        ]
      }
    });
    expect(_sampleQuestion.getAnswerGroups()).toEqual([{
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
    }]);
    expect(_sampleQuestion.getDefaultOutcome()).toEqual({
      dest: 'First state',
      feedback: ['Try again.'],
      param_changes: []
    });
    expect(_sampleQuestion.getDestinationStateName()).toEqual('Second state');
    expect(_sampleQuestion.getBridgeHtml()).toEqual('Second state content');
  });

  it('should allow customization args to be set', function() {
    expect(_sampleQuestion.getInteractionCustomizationArgs()).toEqual({
      choices: {
        value: [
          'Choice 1',
          'Choice 2'
        ]
      }
    });
    _sampleQuestion.setInteractionCustomizationArgs({
      choices: {
        value: [
          'New choice 1'
        ]
      }
    });
    expect(_sampleQuestion.getInteractionCustomizationArgs()).toEqual({
      choices: {
        value: [
          'New choice 1'
        ]
      }
    });
  });

  it('should allow answer groups to be set', function() {
    expect(_sampleQuestion.getAnswerGroups()).toEqual([{
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
    }]);
    _sampleQuestion.setAnswerGroups([{
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
    }]);
    expect(_sampleQuestion.getAnswerGroups()).toEqual([{
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
    }]);
  });

  it('should allow the default outcome to be set', function() {
    expect(_sampleQuestion.getDefaultOutcome()).toEqual({
      dest: 'First state',
      feedback: ['Try again.'],
      param_changes: []
    });
    _sampleQuestion.setDefaultOutcome({
      dest: 'Second state',
      feedback: ['Carry on.'],
      param_changes: []
    });
    expect(_sampleQuestion.getDefaultOutcome()).toEqual({
      dest: 'Second state',
      feedback: ['Carry on.'],
      param_changes: []
    });
  });

  it('should allow the bridge HTML to be set', function() {
    expect(_sampleQuestion.getBridgeHtml()).toEqual('Second state content');
    _sampleQuestion.setBridgeHtml('New content');
    expect(_sampleQuestion.getBridgeHtml()).toEqual('New content');
  });

  it('should correctly test whether there are answer groups', function() {
    _sampleQuestion.setAnswerGroups([{
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
    }]);
    expect(_sampleQuestion.hasAnswerGroups()).toBe(true);

    _sampleQuestion.setAnswerGroups([]);
    expect(_sampleQuestion.hasAnswerGroups()).toBe(false);
  });
});
