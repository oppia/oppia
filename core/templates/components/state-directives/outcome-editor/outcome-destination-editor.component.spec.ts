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
 * @fileoverview Unit tests for outcome destination editor component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { StateGraphLayoutService } from 'components/graph-services/graph-layout.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { EditorFirstTimeEventsService } from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { UserService } from 'services/user.service';
import { OutcomeDestinationEditorComponent } from './outcome-destination-editor.component';

fdescribe('Outcome Destination Editor', () => {
  let component: OutcomeDestinationEditorComponent;
  let fixture: ComponentFixture<OutcomeDestinationEditorComponent>;

  let stateEditorService: StateEditorService;
  let editorFirstTimeEventsService: EditorFirstTimeEventsService;
  let stateGraphLayoutService: StateGraphLayoutService;
  let focusManagerService: FocusManagerService;
  let userService = null;
  let PLACEHOLDER_OUTCOME_DEST;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      declarations: [
        OutcomeDestinationEditorComponent
      ],
      providers: [
        EditorFirstTimeEventsService,
        FocusManagerService,
        StateEditorService,
        StateGraphLayoutService,
        UserService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OutcomeDestinationEditorComponent);
    component = fixture.componentInstance;
    editorFirstTimeEventsService = TestBed.inject(EditorFirstTimeEventsService);
    focusManagerService = TestBed.inject(FocusManagerService);
    stateEditorService = TestBed.inject(StateEditorService);
    stateGraphLayoutService = TestBed.inject(StateGraphLayoutService);
    userService = TestBed.inject(UserService);
    PLACEHOLDER_OUTCOME_DEST = TestBed.inject(PLACEHOLDER_OUTCOME_DEST);

    spyOn(stateEditorService, 'isExplorationWhitelisted').and.returnValue(true);
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set component properties on initialization', fakeAsync(() => {
    let computedLayout = stateGraphLayoutService.computeLayout(
      {
        Introduction: 'Introduction',
        State1: 'State1',
        End: 'End'
      }, [
        {
          source: 'Introduction',
          target: 'State1'
        },
        {
          source: 'State1',
          target: 'End'
        }
      ], 'Introduction', ['End']);
    spyOn(stateEditorService, 'getStateNames')
      .and.returnValue(['Introduction', 'State1', 'NewState', 'End']);
    spyOn(stateGraphLayoutService, 'getLastComputedArrangement')
      .and.returnValue(computedLayout);

    component.ngOnInit();
    flushMicrotasks();
    tick();

    expect(component.canAddPrerequisiteSkill).toBeFalse();
    expect(component.canEditRefresherExplorationId).toBeNull();
    expect(component.newStateNamePattern).toEqual(/^[a-zA-Z0-9.\s-]+$/);
    expect(component.destChoices).toEqual([{
      id: null,
      text: '(try again)'
    }, {
      id: 'Introduction',
      text: 'Introduction'
    }, {
      id: 'State1',
      text: 'State1'
    }, {
      id: 'End',
      text: 'End'
    }, {
      id: 'NewState',
      text: 'NewState'
    }, {
      id: '/',
      text: 'A New Card Called...'
    }]);
  }));

  it('should set outcome destination as active state if it is a self loop' +
    ' when outcome destination details are saved', fakeAsync(() => {
    component.outcome = new Outcome(
      'Hola',
      new SubtitledHtml('<p> HTML string </p>', 'Id'),
      false,
      [],
      null,
      null,
    );
    let onSaveOutcomeDestDetailsEmitter = new EventEmitter();
    spyOnProperty(stateEditorService, 'onSaveOutcomeDestDetails')
      .and.returnValue(onSaveOutcomeDestDetailsEmitter);
    spyOn(stateEditorService, 'getActiveStateName').and.returnValues(
      'Hola', 'Introduction');

    component.ngOnInit();
    flushMicrotasks();
    tick();

    onSaveOutcomeDestDetailsEmitter.emit();

    expect(component.outcome.dest).toBe('Introduction');
  }));

  it('should add new state if outcome destination is a placeholder when' +
    ' outcome destination details are saved', fakeAsync(() => {
    component.outcome = new Outcome(
      PLACEHOLDER_OUTCOME_DEST,
      new SubtitledHtml('<p> HTML string </p>', 'Id'),
      false,
      [],
      null,
      null,
    );
    component.outcomeNewStateName = 'End';
    let onSaveOutcomeDestDetailsEmitter = new EventEmitter();
    spyOnProperty(stateEditorService, 'onSaveOutcomeDestDetails')
      .and.returnValue(onSaveOutcomeDestDetailsEmitter);
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue('Hola');
    spyOn(editorFirstTimeEventsService, 'registerFirstCreateSecondStateEvent');
    spyOn(component, 'addState');

    component.ngOnInit();
    flushMicrotasks();
    tick();

    onSaveOutcomeDestDetailsEmitter.emit();

    expect(component.outcome.dest).toBe('End');
    expect(editorFirstTimeEventsService.registerFirstCreateSecondStateEvent)
      .toHaveBeenCalled();
    expect(component.addState).toHaveBeenCalled();
  }));

  it('should allow admin and moderators to edit refresher' +
    ' exploration id', fakeAsync(() => {
    let userInfo = {
      isCurriculumAdmin: () => true,
      isModerator: () => false
    };
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(userInfo));

    expect(component.canEditRefresherExplorationId).toBe(undefined);

    component.ngOnInit();
    flushMicrotasks();
    tick();

    expect(component.canEditRefresherExplorationId).toBeTrue();
  }));

  it('should update option names when state name is changed', fakeAsync(() => {
    let onStateNamesChangedEmitter = new EventEmitter();
    let computedLayout = stateGraphLayoutService.computeLayout(
      {
        Introduction: 'Introduction',
        State1: 'State1',
        End: 'End'
      }, [
        {
          source: 'Introduction',
          target: 'State1'
        },
        {
          source: 'State1',
          target: 'End'
        }
      ], 'Introduction', ['End']);
    spyOnProperty(stateEditorService, 'onStateNamesChanged')
      .and.returnValue(onStateNamesChangedEmitter);
    spyOn(stateEditorService, 'getStateNames')
      .and.returnValues(
        ['Introduction', 'State1', 'End'],
        ['Introduction', 'State2', 'End']);
    spyOn(stateGraphLayoutService, 'getLastComputedArrangement')
      .and.returnValue(computedLayout);

    component.ngOnInit();
    flushMicrotasks();
    tick();

    expect(component.destChoices).toEqual([{
      id: null,
      text: '(try again)'
    }, {
      id: 'Introduction',
      text: 'Introduction'
    }, {
      id: 'State1',
      text: 'State1'
    }, {
      id: 'End',
      text: 'End'
    }, {
      id: '/',
      text: 'A New Card Called...'
    }]);

    onStateNamesChangedEmitter.emit();

    expect(component.destChoices).toEqual([{
      id: null,
      text: '(try again)'
    }, {
      id: 'Introduction',
      text: 'Introduction'
    }, {
      id: 'End',
      text: 'End'
    }, {
      id: 'State2',
      text: 'State2'
    }, {
      id: '/',
      text: 'A New Card Called...'
    }]);
  }));

  it('should set focus to new state name input field on destination' +
    ' selector change', () => {
    component.outcome = new Outcome(
      PLACEHOLDER_OUTCOME_DEST,
      new SubtitledHtml('<p> HTML string </p>', 'Id'),
      false,
      [],
      null,
      null,
    );
    spyOn(focusManagerService, 'setFocus');

    component.onDestSelectorChange();

    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'newStateNameInputField'
    );
  });

  it('should check if new state is being created', () => {
    component.outcome = new Outcome(
      PLACEHOLDER_OUTCOME_DEST,
      new SubtitledHtml('<p> HTML string </p>', 'Id'),
      false,
      [],
      null,
      null,
    );

    expect(component.isCreatingNewState()).toBeTrue();

    component.outcome = new Outcome(
      PLACEHOLDER_OUTCOME_DEST,
      new SubtitledHtml('<p> HTML string </p>', 'Id'),
      false,
      [],
      null,
      null,
    );

    expect(component.isCreatingNewState()).toBeFalse();
  });
});
