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
 * @fileoverview Unit tests for the SimpleEditorManagerService.js
 */

describe('Simple Editor Manager Service', function() {
  var stubs;
  var data;
  var mockExplorationData = {
    explorationId: 'exp_id',
    autosaveChangeList: function() { },
    discardDraft: function() { }
  };

  var simpleEditorManagerService;
  var questionObjectFactory;
  var answerGroupObjectFactory;
  var ruleObjectFactory;
  var outcomeObjectFactory;
  var explorationStatesService;
  var explorationTitleService;
  var explorationInitStateNameService;
  var statesToQuestionsService;
  var questionListObjectFactory;
  var validatorsService;
  var simpleEditorShimService;
  var questions;
  var questionList;
  var lastStateName;
  var DEFAULT_INTERACTION;
  var END_EXPLORATION_INTERACTION;

  beforeEach(module('oppia'));

  beforeEach(module(function($provide) {
    $provide.value('explorationData', mockExplorationData);
  }));

  beforeEach(inject(function($injector) {
    simpleEditorManagerService = $injector.get('SimpleEditorManagerService');
    questionObjectFactory = $injector.get('QuestionObjectFactory');
    answerGroupObjectFactory = $injector.get('AnswerGroupObjectFactory');
    ruleObjectFactory = $injector.get('RuleObjectFactory');
    outcomeObjectFactory = $injector.get('OutcomeObjectFactory');
    explorationStatesService = $injector.get('explorationStatesService');
    explorationTitleService = $injector.get('explorationTitleService');
    explorationInitStateNameService = $injector
      .get('explorationInitStateNameService');
    statesToQuestionsService = $injector.get('StatesToQuestionsService');
    questionListObjectFactory = $injector.get('QuestionListObjectFactory');
    validatorsService = $injector.get('validatorsService');
    simpleEditorShimService = $injector.get('SimpleEditorShimService');
  }));

  beforeEach(function() {
    stubs = {
      validatorsService: {
        isValidEntityName: function() { }
      }
    };

    data = {
      init_state_name: 'Introduction',
      title: 'Linear Algebra',
      states: {
        'Question 2': {
          param_changes: [],
          classifier_model_id: null,
          interaction: {
            fallbacks: [],
            default_outcome: null,
            answer_groups: [],
            confirmed_unclassified_answers: [],
            customization_args: {
              recommendedExplorationIds: []
            },
            id: 'EndExploration'
          },
          content: [
            {
              type: 'text',
              value: ''
            }
          ],
          unresolved_answers: {}
        },
        'Question 1': {
          content: [
            {
              value: '<p>lets move to next question.</p>',
              type: 'text'
            }
          ],
          interaction: {
            customization_args: {
              choices: {
                value: [
                  '<p>linear equation in one variable is aX+bY+c=0</p>',
                  '<p>linear equation in one variable is bY+c=0</p>',
                  '<p>linear equation in one variable is aY+bX+c=0</p>',
                  '<p>None of the above.</p>'
                ]
              }
            },
            confirmed_unclassified_answers: [],
            id: 'MultipleChoiceInput',
            default_outcome: {
              feedback: [
                '<p>All others have  two variables.</p>'
              ],
              dest: 'Question 1',
              param_changes: []
            },
            fallbacks: [],
            answer_groups: [
              {
                outcome: {
                  feedback: [
                    '<p>Y is the only variable.</p>'
                  ],
                  dest: 'Question 2',
                  param_changes: []
                },
                rule_specs: [
                  {
                    inputs: {
                      x: 1
                    },
                    rule_type: 'Equals'
                  }
                ]
              }
            ]
          },
          param_changes: [],
          unresolved_answers: {},
          classifier_model_id: null
        },
        Introduction: {
          param_changes: [],
          classifier_model_id: null,
          interaction: {
            fallbacks: [],
            default_outcome: {
              dest: 'Introduction',
              feedback: [
                '<p>all others can be ruled out by definition of slope.</p>'
              ],
              param_changes: []
            },
            answer_groups: [
              {
                rule_specs: [
                  {
                    rule_type: 'Equals',
                    inputs: {
                      x: 0
                    }
                  }
                ],
                outcome: {
                  dest: 'Question 1',
                  feedback: [
                    '<p>y/x is the measure of the slope.</p>'
                  ],
                  param_changes: []
                }
              }
            ],
            confirmed_unclassified_answers: [],
            customization_args: {
              choices: {
                value: [
                  '<p>y/x</p>',
                  '<p>-y/x</p>',
                  '<p>x/y</p>',
                  '<p>-x/y</p>'
                ]
              }
            },
            id: 'MultipleChoiceInput'
          },
          content: [
            {
              type: 'text',
              value: '<p><b>Linear algebra</b> is a subtopic of maths.</p>'
            }
          ],
          unresolved_answers: {}
        }
      }
    };

    DEFAULT_INTERACTION = {
      ID: 'MultipleChoiceInput',
      CUSTOMIZATION_ARGS: {
        choices: {
          value: ['<p>Option 1</p>']
        }
      }
    };

    END_EXPLORATION_INTERACTION = {
      ID: 'EndExploration',
      CUSTOMIZATION_ARGS: {
        recommendedExplorationIds: {
          value: []
        }
      }
    };

    explorationStatesService.init(data.states);
    explorationTitleService.init(data.title);
    explorationInitStateNameService.init(data.init_state_name);

    questions = statesToQuestionsService.getQuestions();
    questionList = questionListObjectFactory.create(questions);
    lastStateName = questionList.getLastQuestion().getDestinationStateName();

    spyOn(validatorsService, 'isValidEntityName').and.returnValue(true);
    spyOn(mockExplorationData, 'autosaveChangeList').and.returnValue(true);
  });

  it('should initialize the local data variables', function() {
    expect(simpleEditorManagerService.tryToInit()).toBe(true);
    expect(simpleEditorManagerService.getTitle()).toBe(data.title);
    expect(simpleEditorManagerService.getIntroductionHtml())
      .toBe(data.states.Introduction.content[0].value);
    // 'questionList' is generated from the test data.
    var expectedSimpleEditorManagerQuestionList = questionList;
    expect(simpleEditorManagerService.getQuestionList())
      .toEqual(expectedSimpleEditorManagerQuestionList);
  });

  it('should return false if initializing the question list fails',
    function() {
      spyOn(statesToQuestionsService, 'getQuestions').and.returnValue(null);
      expect(simpleEditorManagerService.tryToInit()).toBe(false);
    });

  it('should return data representing the exploration', function() {
    var expectedSimpleEditorManagerData = {
      title: data.title,
      introductionHtml: data.states.Introduction.content[0].value,
      questionList: null
    };
    simpleEditorManagerService.tryToInit();
    expectedSimpleEditorManagerData.questionList = questionList;
    expect(simpleEditorManagerService.getData())
      .toEqual(expectedSimpleEditorManagerData);
  });

  it('should return title', function() {
    var expectedTitle = data.title;
    simpleEditorManagerService.tryToInit();
    expect(simpleEditorManagerService.getTitle()).toEqual(expectedTitle);
  });

  it('should return introduction html', function() {
    var expectedIntroductionHtml = data.states.Introduction.content[0].value;
    simpleEditorManagerService.tryToInit();
    expect(simpleEditorManagerService.getIntroductionHtml())
      .toEqual(expectedIntroductionHtml);
  });

  it('should return question list', function() {
    var expectedSimpleEditorManagerQuestionList = questionList;
    simpleEditorManagerService.tryToInit();
    expect(simpleEditorManagerService.getQuestionList())
      .toEqual(expectedSimpleEditorManagerQuestionList);
  });

  it('should save the given new title', function() {
    var expectedNewTitle = 'ExpNewTitle';
    simpleEditorManagerService.saveTitle(expectedNewTitle);
    expect(explorationTitleService.savedMemento).toEqual(expectedNewTitle);
    expect(simpleEditorManagerService.getTitle()).toEqual(expectedNewTitle);
  });

  it('should save the given new introduction html', function() {
    var expectedNewIntroductionHtml = '<p> new intro </p>';
    simpleEditorManagerService
      .saveIntroductionHtml(expectedNewIntroductionHtml);
    expect(simpleEditorShimService.getIntroductionHtml())
      .toEqual(expectedNewIntroductionHtml);
    expect(simpleEditorManagerService.getIntroductionHtml())
      .toEqual(expectedNewIntroductionHtml);
  });

  it('should save the customization args', function() {
    var testStateName = 'Introduction';
    var expectedNewCustomizationArgs = {
      choices: {
        value: [
          '<p>Option 3</p>'
        ]
      }
    };
    simpleEditorManagerService.tryToInit();
    simpleEditorManagerService.saveCustomizationArgs(
      testStateName, expectedNewCustomizationArgs);
    expect(explorationStatesService.getState(testStateName)
      .interaction.customizationArgs).toEqual(expectedNewCustomizationArgs);
  });

  it('should save the answer groups', function() {
    var testStateName = 'Introduction';
    var newAnswerGroupRuleSpecs = [ruleObjectFactory.createNew('Contains', {
      x: 'ate'
    })];
    var newAnswerGroupOutcome = outcomeObjectFactory.createNew(
      'Question 1', ['<p>Omnomnom.</p>'], []);
    var expectedNewAnswerGroups = [answerGroupObjectFactory
      .createNew(newAnswerGroupRuleSpecs, newAnswerGroupOutcome, false)];
    simpleEditorManagerService.tryToInit();
    simpleEditorManagerService.saveAnswerGroups(
      testStateName, expectedNewAnswerGroups);
    expect(explorationStatesService.getState(testStateName)
      .interaction.answerGroups).toEqual(expectedNewAnswerGroups);
  });

  it('should save the default outcome', function() {
    var testStateName = 'Introduction';
    var expectedNewDefaultOutcome = outcomeObjectFactory.createNew(
      'Introduction', ['<p>One is wrong bcz many reasons</p>'], []);
    simpleEditorManagerService.tryToInit();
    simpleEditorManagerService.saveDefaultOutcome(
      testStateName, expectedNewDefaultOutcome);
    expect(explorationStatesService.getState(testStateName)
      .interaction.defaultOutcome).toEqual(expectedNewDefaultOutcome);
  });

  it('should save the bridge html', function() {
    var testStateName = 'Introduction';
    var expectedNewBridgeHtml = '<p> lets move to next Qsn </p>';
    var expectedSimpleEditorManagerQuestionList = questionList;
    simpleEditorManagerService.tryToInit();
    simpleEditorManagerService.saveBridgeHtml(
      testStateName, expectedNewBridgeHtml);
    var nextState = explorationStatesService
      .getState(expectedSimpleEditorManagerQuestionList
        .getNextStateName(testStateName));
    expect(nextState.content[0].value).toEqual(expectedNewBridgeHtml);
  });

  it('should add new question', function() {
    var expectedInteraction = DEFAULT_INTERACTION;
    var expectedLastStateName = lastStateName;
    var expectedDefaultOutcome = outcomeObjectFactory.createNew(
      expectedLastStateName, [''], []);
    simpleEditorManagerService.tryToInit();
    simpleEditorManagerService.addNewQuestion();
    var state = explorationStatesService.getState(expectedLastStateName);
    expect(state.interaction.id).toEqual(expectedInteraction.ID);
    expect(state.interaction.customizationArgs)
      .toEqual(expectedInteraction.CUSTOMIZATION_ARGS);
    expect(state.interaction.defaultOutcome).toEqual(expectedDefaultOutcome);
    var expectedQuestion = questionObjectFactory.create(
      expectedLastStateName, state.interaction, '');
    expect(simpleEditorManagerService.getQuestionList()._questions
      .some(function(question) {
        return angular.equals(question, expectedQuestion);
      })).toBe(true);
  });

  describe('deleteQuestion', function() {
    var stateNameOfQuestionToDelete;
    var questionToDelete;
    var nextStateName;

    beforeEach(function() {
      simpleEditorManagerService.tryToInit();
      stateNameOfQuestionToDelete = 'Question 1';
      nextStateName = 'Question 2';
      expect(function() {
        simpleEditorManagerService.getQuestionList()
          .getBindableQuestion(stateNameOfQuestionToDelete);
      }).not.toThrowError();
      questionToDelete = questionList
        .getBindableQuestion(stateNameOfQuestionToDelete);
      expect(explorationStatesService.hasState(stateNameOfQuestionToDelete))
        .toBe(true);
    });

    it('should remove question from question list', function() {
      simpleEditorManagerService.deleteQuestion(questionToDelete);
      expect(simpleEditorManagerService.getQuestionList().getQuestions()
        .indexOf(questionToDelete)).toEqual(-1);
    });

    it('should remove the corresponding state', function() {
      simpleEditorManagerService.deleteQuestion(questionToDelete);
      expect(explorationStatesService.hasState(stateNameOfQuestionToDelete))
        .toBe(false);
    });

    it('should change the destination of states that point to it to' +
      'next state.', function() {
      var stateThatPointToIt = 'Introduction';
      simpleEditorManagerService.deleteQuestion(questionToDelete);
      var expectedDestination = simpleEditorShimService
        .getState(stateThatPointToIt).interaction.answerGroups[0].outcome.dest;
      expect(expectedDestination).toEqual(nextStateName);
    });

    it('should change the destination of questions that point to it to' +
      'next question', function() {
      var stateThatPointToIt = 'Introduction';
      var questionThatPointToIt = questionList
        .getBindableQuestion(stateThatPointToIt);
      simpleEditorManagerService.deleteQuestion(questionToDelete);
      var expectedDestination = simpleEditorManagerService.getQuestionList()
        .getBindableQuestion(stateThatPointToIt).getAnswerGroups()[0]
          .outcome.dest;
      expect(expectedDestination).toEqual(nextStateName);
    });

    it('should change the init state name to next state if question' +
      ' corresponding to initial state is deleted', function() {
      questionToDelete = questionList
        .getBindableQuestion(data.init_state_name);
      nextStateName = data.states[data.init_state_name].interaction
        .answer_groups[0].outcome.dest;
      simpleEditorManagerService.deleteQuestion(questionToDelete);
      expect(simpleEditorShimService.getInitStateName())
        .toEqual(nextStateName);
    });

    it('should move the content stored in corresponding state to next state',
      function() {
        var content = simpleEditorShimService
          .getState(stateNameOfQuestionToDelete).content;
        simpleEditorManagerService.deleteQuestion(questionToDelete);
        var expectedNextStateContent = simpleEditorShimService
          .getState(nextStateName).content;
        expect(expectedNextStateContent).toEqual(content);
      });
  });

  it('should add new state', function() {
    simpleEditorManagerService.tryToInit();
    var newStateName = simpleEditorManagerService.addState();
    var newState = explorationStatesService.getState(newStateName);
    expect(newState.interaction.id).toEqual(END_EXPLORATION_INTERACTION.ID);
    expect(newState.interaction.customizationArgs)
      .toEqual(END_EXPLORATION_INTERACTION.CUSTOMIZATION_ARGS);
    expect(newState.interaction.defaultOutcome).toEqual(null);
  });

  it('should move the question', function() {

  });
	it('should move the question to starting position', function() {

	});
	it('should move the question to last position', function() {

	});

});
