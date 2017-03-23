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

ddescribe('Simple Editor Manager Service', function() {
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
      exploration_id: 'ON_EQsq-PcIe',
      skin_customizations: {
        panels_contents: {
          bottom: []
        }
      },
      user_email: 'test@example.com',
      tags: [],
      is_moderator: false,
      username: 'ashish3805',
      is_version_of_draft_valid: null,
      version: 3,
      param_specs: {},
      init_state_name: 'Introduction',
      rights: {
        editor_names: [],
        cloned_from: null,
        viewable_if_private: false,
        owner_names: [
          'ashish3805'
        ],
        viewer_names: [],
        status: 'private',
        community_owned: false
      },
      is_admin: false,
      language_code: 'en',
      param_changes: [],
      profile_picture_data_url: 'data:image/png;base64, removed',
      email_preferences: {
        mute_suggestion_notifications: false,
        mute_feedback_notifications: false
      },
      show_state_editor_tutorial_on_load: true,
      draft_changes: null,
      title: 'Linear Algebra',
      category: '',
      is_super_admin: false,
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
      },
      objective: ''
    };

    explorationStatesService.init(data.states);
    explorationTitleService.init(data.title);
    explorationInitStateNameService.init(data.init_state_name);

    spyOn(validatorsService, 'isValidEntityName').andReturn(true);
    spyOn(mockExplorationData, 'autosaveChangeList').andReturn(true);
  });

  it('should initialize the local data variables', function() {
    var returnedValue = simpleEditorManagerService.tryToInit();
    expect(simpleEditorManagerService.getTitle()).toBe(data.title);
    expect(simpleEditorManagerService.getIntroductionHtml())
      .toBe(data.states.Introduction.content[0].value);
    var questions = statesToQuestionsService.getQuestions();
    if (!questions) {
      expect(returnedValue).toBeFalsy();
    } else {
      expect(returnedValue).toBeTruthy();
    }
    var questionList = questionListObjectFactory.create(questions);
    expect(simpleEditorManagerService.getQuestionList()).toEqual(questionList);
  });

  it('should return data', function() {
    // Expected initialized data inside simpleEditorManagerService
    var questions = statesToQuestionsService.getQuestions();
    var serviceData = {
      title: data.title,
      introductionHtml: data.states.Introduction.content[0].value,
      questionList: null
    };
    // In most of the cases data will be used after they have been initialized
    // by calling tryToInit().
    if (simpleEditorManagerService.tryToInit()) {
      serviceData.questionList = questionListObjectFactory.create(questions);
    }
    expect(simpleEditorManagerService.getData()).toEqual(serviceData);
  });

  it('should return title', function() {
    var title = data.title;
    // In most of the cases Title wil be valid only after it has been
    // initialized by calling tryToInit().
    simpleEditorManagerService.tryToInit();
    expect(simpleEditorManagerService.getTitle()).toEqual(title);
  });

  it('should return introduction html', function() {
    var introductionHtml = data.states.Introduction.content[0].value;
    simpleEditorManagerService.tryToInit();
    expect(simpleEditorManagerService.getIntroductionHtml())
      .toEqual(introductionHtml);
  });

  it('should return question list', function() {
    var questions = statesToQuestionsService.getQuestions();
    var questionList = null;
    if (simpleEditorManagerService.tryToInit()) {
      questionList = questionListObjectFactory.create(questions);
    }
    expect(simpleEditorManagerService.getQuestionList()).toEqual(questionList);
  });

  it('should save the given new title', function() {
    var newTitle = 'ExpNewTitle';
    simpleEditorManagerService.saveTitle(newTitle);
    expect(explorationTitleService.savedMemento)
      .toEqual(newTitle);
    expect(simpleEditorManagerService.getTitle()).toEqual(newTitle);
  });

  it('should save the given new introduction html', function() {
    var newIntroductionHtml = '<p> new intro </p>';
    simpleEditorManagerService.saveIntroductionHtml(newIntroductionHtml);
    expect(simpleEditorShimService.getIntroductionHtml())
      .toEqual(newIntroductionHtml);
    expect(simpleEditorManagerService.getIntroductionHtml())
      .toEqual(newIntroductionHtml);
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
    simpleEditorManagerService.saveCustomizationArgs(
      stateName, newCustomizationArgs);
    expect(explorationStatesService.getState(stateName)
      .interaction.customization_args).toEqual(newCustomizationArgs);
  });
  /**
    * Not working, needs debugging.
    It('should save the answer groups', function () {
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
      expect(explorationStatesService.getState(stateName)
        .interaction.answer_groups).toContain(newAnswerGroups);
    });
  */

  it('should save the default outcome', function() {
    var stateName = 'Introduction';
    var newDefaultOutcome = {
      dest: 'Introduction',
      feedback: [
        '<p>One is wrong bcz ofisEmpty many reasons</p>'
      ]
    };
    simpleEditorManagerService.tryToInit();
    simpleEditorManagerService.saveDefaultOutcome(
      stateName, newDefaultOutcome);
    expect(explorationStatesService.getState(stateName)
      .interaction.default_outcome).toEqual(newDefaultOutcome);
  });

  /**
    * Not working, needs debugging.
  It('should save the bridge html', function () {
    var stateName = 'Introduction';
    var newBridgeHtml = '<p> lets move to next Qsn </p>';
    var questions = statesToQuestionsService.getQuestions();
    var questionList = null;
    if (simpleEditorManagerService.tryToInit()) {
      simpleEditorManagerService.saveBridgeHtml(stateName, newBridgeHtml);
      questionList = questionListObjectFactory.create(questions);
      expect(explorationStatesService.getState(
        questionList.getNextStateName(stateName)).content)
        .toEqual(newBridgeHtml);
    }
  });
  */

  it('should add new question and new state', function() {
    var questions = statesToQuestionsService.getQuestions();
    var questionList = null;
    var lastStateName;
    var defaultOutcome;
    var DEFAULT_INTERACTION = {
      ID: 'MultipleChoiceInput',
      CUSTOMIZATION_ARGS: {
        choices: {
          value: ['<p>Option 1</p>']
        }
      }
    };

    if (simpleEditorManagerService.tryToInit()) {
      questionList = questionListObjectFactory.create(questions);

      lastStateName = (
        questionList.isEmpty() ? SimpleEditorShimService.getInitStateName() :
          questionList.getLastQuestion().getDestinationStateName());

      defaultOutcome = {
        dest: lastStateName,
        feedback: [''],
        param_changes: []
      };

      simpleEditorManagerService.addNewQuestion();
      expect(explorationStatesService.getState(lastStateName)
        .interaction.id).toEqual(DEFAULT_INTERACTION.ID);
      expect(explorationStatesService.getState(lastStateName)
        .interaction.customization_args)
        .toEqual(DEFAULT_INTERACTION.CUSTOMIZATION_ARGS);
      expect(explorationStatesService.getState(lastStateName)
        .interaction.default_outcome).toEqual(defaultOutcome);
      var stateData = simpleEditorShimService.getState(lastStateName);
      expect(JSON.stringify(simpleEditorManagerService.getQuestionList()))
        .toContain(JSON.stringify(questionObjectFactory.create(
          lastStateName, stateData.interaction, '')));

      // It should also add the new state.
      simpleEditorManagerService.addState();
      var newStates = explorationStatesService.getStates();
      expect(newStates['Question 2']).toBeDefined();
    }
  });
});
