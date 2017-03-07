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
  var pageData;
  var simpleEditorManagerService;
  var questionList;

  beforeEach(function() {
    pageData = {
      title: 'MathExp',
      questions: [{
        _stateName: 'Introduction',
        _interactionId: 'MultipleChoiceInput',
        _interactionCustomizationArgs: {
          choices: {
            value: [
              '<p>Option 1</p>',
              '<p>Option 2</p>'
            ]
          }
        }
      }],
      introductionHtml: '<p> This is intro </p>',
      states: {
        Introduction: {
          content: [{
            type: 'text',
            value: '<p>Introduction text is this.</p>'
          }],
          interaction: {
            customization_args: {
              choices: {
                value: [
                  '<p>Option 1</p>',
                  '<p>Option 2</p>'
                ]
              }
            },
            default_outcome: {
              dest: 'Introduction',
              feedback: [
                '<p>One is wrong bcz of many reasons</p>'
              ]
            },
            answer_groups: [{
              rule_specs: [{
                rule_type: 'Equals',
                inputs: {
                  x: 1
                }
              }],
              outcome: {
                dest: 'Question 1',
                feedback: [
                  '<p>Opt 2 is correct bcz of dash dash...</p>'
                ]
              }
            }],
            id: 'MultipleChoiceInput'
          }
        }
      }
    };

    questionList = {
      _questions: pageData.questions,
      getBindableQuestion: function() {},
      setInteractionCustomizationArgs: function() {},
      getNextStateName: function() {},
      isEmpty: function() {},
      getLastQuestion: function() {},
      addQuestion: function() {},
      getQuestionCount: function() {},
      getAllStateNames: function() {}
    };

    stubs = {
      SimpleEditorShimService: {
        getTitle: function() {
          return pageData.title;
        },
        getIntroductionHtml: function() {
          return pageData.introductionHtml;
        },
        saveTitle: function() {},
        saveIntroductionHtml: function() {},
        saveCustomizationArgs: function() {},
        saveAnswerGroups: function() {},
        saveDefaultOutcome: function() {},
        saveBridgeHtml: function() {},
        saveInteractionId: function() {},
        getInitStateName: function() {},
        getState: function() {},
        addState: function() {}
      },
      StatesToQuestionsService: {
        getQuestions: function() {
          return pageData.questions;
        }
      },
      QuestionListObjectFactory: {
        create: function() {
          return questionList;
        }
      },
      QuestionObjectFactory: {
        create: function() {}
      }
    };
  });

  beforeEach(module('oppia'));

  beforeEach(module(function($provide) {
    $provide.value('SimpleEditorShimService', stubs.SimpleEditorShimService);
    $provide.value('StatesToQuestionsService', stubs.StatesToQuestionsService);
    $provide.value('QuestionListObjectFactory',
      stubs.QuestionListObjectFactory);
    $provide.value('QuestionObjectFactory', stubs.QuestionObjectFactory);
  }));

  beforeEach(inject(function($injector) {
    simpleEditorManagerService = $injector.get('SimpleEditorManagerService');
  }));

  beforeEach(function() {
    spyOn(stubs.SimpleEditorShimService, 'saveTitle');
    spyOn(stubs.SimpleEditorShimService, 'saveIntroductionHtml');
    spyOn(stubs.SimpleEditorShimService, 'saveCustomizationArgs');
    spyOn(stubs.SimpleEditorShimService, 'saveAnswerGroups');
    spyOn(stubs.SimpleEditorShimService, 'saveDefaultOutcome');
    spyOn(stubs.SimpleEditorShimService, 'saveBridgeHtml');
    spyOn(stubs.SimpleEditorShimService, 'saveInteractionId');
    spyOn(stubs.SimpleEditorShimService, 'addState');
    spyOn(stubs.SimpleEditorShimService, 'getState').andReturn({
      Question1: {
        content: [{
          type: 'text',
          value: '<p>This is Question One statement</p>'
        }]
      }
    });
    spyOn(stubs.SimpleEditorShimService, 'getInitStateName')
      .andReturn('Introduction');
    spyOn(questionList, 'getBindableQuestion').andReturn({
      setInteractionCustomizationArgs: function() {},
      setAnswerGroups: function() {},
      setDefaultOutcome: function() {},
      setBridgeHtml: function() {}
    });
    spyOn(questionList, 'getNextStateName').andReturn('Question1');
    // As the dummy question list has atleast one question corrosponding to
    // Introduction State.
    spyOn(questionList, 'isEmpty').andReturn(false);
    spyOn(questionList, 'getLastQuestion').andReturn({
      // Assuming last state is Introduction and destination to be Question1.
      getDestinationStateName: function() {
        return 'Question1';
      }
    });
    spyOn(questionList, 'addQuestion');
    spyOn(stubs.QuestionObjectFactory, 'create');
    // As dummy question list has only one question.
    spyOn(questionList, 'getQuestionCount').andReturn(1);
    spyOn(questionList, 'getAllStateNames').andReturn(['Introduction']);
  });

  it('should initialize the local data variables', function() {
    var returnedValue = simpleEditorManagerService.tryToInit();
    expect(simpleEditorManagerService.getData()).not.toBeNull();
    expect(simpleEditorManagerService.getIntroductionHtml()).not.toBeNull();
    expect(simpleEditorManagerService.getQuestionList()).not.toBeNull();
    expect(returnedValue).toBeTruthy();

    pageData.questions = null;
    returnedValue = simpleEditorManagerService.tryToInit();
    expect(returnedValue).toBeFalsy();
  });

  it('should return data', function() {
    var fakeData = {
      title: pageData.title,
      introductionHtml: pageData.introductionHtml,
      questionList: questionList
    };
    // In most of the cases data will be used after they have been initialized
    // by calling tryToInit().
    simpleEditorManagerService.tryToInit();
    expect(simpleEditorManagerService.getData()).toEqual(fakeData);
  });

  it('should return title', function() {
    var fakeTitle = pageData.title;
    // In most of the cases Title wil be valid only after it has been
    // initialized by calling tryToInit().
    simpleEditorManagerService.tryToInit();
    expect(simpleEditorManagerService.getTitle()).toEqual(fakeTitle);
  });

  it('should return introduction html', function() {
    var fakeIntroductionHtml = pageData.introductionHtml;
    simpleEditorManagerService.tryToInit();
    expect(simpleEditorManagerService.getIntroductionHtml()).toEqual(fakeIntroductionHtml);
  });

  it('should return question list', function() {
    var fakeQuestionList = questionList;
    simpleEditorManagerService.tryToInit();
    expect(simpleEditorManagerService.getQuestionList()).toEqual(questionList);
  });

  it('should save the given new title', function() {
    var fakeNewTitle = 'ExpNewTitle';
    simpleEditorManagerService.saveTitle(fakeNewTitle);
    expect(stubs.SimpleEditorShimService.saveTitle)
      .toHaveBeenCalledWith(fakeNewTitle);
    expect(simpleEditorManagerService.getTitle()).toEqual(fakeNewTitle);
  });

  it('should save the given new introduction html', function() {
    var fakeNewIntroductionHtml = '<p> new intro </p>';
    simpleEditorManagerService.saveIntroductionHtml(fakeNewIntroductionHtml);
    expect(stubs.SimpleEditorShimService.saveIntroductionHtml)
      .toHaveBeenCalledWith(fakeNewIntroductionHtml);
    expect(simpleEditorManagerService.getIntroductionHtml()).toEqual(fakeNewIntroductionHtml);
  });

  it('should save the customization args', function() {
    var stateName = 'Introduction';
    var newCustomizationArgs = {
      choices: {
        value: [
          '<p>Option 3</p>'
        ]
      }
    };
    simpleEditorManagerService.tryToInit();
    simpleEditorManagerService.saveCustomizationArgs(stateName, newCustomizationArgs);
    expect(stubs.SimpleEditorShimService.saveCustomizationArgs)
      .toHaveBeenCalledWith(stateName, newCustomizationArgs);
    expect(questionList.getBindableQuestion).toHaveBeenCalledWith(stateName);
  });

  it('should save the answer groups', function() {
    var stateName = 'Introduction';
    var newAnswerGroups = [{
      rule_specs: [{
        rule_type: 'Equals',
        inputs: {
          x: 1
        }
      }]
    }];
    simpleEditorManagerService.tryToInit();
    simpleEditorManagerService.saveAnswerGroups(stateName, newAnswerGroups);
    expect(stubs.SimpleEditorShimService.saveAnswerGroups)
      .toHaveBeenCalledWith(stateName, newAnswerGroups);
    expect(questionList.getBindableQuestion).toHaveBeenCalledWith(stateName);
  });

  it('should save the default outcome', function() {
    var stateName = 'Introduction';
    var newDefaultOutcome = {
      dest: 'Introduction',
      feedback: [
        '<p>One is wrong bcz ofisEmpty many reasons</p>'
      ]
    };
    simpleEditorManagerService.tryToInit();
    simpleEditorManagerService.saveDefaultOutcome(stateName, newDefaultOutcome);
    expect(stubs.SimpleEditorShimService.saveDefaultOutcome)
      .toHaveBeenCalledWith(stateName, newDefaultOutcome);
    expect(questionList.getBindableQuestion).toHaveBeenCalledWith(stateName);
  });

  it('should save the bridge html', function() {
    var stateName = 'Introduction';
    var newBridgeHtml = '<p> lets move to next Qsn </p>';
    simpleEditorManagerService.tryToInit();
    simpleEditorManagerService.saveBridgeHtml(stateName, newBridgeHtml);
    expect(stubs.SimpleEditorShimService.saveBridgeHtml)
      .toHaveBeenCalledWith(questionList.getNextStateName(stateName),
        newBridgeHtml);
    expect(questionList.getBindableQuestion).toHaveBeenCalledWith(stateName);
  });

  it('should add new question', function() {
    var DEFAULT_INTERACTION = {
      ID: 'MultipleChoiceInput',
      CUSTOMIZATION_ARGS: {
        choices: {
          value: ['<p>Option 1</p>']
        }
      }
    };

    var lastStateName = (questionList.isEmpty() ? SimpleEditorShimService
        .getInitStateName() : questionList.getLastQuestion()
          .getDestinationStateName());

    var defaultOutcome = {
      dest: lastStateName,
      feedback: [''],
      param_changes: []
    };

    simpleEditorManagerService.tryToInit();
    simpleEditorManagerService.addNewQuestion();

    expect(stubs.SimpleEditorShimService.saveInteractionId)
      .toHaveBeenCalledWith(lastStateName, DEFAULT_INTERACTION.ID);
    expect(stubs.SimpleEditorShimService.saveCustomizationArgs)
      .toHaveBeenCalledWith(lastStateName,
        DEFAULT_INTERACTION.CUSTOMIZATION_ARGS);
    expect(stubs.SimpleEditorShimService.saveDefaultOutcome)
      .toHaveBeenCalledWith(lastStateName, defaultOutcome);
    expect(questionList.addQuestion).toHaveBeenCalled();
    expect(stubs.QuestionObjectFactory.create).toHaveBeenCalled();
  });

  it('should add state', function() {
    simpleEditorManagerService.tryToInit();
    simpleEditorManagerService.addState();
    expect(stubs.SimpleEditorShimService.addState).toHaveBeenCalled();
    expect(stubs.SimpleEditorShimService.saveInteractionId).toHaveBeenCalled();
    expect(stubs.SimpleEditorShimService.saveCustomizationArgs)
      .toHaveBeenCalled();
    expect(stubs.SimpleEditorShimService.saveDefaultOutcome)
      .toHaveBeenCalled();
  });
});
