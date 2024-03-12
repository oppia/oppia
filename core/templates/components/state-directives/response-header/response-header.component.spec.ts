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
 * @fileoverview Unit tests for Response Header Component.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ResponseHeaderComponent} from './response-header.component';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import {OutcomeObjectFactory} from 'domain/exploration/OutcomeObjectFactory';

const mockInteractionState = {
  TextInput: {
    is_linear: false,
  },
};
class MockStateInteractionIdService {
  savedMemento = 'TextInput';
}

describe('Response Header Component', () => {
  let component: ResponseHeaderComponent;
  let fixture: ComponentFixture<ResponseHeaderComponent>;
  let stateEditorService: StateEditorService;
  let outcomeObjectFactory: OutcomeObjectFactory;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ResponseHeaderComponent],
      providers: [
        StateEditorService,
        OutcomeObjectFactory,
        {
          provide: INTERACTION_SPECS,
          useValue: mockInteractionState,
        },
        {
          provide: StateInteractionIdService,
          useClass: MockStateInteractionIdService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseHeaderComponent);
    component = fixture.componentInstance;

    stateEditorService = TestBed.inject(StateEditorService);
    outcomeObjectFactory = TestBed.inject(OutcomeObjectFactory);

    component.outcome = outcomeObjectFactory.createNew('/', '0', '0', []);
    component.index = 0;

    fixture.detectChanges();
  });

  it('should check if state is in question mode', () => {
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(true);

    expect(component.isInQuestionMode()).toBe(true);
  });

  it('should get current interaction ID', () => {
    expect(component.getCurrentInteractionId()).toBe('TextInput');
  });

  it('should check if current interaction is linear or not', () => {
    expect(component.isCurrentInteractionLinear()).toBe(false);
  });

  it('should navigate to state after user click on outcome dest', () => {
    spyOn(component.navigateToState, 'emit').and.callThrough();

    component.returnToState();

    expect(component.navigateToState.emit).toHaveBeenCalled();
  });

  it('should check if current response is outcome is correct', () => {
    expect(component.isCorrect()).toBe(false);
  });

  it('should check if outcome is in a loop', () => {
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue('Hola');

    expect(component.isOutcomeLooping()).toBe(false);
  });

  it('should check if a new state is being created', () => {
    expect(component.isCreatingNewState()).toBe(true);
  });

  it('should delete response when user clicks delete button', () => {
    spyOn(component.delete, 'emit').and.callThrough();
    component.deleteResponse(new Event(''));

    expect(component.delete.emit).toHaveBeenCalled();
  });
});
