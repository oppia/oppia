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
 * @fileoverview Unit test for the Editor state service.
 */

import { TestBed } from '@angular/core/testing';

import { StateEditorService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-editor.service';
import { AnswerGroupObjectFactory } from 'domain/exploration/AnswerGroupObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { Interaction, InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { SolutionObjectFactory } from 'domain/exploration/SolutionObjectFactory';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { SubtitledUnicodeObjectFactory } from 'domain/exploration/SubtitledUnicodeObjectFactory';
import { SolutionValidityService } from 'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { Subscription } from 'rxjs';

describe('Editor state service', () => {
  let ecs: StateEditorService = null;
  let suof: SubtitledUnicodeObjectFactory = null;
  let sof: SolutionObjectFactory = null;
  let hof: HintObjectFactory = null;
  let interactionObjectFactory: InteractionObjectFactory = null;
  let answerGroupObjectFactory: AnswerGroupObjectFactory = null;
  let outcomeObjectFactory: OutcomeObjectFactory = null;
  let solutionValidityService: SolutionValidityService = null;
  let mockInteraction: Interaction;

  let stateEditorInitializedSpy = null;
  let stateEditorDirectiveInitializedSpy = null;
  let interactionEditorInitializedSpy = null;
  let showTranslationTabBusyModalSpy = null;
  let refreshStateTranslationSpy = null;
  let updateAnswerChoicesSpy = null;
  let saveOutcomeDestDetailsSpy = null;
  let handleCustomArgsUpdateSpy = null;
  let objectFormValidityChangeSpy = null;
  let testSubscriptions = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StateEditorService]
    });

    ecs = TestBed.get(StateEditorService);
    suof = TestBed.inject(SubtitledUnicodeObjectFactory);
    sof = TestBed.inject(SolutionObjectFactory);
    hof = TestBed.inject(HintObjectFactory);
    interactionObjectFactory = TestBed.inject(InteractionObjectFactory);
    answerGroupObjectFactory = TestBed.inject(AnswerGroupObjectFactory);
    outcomeObjectFactory = TestBed.inject(OutcomeObjectFactory);
    solutionValidityService = TestBed.inject(SolutionValidityService);

    // Here, mockInteraction consists of an TextInput interaction with an
    // answer group leading to 'State' state and a default outcome leading to
    // 'Hola' state.
    mockInteraction = interactionObjectFactory.createFromBackendDict({
      id: 'TextInput',
      answer_groups: [
        {
          outcome: {
            dest: 'State',
            feedback: {
              html: '',
              content_id: 'This is a new feedback text',
            },
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
            labelled_as_correct: false,
            param_changes: [],
          },
          rule_specs: [],
          training_data: [],
          tagged_skill_misconception_id: '',
        },
      ],
      default_outcome: {
        dest: 'Hola',
        feedback: {
          content_id: '',
          html: '',
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null,
      },
      confirmed_unclassified_answers: [],
      customization_args: {
        placeholder: {
          value: {
            content_id: 'cid',
            unicode_str: '1'
          }
        },
        rows: {
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
      },
    });
  });

  beforeEach(() => {
    stateEditorInitializedSpy = jasmine.createSpy('stateEditorInitialized');
    stateEditorDirectiveInitializedSpy = jasmine.createSpy(
      'stateEditorDirectiveInitialized');
    interactionEditorInitializedSpy = jasmine.createSpy(
      'interactionEditorInitialized');
    showTranslationTabBusyModalSpy = jasmine.createSpy(
      'showTranslationTabBusyModal');
    refreshStateTranslationSpy = jasmine.createSpy('refreshStateTranslation');
    updateAnswerChoicesSpy = jasmine.createSpy('updateAnswerChoices');
    saveOutcomeDestDetailsSpy = jasmine.createSpy('saveOutcomeDestDetails');
    handleCustomArgsUpdateSpy = jasmine.createSpy('handleCustomArgsUpdate');
    objectFormValidityChangeSpy = jasmine.createSpy('objectFormValidityChange');

    testSubscriptions = new Subscription();

    testSubscriptions.add(ecs.onStateEditorInitialized.subscribe(
      stateEditorInitializedSpy));
    testSubscriptions.add(ecs.onStateEditorDirectiveInitialized.subscribe(
      stateEditorDirectiveInitializedSpy));
    testSubscriptions.add(ecs.onInteractionEditorInitialized.subscribe(
      interactionEditorInitializedSpy));
    testSubscriptions.add(ecs.onShowTranslationTabBusyModal.subscribe(
      showTranslationTabBusyModalSpy));
    testSubscriptions.add(ecs.onRefreshStateTranslation.subscribe(
      refreshStateTranslationSpy));
    testSubscriptions.add(ecs.onUpdateAnswerChoices.subscribe(
      updateAnswerChoicesSpy));
    testSubscriptions.add(ecs.onSaveOutcomeDestDetails.subscribe(
      saveOutcomeDestDetailsSpy));
    testSubscriptions.add(ecs.onHandleCustomArgsUpdate.subscribe(
      handleCustomArgsUpdateSpy));
    testSubscriptions.add(ecs.onObjectFormValidityChange.subscribe(
      objectFormValidityChangeSpy));
  });

  afterAll(() => {
    testSubscriptions.unsubscribe();
  });

  it('should correctly set and get state names', () => {
    ecs.setActiveStateName('A State');
    expect(ecs.getActiveStateName()).toBe('A State');
  });

  it('should not allow invalid state names to be set', () => {
    ecs.setActiveStateName('');
    expect(ecs.getActiveStateName()).toBeNull();

    ecs.setActiveStateName(null);
    expect(ecs.getActiveStateName()).toBeNull();
  });

  it('should correctly set and get solicitAnswerDetails', () => {
    expect(ecs.getSolicitAnswerDetails()).toBeNull();
    ecs.setSolicitAnswerDetails(false);
    expect(ecs.getSolicitAnswerDetails()).toEqual(false);
    ecs.setSolicitAnswerDetails(true);
    expect(ecs.getSolicitAnswerDetails()).toEqual(true);
  });

  it('should correctly set and get cardIsCheckpoint', () => {
    expect(ecs.getCardIsCheckpoint()).toBe(null);
    expect(ecs.setCardIsCheckpoint(false));
    expect(ecs.getCardIsCheckpoint()).toBe(false);
    expect(ecs.setCardIsCheckpoint(true));
    expect(ecs.getCardIsCheckpoint()).toBe(true);
  });

  it('should correctly set and get misconceptionsBySkill', () => {
    const misconceptionsBySkill = {
      skillId1: [0],
      skillId2: [1, 2]
    };
    expect(ecs.getMisconceptionsBySkill()).toEqual({});
    ecs.setMisconceptionsBySkill(misconceptionsBySkill);
    expect(ecs.getMisconceptionsBySkill()).toEqual(misconceptionsBySkill);
  });

  it('should correctly set and get linkedSkillId', () => {
    const linkedSkillId = 'skill_id1';

    expect(ecs.getLinkedSkillId()).toEqual(null);
    ecs.setLinkedSkillId(linkedSkillId);
    expect(ecs.getLinkedSkillId()).toEqual(linkedSkillId);
  });

  it('should correctly return answer choices for interaction', () => {
    const customizationArgsForMultipleChoiceInput = {
      choices: {
        value: [
          new SubtitledHtml('Choice 1', ''),
          new SubtitledHtml('Choice 2', '')
        ]
      }
    };
    expect(
      ecs.getAnswerChoices(
        'MultipleChoiceInput', customizationArgsForMultipleChoiceInput)
    ).toEqual([{
      val: 0,
      label: 'Choice 1',
    }, {
      val: 1,
      label: 'Choice 2',
    }]);

    const customizationArgsForImageClickInput = {
      imageAndRegions: {
        value: {
          labeledRegions: [{
            label: 'Label 1'
          }, {
            label: 'Label 2'
          }]
        }
      }
    };
    expect(
      ecs.getAnswerChoices(
        'ImageClickInput', customizationArgsForImageClickInput)
    ).toEqual([{
      val: 'Label 1',
      label: 'Label 1',
    }, {
      val: 'Label 2',
      label: 'Label 2',
    }]);

    const customizationArgsForItemSelectionAndDragAndDropInput = {
      choices: {
        value: [
          new SubtitledHtml('Choice 1', 'ca_choices_0'),
          new SubtitledHtml('Choice 2', 'ca_choices_1')
        ]
      }
    };
    expect(
      ecs.getAnswerChoices(
        'ItemSelectionInput',
        customizationArgsForItemSelectionAndDragAndDropInput)
    ).toEqual([{
      val: 'ca_choices_0',
      label: 'Choice 1',
    }, {
      val: 'ca_choices_1',
      label: 'Choice 2',
    }]);
    expect(
      ecs.getAnswerChoices(
        'DragAndDropSortInput',
        customizationArgsForItemSelectionAndDragAndDropInput)
    ).toEqual([{
      val: 'ca_choices_0',
      label: 'Choice 1',
    }, {
      val: 'ca_choices_1',
      label: 'Choice 2',
    }]);
    expect(
      ecs.getAnswerChoices(
        'NotDragAndDropSortInput',
        customizationArgsForItemSelectionAndDragAndDropInput)
    ).toEqual(null);
  });

  it('should return null when getting answer choices' +
    ' if interactionID is empty', () => {
    expect(ecs.getAnswerChoices('', {
      choices: {
        value: [
          new SubtitledHtml('Choice 1', ''),
          new SubtitledHtml('Choice 2', '')
        ]
      }
    })).toBe(null);
  });

  it('should return if exploration is whitelisted or not', () => {
    expect(ecs.isExplorationWhitelisted()).toBe(false);
    ecs.explorationIsWhitelisted = true;
    expect(ecs.isExplorationWhitelisted()).toBe(true);
    ecs.explorationIsWhitelisted = false;
    expect(ecs.isExplorationWhitelisted()).toBe(false);
  });

  it('should initialise state content editor', () => {
    expect(ecs.stateContentEditorInitialised).toBe(false);
    ecs.updateStateContentEditorInitialised();
    expect(ecs.stateContentEditorInitialised).toBe(true);
  });

  it('should initialise state interaction editor', () => {
    expect(ecs.stateInteractionEditorInitialised).toBe(false);
    ecs.updateStateInteractionEditorInitialised();
    expect(ecs.stateInteractionEditorInitialised).toBe(true);
  });

  it('should initialise state responses initialised', () => {
    expect(ecs.stateResponsesInitialised).toBe(false);
    ecs.updateStateResponsesInitialised();
    expect(ecs.stateResponsesInitialised).toBe(true);
  });

  it('should initialise state hints editor', () => {
    expect(ecs.stateHintsEditorInitialised).toBe(false);
    ecs.updateStateHintsEditorInitialised();
    expect(ecs.stateHintsEditorInitialised).toBe(true);
  });

  it('should initialise state solution editor', () => {
    expect(ecs.stateSolutionEditorInitialised).toBe(false);
    ecs.updateStateSolutionEditorInitialised();
    expect(ecs.stateSolutionEditorInitialised).toBe(true);
  });

  it('should initialise state editor', () => {
    expect(ecs.stateEditorDirectiveInitialised).toBe(false);
    ecs.updateStateEditorDirectiveInitialised();
    expect(ecs.stateEditorDirectiveInitialised).toBe(true);
  });

  it('should update current rule input is valid', () => {
    expect(ecs.checkCurrentRuleInputIsValid()).toBe(false);
    ecs.updateCurrentRuleInputIsValid(true);
    expect(ecs.checkCurrentRuleInputIsValid()).toBe(true);
    ecs.updateCurrentRuleInputIsValid(false);
    expect(ecs.checkCurrentRuleInputIsValid()).toBe(false);
  });

  it('should get and set state names', () => {
    expect(ecs.getStateNames()).toEqual([]);
    ecs.setStateNames(['Introduction', 'State1']);
    expect(ecs.getStateNames()).toEqual(['Introduction', 'State1']);
    ecs.setStateNames(['Introduction', 'End']);
    expect(ecs.getStateNames()).toEqual(['Introduction', 'End']);
  });

  it('should check event listener registration status', () => {
    // Registration status is true only when,
    // stateInteractionEditorInitialised, stateResponsesInitialised and
    // stateEditorDirectiveInitialised are true.
    expect(ecs.stateInteractionEditorInitialised).toBe(false);
    expect(ecs.stateResponsesInitialised).toBe(false);
    expect(ecs.stateEditorDirectiveInitialised).toBe(false);
    expect(ecs.checkEventListenerRegistrationStatus()).toBe(false);

    // Set stateInteractionEditorInitialised as true.
    ecs.updateStateInteractionEditorInitialised();
    expect(ecs.stateInteractionEditorInitialised).toBe(true);
    expect(ecs.stateResponsesInitialised).toBe(false);
    expect(ecs.stateEditorDirectiveInitialised).toBe(false);
    expect(ecs.checkEventListenerRegistrationStatus()).toBe(false);

    // Set stateResponsesInitialised as true.
    ecs.updateStateResponsesInitialised();
    expect(ecs.stateInteractionEditorInitialised).toBe(true);
    expect(ecs.stateResponsesInitialised).toBe(true);
    expect(ecs.stateEditorDirectiveInitialised).toBe(false);
    expect(ecs.checkEventListenerRegistrationStatus()).toBe(false);

    // Set stateEditorDirectiveInitialised as true.
    ecs.updateStateEditorDirectiveInitialised();
    expect(ecs.stateInteractionEditorInitialised).toBe(true);
    expect(ecs.stateResponsesInitialised).toBe(true);
    expect(ecs.stateEditorDirectiveInitialised).toBe(true);
    expect(ecs.checkEventListenerRegistrationStatus()).toBe(true);
  });

  it('should update exploration whitelisted status', () => {
    expect(ecs.isExplorationWhitelisted()).toBe(false);
    ecs.updateExplorationWhitelistedStatus(true);
    expect(ecs.isExplorationWhitelisted()).toBe(true);
    ecs.updateExplorationWhitelistedStatus(false);
    expect(ecs.isExplorationWhitelisted()).toBe(false);
  });

  it('should set interaction', () => {
    expect(ecs.getInteraction()).toEqual(null);
    ecs.setInteraction(mockInteraction);
    expect(ecs.getInteraction()).toEqual(mockInteraction);
  });

  it('should get event emitter for change in state names', () => {
    spyOn(ecs.onStateNamesChanged, 'subscribe');
    ecs.onStateNamesChanged.subscribe();
    ecs.setStateNames(['State1']);
    expect(ecs.onStateNamesChanged.subscribe).toHaveBeenCalled();
  });

  it('should set interaction ID', () => {
    ecs.setInteraction(mockInteraction);
    expect(ecs.interaction.id).toBe('TextInput');
    ecs.setInteractionId('ChangedTextInput');
    expect(ecs.interaction.id).toBe('ChangedTextInput');
  });

  it('should set interaction answer groups', () => {
    let newAnswerGroups = [
      answerGroupObjectFactory.createNew(
        [],
        outcomeObjectFactory.createNew('Hola', '1', 'Feedback text', []),
        ['Training data text'],
        '0'
      ),
    ];

    ecs.setInteraction(mockInteraction);
    expect(ecs.interaction.answerGroups).toEqual(
      [
        answerGroupObjectFactory.createNew(
          [],
          outcomeObjectFactory.createNew(
            'State', 'This is a new feedback text', '', []),
          [],
          ''
        ),
      ]
    );
    ecs.setInteractionAnswerGroups(newAnswerGroups);
    expect(ecs.interaction.answerGroups).toEqual(newAnswerGroups);
  });

  it('should set interaction default outcome', () => {
    let newDefaultOutcome = outcomeObjectFactory.createNew(
      'Hola1', '', 'Feedback text', []);

    ecs.setInteraction(mockInteraction);
    expect(ecs.interaction.defaultOutcome).toEqual(
      outcomeObjectFactory.createNew('Hola', '', '', []));
    ecs.setInteractionDefaultOutcome(newDefaultOutcome);
    expect(ecs.interaction.defaultOutcome).toEqual(newDefaultOutcome);
  });

  it('should set interaction customization args', () => {
    let newCustomizationArgs = {
      rows: {
        value: 2,
      },
      placeholder: {
        value: suof.createDefault('2', ''),
      },
    };
    ecs.setInteraction(mockInteraction);
    expect(ecs.interaction.customizationArgs).toEqual({
      placeholder: {
        value: suof.createDefault('1', 'cid'),
      },
      rows: {
        value: 1
      }
    });
    ecs.setInteractionCustomizationArgs(newCustomizationArgs);
    expect(ecs.interaction.customizationArgs).toEqual(newCustomizationArgs);
  });

  it('should set interaction solution', () => {
    let newSolution = sof.createFromBackendDict({
      answer_is_exclusive: true,
      correct_answer: 'test_answer_new',
      explanation: {
        content_id: '2',
        html: 'test_explanation1_new',
      },
    });
    ecs.setInteraction(mockInteraction);
    expect(ecs.interaction.solution).toEqual(sof.createFromBackendDict({
      answer_is_exclusive: true,
      correct_answer: 'test_answer',
      explanation: {
        content_id: '2',
        html: 'test_explanation1',
      },
    }));
    ecs.setInteractionSolution(newSolution);
    expect(ecs.interaction.solution).toEqual(newSolution);
  });

  it('should set interaction hints', () => {
    let newHints = [hof.createFromBackendDict({
      hint_content: {
        content_id: '',
        html: 'This is a hint'
      }
    })];
    ecs.setInteraction(mockInteraction);
    expect(ecs.interaction.hints).toEqual([]);
    ecs.setInteractionHints(newHints);
    expect(ecs.interaction.hints).toEqual(newHints);
  });

  it('should set in question mode', () => {
    expect(ecs.isInQuestionMode()).toBe(null);
    ecs.setInQuestionMode(true);
    expect(ecs.isInQuestionMode()).toBe(true);
    ecs.setInQuestionMode(false);
    expect(ecs.isInQuestionMode()).toBe(false);
  });

  it('should set correctness feedback enabled', () => {
    expect(ecs.getCorrectnessFeedbackEnabled()).toBe(null);
    ecs.setCorrectnessFeedbackEnabled(true);
    expect(ecs.getCorrectnessFeedbackEnabled()).toBe(true);
    ecs.setCorrectnessFeedbackEnabled(false);
    expect(ecs.getCorrectnessFeedbackEnabled()).toBe(false);
  });

  it('should set inapplicable skill misconception ids', () => {
    expect(ecs.getInapplicableSkillMisconceptionIds()).toEqual([]);
    ecs.setInapplicableSkillMisconceptionIds(['id1', 'id2']);
    expect(ecs.getInapplicableSkillMisconceptionIds()).toEqual(['id1', 'id2']);
  });

  it('should check if current solution is valid', () => {
    // Set 'Hola' as the active state.
    ecs.activeStateName = 'Hola';
    // At present, we are not keeping track of the solution's validity. So, we
    // initialize the Solution Validity Service with the state. Upon,
    // initialization the solution validity is set as true.
    expect(ecs.isCurrentSolutionValid()).toBe(undefined);
    solutionValidityService.init(['Hola']);
    expect(ecs.isCurrentSolutionValid()).toBe(true);
  });

  it('should delete current solution validity', () => {
    ecs.activeStateName = 'Hola';
    expect(ecs.isCurrentSolutionValid()).toBe(undefined);
    solutionValidityService.init(['Hola']);
    expect(ecs.isCurrentSolutionValid()).toBe(true);
    ecs.deleteCurrentSolutionValidity();
    expect(ecs.isCurrentSolutionValid()).toBe(undefined);
  });
});
