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
 * @fileoverview Tests for QuestionListObjectFactory.
 */

describe('Question List Object Factory', function() {
  var InteractionObjectFactory;
  var QuestionListObjectFactory;
  var QuestionObjectFactory;
  var sampleQuestions;
  var questionList;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    InteractionObjectFactory = $injector.get('InteractionObjectFactory');
    QuestionObjectFactory = $injector.get('QuestionObjectFactory');
    QuestionListObjectFactory = $injector.get('QuestionListObjectFactory');
  }));

  beforeEach(function() {
    sampleQuestions = [
      QuestionObjectFactory.create(
        'First state',
        InteractionObjectFactory.createFromBackendDict({
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
              value: ['Choice 1', 'Choice 2', 'Choice3']
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
      ),
      QuestionObjectFactory.create(
        'Second state',
        InteractionObjectFactory.createFromBackendDict({
          answer_groups: [{
            correct: false,
            outcome: {
              dest: 'End state',
              feedback: ['Some feedback'],
              param_changes: []
            },
            rule_specs: [{
              inputs: {
                x: 1
              }
            }]
          }],
          confirmed_unclassified_answers: [],
          customization_args: {
            choices: {
              value: ['Choice 1', 'Choice 2']
            }
          },
          default_outcome: {
            dest: 'Second state',
            feedback: ['Try again.'],
            param_changes: []
          },
          fallbacks: [],
          id: 'MultipleChoiceInput'
        }),
        'Third state content'
      )
    ];

    questionList = QuestionListObjectFactory.create(sampleQuestions);
  });

  it('should return copy of list instance', function() {
    var returnedQuestionList1 = questionList.getQuestions();
    var returnedQuestionList2 = questionList.getQuestions();
    expect(returnedQuestionList1 === returnedQuestionList2).toBe(false);
  });

  it('should return same question instances', function() {
    var returnedQuestionList1 = questionList.getQuestions();
    var returnedQuestionList2 = questionList.getQuestions();
    var result = true;
    returnedQuestionList1.forEach(function(value, index) {
      result = (returnedQuestionList1[index] === returnedQuestionList2[index]);
    });
    expect(result).toBe(true);
  });

  it('should add question', function() {
    var newQuestion = QuestionObjectFactory.create(
      'Third state',
      InteractionObjectFactory.createFromBackendDict({
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
            value: ['Choice 1', 'Choice 2']
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
      'Fourth state content');

    questionList.addQuestion(newQuestion);
    var returnedQuestionList = questionList.getQuestions();
    expect(
      newQuestion === returnedQuestionList[returnedQuestionList.length - 1]
    ).toBe(true);
  });

  it('should have answer group', function() {
    expect(questionList.doesLastQuestionHaveAnswerGroups())
      .toBe(true);
  });

  it('should return all questions state names', function() {
    var expectedStateNames = sampleQuestions.map(function(question) {
      return question.getStateName();
    });
    var returnedStateNames = questionList.getAllStateNames();
    var result = true;
    expectedStateNames.forEach(function(value, index) {
      result = (expectedStateNames[index] === returnedStateNames[index]);
    });
    expect(result).toBe(true);
  });

  it('should not be empty', function() {
    expect(questionList.isEmpty()).toBe(false);
  });

  it('should return question count', function() {
    expect(questionList.getQuestionCount() === sampleQuestions.length)
      .toBe(true);
  });

  it('should return next state name', function() {
    var curState = sampleQuestions[0].getStateName();
    var expectedState = sampleQuestions[0].getDestinationStateName();
    expect(questionList.getNextStateName(curState)).toEqual(expectedState);
  });

  it('should throw error instead of returning next state name', function() {
    var randomState = 'Random State';
    expect(function() {
      questionList.getNextStateName(randomState);
    }).toThrow('Could not find next state name after: ' + randomState);
  });

  it('should return bindable question', function() {
    var stateName = sampleQuestions[0].getStateName();
    var returnedQuestion1 = questionList.getBindableQuestion(stateName);
    var returnedQuestion2 = questionList.getBindableQuestion(stateName);
    expect(returnedQuestion1 === returnedQuestion2).toBe(true);
  });

  it('should throw error instead of returning bindable question', function() {
    var randomState = 'Random State';
    expect(function() {
      questionList.getBindableQuestion(randomState);
    }).toThrow(
      'Cannot find question corresponding to state named: ' + randomState
    );
  });

  it('should return last question', function() {
    var expectedQuestion = sampleQuestions[sampleQuestions.length - 1];
    var returnedQuestion = questionList.getLastQuestion();
    expect(returnedQuestion).toBeDefined();
    expect(returnedQuestion).toEqual(expectedQuestion);
  });

  it('should return copy of last question instance', function() {
    var expectedQuestion = sampleQuestions[sampleQuestions.length - 1];
    var returnedQuestion = questionList.getLastQuestion();
    expect(returnedQuestion).toBeDefined();
    expect(returnedQuestion === expectedQuestion).toBe(false);
  });
});
