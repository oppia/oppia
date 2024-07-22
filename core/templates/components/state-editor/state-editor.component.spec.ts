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
 * @fileoverview Unit test for State Editor Component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';
import {Solution} from 'domain/exploration/SolutionObjectFactory';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {State} from 'domain/state/StateObjectFactory';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {StateEditorService} from './state-editor-properties-services/state-editor.service';
import {StateInteractionIdService} from './state-editor-properties-services/state-interaction-id.service';
import {StateEditorComponent} from './state-editor.component';

describe('State Editor Component', () => {
  let component: StateEditorComponent;
  let fixture: ComponentFixture<StateEditorComponent>;
  let windowDimensionsService: WindowDimensionsService;
  let stateEditorService: StateEditorService;
  let stateInteractionIdService: StateInteractionIdService;
  let explorationHtmlFormatterService: ExplorationHtmlFormatterService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StateEditorComponent],
      providers: [
        WindowDimensionsService,
        StateEditorService,
        StateInteractionIdService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateEditorComponent);
    component = fixture.componentInstance;

    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    stateEditorService = TestBed.inject(StateEditorService);
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);
    explorationHtmlFormatterService = TestBed.inject(
      ExplorationHtmlFormatterService
    );

    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      'Introduction'
    );
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should emit values properly', () => {
    spyOn(component.recomputeGraph, 'emit').and.stub();
    spyOn(component.onSaveLinkedSkillId, 'emit').and.stub();
    spyOn(component.onSaveSolicitAnswerDetails, 'emit').and.stub();
    spyOn(component.onSaveHints, 'emit').and.stub();
    spyOn(component.refreshWarnings, 'emit').and.stub();
    spyOn(component.onSaveInteractionDefaultOutcome, 'emit').and.stub();
    spyOn(component.onSaveInteractionAnswerGroups, 'emit').and.stub();
    spyOn(component.onSaveInapplicableSkillMisconceptionIds, 'emit').and.stub();
    spyOn(component.navigateToState, 'emit').and.stub();
    spyOn(component.onSaveSolution, 'emit').and.stub();
    spyOn(component.onSaveNextContentIdIndex, 'emit').and.stub();
    spyOn(component.onSaveInteractionData, 'emit').and.stub();
    spyOn(component.onSaveStateContent, 'emit').and.stub();

    component.sendRecomputeGraph();
    component.sendOnSaveLinkedSkillId('');
    component.sendOnSaveSolicitAnswerDetails(false);
    component.sendOnSaveHints([]);
    component.sendRefreshWarnings();
    component.sendOnSaveInteractionDefaultOutcome(
      new Outcome(
        'Hola',
        null,
        new SubtitledHtml('<p> Previous HTML string </p>', 'Id'),
        true,
        [],
        null,
        null
      )
    );
    component.sendOnSaveInteractionAnswerGroups([]);
    component.sendOnSaveInapplicableSkillMisconceptionIds([]);
    component.sendNavigateToState('');
    component.sendOnSaveSolution(
      new Solution(
        explorationHtmlFormatterService,
        true,
        [],
        new SubtitledHtml('<p> Previous HTML string </p>', 'Id')
      )
    );
    component.sendOnSaveNextContentIdIndex(0);
    let interactionData = {
      interactionId: null,
      customizationArgs: {},
    };
    component.sendOnSaveInteractionData(interactionData);
    component.sendOnSaveStateContent(
      new SubtitledHtml('<p> Previous HTML string </p>', 'Id')
    );

    expect(component.recomputeGraph.emit).toHaveBeenCalled();
    expect(component.onSaveLinkedSkillId.emit).toHaveBeenCalled();
    expect(component.onSaveSolicitAnswerDetails.emit).toHaveBeenCalled();
    expect(component.onSaveHints.emit).toHaveBeenCalled();
    expect(component.refreshWarnings.emit).toHaveBeenCalled();
    expect(component.onSaveInteractionDefaultOutcome.emit).toHaveBeenCalled();
    expect(component.onSaveInteractionAnswerGroups.emit).toHaveBeenCalled();
    expect(
      component.onSaveInapplicableSkillMisconceptionIds.emit
    ).toHaveBeenCalled();
    expect(component.navigateToState.emit).toHaveBeenCalled();
    expect(component.onSaveSolution.emit).toHaveBeenCalled();
    expect(component.onSaveNextContentIdIndex.emit).toHaveBeenCalled();
    expect(component.onSaveInteractionData.emit).toHaveBeenCalled();
    expect(component.onSaveStateContent.emit).toHaveBeenCalled();
  });

  it('should set component properties initialization', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);

    expect(component.oppiaBlackImgUrl).toBeUndefined();
    expect(component.currentStateIsTerminal).toBeFalse();
    expect(component.conceptCardIsShown).toBeTrue();
    expect(component.windowIsNarrow).toBeFalse();
    expect(component.interactionIdIsSet).toBeFalse();
    expect(component.stateName).toBe(undefined);

    component.ngOnInit();

    expect(component.oppiaBlackImgUrl).toBe(
      '/assets/copyrighted-images/avatar/oppia_avatar_100px.svg'
    );
    expect(component.currentStateIsTerminal).toBe(false);
    expect(component.conceptCardIsShown).toBe(true);
    expect(component.windowIsNarrow).toBe(false);
    expect(component.interactionIdIsSet).toBe(false);
    expect(component.stateName).toBe('Introduction');
  });

  it('should update interaction visibility when interaction is changed', () => {
    let onInteractionIdChangedEmitter = new EventEmitter();
    spyOnProperty(
      stateInteractionIdService,
      'onInteractionIdChanged'
    ).and.returnValue(onInteractionIdChangedEmitter);

    expect(component.interactionIdIsSet).toBeFalse();
    expect(component.currentInteractionCanHaveSolution).toBeFalse();
    expect(component.currentStateIsTerminal).toBeFalse();

    component.ngOnInit();

    onInteractionIdChangedEmitter.emit('TextInput');

    expect(component.interactionIdIsSet).toBe(true);
    expect(component.currentInteractionCanHaveSolution).toBe(true);
    expect(component.currentStateIsTerminal).toBe(false);
  });

  it('should toggle concept card', () => {
    expect(component.conceptCardIsShown).toBe(true);

    component.toggleConceptCard();

    expect(component.conceptCardIsShown).toBe(false);

    component.toggleConceptCard();

    expect(component.conceptCardIsShown).toBe(true);
  });

  it('should initialize services when component is reinitialized', () => {
    let onStateEditorInitializedEmitter = new EventEmitter();
    let stateData = {
      content: {},
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      interaction: {
        id: null,
        answer_groups: [],
        default_outcome: {
          dest: 'default',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
        },
        hints: [],
      },
      param_changes: [],
      solicit_answer_details: false,
    };
    spyOnProperty(
      stateEditorService,
      'onStateEditorInitialized'
    ).and.returnValue(onStateEditorInitializedEmitter);

    component.ngOnInit();

    expect(component.servicesInitialized).toBe(false);

    onStateEditorInitializedEmitter.emit(stateData);

    expect(component.servicesInitialized).toBe(true);
  });

  it(
    'should throw error if state data is not defined and' +
      ' component is reinitialized',
    fakeAsync(() => {
      let onStateEditorInitializedEmitter = new EventEmitter<State>();
      let stateData: State | null = null;
      spyOnProperty(
        stateEditorService,
        'onStateEditorInitialized'
      ).and.returnValue(onStateEditorInitializedEmitter);

      component.ngOnInit();

      expect(() => {
        onStateEditorInitializedEmitter.emit(stateData as State);
        tick();
      }).toThrowError('Expected stateData to be defined but received null');
    })
  );

  it('should reinitialize editor when responses change', () => {
    spyOn(stateEditorService.onStateEditorInitialized, 'emit').and.stub();

    component.reinitializeEditor();

    expect(stateEditorService.onStateEditorInitialized.emit).toHaveBeenCalled();
  });
});
