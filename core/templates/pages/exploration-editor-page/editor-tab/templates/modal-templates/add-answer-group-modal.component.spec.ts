// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for AddAnswerGroupModalController.
 */

import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { EditorFirstTimeEventsService } from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { Outcome, OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { Subscription } from 'rxjs';
import { EventBusGroup, EventBusService } from 'app-events/event-bus.service';
import { ObjectFormValidityChangeEvent } from 'app-events/app-events';
import { AddAnswerGroupModalComponent } from './add-answer-group-modal.component';
import { NO_ERRORS_SCHEMA, ElementRef } from '@angular/core';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Add Answer Group Modal Component', () => {
  let component: AddAnswerGroupModalComponent;
  let fixture: ComponentFixture<AddAnswerGroupModalComponent>;
  var outcomeObjectFactory: OutcomeObjectFactory;
  var stateEditorService: StateEditorService;
  var generateContentIdService: GenerateContentIdService;
  var testSubscriptions: Subscription;

  const saveOutcomeDestDetailsSpy = jasmine.createSpy('saveOutcomeDestDetails');

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AddAnswerGroupModalComponent
      ],
      providers: [
        EditorFirstTimeEventsService,
        GenerateContentIdService,
        OutcomeObjectFactory,
        StateEditorService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAnswerGroupModalComponent);
    component = fixture.componentInstance;

    outcomeObjectFactory = TestBed.inject(OutcomeObjectFactory);
    stateEditorService = TestBed.inject(StateEditorService);
    generateContentIdService = TestBed.inject(GenerateContentIdService);
    generateContentIdService.init(() => 0, () => {});
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(true);
    testSubscriptions = new Subscription();
    testSubscriptions.add(stateEditorService.onSaveOutcomeDestDetails.subscribe(
      saveOutcomeDestDetailsSpy));

    fixture.detectChanges();
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should initialize component properties after controller is initialized',
    fakeAsync(() => {
      expect(component.feedbackEditorIsOpen).toBe(false);
      expect(component.questionModeEnabled).toBe(true);
      expect(component.tmpTaggedSkillMisconceptionId).toBe(null);
      expect(component.addAnswerGroupForm).toEqual({});
      expect(component.validation).toBe(false);

      component.validateChanges({
        isCreatingNewState: true,
        value: ''
      });
      tick();

      expect(component.validation).toBe(true);

      component.validateChanges({
        isCreatingNewState: true,
        value: 'newState'
      });
      tick();

      expect(component.validation).toBe(false);
    }));

  it('should update answer group feedback', () => {
    expect(component.feedbackEditorIsOpen).toBe(false);

    var feedback = new SubtitledHtml('New feedback', null);
    component.updateAnswerGroupFeedback({
      feedback: feedback
    } as Outcome);
    component.modalId = Symbol();
    const eventBusGroup = new EventBusGroup(TestBed.inject(EventBusService));
    eventBusGroup.emit(new ObjectFormValidityChangeEvent({
      value: true, modalId: component.modalId}));
    expect(component.feedbackEditorIsOpen).toBe(true);
    expect(component.tmpOutcome.feedback).toBe(feedback);
  });

  it('should update tagged misconception', () => {
    expect(component.tmpTaggedSkillMisconceptionId).toBe(null);

    var taggedMisconception = {
      misconceptionId: 1,
      skillId: 'skill_1'
    };
    component.updateTaggedMisconception(taggedMisconception);

    expect(component.tmpTaggedSkillMisconceptionId).toBe('skill_1-1');
  });

  it('should check if current interaction is linear', () => {
    component.currentInteractionId = 'Continue';

    expect(component.isCurrentInteractionLinear()).toBe(true);
  });

  it('should check if outcome has no feedback with self loop', fakeAsync(() => {
    var outcome = outcomeObjectFactory.createNew(
      'State Name', '1', '', []);
    component.stateName = 'State Name';
    tick();

    expect(component.isSelfLoopWithNoFeedback(outcome)).toBe(true);

    var outcome2 = outcomeObjectFactory.createNew(
      'State Name', '1', 'Feedback Text', []);
    tick();
    expect(component.isSelfLoopWithNoFeedback(outcome2)).toBe(false);
  }));

  it('should check if outcome feedback exceeds 10000 characters', () => {
    var outcome1 = outcomeObjectFactory.createNew(
      'State Name', '1', 'a'.repeat(10000), []);
    expect(component.isFeedbackLengthExceeded(outcome1)).toBe(false);

    var outcome2 = outcomeObjectFactory.createNew(
      'State Name', '1', 'a'.repeat(10001), []);
    expect(component.isFeedbackLengthExceeded(outcome2)).toBe(true);
  });

  it('should focus on the header after loading', () => {
    const addResponseRef = new ElementRef(
      document.createElement('h4'));
    component.addResponseRef = addResponseRef;
    spyOn(addResponseRef.nativeElement, 'focus');

    component.ngAfterViewInit();

    expect(addResponseRef.nativeElement.focus).toHaveBeenCalled();
  });

  it('should save answer group response when closing the modal', () => {
    component.saveResponse(false);
    component.updateState('update');

    expect(saveOutcomeDestDetailsSpy).toHaveBeenCalled();
  });
});
