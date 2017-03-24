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
    explorationId: 0,
    autosaveChangeList: function() { },
    discardDraft: function() { }
  };

  var simpleEditorManagerService;
  var questionObjectFactory;
  var explorationStatesService;
  var explorationTitleService;
  var explorationInitStateNameService;
  var statesToQuestionsService;
  var questionListObjectFactory;
  var validatorsService;
  var simpleEditorShimService;

  beforeEach(module('oppia'));

  beforeEach(module(function($provide) {
    $provide.value('explorationData', mockExplorationData);
  }));

  beforeEach(inject(function() {
    GLOBALS.NEW_STATE_TEMPLATE = {
      content: [{
        type: 'text',
        value: ''
      }],
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1
          },
          placeholder: {
            value: 'Type your answer here.'
          }
        },
        default_outcome: {
          dest: '(untitled state)',
          feedback: [],
          param_changes: []
        },
        fallbacks: [],
        id: 'TextInput'
      },
      param_changes: []
    };
  }));

  beforeEach(inject(function($injector) {
    simpleEditorManagerService = $injector.get('SimpleEditorManagerService');
    questionObjectFactory = $injector.get('QuestionObjectFactory');
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
        'Question 1': {
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

    explorationStatesService.init(data.states);
    explorationTitleService.init(data.title);
    explorationInitStateNameService.init(data.init_state_name);

    spyOn(validatorsService, 'isValidEntityName').andReturn(true);
    spyOn(mockExplorationData, 'autosaveChangeList').andReturn(true);
  });

  it('should initialize the local data variables', function() {
    var expectedReturnedValue;
    // Case:1 when there are two valid states  with no error in initialized
    // data, initialized in beforeEach block and StatesToQuestionsService
    // .getQuestions() will return non null value.
    expectedReturnedValue = simpleEditorManagerService.tryToInit();
    expect(simpleEditorManagerService.getTitle()).toBe(data.title);
    expect(simpleEditorManagerService.getIntroductionHtml())
      .toBe(data.states.Introduction.content[0].value);
    // Expected questions are genereated from test data.
    var expectedSimpleEditorManagerQuestions =
      statesToQuestionsService.getQuestions();
    var expectedSimpleEditorManagerQuestionList =
      questionListObjectFactory.create(expectedSimpleEditorManagerQuestions);
    expect(simpleEditorManagerService.getQuestionList())
      .toEqual(expectedSimpleEditorManagerQuestionList);
    expect(expectedReturnedValue).toBeTruthy();

    // Case:2 when StatesToQuestionsService.getQuestions() will return null,
    // may be due to errors.
    spyOn(statesToQuestionsService, 'getQuestions').andReturn(null);
    expectedReturnedValue = simpleEditorManagerService.tryToInit();
    expect(expectedReturnedValue).toBeFalsy();
  });

  it('should return data', function() {
    var expectedSimpleEditorManagerQuestions =
      statesToQuestionsService.getQuestions();
    // Expected initialized data inside simpleEditorManagerService
    var expectedSimpleEditorManagerData = {
      title: data.title,
      introductionHtml: data.states.Introduction.content[0].value,
      questionList: null
    };
    // Initialize simpleEditorManagerService.data
    simpleEditorManagerService.tryToInit();
    expectedSimpleEditorManagerData.questionList =
      questionListObjectFactory.create(expectedSimpleEditorManagerQuestions);
    expect(simpleEditorManagerService.getData())
      .toEqual(expectedSimpleEditorManagerData);
  });

  it('should return title', function() {
    var expectedTitle = data.title;
    // Initialize simpleEditorManagerService.data
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
    var expectedSimpleEditorManagerQuestions =
      statesToQuestionsService.getQuestions();
    var expectedSimpleEditorManagerQuestionList = null;
    expectedSimpleEditorManagerQuestionList =
      questionListObjectFactory.create(expectedSimpleEditorManagerQuestions);
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
    var expectedNewIntroductionHtmll = '<p> new intro </p>';
    simpleEditorManagerService
      .saveIntroductionHtml(expectedNewIntroductionHtmll);
    expect(simpleEditorShimService.getIntroductionHtml())
      .toEqual(expectedNewIntroductionHtmll);
    expect(simpleEditorManagerService.getIntroductionHtml())
      .toEqual(expectedNewIntroductionHtmll);
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
      .interaction.customization_args).toEqual(expectedNewCustomizationArgs);
  });
  /**
    * Not working, needs debugging.
    It('should save the answer groups', function () {
      var testStateName = 'Introduction';
      var expectedNewAnswerGroups = [{
        rule_specs: [{
          rule_type: 'Equals',
          inputs: {
            x: 1
          }
        }]
      }];
      simpleEditorManagerService.tryToInit();
      simpleEditorManagerService.saveAnswerGroups(
        testStateName, expectedNewAnswerGroups);
      expect(explorationStatesService.getState(testStateName)
        .interaction.answer_groups).toContain(expectedNewAnswerGroups);
    });
  */

  it('should save the default outcome', function() {
    var testStateName = 'Introduction';
    var expectedNewDefaultOutcome = {
      dest: 'Introduction',
      feedback: [
        '<p>One is wrong bcz ofisEmpty many reasons</p>'
      ]
    };
    simpleEditorManagerService.tryToInit();
    simpleEditorManagerService.saveDefaultOutcome(
      testStateName, expectedNewDefaultOutcome);
    expect(explorationStatesService.getState(testStateName)
      .interaction.default_outcome).toEqual(expectedNewDefaultOutcome);
  });

  /**
    * Not working, needs debugging.
  it('should save the bridge html', function () {
    var testStateName = 'Introduction';
    var expectedNewBridgeHtml = '<p> lets move to next Qsn </p>';
    var expectedSimpleEditorManagerQuestions =
      statesToQuestionsService.getQuestions();
    var expectedSimpleEditorManagerQuestionList = null;
    simpleEditorManagerService.tryToInit()
    simpleEditorManagerService.saveBridgeHtml(
      testStateName, expectedNewBridgeHtml);
    expectedSimpleEditorManagerQuestionList =
      questionListObjectFactory.create(expectedSimpleEditorManagerQuestions);
    expect(explorationStatesService
      .getState(expectedSimpleEditorManagerQuestionList
        .getNextStateName(testStateName)).content)
          .toEqual(expectedNewBridgeHtml);
  });
*/
  it('should add new question and new state', function() {
    var expectedSimpleEditorQuestions =
      statesToQuestionsService.getQuestions();
    var expectedSimpleEditorQuestionList = null;
    var expectedLastStateName;
    var expectedDefaultOutcome;
    var DEFAULT_INTERACTION = {
      ID: 'MultipleChoiceInput',
      CUSTOMIZATION_ARGS: {
        choices: {
          value: ['<p>Option 1</p>']
        }
      }
    };

    simpleEditorManagerService.tryToInit();
    expectedSimpleEditorQuestionList =
      questionListObjectFactory.create(expectedSimpleEditorQuestions);

    expectedLastStateName =
      expectedSimpleEditorQuestionList.getLastQuestion()
        .getDestinationStateName();

    expectedDefaultOutcome = {
      dest: expectedLastStateName,
      feedback: [''],
      param_changes: []
    };

    simpleEditorManagerService.addNewQuestion();
    expect(explorationStatesService.getState(expectedLastStateName)
      .interaction.id).toEqual(DEFAULT_INTERACTION.ID);
    expect(explorationStatesService.getState(expectedLastStateName)
      .interaction.customization_args)
        .toEqual(DEFAULT_INTERACTION.CUSTOMIZATION_ARGS);
    expect(explorationStatesService.getState(expectedLastStateName)
      .interaction.default_outcome).toEqual(expectedDefaultOutcome);
    var expectedStateData =
      simpleEditorShimService.getState(expectedLastStateName);
    expect(JSON.stringify(simpleEditorManagerService.getQuestionList()))
      .toContain(JSON.stringify(questionObjectFactory.create(
        expectedLastStateName, expectedStateData.interaction, '')));

    // It should also add the new state.
    simpleEditorManagerService.addState();
    var expectedAllStates = explorationStatesService.getStates();
    expect(expectedAllStates['Question 2']).toBeDefined();
  });
});
