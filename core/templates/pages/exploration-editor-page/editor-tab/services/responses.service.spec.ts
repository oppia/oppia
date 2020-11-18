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
import { TestBed } from '@angular/core/testing';

import { ResponsesService } from 'pages/exploration-editor-page/editor-tab/services/responses.service.ts';

import { AnswerGroupObjectFactory } from 'domain/exploration/AnswerGroupObjectFactory';
import { AnswerGroupsCacheService } from 'pages/exploration-editor-page/editor-tab/services/answer-groups-cache.service';
import { AlertsService } from 'services/alerts.service';
import { InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { LoggerService } from 'services/contextual/logger.service';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import {
  StateEditorService,
  // eslint-disable-next-line max-len
} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { SubtitledHtml } from 'domain/exploration/SubtitledHtmlObjectFactory';

describe('Responses Service', () => {
  let responsesService: ResponsesService = null;
  let interactionObjectFactory: InteractionObjectFactory = null;
  let outcomeObjectFactory: OutcomeObjectFactory = null;
  let stateEditorService: StateEditorService = null;
  let alertsService: AlertsService = null;
  let stateInteractionIdService: StateInteractionIdService = null;
  let answerGroupsCacheService: AnswerGroupsCacheService = null;
  let answerGroupObjectFactory: AnswerGroupObjectFactory = null;
  let interactionData = null;
  let interactionDataWithRules = null;
  let loggerService: LoggerService = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ResponsesService,
        OutcomeObjectFactory,
        InteractionObjectFactory,
        InteractionObjectFactory,
        StateEditorService,
        AlertsService,
        StateInteractionIdService,
        AnswerGroupsCacheService,
        AnswerGroupObjectFactory,
        LoggerService,
      ],
    });

    responsesService = TestBed.get(ResponsesService);
    interactionObjectFactory = TestBed.get(InteractionObjectFactory);
    outcomeObjectFactory = TestBed.get(OutcomeObjectFactory);
    stateEditorService = TestBed.get(StateEditorService);
    alertsService = TestBed.get(AlertsService);
    stateInteractionIdService = TestBed.get(StateInteractionIdService);
    answerGroupsCacheService = TestBed.get(AnswerGroupsCacheService);
    answerGroupObjectFactory = TestBed.get(AnswerGroupObjectFactory);
    loggerService = TestBed.get(LoggerService);

    interactionData = interactionObjectFactory.createFromBackendDict({
      id: 'TextInput',
      answer_groups: [
        {
          outcome: {
            dest: 'State',
            feedback: {
              html: '',
              content_id: 'This is a new feedback text',
            },
            refresher_exploration_id: 'test',
            missing_prerequisite_skill_id: 'test_skill_id',
            labelled_as_correct: true,
            param_changes: [],
          },
          rule_specs: [],
          training_data: '',
          tagged_skill_misconception_id: '',
        },
      ],
      default_outcome: {
        dest: 'Hola',
        feedback: {
          content_id: '',
          html: '',
        },
        labelled_as_correct: true,
        param_changes: [],
        refresher_exploration_id: 'test',
        missing_prerequisite_skill_id: 'test_skill_id',
      },
      confirmed_unclassified_answers: [],
      customization_args: {
        rows: {
          value: true,
        },
        placeholder: {
          value: 1,
        },
      },
      hints: [],
      solution: {
        answer_is_exclusive: true,
        correct_answer: 'test_answer',
        explanation: {
          content_id: '2',
          html: 'test_explanation1',
        },
      },
    });

    interactionDataWithRules = interactionObjectFactory.createFromBackendDict({
      id: 'TextInput',
      answer_groups: [{
        outcome: {
          dest: '',
          feedback: {
            content_id: 'feedback_1',
            html: ''
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: '',
          missing_prerequisite_skill_id: ''
        },
        rule_specs: [{
          rule_type: '',
          inputs: {
            x: ['c', 'd', 'e'],
            y: ['a', 'b', 'c']
          }
        }],
        training_data: '',
        tagged_skill_misconception_id: '',
      }],
      default_outcome: {
        dest: 'Hola',
        feedback: {
          content_id: '',
          html: '',
        },
        labelled_as_correct: true,
        param_changes: [],
        refresher_exploration_id: 'test',
        missing_prerequisite_skill_id: 'test_skill_id',
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
      solution: {
        answer_is_exclusive: true,
        correct_answer: 'test_answer',
        explanation: {
          content_id: '2',
          html: 'test_explanation1',
        },
      }
    });
  });

  it('should init the service', () => {
    responsesService.init(interactionData);
    stateInteractionIdService.init('stateName', 'TextInput');
    expect(responsesService.getActiveAnswerGroupIndex()).toBe(-1);
    expect(responsesService.getActiveRuleIndex()).toBe(0);
    expect(responsesService.getActiveAnswerGroupIndex()).toBe(-1);
    expect(responsesService.getAnswerGroups()).toEqual(
      interactionData.answerGroups
    );
    expect(responsesService.getAnswerGroup(0)).toEqual(
      interactionData.answerGroups[0]
    );
    expect(responsesService.getAnswerGroupCount()).toBe(1);
    expect(responsesService.getDefaultOutcome()).toEqual(
      interactionData.defaultOutcome
    );
    expect(responsesService.getConfirmedUnclassifiedAnswers()).toEqual(
      interactionData.confirmedUnclassifiedAnswers
    );
  });

  it('should change active answer group index', () => {
    responsesService.changeActiveAnswerGroupIndex(1);
    expect(responsesService.getActiveAnswerGroupIndex()).toBe(1);

    // Click again in the current group.
    responsesService.changeActiveAnswerGroupIndex(1);
    expect(responsesService.getActiveAnswerGroupIndex()).toBe(-1);
  });

  it('should update default outcome', () => {
    // eslint-disable-next-line max-len
    let addInfoMessageSpy = spyOn(alertsService, 'addInfoMessage');

    responsesService.init(interactionData);
    stateEditorService.setInteraction(interactionData);
    stateEditorService.setActiveStateName('Hola');
    stateInteractionIdService.init('stateName', 'TextInput');

    responsesService.init(interactionData);
    stateEditorService.setInteraction(interactionData);

    var updatedDefaultOutcome = outcomeObjectFactory.createNew(
      'Hola',
      'new_id',
      'This is a new feedback text',
      []
    );
    var callbackSpy = jasmine.createSpy('callback');
    responsesService.updateDefaultOutcome(updatedDefaultOutcome, callbackSpy);

    expect(addInfoMessageSpy).toHaveBeenCalledWith(
      'The current solution does not lead to another card.'
    );
    expect(callbackSpy).toHaveBeenCalledWith(updatedDefaultOutcome);
    expect(responsesService.getDefaultOutcome()).toEqual(updatedDefaultOutcome);
  });

  it('should update answer group', () => {
    responsesService.init(interactionData);
    stateEditorService.setInteraction(interactionData);

    var updatedAnswerGroup = {
      rules: [
        {
          type: 'Contains',
          inputs: {
            x: 'correct',
          },
          toBackendDict: jasmine.createSpy('toBackendDict'),
        },
      ],
      outcome: {
        dest: 'State',
        feedback: new SubtitledHtml('', 'This is a new feedback text'),
        refresherExplorationId: 'test',
        missingPrerequisiteSkillId: 'test_skill_id',
        labelledAsCorrect: true,
        paramChanges: [],
        toBackendDict: jasmine.createSpy('toBackendDict'),
        setDestination: jasmine.createSpy('setDestination'),
        hasNonemptyFeedback: jasmine.createSpy('hasNonemptyFeedback'),
        isConfusing: jasmine.createSpy('isConfusing')
      },
      trainingData: 'This is training data text',
      taggedSkillMisconceptionId: '',
    };
    var callbackSpy = jasmine.createSpy('callback');
    responsesService.updateAnswerGroup(0, updatedAnswerGroup, callbackSpy);

    // Reassign only updated properties.
    var expectedAnswerGroup = interactionData.answerGroups;
    expectedAnswerGroup[0].rules = updatedAnswerGroup.rules;
    expectedAnswerGroup[0].taggedSkillMisconceptionId =
      updatedAnswerGroup.taggedSkillMisconceptionId;
    expectedAnswerGroup[0].outcome.feedback =
      updatedAnswerGroup.outcome.feedback;
    expectedAnswerGroup[0].outcome.dest = updatedAnswerGroup.outcome.dest;
    expectedAnswerGroup[0].outcome.refresherExplorationId =
      updatedAnswerGroup.outcome.refresherExplorationId;
    expectedAnswerGroup[0].outcome.missingPrerequisiteSkillId =
      updatedAnswerGroup.outcome.missingPrerequisiteSkillId;
    expectedAnswerGroup[0].outcome.labelledAsCorrect =
      updatedAnswerGroup.outcome.labelledAsCorrect;
    expectedAnswerGroup[0].trainingData = updatedAnswerGroup.trainingData;

    expect(callbackSpy).toHaveBeenCalledWith(expectedAnswerGroup);
    expect(responsesService.getAnswerGroup(0)).toEqual(expectedAnswerGroup[0]);
  });

  it('should update active answer group', () => {
    responsesService.init(interactionData);
    stateEditorService.setInteraction(interactionData);

    var updatedAnswerGroup = {
      rules: [
        {
          type: 'Contains',
          inputs: {
            x: 'correct',
          },
          toBackendDict: jasmine.createSpy('toBackendDict'),
        },
      ],
      outcome: {
        dest: 'State',
        feedback: new SubtitledHtml('', 'This is a new feedback text'),
        refresherExplorationId: 'test',
        missingPrerequisiteSkillId: 'test_skill_id',
        labelledAsCorrect: true,
        paramChanges: [],
        toBackendDict: jasmine.createSpy('toBackendDict'),
        setDestination: jasmine.createSpy('setDestination'),
        hasNonemptyFeedback: jasmine.createSpy('hasNonemptyFeedback'),
        isConfusing: jasmine.createSpy('isConfusing'),
      },
      taggedSkillMisconceptionId: '',
      feedback: 'This is a new feedback text',
      dest: 'State',
      refresherExplorationId: '',
      missingPrerequisiteSkillId: '',
      labelledAsCorrect: false,
      trainingData: 'This is training data text',
    };
    var callbackSpy = jasmine.createSpy('callback');
    responsesService.changeActiveAnswerGroupIndex(0);
    expect(responsesService.getActiveRuleIndex()).toBe(-1);

    responsesService.changeActiveRuleIndex(1);
    expect(responsesService.getActiveRuleIndex()).toBe(1);

    responsesService.updateActiveAnswerGroup(updatedAnswerGroup, callbackSpy);

    // Reassign only updated properties.
    var expectedAnswerGroup = interactionData.answerGroups;
    expectedAnswerGroup[0].rules = updatedAnswerGroup.rules;
    expectedAnswerGroup[0].taggedSkillMisconceptionId =
      updatedAnswerGroup.taggedSkillMisconceptionId;
    expectedAnswerGroup[0].outcome.feedback =
      updatedAnswerGroup.outcome.feedback;
    expectedAnswerGroup[0].outcome.dest = updatedAnswerGroup.outcome.dest;
    expectedAnswerGroup[0].outcome.refresherExplorationId =
      updatedAnswerGroup.outcome.refresherExplorationId;
    expectedAnswerGroup[0].outcome.missingPrerequisiteSkillId =
      updatedAnswerGroup.outcome.missingPrerequisiteSkillId;
    expectedAnswerGroup[0].outcome.labelledAsCorrect =
      updatedAnswerGroup.outcome.labelledAsCorrect;
    expectedAnswerGroup[0].trainingData = updatedAnswerGroup.trainingData;

    expect(responsesService.getActiveAnswerGroupIndex()).toBe(0);
    expect(callbackSpy).toHaveBeenCalledWith(expectedAnswerGroup);
    expect(responsesService.getAnswerGroup(0)).toEqual(expectedAnswerGroup[0]);
  });

  it('should not update active answer group that does not exist', () => {
    var logErrorSpy = spyOn(loggerService, 'error').and.callThrough();
    responsesService.init(interactionData);
    stateEditorService.setInteraction(interactionData);

    var updatedAnswerGroup = {
      rules: [
        {
          type: 'Contains',
          inputs: {
            x: 'correct',
          },
        },
      ],
      taggedSkillMisconceptionId: '',
      feedback: 'This is a new feedback text',
      dest: 'State',
      refresherExplorationId: '',
      missingPrerequisiteSkillId: '',
      labelledAsCorrect: false,
      trainingData: 'This is training data text',
    };
    var callbackSpy = jasmine.createSpy('callback');
    responsesService.changeActiveAnswerGroupIndex(1);
    expect(responsesService.getActiveRuleIndex()).toBe(-1);

    responsesService.changeActiveRuleIndex(1);
    expect(responsesService.getActiveRuleIndex()).toBe(1);

    responsesService.updateActiveAnswerGroup(updatedAnswerGroup, callbackSpy);

    expect(logErrorSpy).toHaveBeenCalledWith(
      'The index provided does not exist in _answerGroups array.'
    );
    expect(responsesService.getActiveAnswerGroupIndex()).toBe(-1);
    expect(callbackSpy).not.toHaveBeenCalled();
    expect(responsesService.getAnswerGroups()).toEqual(
      interactionData.answerGroups
    );
  });

  it('should update confirmed unclassified answers', () => {
    responsesService.init(interactionData);
    stateEditorService.setInteraction(interactionData);
    var confirmedUnclassifiedAnswers = [
      'A confirmed unclassified answer',
      'This is an answer',
    ];

    expect(responsesService.getConfirmedUnclassifiedAnswers()).toEqual([]);
    responsesService.updateConfirmedUnclassifiedAnswers(
      confirmedUnclassifiedAnswers
    );
    expect(responsesService.getConfirmedUnclassifiedAnswers()).toEqual(
      confirmedUnclassifiedAnswers
    );
  });

  it(
    'should update answer choices when savedMemento is ItemSelectionInput' +
      ' and choices has its positions changed',
    () => {
      responsesService.init(interactionDataWithRules);
      stateEditorService.setInteraction(interactionDataWithRules);
      stateInteractionIdService.init('stateName', 'ItemSelectionInput');

      // Set _answerChoices variable.
      responsesService.updateAnswerChoices([
        {
          val: 'a',
          label: '',
        },
        {
          val: 'b',
          label: '',
        },
        {
          val: 'c',
          label: '',
        },
      ]);
      responsesService.changeActiveAnswerGroupIndex(0);

      var newAnswerChoices = [
        {
          val: 'c',
          label: '',
        },
        {
          val: 'b',
          label: '',
        },
        {
          val: 'a',
          label: '',
        },
      ];
      var callbackSpy = jasmine.createSpy('callback');
      responsesService.handleCustomArgsUpdate(newAnswerChoices, callbackSpy);

      var expectedRules = ['c'];
      var expectedAnswerGroup = interactionDataWithRules.answerGroups;
      expectedAnswerGroup[0].rules[0].inputs.x = expectedRules;

      expect(callbackSpy).toHaveBeenCalledWith(expectedAnswerGroup);
      expect(responsesService.getAnswerGroup(0)).toEqual(
        expectedAnswerGroup[0]
      );

      expect(responsesService.getAnswerChoices()).toEqual(newAnswerChoices);
    }
  );

  it(
    'should update answer choices when savedMemento is ItemSelectionInput' +
      ' and choices has its values changed',
    () => {
      responsesService.init(interactionDataWithRules);
      stateEditorService.setInteraction(interactionDataWithRules);
      stateInteractionIdService.init('stateName', 'ItemSelectionInput');

      responsesService.updateAnswerChoices([
        {
          val: 'a',
          label: '',
        },
        {
          val: 'b',
          label: '',
        },
        {
          val: 'c',
          label: '',
        },
      ]);

      var newAnswerChoices = [
        {
          val: 'd',
          label: '',
        },
        {
          val: 'e',
          label: '',
        },
        {
          val: 'f',
          label: '',
        },
      ];
      var callbackSpy = jasmine.createSpy('callback');
      responsesService.handleCustomArgsUpdate(newAnswerChoices, callbackSpy);

      var expectedAnswerGroup = interactionDataWithRules.answerGroups;
      expectedAnswerGroup[0].rules[0].inputs.x = ['f', 'd', 'e'];
      expectedAnswerGroup[0].rules[0].inputs.y = ['d', 'e', 'f'];

      expect(callbackSpy).toHaveBeenCalledWith(expectedAnswerGroup);
      expect(responsesService.getAnswerGroup(0)).toEqual(
        expectedAnswerGroup[0]
      );
      expect(responsesService.getAnswerChoices()).toEqual(newAnswerChoices);
    }
  );

  it(
    'should update answer choices when savedMemento is' +
      ' DragAndDropSortInput and rule type is' +
      ' HasElementXAtPositionY',
    () => {
      interactionDataWithRules.id = 'DragAndDropSortInput';
      interactionDataWithRules.answerGroups[0].rules[0].type =
        'HasElementXAtPositionY';
      interactionDataWithRules.answerGroups[0].rules[0].inputs.x = 'b';
      interactionDataWithRules.answerGroups[0].rules[0].inputs.y = 3;

      responsesService.init(interactionDataWithRules);
      stateEditorService.setInteraction(interactionDataWithRules);
      stateInteractionIdService.init('stateName', 'DragAndDropSortInput');

      responsesService.updateAnswerChoices([
        {
          val: 'a',
          label: '',
        },
        {
          val: 'b',
          label: '',
        },
        {
          val: 'c',
          label: '',
        },
      ]);

      var newAnswerChoices = [
        {
          val: 'c',
          label: '',
        },
        {
          val: 'b',
          label: '',
        },
      ];
      var callbackSpy = jasmine.createSpy('callback');
      responsesService.handleCustomArgsUpdate(newAnswerChoices, callbackSpy);

      var expectedAnswerGroup = interactionDataWithRules.answerGroups;
      expectedAnswerGroup[0].rules[0].inputs.x = 'c';
      expectedAnswerGroup[0].rules[0].inputs.y = 1;

      expect(callbackSpy).toHaveBeenCalledWith(expectedAnswerGroup);
      expect(responsesService.getAnswerChoices()).toEqual(newAnswerChoices);
    }
  );

  it(
    'should update answer choices when savedMemento is' +
      ' DragAndDropSortInput and rule type is' +
      ' HasElementXBeforeElementY',
    () => {
      interactionDataWithRules.id = 'DragAndDropSortInput';
      interactionDataWithRules.answerGroups[0].rules[0].type =
        'HasElementXBeforeElementY';
      interactionDataWithRules.answerGroups[0].rules[0].inputs.x = 'a';
      interactionDataWithRules.answerGroups[0].rules[0].inputs.y = 'b';

      responsesService.init(interactionDataWithRules);
      stateEditorService.setInteraction(interactionDataWithRules);

      stateInteractionIdService.init('stateName', 'DragAndDropSortInput');

      responsesService.updateAnswerChoices([
        {
          val: 'a',
          label: '',
        },
        {
          val: 'b',
          label: '',
        },
        {
          val: 'c',
          label: '',
        },
      ]);

      var newAnswerChoices = [
        {
          val: 'a',
          label: '',
        },
        {
          val: 'd',
          label: '',
        },
        {
          val: 'e',
          label: '',
        },
      ];
      var callbackSpy = jasmine.createSpy('callback');
      responsesService.handleCustomArgsUpdate(newAnswerChoices, callbackSpy);

      var expectedAnswerGroup = interactionDataWithRules.answerGroups;
      expectedAnswerGroup[0].rules[0].inputs.x = 'a';
      expectedAnswerGroup[0].rules[0].inputs.y = 'd';

      expect(callbackSpy).toHaveBeenCalledWith(expectedAnswerGroup);
      expect(responsesService.getAnswerChoices()).toEqual(newAnswerChoices);
    }
  );

  it(
    'should update answer choices when savedMemento is' +
      ' DragAndDropSortInput and choices had changed',
    () => {
      interactionDataWithRules.id = 'DragAndDropSortInput';
      // Any other method from DragAndDropSortInputRulesService.
      interactionDataWithRules.answerGroups[0].rules[0].type =
        'IsEqualToOrderingWithOneItemAtIncorrectPosition';
      interactionDataWithRules.answerGroups[0].rules[0].inputs.x = [
        ['a'],
        ['b'],
        ['c'],
      ];
      delete interactionDataWithRules.answerGroups[0].rules[0].inputs.y;
      responsesService.init(interactionDataWithRules);
      stateEditorService.setInteraction(interactionDataWithRules);
      stateInteractionIdService.init('stateName', 'DragAndDropSortInput');
      responsesService.updateAnswerChoices(
        [{
          val: 'a',
          label: ''
        },
        {
          val: 'b',
          label: ''
        },
        {
          val: 'c',
          label: ''
        }]
      );

      var newAnswerChoices = [
        {
          val: 'd',
          label: '',
        },
        {
          val: 'e',
          label: '',
        },
        {
          val: 'f',
          label: '',
        },
      ];
      var callbackSpy = jasmine.createSpy('callback');
      responsesService.handleCustomArgsUpdate(newAnswerChoices, callbackSpy);

      var expectedAnswerGroup = interactionDataWithRules.answerGroups;
      expectedAnswerGroup[0].rules[0].inputs.x = [['d'], ['e'], ['f']];

      expect(callbackSpy).toHaveBeenCalledWith(expectedAnswerGroup);
      expect(responsesService.getAnswerChoices()).toEqual(newAnswerChoices);
    }
  );

  it(
    'should update answer choices when savedMemento is' +
      ' DragAndDropSortInput and choices has its positions changed',
    () => {
      responsesService.init(interactionDataWithRules);
      stateEditorService.setInteraction(interactionDataWithRules);
      stateInteractionIdService.init('stateName', 'DragAndDropSortInput');

      responsesService.updateAnswerChoices(
        [
          {
            val: 'a',
            label: ''
          },
          {
            val: 'b',
            label: ''
          },
          {
            val: 'c',
            label: ''
          },
        ]
      );

      var newAnswerChoices = [
        {
          val: 'c',
          label: ''
        },
        {
          val: 'b',
          label: ''
        },
        {
          val: 'a',
          label: ''
        },
      ];
      var callbackSpy = jasmine.createSpy('callback');
      responsesService.updateAnswerChoices(newAnswerChoices);

      expect(callbackSpy).not.toHaveBeenCalled();
      expect(responsesService.getAnswerGroup(0)).toEqual(
        interactionDataWithRules.answerGroups[0]
      );
      expect(responsesService.getAnswerChoices()).toEqual(newAnswerChoices);
    }
  );

  it('should delete an answer group', () => {
    responsesService.init(interactionData);
    stateEditorService.setInteraction(interactionData);

    var callbackSpy = jasmine.createSpy('callback');
    responsesService.deleteAnswerGroup(0, callbackSpy);

    expect(callbackSpy).toHaveBeenCalledWith([]);
    expect(responsesService.getActiveAnswerGroupIndex()).toBe(-1);
    expect(responsesService.getAnswerGroups()).toEqual([]);
  });

  it('should not delete an answer group that does not exist', () => {
    responsesService.init(interactionData);
    stateEditorService.setInteraction(interactionData);

    var callbackSpy = jasmine.createSpy('callback');
    responsesService.deleteAnswerGroup(1, callbackSpy);

    expect(callbackSpy).toHaveBeenCalledWith(interactionData.answerGroups);
    expect(responsesService.getActiveAnswerGroupIndex()).toBe(-1);
    expect(responsesService.getAnswerGroups()).toEqual(
      interactionData.answerGroups
    );
  });

  it('should change interaction when id does not exist in any answer group',
    () => {
      var cacheSpy = spyOn(answerGroupsCacheService, 'set').and.callThrough();
      responsesService.init(interactionData);
      stateEditorService.setInteraction(interactionData);

      var newInteractionId = 'Continue';
      var callbackSpy = jasmine.createSpy('callback');
      responsesService.onInteractionIdChanged(newInteractionId, callbackSpy);

      expect(cacheSpy).toHaveBeenCalledWith(newInteractionId, []);
      expect(callbackSpy).toHaveBeenCalledWith(
        [],
        interactionData.defaultOutcome
      );
    });

  it('should change interaction', () => {
    var cacheSpy = spyOn(answerGroupsCacheService, 'set').and.callThrough();
    stateInteractionIdService.init('stateName', 'TextInput');
    responsesService.init(interactionData);
    stateEditorService.setInteraction(interactionData);

    var newInteractionId = 'TextInput';
    var callbackSpy = jasmine.createSpy('callback');
    responsesService.onInteractionIdChanged(newInteractionId, callbackSpy);

    expect(cacheSpy).toHaveBeenCalledWith(
      newInteractionId,
      interactionData.answerGroups
    );
    expect(callbackSpy).toHaveBeenCalledWith(
      interactionData.answerGroups,
      interactionData.defaultOutcome
    );
  });

  it('should change interaction id when default outcome is not set', () => {
    var cacheSpy = spyOn(answerGroupsCacheService, 'set').and.callThrough();
    stateEditorService.setActiveStateName('State');

    var newInteractionId = 'Continue';
    var callbackSpy = jasmine.createSpy('callback');
    responsesService.onInteractionIdChanged(newInteractionId, callbackSpy);

    var expectedDefaultOutcomeCreated = outcomeObjectFactory.createNew(
      'State',
      'default_outcome',
      '',
      []
    );
    expect(cacheSpy).toHaveBeenCalledWith(newInteractionId, []);
    expect(callbackSpy).toHaveBeenCalledWith([], expectedDefaultOutcomeCreated);
  });

  it(
    "should change interaction id when interaction is terminal and it's" +
      ' not cached',
    () => {
      var cacheSpy = spyOn(answerGroupsCacheService, 'set').and.callThrough();
      responsesService.init(interactionData);
      stateEditorService.setInteraction(interactionData);

      var newInteractionId = 'EndExploration';
      var callbackSpy = jasmine.createSpy('callback');
      responsesService.onInteractionIdChanged(newInteractionId, callbackSpy);

      expect(cacheSpy).toHaveBeenCalledWith(newInteractionId, []);
      expect(callbackSpy).toHaveBeenCalledWith([], null);
    }
  );

  it('should save new answer group and default outcome', () => {
    var addInfoMessageSpy = spyOn(
      alertsService,
      'addInfoMessage'
    ).and.callThrough();
    responsesService.init(interactionData);
    stateEditorService.setInteraction(interactionData);
    stateEditorService.setActiveStateName('Hola');
    stateInteractionIdService.init('stateName', 'TextInput');

    var updatedAnswerGroups = [
      answerGroupObjectFactory.createNew(
        [],
        outcomeObjectFactory.createNew('Hola', '1', 'Feedback text', []),
        'Training data text',
        '0'
      ),
    ];
    var updatedDefaultOutcome = outcomeObjectFactory.createNew(
      'State',
      'new_id',
      'This is a new feedback text',
      []
    );

    var callbackSpy = jasmine.createSpy('callback');
    responsesService.save(
      updatedAnswerGroups,
      updatedDefaultOutcome,
      callbackSpy
    );

    expect(addInfoMessageSpy).toHaveBeenCalledTimes(2);
    expect(addInfoMessageSpy).toHaveBeenCalledWith(
      'The solution is now valid!'
    );
    expect(responsesService.getDefaultOutcome()).toEqual(updatedDefaultOutcome);
    expect(responsesService.getAnswerGroups()).toEqual(updatedAnswerGroups);
    expect(responsesService.getAnswerGroup(0)).toEqual(updatedAnswerGroups[0]);
    expect(callbackSpy).toHaveBeenCalledWith(
      updatedAnswerGroups,
      updatedDefaultOutcome
    );
  });

  it('should save new answer group and default outcome twice', () => {
    var addInfoMessageSpy = spyOn(
      alertsService,
      'addInfoMessage'
    ).and.callThrough();
    responsesService.init(interactionData);
    stateEditorService.setInteraction(interactionData);
    stateEditorService.setActiveStateName('Hola');
    stateInteractionIdService.init('stateName', 'TextInput');

    var updatedAnswerGroups = [
      answerGroupObjectFactory.createNew(
        [],
        outcomeObjectFactory.createNew('Hola', '1', 'Feedback text', []),
        'Training data text',
        '0'
      ),
    ];
    var updatedDefaultOutcome = outcomeObjectFactory.createNew(
      'State',
      'new_id',
      'This is a new feedback text',
      []
    );

    // Save first time.
    responsesService.save(
      updatedAnswerGroups,
      updatedDefaultOutcome,
      () => {}
    );

    var updatedDefaultOutcome = outcomeObjectFactory.createNew(
      'Hola',
      'new_id',
      'This is a new feedback text',
      []
    );

    // Save second time.
    var callbackSpy = jasmine.createSpy('callback');
    responsesService.save(
      updatedAnswerGroups,
      updatedDefaultOutcome,
      callbackSpy
    );

    expect(addInfoMessageSpy).toHaveBeenCalledWith(
      'The current solution is no longer valid.'
    );
    expect(responsesService.getDefaultOutcome()).toEqual(updatedDefaultOutcome);
    expect(responsesService.getAnswerGroups()).toEqual(updatedAnswerGroups);
    expect(responsesService.getAnswerGroup(0)).toEqual(updatedAnswerGroups[0]);
    expect(callbackSpy).toHaveBeenCalledWith(
      updatedAnswerGroups,
      updatedDefaultOutcome
    );
  });

  it('should fetch EventEmitters', () => {
    let answerGroupsChangedEventEmitter = new EventEmitter();
    let initializeAnswerGroupsEventEmitter = new EventEmitter();
    expect(responsesService.onAnswerGroupsChanged).toEqual(
      answerGroupsChangedEventEmitter
    );
    expect(responsesService.onInitializeAnswerGroups).toEqual(
      initializeAnswerGroupsEventEmitter
    );
  });
});
