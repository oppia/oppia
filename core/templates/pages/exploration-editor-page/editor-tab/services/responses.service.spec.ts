// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ResponsesService.
 */

import { EventEmitter } from '@angular/core';

import { UpgradedServices } from 'services/UpgradedServices';

describe('Responses Service', function() {
  var ResponsesService = null;
  var InteractionObjectFactory = null;
  var OutcomeObjectFactory = null;
  var StateEditorService = null;
  var AlertsService = null;
  var StateInteractionIdService = null;
  var AnswerGroupsCacheService = null;
  var AnswerGroupObjectFactory = null;
  var interactionData = null;
  var interactionDataWithRules = null;
  var LoggerService = null;
  var RuleObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('StateSolutionService', {
      savedMemento: {
        correctAnswer: 'This is a correct answer'
      }
    });
  }));
  beforeEach(angular.mock.inject(function($injector) {
    ResponsesService = $injector.get('ResponsesService');
    InteractionObjectFactory = $injector.get('InteractionObjectFactory');
    OutcomeObjectFactory = $injector.get('OutcomeObjectFactory');
    StateEditorService = $injector.get('StateEditorService');
    AlertsService = $injector.get('AlertsService');
    StateInteractionIdService = $injector.get('StateInteractionIdService');
    AnswerGroupsCacheService = $injector.get('AnswerGroupsCacheService');
    AnswerGroupObjectFactory = $injector.get('AnswerGroupObjectFactory');
    LoggerService = $injector.get('LoggerService');
    RuleObjectFactory = $injector.get('RuleObjectFactory');

    interactionData = InteractionObjectFactory.createFromBackendDict({
      id: 'TextInput',
      answer_groups: [{
        outcome: {
          dest: '',
          feedback: {
            content_id: 'feedback_1',
            html: ''
          },
        },
        rule_types_to_inputs_translations: {},
        rule_inputs: {},
      }],
      default_outcome: {
        dest: 'Hola',
        feedback: {
          content_id: '',
          html: '',
        },
      },
      confirmed_unclassified_answers: [],
      customization_args: {
        rows: {
          value: true
        },
        placeholder: {
          value: 1
        }
      },
      hints: [],
    });
    interactionDataWithRules = InteractionObjectFactory.createFromBackendDict({
      id: 'TextInput',
      answer_groups: [{
        outcome: {
          dest: '',
          feedback: {
            content_id: 'feedback_1',
            html: ''
          },
        },
        rule_types_to_inputs_translations: {},
        rule_inputs: {
          '': [
            {
              x: ['c', 'd', 'e'],
              y: ['a', 'b', 'c']
            }
          ]
        }
      }],
      default_outcome: {
        dest: 'Hola',
        feedback: {
          content_id: '',
          html: '',
        },
      },
      confirmed_unclassified_answers: [],
      customization_args: {
        rows: {
          value: true
        },
        placeholder: {
          value: 1
        }
      },
      hints: [],
    });
  }));

  it('should init the service', function() {
    ResponsesService.init(interactionData);
    StateInteractionIdService.init('stateName', 'TextInput');
    expect(ResponsesService.getActiveAnswerGroupIndex()).toBe(-1);
    expect(ResponsesService.getActiveRuleIndex()).toBe(0);
    expect(ResponsesService.getActiveAnswerGroupIndex()).toBe(-1);
    expect(ResponsesService.getAnswerGroups()).toEqual(
      interactionData.answerGroups);
    expect(ResponsesService.getAnswerGroup(0)).toEqual(
      interactionData.answerGroups[0]);
    expect(ResponsesService.getAnswerGroupCount()).toBe(1);
    expect(ResponsesService.getDefaultOutcome()).toEqual(
      interactionData.defaultOutcome);
    expect(ResponsesService.getConfirmedUnclassifiedAnswers()).toEqual(
      interactionData.confirmedUnclassifiedAnswers);
  });

  it('should change active answer group index', function() {
    ResponsesService.changeActiveAnswerGroupIndex(1);
    expect(ResponsesService.getActiveAnswerGroupIndex()).toBe(1);

    // Click again in the current group.
    ResponsesService.changeActiveAnswerGroupIndex(1);
    expect(ResponsesService.getActiveAnswerGroupIndex()).toBe(-1);
  });

  it('should update default outcome', function() {
    var addInfoMessageSpy = spyOn(AlertsService, 'addInfoMessage')
      .and.callThrough();
    ResponsesService.init(interactionData);
    StateEditorService.setInteraction(interactionData);
    StateEditorService.setActiveStateName('Hola');
    StateInteractionIdService.init('stateName', 'TextInput');

    ResponsesService.init(interactionData);
    StateEditorService.setInteraction(interactionData);

    var updatedDefaultOutcome = OutcomeObjectFactory.createNew(
      'Hola', 'new_id', 'This is a new feedback text');
    var callbackSpy = jasmine.createSpy('callback');
    ResponsesService.updateDefaultOutcome(updatedDefaultOutcome, callbackSpy);

    expect(addInfoMessageSpy).toHaveBeenCalledWith(
      'The current solution does not lead to another card.');
    expect(callbackSpy).toHaveBeenCalledWith(updatedDefaultOutcome);
    expect(ResponsesService.getDefaultOutcome()).toEqual(
      updatedDefaultOutcome);
  });

  it('should update answer group', function() {
    ResponsesService.init(interactionData);
    StateEditorService.setInteraction(interactionData);

    var updatedAnswerGroup = {
      rules: [RuleObjectFactory.createFromBackendDict({
        type: 'Contains',
        inputs: {
          x: 'correct',
        }
      })],
      taggedSkillMisconceptionId: '',
      feedback: 'This is a new feedback text',
      dest: 'State',
      refresherExplorationId: '',
      missingPrerequisiteSkillId: '',
      labelledAsCorrect: false,
      trainingData: 'This is training data text'
    };
    var callbackSpy = jasmine.createSpy('callback');
    ResponsesService.updateAnswerGroup(0, updatedAnswerGroup, callbackSpy);

    // Reassign only updated properties.
    var expectedAnswerGroup = interactionData.answerGroups;
    expectedAnswerGroup[0].updateRuleTypesToInputs(updatedAnswerGroup.rules);
    expectedAnswerGroup[0].taggedSkillMisconceptionId =
      updatedAnswerGroup.taggedSkillMisconceptionId;
    expectedAnswerGroup[0].outcome.feedback = updatedAnswerGroup.feedback;
    expectedAnswerGroup[0].outcome.dest = updatedAnswerGroup.dest;
    expectedAnswerGroup[0].outcome.refresherExplorationId =
      updatedAnswerGroup.refresherExplorationId;
    expectedAnswerGroup[0].outcome.missingPrerequisiteSkillId =
      updatedAnswerGroup.missingPrerequisiteSkillId;
    expectedAnswerGroup[0].outcome.labelledAsCorrect =
      updatedAnswerGroup.labelledAsCorrect;
    expectedAnswerGroup[0].trainingData = updatedAnswerGroup.trainingData;

    expect(callbackSpy).toHaveBeenCalledWith(expectedAnswerGroup);
    expect(ResponsesService.getAnswerGroup(0)).toEqual(expectedAnswerGroup[0]);
  });

  it('should update active answer group', function() {
    ResponsesService.init(interactionData);
    StateEditorService.setInteraction(interactionData);

    var updatedAnswerGroup = {
      rules: [RuleObjectFactory.createFromBackendDict({
        type: 'Contains',
        inputs: {
          x: 'correct',
        }
      })],
      taggedSkillMisconceptionId: '',
      feedback: 'This is a new feedback text',
      dest: 'State',
      refresherExplorationId: '',
      missingPrerequisiteSkillId: '',
      labelledAsCorrect: false,
      trainingData: 'This is training data text'
    };
    var callbackSpy = jasmine.createSpy('callback');
    ResponsesService.changeActiveAnswerGroupIndex(0);
    expect(ResponsesService.getActiveRuleIndex()).toBe(-1);

    ResponsesService.changeActiveRuleIndex(1);
    expect(ResponsesService.getActiveRuleIndex()).toBe(1);

    ResponsesService.updateActiveAnswerGroup(updatedAnswerGroup, callbackSpy);

    // Reassign only updated properties.
    var expectedAnswerGroup = interactionData.answerGroups;
    expectedAnswerGroup[0].updateRuleTypesToInputs(updatedAnswerGroup.rules);
    expectedAnswerGroup[0].taggedSkillMisconceptionId =
      updatedAnswerGroup.taggedSkillMisconceptionId;
    expectedAnswerGroup[0].outcome.feedback = updatedAnswerGroup.feedback;
    expectedAnswerGroup[0].outcome.dest = updatedAnswerGroup.dest;
    expectedAnswerGroup[0].outcome.refresherExplorationId =
      updatedAnswerGroup.refresherExplorationId;
    expectedAnswerGroup[0].outcome.missingPrerequisiteSkillId =
      updatedAnswerGroup.missingPrerequisiteSkillId;
    expectedAnswerGroup[0].outcome.labelledAsCorrect =
      updatedAnswerGroup.labelledAsCorrect;
    expectedAnswerGroup[0].trainingData = updatedAnswerGroup.trainingData;

    expect(ResponsesService.getActiveAnswerGroupIndex()).toBe(0);
    expect(callbackSpy).toHaveBeenCalledWith(expectedAnswerGroup);
    expect(ResponsesService.getAnswerGroup(0)).toEqual(expectedAnswerGroup[0]);
  });

  it('should not update active answer group that does not exist', function() {
    var logErrorSpy = spyOn(LoggerService, 'error').and.callThrough();
    ResponsesService.init(interactionData);
    StateEditorService.setInteraction(interactionData);

    var updatedAnswerGroup = {
      rules: [RuleObjectFactory.createFromBackendDict({
        type: 'Contains',
        inputs: {
          x: 'correct',
        }
      })],
      taggedSkillMisconceptionId: '',
      feedback: 'This is a new feedback text',
      dest: 'State',
      refresherExplorationId: '',
      missingPrerequisiteSkillId: '',
      labelledAsCorrect: false,
      trainingData: 'This is training data text'
    };
    var callbackSpy = jasmine.createSpy('callback');
    ResponsesService.changeActiveAnswerGroupIndex(1);
    expect(ResponsesService.getActiveRuleIndex()).toBe(-1);

    ResponsesService.changeActiveRuleIndex(1);
    expect(ResponsesService.getActiveRuleIndex()).toBe(1);

    ResponsesService.updateActiveAnswerGroup(updatedAnswerGroup, callbackSpy);

    expect(logErrorSpy).toHaveBeenCalledWith(
      'The index provided does not exist in _answerGroups array.');
    expect(ResponsesService.getActiveAnswerGroupIndex()).toBe(-1);
    expect(callbackSpy).not.toHaveBeenCalled();
    expect(ResponsesService.getAnswerGroups()).toEqual(
      interactionData.answerGroups);
  });

  it('should update confirmed unclassified answers', function() {
    ResponsesService.init(interactionData);
    StateEditorService.setInteraction(interactionData);
    var confirmedUnclassifiedAnswers = [
      'A confirmed unclassified answer',
      'This is an answer'
    ];

    expect(ResponsesService.getConfirmedUnclassifiedAnswers()).toEqual([]);
    ResponsesService.updateConfirmedUnclassifiedAnswers(
      confirmedUnclassifiedAnswers);
    expect(ResponsesService.getConfirmedUnclassifiedAnswers()).toEqual(
      confirmedUnclassifiedAnswers);
  });

  it('should update answer choices when savedMemento is ItemSelectionInput' +
    ' and choices has its positions changed', function() {
    ResponsesService.init(interactionDataWithRules);
    StateEditorService.setInteraction(interactionDataWithRules);
    StateInteractionIdService.init('stateName', 'ItemSelectionInput');

    // Set _answerChoices variable.
    ResponsesService.updateAnswerChoices([{
      val: 'a'
    }, {
      val: 'b'
    }, {
      val: 'c'
    }]);
    ResponsesService.changeActiveAnswerGroupIndex(0);

    var newAnswerChoices = [{
      val: 'c'
    }, {
      val: 'b'
    }, {
      val: 'a'
    }];
    var callbackSpy = jasmine.createSpy('callback');
    ResponsesService.handleCustomArgsUpdate(newAnswerChoices, callbackSpy);

    var expectedRules = ['c'];
    var expectedAnswerGroup = interactionDataWithRules.answerGroups;
    expectedAnswerGroup[0].ruleTypesToInputs[''][0].x = expectedRules;

    expect(callbackSpy).toHaveBeenCalledWith(expectedAnswerGroup);
    expect(ResponsesService.getAnswerGroup(0)).toEqual(
      expectedAnswerGroup[0]);
    expect(ResponsesService.getAnswerChoices()).toEqual(newAnswerChoices);
  });

  it('should update answer choices when savedMemento is ItemSelectionInput' +
    ' and choices has its values changed', function() {
    ResponsesService.init(interactionDataWithRules);
    StateEditorService.setInteraction(interactionDataWithRules);
    StateInteractionIdService.init('stateName', 'ItemSelectionInput');

    ResponsesService.updateAnswerChoices([{
      val: 'a'
    }, {
      val: 'b'
    }, {
      val: 'c'
    }]);

    var newAnswerChoices = [{
      val: 'd'
    }, {
      val: 'e'
    }, {
      val: 'f'
    }];
    var callbackSpy = jasmine.createSpy('callback');
    ResponsesService.handleCustomArgsUpdate(newAnswerChoices, callbackSpy);

    var expectedAnswerGroup = interactionDataWithRules.answerGroups;
    expectedAnswerGroup[0].ruleTypesToInputs[''][0].x = ['f', 'd', 'e'];
    expectedAnswerGroup[0].ruleTypesToInputs[''][0].y = ['d', 'e', 'f'];

    expect(callbackSpy).toHaveBeenCalledWith(expectedAnswerGroup);
    expect(ResponsesService.getAnswerGroup(0)).toEqual(
      expectedAnswerGroup[0]);
    expect(ResponsesService.getAnswerChoices()).toEqual(newAnswerChoices);
  });

  it('should update answer choices when savedMemento is' +
    ' DragAndDropSortInput and rule type is' +
    ' HasElementXAtPositionY', function() {
    interactionDataWithRules.id = 'DragAndDropSortInput';
    delete interactionDataWithRules.answerGroups[0].ruleTypesToInputs[''];
    interactionDataWithRules.answerGroups[0].ruleTypesToInputs = {
      HasElementXAtPositionY: [{
        x: 'b', y: 3
      }]
    };

    ResponsesService.init(interactionDataWithRules);
    StateEditorService.setInteraction(interactionDataWithRules);
    StateInteractionIdService.init('stateName', 'DragAndDropSortInput');

    ResponsesService.updateAnswerChoices([{
      val: 'a'
    }, {
      val: 'b'
    }, {
      val: 'c'
    }]);

    var newAnswerChoices = [{
      val: 'c'
    }, {
      val: 'b'
    }];
    var callbackSpy = jasmine.createSpy('callback');
    ResponsesService.handleCustomArgsUpdate(newAnswerChoices, callbackSpy);

    var expectedAnswerGroup = interactionDataWithRules.answerGroups;
    expectedAnswerGroup[0].ruleTypesToInputs.HasElementXAtPositionY[0].x = 'c';
    expectedAnswerGroup[0].ruleTypesToInputs.HasElementXAtPositionY[0].y = 1;

    expect(callbackSpy).toHaveBeenCalledWith(expectedAnswerGroup);
    expect(ResponsesService.getAnswerChoices()).toEqual(newAnswerChoices);
  });

  it('should update answer choices when savedMemento is' +
    ' DragAndDropSortInput and rule type is' +
    ' HasElementXBeforeElementY', function() {
    interactionDataWithRules.id = 'DragAndDropSortInput';
    delete interactionDataWithRules.answerGroups[0].ruleTypesToInputs[''];
    interactionDataWithRules.answerGroups[0].ruleTypesToInputs = {
      HasElementXBeforeElementY: [{
        x: 'a', y: 'b'
      }]
    };

    ResponsesService.init(interactionDataWithRules);
    StateEditorService.setInteraction(interactionDataWithRules);

    StateInteractionIdService.init('stateName', 'DragAndDropSortInput');

    ResponsesService.updateAnswerChoices([{
      val: 'a'
    }, {
      val: 'b'
    }, {
      val: 'c'
    }]);

    var newAnswerChoices = [{
      val: 'a'
    }, {
      val: 'd'
    }, {
      val: 'e'
    }];
    var callbackSpy = jasmine.createSpy('callback');
    ResponsesService.handleCustomArgsUpdate(newAnswerChoices, callbackSpy);

    var expectedAnswerGroup = interactionDataWithRules.answerGroups;
    const ruleTypesToInputs = expectedAnswerGroup[0].ruleTypesToInputs;
    ruleTypesToInputs.HasElementXBeforeElementY[0].x = 'a';
    ruleTypesToInputs.HasElementXBeforeElementY[0].y = 'd';

    expect(callbackSpy).toHaveBeenCalledWith(expectedAnswerGroup);
    expect(ResponsesService.getAnswerChoices()).toEqual(newAnswerChoices);
  });

  it('should update answer choices when savedMemento is' +
    ' DragAndDropSortInput and choices had changed', function() {
    interactionDataWithRules.id = 'DragAndDropSortInput';
    // Any other method from DragAndDropSortInputRulesService.
    delete interactionDataWithRules.answerGroups[0].ruleTypesToInputs[''];
    interactionDataWithRules.answerGroups[0].ruleTypesToInputs = {
      IsEqualToOrderingWithOneItemAtIncorrectPosition: [{
        x: [['a'], ['b'], ['c']]
      }]
    };
    ResponsesService.init(interactionDataWithRules);
    StateEditorService.setInteraction(interactionDataWithRules);
    StateInteractionIdService.init('stateName', 'DragAndDropSortInput');
    ResponsesService.updateAnswerChoices({
      val: 'a'
    }, {
      val: 'b'
    }, {
      val: 'c'
    });

    var newAnswerChoices = [{
      val: 'd'
    }, {
      val: 'e'
    }, {
      val: 'f'
    }];
    var callbackSpy = jasmine.createSpy('callback');
    ResponsesService.handleCustomArgsUpdate(newAnswerChoices, callbackSpy);

    var expectedAnswerGroup = interactionDataWithRules.answerGroups;
    const ruleTypesToInputs = expectedAnswerGroup[0].ruleTypesToInputs;
    ruleTypesToInputs.IsEqualToOrderingWithOneItemAtIncorrectPosition[0].x = (
      [['d'], ['e'], ['f']]);

    expect(callbackSpy).toHaveBeenCalledWith(expectedAnswerGroup);
    expect(ResponsesService.getAnswerChoices()).toEqual(newAnswerChoices);
  });

  it('should update answer choices when savedMemento is' +
    ' DragAndDropSortInput and choices has its positions changed', function() {
    ResponsesService.init(interactionDataWithRules);
    StateEditorService.setInteraction(interactionDataWithRules);
    StateInteractionIdService.init('stateName', 'DragAndDropSortInput');

    ResponsesService.updateAnswerChoices([{
      val: 'a'
    }, {
      val: 'b'
    }, {
      val: 'c'
    }], function() {});

    var newAnswerChoices = [{
      val: 'c'
    }, {
      val: 'b'
    }, {
      val: 'a'
    }];
    var callbackSpy = jasmine.createSpy('callback');
    ResponsesService.updateAnswerChoices(newAnswerChoices, callbackSpy);

    expect(callbackSpy).not.toHaveBeenCalled();
    expect(ResponsesService.getAnswerGroup(0)).toEqual(
      interactionDataWithRules.answerGroups[0]);
    expect(ResponsesService.getAnswerChoices()).toEqual(newAnswerChoices);
  });

  it('should delete an answer group', function() {
    ResponsesService.init(interactionData);
    StateEditorService.setInteraction(interactionData);

    var callbackSpy = jasmine.createSpy('callback');
    ResponsesService.deleteAnswerGroup(0, callbackSpy);

    expect(callbackSpy).toHaveBeenCalledWith([]);
    expect(ResponsesService.getActiveAnswerGroupIndex()).toBe(-1);
    expect(ResponsesService.getAnswerGroups()).toEqual([]);
  });

  it('should not delete an answer group that does not exist', function() {
    ResponsesService.init(interactionData);
    StateEditorService.setInteraction(interactionData);

    var callbackSpy = jasmine.createSpy('callback');
    ResponsesService.deleteAnswerGroup(1, callbackSpy);

    expect(callbackSpy).toHaveBeenCalledWith(interactionData.answerGroups);
    expect(ResponsesService.getActiveAnswerGroupIndex()).toBe(-1);
    expect(ResponsesService.getAnswerGroups()).toEqual(
      interactionData.answerGroups);
  });

  it('should change interaction when id does not exist in any answer group',
    function() {
      var cacheSpy = spyOn(AnswerGroupsCacheService, 'set').and.callThrough();
      ResponsesService.init(interactionData);
      StateEditorService.setInteraction(interactionData);

      var newInteractionId = 'Continue';
      var callbackSpy = jasmine.createSpy('callback');
      ResponsesService.onInteractionIdChanged(newInteractionId, callbackSpy);

      expect(cacheSpy).toHaveBeenCalledWith(
        newInteractionId, []);
      expect(callbackSpy).toHaveBeenCalledWith(
        [], interactionData.defaultOutcome);
    });

  it('should change interaction', function() {
    var cacheSpy = spyOn(AnswerGroupsCacheService, 'set').and.callThrough();
    StateInteractionIdService.init('stateName', 'TextInput');
    ResponsesService.init(interactionData);
    StateEditorService.setInteraction(interactionData);

    var newInteractionId = 'TextInput';
    var callbackSpy = jasmine.createSpy('callback');
    ResponsesService.onInteractionIdChanged(newInteractionId, callbackSpy);

    expect(cacheSpy).toHaveBeenCalledWith(
      newInteractionId, interactionData.answerGroups);
    expect(callbackSpy).toHaveBeenCalledWith(
      interactionData.answerGroups, interactionData.defaultOutcome);
  });

  it('should change interaction id when default outcome is not set',
    function() {
      var cacheSpy = spyOn(AnswerGroupsCacheService, 'set').and.callThrough();
      StateEditorService.setActiveStateName('State');

      var newInteractionId = 'Continue';
      var callbackSpy = jasmine.createSpy('callback');
      ResponsesService.onInteractionIdChanged(newInteractionId, callbackSpy);

      var expectedDefaultOutcomeCreated = OutcomeObjectFactory.createNew(
        'State', 'default_outcome', '', []);
      expect(cacheSpy).toHaveBeenCalledWith(
        newInteractionId, []);
      expect(callbackSpy).toHaveBeenCalledWith(
        [], expectedDefaultOutcomeCreated);
    });

  it('should change interaction id when interaction is terminal and it\'s' +
    ' not cached', function() {
    var cacheSpy = spyOn(AnswerGroupsCacheService, 'set').and.callThrough();
    ResponsesService.init(interactionData);
    StateEditorService.setInteraction(interactionData);

    var newInteractionId = 'EndExploration';
    var callbackSpy = jasmine.createSpy('callback');
    ResponsesService.onInteractionIdChanged(newInteractionId, callbackSpy);

    expect(cacheSpy).toHaveBeenCalledWith(
      newInteractionId, []);
    expect(callbackSpy).toHaveBeenCalledWith(
      [], null);
  });

  it('should save new answer group and default outcome', function() {
    var addInfoMessageSpy = spyOn(AlertsService, 'addInfoMessage')
      .and.callThrough();
    ResponsesService.init(interactionData);
    StateEditorService.setInteraction(interactionData);
    StateEditorService.setActiveStateName('Hola');
    StateInteractionIdService.init('stateName', 'TextInput');

    var updatedAnswerGroups = [
      AnswerGroupObjectFactory.createNew(
        OutcomeObjectFactory.createNew('Hola', '1', 'Feedback text'),
        'Training data text', '0'
      )
    ];
    var updatedDefaultOutcome = OutcomeObjectFactory.createNew(
      'State', 'new_id', 'This is a new feedback text');

    var callbackSpy = jasmine.createSpy('callback');
    ResponsesService.save(
      updatedAnswerGroups, updatedDefaultOutcome, callbackSpy);

    expect(addInfoMessageSpy).toHaveBeenCalledTimes(2);
    expect(addInfoMessageSpy).toHaveBeenCalledWith(
      'The solution is now valid!');
    expect(ResponsesService.getDefaultOutcome()).toEqual(
      updatedDefaultOutcome);
    expect(ResponsesService.getAnswerGroups()).toEqual(updatedAnswerGroups);
    expect(ResponsesService.getAnswerGroup(0)).toEqual(updatedAnswerGroups[0]);
    expect(callbackSpy).toHaveBeenCalledWith(
      updatedAnswerGroups, updatedDefaultOutcome);
  });

  it('should save new answer group and default outcome twice', function() {
    var addInfoMessageSpy = spyOn(AlertsService, 'addInfoMessage')
      .and.callThrough();
    ResponsesService.init(interactionData);
    StateEditorService.setInteraction(interactionData);
    StateEditorService.setActiveStateName('Hola');
    StateInteractionIdService.init('stateName', 'TextInput');

    var updatedAnswerGroups = [
      AnswerGroupObjectFactory.createNew(
        OutcomeObjectFactory.createNew('Hola', '1', 'Feedback text'),
        'Training data text', '0'
      )
    ];
    var updatedDefaultOutcome = OutcomeObjectFactory.createNew(
      'State', 'new_id', 'This is a new feedback text');

    // Save first time.
    ResponsesService.save(
      updatedAnswerGroups, updatedDefaultOutcome, function() {});

    var updatedDefaultOutcome = OutcomeObjectFactory.createNew(
      'Hola', 'new_id', 'This is a new feedback text');

    // Save second time.
    var callbackSpy = jasmine.createSpy('callback');
    ResponsesService.save(
      updatedAnswerGroups, updatedDefaultOutcome, callbackSpy);

    expect(addInfoMessageSpy).toHaveBeenCalledWith(
      'The current solution is no longer valid.');
    expect(ResponsesService.getDefaultOutcome()).toEqual(
      updatedDefaultOutcome);
    expect(ResponsesService.getAnswerGroups()).toEqual(updatedAnswerGroups);
    expect(ResponsesService.getAnswerGroup(0)).toEqual(updatedAnswerGroups[0]);
    expect(callbackSpy).toHaveBeenCalledWith(
      updatedAnswerGroups, updatedDefaultOutcome);
  });

  it('should fetch EventEmitters', function() {
    let answerGroupsChangedEventEmitter = new EventEmitter();
    let initializeAnswerGroupsEventEmitter = new EventEmitter();
    expect(ResponsesService.onAnswerGroupsChanged).toEqual(
      answerGroupsChangedEventEmitter);
    expect(ResponsesService.onInitializeAnswerGroups).toEqual(
      initializeAnswerGroupsEventEmitter);
  });
});
