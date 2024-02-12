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
import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { Outcome, OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { AddOutcomeModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/add-outcome-modal.component';
import { of } from 'rxjs';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { ExternalSaveService } from 'services/external-save.service';
import { OutcomeEditorComponent } from './outcome-editor.component';

class MockWindowDimensionsService {
  getResizeEvent() {
    return of(new Event('resize'));
  }

  getWidth(): number {
    // Screen width of iPhone 12 Pro (to simulate a mobile viewport).
    return 390;
  }
}

describe('Outcome Editor Component', () => {
  let component: OutcomeEditorComponent;
  let fixture: ComponentFixture<OutcomeEditorComponent>;
  let externalSaveService: ExternalSaveService;
  let stateEditorService: StateEditorService;
  let stateInteractionIdService: StateInteractionIdService;
  let ngbModal: NgbModal;
  let outcomeObjectFactory: OutcomeObjectFactory;
  let windowDimensionsService: MockWindowDimensionsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      declarations: [
        OutcomeEditorComponent,
        AddOutcomeModalComponent
      ],
      providers: [
        ExternalSaveService,
        StateEditorService,
        StateInteractionIdService,
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService
        }
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
    ngbModal = TestBed.inject(NgbModal);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);

    spyOn(stateEditorService, 'isExplorationCurated').and.returnValue(true);
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set component properties on initialization', () => {
    let outcome = new Outcome(
      'Introduction',
      null,
      new SubtitledHtml('<p> Previous HTML string </p>', 'Id'),
      true,
      [],
      null,
      null,
    );
    component.outcome = outcome;

    const windowResizeSpy = spyOn(
      windowDimensionsService, 'getResizeEvent').and.callThrough();

    expect(component.savedOutcome).toBeUndefined();

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.savedOutcome).toEqual(outcome);
    expect(windowResizeSpy).toHaveBeenCalled();
    expect(component.resizeSubscription).not.toBe(undefined);
    expect(component.onMobile).toBeTrue();
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

    onExternalSaveEmitter.emit();

    expect(component.saveThisFeedback).toHaveBeenCalled();
  });

  it('should cancel feedback edit on external save event when' +
    ' editFeedbackForm is not valid or state us not valid after' +
    ' feedback save', () => {
    let onExternalSaveEmitter = new EventEmitter();
    spyOnProperty(externalSaveService, 'onExternalSave')
      .and.returnValue(onExternalSaveEmitter);
    spyOn(component, 'invalidStateAfterFeedbackSave').and.returnValue(true);

    component.ngOnInit();

    // Setup. No pre-check as we are setting up values below.
    component.feedbackEditorIsOpen = true;
    component.savedOutcome = new Outcome(
      'Introduction',
      null,
      new SubtitledHtml('<p>Saved Outcome</p>', 'Id'),
      true,
      [],
      null,
      null,
    );
    component.outcome = new Outcome(
      'Introduction',
      null,
      new SubtitledHtml('<p>Outcome</p>', 'Id'),
      true,
      [],
      null,
      null,
    );

    // Action.
    onExternalSaveEmitter.emit();

    // Post-check.
    expect(component.feedbackEditorIsOpen).toBeFalse();
    expect(component.outcome.feedback).toEqual(
      new SubtitledHtml('<p>Saved Outcome</p>', 'Id'));
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

    onInteractionIdChangedEmitter.emit();

    expect(component.saveThisDestination).toHaveBeenCalled();
  });

  it('should save destination for the stuck learner on interaction change' +
    ' when state is not invalid after destination save', () => {
    let onInteractionIdChangedEmitter = new EventEmitter();
    spyOnProperty(stateInteractionIdService, 'onInteractionIdChanged')
      .and.returnValue(onInteractionIdChangedEmitter);
    spyOn(component, 'saveThisIfStuckDestination');

    component.ngOnInit();

    component.destinationIfStuckEditorIsOpen = true;

    onInteractionIdChangedEmitter.emit();

    expect(component.saveThisIfStuckDestination).toHaveBeenCalled();
  });

  it('should cancel destination if-stuck edit correctly', () => {
    component.ngOnInit();

    // Setup. No pre-check as we are setting up values below.
    component.destinationIfStuckEditorIsOpen = true;
    component.savedOutcome = new Outcome(
      'Introduction',
      'Stuck state',
      new SubtitledHtml('<p>Saved Outcome</p>', 'Id'),
      true,
      [],
      '',
      '',
    );
    component.outcome = new Outcome(
      'Saved Outcome',
      'Changed state',
      new SubtitledHtml('<p>Outcome</p>', 'Id'),
      true,
      [],
      '',
      '',
    );

    // Action.
    component.cancelThisIfStuckDestinationEdit();

    // Post-check.
    expect(component.destinationIfStuckEditorIsOpen).toBeFalse();
    expect(component.outcome.destIfReallyStuck).toBe('Stuck state');
  });

  it('should cancel destination edit on interaction change when edit' +
    ' destination form is not valid or state is invalid after' +
    ' destination save', () => {
    let onInteractionIdChangedEmitter = new EventEmitter();
    spyOnProperty(stateInteractionIdService, 'onInteractionIdChanged')
      .and.returnValue(onInteractionIdChangedEmitter);
    spyOn(component, 'invalidStateAfterDestinationSave').and.returnValue(true);

    component.ngOnInit();

    // Setup. No pre-check as we are setting up values below.
    component.destinationEditorIsOpen = true;
    component.savedOutcome = new Outcome(
      'Introduction',
      null,
      new SubtitledHtml('<p>Saved Outcome</p>', 'Id'),
      true,
      [],
      'ExpId',
      'SkillId',
    );
    component.outcome = new Outcome(
      'Saved Outcome',
      null,
      new SubtitledHtml('<p>Outcome</p>', 'Id'),
      true,
      [],
      '',
      '',
    );

    // Action.
    onInteractionIdChangedEmitter.emit();

    // Post-check.
    expect(component.destinationEditorIsOpen).toBeFalse();
    expect(component.outcome.dest).toBe('Introduction');
    expect(component.outcome.refresherExplorationId).toBe('ExpId');
    expect(component.outcome.missingPrerequisiteSkillId).toBe('SkillId');
  });

  it('should check if state is in question mode', () => {
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(true);

    expect(component.isInQuestionMode()).toBeTrue();
  });

  it('should get current interaction\'s ID', () => {
    stateInteractionIdService.savedMemento = 'TextInput';

    expect(component.getCurrentInteractionId()).toBe('TextInput');
  });

  it('should check if current interaction is linear or not', () => {
    stateInteractionIdService.savedMemento = 'TextInput';

    expect(component.isCurrentInteractionLinear()).toBeFalse();
  });

  it('should check if current interaction is linear or not', () => {
    stateInteractionIdService.savedMemento = 'TextInput';

    expect(component.isCurrentInteractionLinear()).toBeFalse();
  });

  it('should check if a state is in self loop', () => {
    let outcome = new Outcome(
      'Hola',
      null,
      new SubtitledHtml('<p> Previous HTML string </p>', 'Id'),
      true,
      [],
      null,
      null,
    );
    component.outcome = outcome;
    spyOn(stateEditorService, 'getActiveStateName')
      .and.returnValue('Hola');

    expect(component.isSelfLoop(outcome)).toBeTrue();

    outcome = new Outcome(
      'Introduction',
      null,
      new SubtitledHtml('<p> Previous HTML string </p>', 'Id'),
      true,
      [],
      null,
      null,
    );
    component.outcome = outcome;
    expect(component.isSelfLoop(outcome)).toBeFalse();
  });

  it('should check if state if of self loop with no feedback', () => {
    spyOn(stateEditorService, 'getActiveStateName')
      .and.returnValue('State Name');
    let outcome = outcomeObjectFactory.createNew(
      'State Name', '1', '', []);

    expect(component.isSelfLoopWithNoFeedback(outcome)).toBe(true);

    outcome = outcomeObjectFactory.createNew(
      '', '', '', []);

    expect(component.isSelfLoopWithNoFeedback(outcome)).toBe(false);
  });

  it('should check if state will become invalid after feedback' +
    ' is saved', () => {
    spyOn(stateEditorService, 'getActiveStateName')
      .and.returnValue('State Name');
    component.outcome = outcomeObjectFactory.createNew(
      'Introduction', '1', '', []);
    component.savedOutcome = outcomeObjectFactory.createNew(
      'State Name', '1', '', []);

    expect(component.invalidStateAfterFeedbackSave()).toBeTrue();
  });

  it('should check if state will become invalid after destination' +
    ' is saved', () => {
    spyOn(stateEditorService, 'getActiveStateName')
      .and.returnValue('Introduction');
    component.outcome = outcomeObjectFactory.createNew(
      'Introduction', '1', '', []);
    component.savedOutcome = outcomeObjectFactory.createNew(
      'State Name', '1', '', []);

    expect(component.invalidStateAfterDestinationSave()).toBeTrue();
  });

  it('should open feedback editor if it is editable', () => {
    component.feedbackEditorIsOpen = false;
    component.isEditable = true;

    component.openFeedbackEditor();

    expect(component.feedbackEditorIsOpen).toBeTrue();
  });

  it('should open feedback editor modal if it is editable', fakeAsync(() => {
    const outcome = new Outcome(
      'Introduction',
      null,
      new SubtitledHtml('<p> Previous HTML string </p>', 'Id'),
      true,
      [],
      null,
      null,
    );

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        outcome: outcome
      },
      result: Promise.resolve({
        outcome: outcome
      })
    } as NgbModalRef);

    spyOn(component, 'saveThisFeedback').and.callFake(()=>{
      component.feedbackEditorIsOpen = false;
    });

    component.isEditable = true;
    component.openFeedbackEditorModal();

    expect(ngbModal.open).toHaveBeenCalled();
  }));

  it('should open destination editor if it is editable', () => {
    component.destinationEditorIsOpen = false;
    component.isEditable = true;

    component.openDestinationEditor();

    expect(component.destinationEditorIsOpen).toBeTrue();
  });

  it('should open destination if-stuck editor if it is editable', () => {
    component.destinationIfStuckEditorIsOpen = false;
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue('first');
    component.isEditable = true;
    component.savedOutcome = new Outcome(
      'Introduction',
      null,
      new SubtitledHtml('<p>Saved Outcome</p>', 'Id'),
      false,
      [],
      'ExpId',
      'SkillId',
    );
    component.outcome = new Outcome(
      'Introduction',
      null,
      new SubtitledHtml('<p>Outcome</p>', 'Id'),
      true,
      [],
      '',
      '',
    );
    component.openDestinationIfStuckEditor();
    expect(component.destinationIfStuckEditorIsOpen).toBeTrue();
    expect(component.outcome.destIfReallyStuck).toBeNull();
  });

  it('should save correctness label when it is changed', () => {
    component.savedOutcome = new Outcome(
      'Introduction',
      null,
      new SubtitledHtml('<p>Saved Outcome</p>', 'Id'),
      false,
      [],
      'ExpId',
      'SkillId',
    );
    component.outcome = new Outcome(
      'Introduction',
      null,
      new SubtitledHtml('<p>Outcome</p>', 'Id'),
      true,
      [],
      '',
      '',
    );

    component.onChangeCorrectnessLabel();

    expect(component.savedOutcome.labelledAsCorrect).toBeTrue();
  });

  it('should set destination when saving feedback not in question mode', () => {
    component.savedOutcome = new Outcome(
      'Dest',
      null,
      new SubtitledHtml('<p>Saved Outcome</p>', 'savedContentId'),
      false,
      [],
      'ExpId',
      'SkillId',
    );
    component.outcome = new Outcome(
      'Dest',
      null,
      new SubtitledHtml('<p>Outcome</p>', 'contentId'),
      true,
      [],
      '',
      '',
    );
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(false);
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue('Hola');

    component.saveThisFeedback();

    expect(component.savedOutcome.dest).toBe('Hola');
  });

  it('should throw error when saving feedback with invalid state name', () => {
    component.savedOutcome = new Outcome(
      'Dest',
      null,
      new SubtitledHtml('<p>Saved Outcome</p>', 'savedContentId'),
      false,
      [],
      'ExpId',
      'SkillId',
    );
    component.outcome = new Outcome(
      'Dest',
      null,
      new SubtitledHtml('<p>Outcome</p>', 'contentId'),
      true,
      [],
      '',
      '',
    );
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(false);
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(null);

    expect(() => {
      component.saveThisFeedback();
    }).toThrowError('The active state name is null in the outcome editor.');
  });

  it('should set refresher exploration ID as null on saving destination' +
    ' when state is not in self loop', () => {
    component.savedOutcome = new Outcome(
      'Saved Dest',
      null,
      new SubtitledHtml('<p>Saved Outcome</p>', 'savedContentId'),
      false,
      [],
      'ExpId',
      '',
    );
    component.outcome = new Outcome(
      'Dest',
      null,
      new SubtitledHtml('<p>Outcome</p>', 'contentId'),
      true,
      [],
      'OutcomeExpId',
      'SkillId',
    );
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue('Dest1');

    component.saveThisDestination();

    expect(component.outcome.refresherExplorationId).toBe(null);
    expect(component.savedOutcome.refresherExplorationId).toBe(null);
    expect(component.savedOutcome.missingPrerequisiteSkillId).toBe('SkillId');
  });

  it('should set labelled as correct to false on saving destination' +
    ' when state is in self loop', () => {
    component.savedOutcome = new Outcome(
      'Saved Dest',
      null,
      new SubtitledHtml('<p>Saved Outcome</p>', 'savedContentId'),
      false,
      [],
      'ExpId',
      '',
    );
    component.outcome = new Outcome(
      'Dest1',
      null,
      new SubtitledHtml('<p>Outcome</p>', 'contentId'),
      true,
      [],
      'OutcomeExpId',
      'SkillId',
    );
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue('Dest1');
    const changeCorrectnessSpy = spyOn(component, 'onChangeCorrectnessLabel');

    component.saveThisDestination();

    expect(component.outcome.labelledAsCorrect).toBe(false);
    expect(changeCorrectnessSpy).toHaveBeenCalled();
  });

  it('should set the dest_if_really_stuck property correctly' +
    'when the destination for the stuck learner is saved.', () => {
    component.savedOutcome = new Outcome(
      'Dest',
      null,
      new SubtitledHtml('<p>Saved Outcome</p>', 'savedContentId'),
      false,
      [],
      'ExpId',
      '',
    );
    component.outcome = new Outcome(
      'Dest',
      'Stuck state',
      new SubtitledHtml('<p>Outcome</p>', 'contentId'),
      true,
      [],
      'OutcomeExpId',
      'SkillId',
    );

    component.saveThisIfStuckDestination();

    expect(component.savedOutcome.destIfReallyStuck).toBe('Stuck state');
  });

  it('should check if outcome feedback exceeds 10000 characters', () => {
    component.outcome = new Outcome(
      'Dest',
      null,
      new SubtitledHtml('a'.repeat(10000), 'contentId'),
      true,
      [],
      'OutcomeExpId',
      'SkillId',
    );
    expect(component.isFeedbackLengthExceeded()).toBeFalse();

    component.outcome = new Outcome(
      'Dest',
      null,
      new SubtitledHtml('a'.repeat(10001), 'contentId'),
      true,
      [],
      'OutcomeExpId',
      'SkillId',
    );
    expect(component.isFeedbackLengthExceeded()).toBeTrue();
  });
});
