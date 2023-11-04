// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for outcome if stuck destination editor component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NodeDataDict, StateGraphLayoutService } from 'components/graph-services/graph-layout.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { EditorFirstTimeEventsService } from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { UserService } from 'services/user.service';
import { OutcomeIfStuckDestinationEditorComponent } from './outcome-if-stuck-destination-editor.component';
import { MockTranslatePipe } from 'tests/unit-test-utils';

describe('Outcome Destination If Stuck Editor', () => {
  let component: OutcomeIfStuckDestinationEditorComponent;
  let fixture: ComponentFixture<OutcomeIfStuckDestinationEditorComponent>;

  let stateEditorService: StateEditorService;
  let editorFirstTimeEventsService: EditorFirstTimeEventsService;
  let stateGraphLayoutService: StateGraphLayoutService;
  let focusManagerService: FocusManagerService;
  let PLACEHOLDER_OUTCOME_DEST_IF_STUCK = '/';
  let DEFAULT_LAYOUT: NodeDataDict;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      declarations: [
        OutcomeIfStuckDestinationEditorComponent,
        MockTranslatePipe,
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
    fixture = TestBed.createComponent(OutcomeIfStuckDestinationEditorComponent);
    component = fixture.componentInstance;
    editorFirstTimeEventsService = TestBed.inject(EditorFirstTimeEventsService);
    focusManagerService = TestBed.inject(FocusManagerService);
    stateEditorService = TestBed.inject(StateEditorService);
    stateGraphLayoutService = TestBed.inject(StateGraphLayoutService);
    DEFAULT_LAYOUT = stateGraphLayoutService.computeLayout(
      {
        Introduction: 'Introduction',
        State1: 'State1',
        End: 'End'
      }, [
        {
          source: 'Introduction',
          target: 'State1',
          linkProperty: '',
          connectsDestIfStuck: false
        },
        {
          source: 'State1',
          target: 'End',
          linkProperty: '',
          connectsDestIfStuck: false
        }
      ], 'Introduction', ['End']);
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set component properties on initialization', fakeAsync(() => {
    let computedLayout = DEFAULT_LAYOUT;
    spyOn(stateEditorService, 'getStateNames')
      .and.returnValue(['Introduction', 'State1', 'NewState', 'End']);
    spyOn(stateGraphLayoutService, 'getLastComputedArrangement')
      .and.returnValue(computedLayout);

    component.ngOnInit();
    tick(10);

    expect(component.newStateNamePattern).toEqual(/^[a-zA-Z0-9.\s-]+$/);
    expect(component.destinationChoices).toEqual([{
      id: null,
      text: 'None'
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

  it('should add new state if outcome destination if stuck is a placeholder' +
    ' when outcome destination if stuck details are saved', fakeAsync(() => {
    component.outcome = new Outcome(
      'Dest',
      PLACEHOLDER_OUTCOME_DEST_IF_STUCK,
      new SubtitledHtml('<p> HTML string </p>', 'Id'),
      false,
      [],
      null,
      null,
    );
    component.outcomeNewStateName = 'End';
    let onSaveOutcomeDestIfStuckDetailsEmitter = new EventEmitter();
    spyOnProperty(stateEditorService, 'onSaveOutcomeDestIfStuckDetails')
      .and.returnValue(onSaveOutcomeDestIfStuckDetailsEmitter);
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue('Hola');
    spyOn(editorFirstTimeEventsService, 'registerFirstCreateSecondStateEvent');

    component.ngOnInit();
    tick(10);

    onSaveOutcomeDestIfStuckDetailsEmitter.emit();

    expect(component.outcome.destIfReallyStuck).toBe('End');
    expect(editorFirstTimeEventsService.registerFirstCreateSecondStateEvent)
      .toHaveBeenCalled();
  }));

  it('should update option names when state name is changed', fakeAsync(() => {
    let onStateNamesChangedEmitter = new EventEmitter();
    let computedLayout = DEFAULT_LAYOUT;
    spyOnProperty(stateEditorService, 'onStateNamesChanged')
      .and.returnValue(onStateNamesChangedEmitter);
    spyOn(stateEditorService, 'getStateNames')
      .and.returnValues(
        ['Introduction', 'State1', 'End'],
        ['Introduction', 'State2', 'End']);
    spyOn(stateGraphLayoutService, 'getLastComputedArrangement')
      .and.returnValue(computedLayout);

    component.ngOnInit();
    tick(10);

    expect(component.destinationChoices).toEqual([{
      id: null,
      text: 'None'
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
    tick(10);

    expect(component.destinationChoices).toEqual([{
      id: null,
      text: 'None'
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
      'Dest',
      PLACEHOLDER_OUTCOME_DEST_IF_STUCK,
      new SubtitledHtml('<p> HTML string </p>', 'Id'),
      false,
      [],
      null,
      null,
    );
    spyOn(focusManagerService, 'setFocus');

    component.onDestIfStuckSelectorChange();

    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'newStateNameInputField'
    );
  });

  it('should check if new state is being created', () => {
    component.outcome = new Outcome(
      'Dest',
      PLACEHOLDER_OUTCOME_DEST_IF_STUCK,
      new SubtitledHtml('<p> HTML string </p>', 'Id'),
      false,
      [],
      null,
      null,
    );

    expect(component.isCreatingNewState()).toBeTrue();

    component.outcome = new Outcome(
      'Dest',
      'Introduction',
      new SubtitledHtml('<p> HTML string </p>', 'Id'),
      false,
      [],
      null,
      null,
    );

    expect(component.isCreatingNewState()).toBeFalse();
  });

  it('should update outcomeNewStateName', () => {
    component.outcomeNewStateName = 'Introduction';

    expect(component.outcomeNewStateName).toBe('Introduction');
    spyOn(component, 'isCreatingNewState').and.returnValue(true);

    component.updateChanges('New State');

    expect(component.outcomeNewStateName).toBe('New State');
  });

  it('should emit changes on destination selector change', () => {
    component.outcome = new Outcome(
      'Introduction',
      null,
      new SubtitledHtml('<p> HTML string </p>', 'Id'),
      false,
      [],
      null,
      null,
    );
    spyOn(component.getChanges, 'emit');

    component.onDestIfStuckSelectorChange();

    expect(component.getChanges.emit).toHaveBeenCalled();
  });

  it('should not show active state', fakeAsync(() => {
    let computedLayout = DEFAULT_LAYOUT;
    spyOn(stateGraphLayoutService, 'getLastComputedArrangement')
      .and.returnValue(computedLayout);
    spyOn(stateEditorService, 'getActiveStateName')
      .and.returnValue('Introduction');
    spyOn(stateEditorService, 'getStateNames')
      .and.returnValues(['Introduction', 'State1', 'End']);

    component.ngOnInit();
    tick(10);

    expect(component.destinationChoices).toEqual([{
      id: null,
      text: 'None'
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
  }));
});
