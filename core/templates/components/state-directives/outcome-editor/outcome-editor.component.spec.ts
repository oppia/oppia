// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for outcome editor component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { ExternalSaveService } from 'services/external-save.service';
import { OutcomeEditorComponent } from './outcome-editor.component';

describe('Outcome Editor Component', () => {
  let component: OutcomeEditorComponent;
  let fixture: ComponentFixture<OutcomeEditorComponent>;
  let externalSaveService: ExternalSaveService;
  let outcomeObjectFactory: OutcomeObjectFactory;
  let stateEditorService: StateEditorService;
  let stateInteractionIdService: StateInteractionIdService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        OutcomeEditorComponent
      ],
      providers: [
        ExternalSaveService,
        StateEditorService,
        StateInteractionIdService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OutcomeEditorComponent);
    component = fixture.componentInstance;
    externalSaveService = TestBed.inject(ExternalSaveService);
    outcomeObjectFactory = TestBed.inject(OutcomeObjectFactory);
    stateEditorService = TestBed.inject(StateEditorService);
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);

    spyOn(stateEditorService, 'isExplorationWhitelisted').and.returnValue(true);
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set component properties on initialization', () => {
    let outcome = {
      feedback: {
        html: '<p> Previous HTML string </p>'
      },
      hasNonemptyFeedback: () => true
    };
    component.outcome = outcome;

    expect(component.editOutcomeForm).toEqual(undefined);
    expect(component.canAddPrerequisiteSkill).toBe(undefined);
    expect(component.feedbackEditorIsOpen).toBe(undefined);
    expect(component.destinationEditorIsOpen).toBe(undefined);
    expect(component.correctnessLabelEditorIsOpen).toBe(undefined);
    expect(component.savedOutcome).toBe(undefined);

    component.ngOnInit();

    expect(component.editOutcomeForm).toEqual({});
    expect(component.canAddPrerequisiteSkill).toBe(false);
    expect(component.feedbackEditorIsOpen).toBe(false);
    expect(component.destinationEditorIsOpen).toBe(false);
    expect(component.correctnessLabelEditorIsOpen).toBe(false);
    expect(component.savedOutcome).toEqual(outcome);
  });

  it('should save feedback on external save event when editFeedbackForm is' +
    ' valid and state is not invalid after feedback save', () => {
    let onExternalSaveEmitter = new EventEmitter();
    spyOnProperty(externalSaveService, 'onExternalSave')
      .and.returnValue(onExternalSaveEmitter);
    spyOn(component, 'invalidStateAfterFeedbackSave').and.returnValue(false);
    spyOn(component, 'saveThisFeedback');

    component.ngOnInit();

    component.feedbackEditorIsOpen = true;
    component.editOutcomeForm = {
      editFeedbackForm: {
        $valid: true
      }
    };

    onExternalSaveEmitter.emit();

    expect(component.saveThisFeedback).toHaveBeenCalledWith(false);
  });

  it('should cancel feedback edit on external save event when' +
    ' editFeedbackForm is not valid or state us not valid after' +
    ' feedback save', () => {
    let onExternalSaveEmitter = new EventEmitter();
    spyOnProperty(externalSaveService, 'onExternalSave')
      .and.returnValue(onExternalSaveEmitter);
    spyOn(component, 'invalidStateAfterFeedbackSave').and.returnValue(false);

    component.ngOnInit();

    // Setup. No pre-check as we are setting up values below.
    component.feedbackEditorIsOpen = true;
    component.editOutcomeForm = {
      editFeedbackForm: {
        $valid: false
      }
    };
    component.savedOutcome = {
      feedback: 'Saved Outcome'
    };
    component.outcome = {
      feedback: 'Outcome'
    };

    // Action.
    onExternalSaveEmitter.emit();

    // Post-check.
    expect(component.feedbackEditorIsOpen).toBe(false);
    expect(component.outcome.feedback).toBe('Saved Outcome');
  });

  it('should save destination on interaction change when edit destination' +
    ' form is valid and state is not invalid after destination save', () => {
    let onInteractionIdChangedEmitter = new EventEmitter();
    spyOnProperty(stateInteractionIdService, 'onInteractionIdChanged')
      .and.returnValue(onInteractionIdChangedEmitter);
    spyOn(component, 'invalidStateAfterDestinationSave').and.returnValue(false);
    spyOn(component, 'saveThisDestination');

    component.ngOnInit();

    component.destinationEditorIsOpen = true;
    component.editOutcomeForm = {
      editDestForm: {
        $valid: true
      }
    };

    onInteractionIdChangedEmitter.emit();

    expect(component.saveThisDestination).toHaveBeenCalled();
  });

  it('should cancel destination edit on interaction change when edit' +
    ' destination form is not valid or state is invalid after' +
    ' destination save', () => {
    let onInteractionIdChangedEmitter = new EventEmitter();
    spyOnProperty(stateInteractionIdService, 'onInteractionIdChanged')
      .and.returnValue(onInteractionIdChangedEmitter);
    spyOn(component, 'invalidStateAfterDestinationSave').and.returnValue(false);

    component.ngOnInit();

    // Setup. No pre-check as we are setting up values below.
    component.destinationEditorIsOpen = true;
    component.editOutcomeForm = {
      editDestForm: {
        $valid: false
      }
    };
    component.savedOutcome = {
      dest: 'Saved Dest',
      refresherExplorationId: 'ExpId',
      missingPrerequisiteSkillId: 'SkillId'
    };
    component.outcome = {
      dest: 'Dest',
      refresherExplorationId: '',
      missingPrerequisiteSkillId: ''
    };

    // Action.
    onInteractionIdChangedEmitter.emit();

    // Post-check.
    expect(component.destinationEditorIsOpen).toBe(false);
    expect(component.outcome.dest).toBe('Saved Dest');
    expect(component.outcome.refresherExplorationId).toBe('ExpId');
    expect(component.outcome.missingPrerequisiteSkillId).toBe('SkillId');
  });

  it('should check if state is in question mode', () => {
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(true);

    expect(component.isInQuestionMode()).toBe(true);
  });

  it('should get current interaction\'s ID', () => {
    stateInteractionIdService.savedMemento = 'TextInput';

    expect(component.getCurrentInteractionId()).toBe('TextInput');
  });

  it('should check if correctness feedback is enabled', () => {
    spyOn(stateEditorService, 'getCorrectnessFeedbackEnabled')
      .and.returnValue(true);

    expect(component.isCorrectnessFeedbackEnabled()).toBe(true);
  });

  it('should check if current interaction is linear or not', () => {
    stateInteractionIdService.savedMemento = 'TextInput';

    expect(component.isCurrentInteractionLinear()).toBe(false);
  });

  it('should check if a state is in self loop', () => {
    spyOn(stateEditorService, 'getActiveStateName')
      .and.returnValue('Hola');

    expect(component.isSelfLoop({dest: 'Hola'})).toBe(true);
    expect(component.isSelfLoop({dest: 'Introduction'})).toBe(false);
  });

  it('should check if state if of self loop with no feedback', () => {
    let outcome = outcomeObjectFactory.createNew(
      'State Name', '1', '', []);
    spyOn(stateEditorService, 'getActiveStateName')
      .and.returnValue('State Name');

    expect(component.isSelfLoopWithNoFeedback(outcome)).toBe(true);
    expect(component.isSelfLoopWithNoFeedback(null)).toBe(false);
  });

  it('should check if state will become invalid after feedback' +
    ' is saved', () => {
    spyOn(stateEditorService, 'getActiveStateName')
      .and.returnValue('State Name');
    component.outcome = outcomeObjectFactory.createNew(
      'Introduction', '1', '', []);
    component.savedOutcome = outcomeObjectFactory.createNew(
      'State Name', '1', '', []);

    expect(component.invalidStateAfterFeedbackSave()).toBe(true);
  });

  it('should check if state will become invalid after destination' +
    ' is saved', () => {
    spyOn(stateEditorService, 'getActiveStateName')
      .and.returnValue('Introduction');
    component.outcome = outcomeObjectFactory.createNew(
      'Introduction', '1', '', []);
    component.savedOutcome = outcomeObjectFactory.createNew(
      'State Name', '1', '', []);

    expect(component.invalidStateAfterDestinationSave()).toBe(true);
  });

  it('should open feedback editor if it is editable', () => {
    component.feedbackEditorIsOpen = false;

    component.openFeedbackEditor();

    expect(component.feedbackEditorIsOpen).toBe(true);
  });

  it('should open destination editor if it is editable', () => {
    component.destinationEditorIsOpen = false;

    component.openDestinationEditor();

    expect(component.destinationEditorIsOpen).toBe(true);
  });

  it('should save correctness label when it is changed', () => {
    component.savedOutcome = {
      labelledAsCorrect: false
    };
    component.outcome = {
      labelledAsCorrect: true
    };

    component.onChangeCorrectnessLabel();

    expect(component.savedOutcome.labelledAsCorrect).toBe(true);
  });

  it('should set destination as null when saving feedback in' +
    ' question mode', () => {
    component.savedOutcome = {
      feedback: {
        contentId: 'savedContentId',
        html: '<p> Saved Outcome </p>'
      },
      dest: 'Saved Dest'
    };
    component.outcome = {
      feedback: {
        contentId: 'contentId',
        html: '<p> Outcome </p>'
      },
      dest: 'Dest'
    };
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(true);
    spyOn(component, 'showMarkAllAudioAsNeedingUpdateModalIfRequired');

    component.saveThisFeedback(true);

    expect(component.savedOutcome.dest).toBe(null);
    expect(component.showMarkAllAudioAsNeedingUpdateModalIfRequired)
      .toHaveBeenCalledWith(['contentId']);
  });

  it('should set destination when saving feedback not in question mode', () => {
    component.savedOutcome = {
      feedback: {
        contentId: 'savedContentId',
        html: '<p> Saved Outcome </p>'
      },
      dest: 'Dest',
    };
    component.outcome = {
      feedback: {
        contentId: 'contentId',
        html: '<p> Outcome </p>'
      },
      dest: 'Dest',
    };
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(false);
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue('Hola');

    component.saveThisFeedback(false);

    expect(component.savedOutcome.dest).toBe('Hola');
  });

  it('should set refresher exploration ID as null on saving destination' +
    ' when state is not in self loop', () => {
    component.savedOutcome = {
      feedback: {
        contentId: 'savedContentId',
        html: '<p> Saved Outcome </p>'
      },
      dest: 'Saved Dest',
      refresherExplorationId: 'ExpId',
      missingPrerequisiteSkillId: ''
    };
    component.outcome = {
      feedback: {
        contentId: 'contentId',
        html: '<p> Outcome </p>'
      },
      dest: 'Dest',
      refresherExplorationId: 'OutcomeExpId',
      missingPrerequisiteSkillId: 'SkillId'
    };
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue('Dest1');

    component.saveThisDestination();

    expect(component.outcome.refresherExplorationId).toBe(null);
    expect(component.savedOutcome.refresherExplorationId).toBe(null);
    expect(component.savedOutcome.missingPrerequisiteSkillId).toBe('SkillId');
  });

  it('should check if outcome feedback exceeds 10000 characters', () => {
    component.outcome = {
      feedback: {
        _html: 'a'.repeat(10000)
      }
    };
    expect(component.isFeedbackLengthExceeded()).toBe(false);

    component.outcome = {
      feedback: {
        _html: 'a'.repeat(10001)
      }
    };
    expect(component.isFeedbackLengthExceeded()).toBe(true);
  });
});
