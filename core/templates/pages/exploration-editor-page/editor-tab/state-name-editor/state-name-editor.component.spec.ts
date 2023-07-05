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
 * @fileoverview Unit tests for the component of the 'State Editor'.
 */

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed, fakeAsync, tick, ComponentFixture, flush } from '@angular/core/testing';
import { EditabilityService } from 'services/editability.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateNameService } from 'components/state-editor/state-editor-properties-services/state-name.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ExplorationDataService } from 'pages/exploration-editor-page/services/exploration-data.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { RouterService } from 'pages/exploration-editor-page/services/router.service';
import { ExternalSaveService } from 'services/external-save.service';
import { StateNameEditorComponent } from './state-name-editor.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

class MockExplorationDataService {
  explorationId!: 0;
  autosaveChangeListAsync() {
    return;
  }

  discardDraftAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
}

describe('State Name Editor component', () => {
  let component: StateNameEditorComponent;
  let fixture: ComponentFixture<StateNameEditorComponent>;
  let explorationStatesService: ExplorationStatesService;
  let routerService: RouterService;
  let stateEditorService: StateEditorService;
  let stateNameService: StateNameService;
  let mockExternalSaveEventEmitter: EventEmitter<void>;
  let explorationDataService: MockExplorationDataService;
  let autosaveChangeListSpy: jasmine.Spy;

  class MockNgbModal {
    open() {
      return {
        result: Promise.resolve()
      };
    }
  }
  mockExternalSaveEventEmitter = new EventEmitter();
  class MockExternalSaveService {
    onExternalSave = mockExternalSaveEventEmitter;
  }

  beforeEach(() => {
    explorationDataService = new MockExplorationDataService();

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        ReactiveFormsModule
      ],
      declarations: [
        StateNameEditorComponent
      ],
      providers: [
        EditabilityService,
        ExplorationStatesService,
        RouterService,
        StateEditorService,
        StateNameService,
        {
          provide: ExplorationDataService,
          useValue: explorationDataService
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: ExternalSaveService,
          useClass: MockExternalSaveService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });


  beforeEach(() => {
    fixture = TestBed.createComponent(StateNameEditorComponent);
    component = fixture.componentInstance;
    stateEditorService = TestBed.inject(StateEditorService);
    stateNameService = TestBed.inject(StateNameService);

    explorationStatesService = TestBed.inject(ExplorationStatesService);
    routerService = TestBed.inject(RouterService);

    spyOn(stateNameService, 'isStateNameEditorShown').and.returnValue(true);
    autosaveChangeListSpy = spyOn(
      explorationDataService, 'autosaveChangeListAsync');

    explorationStatesService.init({
      'First State': {
        classifier_model_id: null,
        card_is_checkpoint: false,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: 'First State Content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {}
          }
        },
        interaction: {
          confirmed_unclassified_answers: [],
          customization_args: {},
          solution: null,
          id: null,
          answer_groups: [],
          default_outcome: {
            dest: 'Second State',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            labelled_as_correct: true,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
            param_changes: []
          },
          hints: []
        },
        param_changes: [],
        solicit_answer_details: false
      },
      'Second State': {
        classifier_model_id: null,
        card_is_checkpoint: false,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: 'Second State Content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {}
          }
        },
        interaction: {
          confirmed_unclassified_answers: [],
          customization_args: {},
          solution: null,
          id: null,
          answer_groups: [],
          default_outcome: {
            dest: 'Second State',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            labelled_as_correct: true,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
            param_changes: []
          },
          hints: []
        },
        param_changes: [],
        solicit_answer_details: false,
      },
      'Third State': {
        classifier_model_id: null,
        card_is_checkpoint: false,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: 'This is some content.'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {}
          }
        },
        interaction: {
          confirmed_unclassified_answers: [],
          customization_args: {},
          solution: null,
          id: null,
          answer_groups: [],
          default_outcome: {
            dest: 'Second State',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            labelled_as_correct: true,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
            param_changes: []
          },
          hints: []
        },
        param_changes: [{
          name: 'comparison',
          generator_id: 'Copier',
          customization_args: {
            value: 'something clever',
            parse_with_jinja: false
          }
        }],
        solicit_answer_details: false,
      }
    }, false);
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
    // This will destroy the fixture once the test gone end
    // this is going to makesure that each testcase is going
    // to run independent of another test case.
    fixture.destroy();
  });

  it('should not save state name when it is longer than 50 characters',
    () => {
      expect(component.saveStateName(
        'babababababababababababababababababababababababababab')).toBe(false);
    });

  it('should not save state names when it contains invalid characteres',
    () => {
      stateEditorService.setActiveStateName('Third State');
      component.initStateNameEditor();
      expect(component.saveStateName('#')).toBe(false);
    });

  it('should not save duplicate state names when trying to save a state' +
    ' that already exists', () => {
    expect(component.saveStateName('Second State')).toBe(false);
  });

  it('should save state name and refresh to main tab when submitting' +
    ' state name form', () => {
    spyOn(routerService, 'navigateToMainTab');
    stateEditorService.setActiveStateName('First State');
    component.initStateNameEditor();

    component.saveStateNameAndRefresh('Fourth State');
    expect(routerService.navigateToMainTab).toHaveBeenCalled();
  });

  it('should save state names independently when editting more than one state',
    fakeAsync(() => {
      stateEditorService.setActiveStateName('Third State');
      component.saveStateName('Fourth State');
      tick(200);
      expect(explorationStatesService.getState('Fourth State')).toBeTruthy();
      expect(explorationStatesService.getState('Third State')).toBeFalsy();

      stateEditorService.setActiveStateName('First State');
      component.saveStateName('Fifth State');
      tick(200);
      expect(explorationStatesService.getState('Fifth State')).toBeTruthy();
      expect(explorationStatesService.getState('First State')).toBeFalsy();
      expect(autosaveChangeListSpy).toHaveBeenCalled();

      flush();
    }));

  it('should not re-save state names when it did not changed', () => {
    stateEditorService.setActiveStateName('Second State');
    component.initStateNameEditor();
    component.openStateNameEditor();
    expect(component.saveStateName('Second State')).toBe(false);
  });

  it('should not change state name when state name edits fail', () => {
    stateEditorService.setActiveStateName('Third State');
    component.initStateNameEditor();
    component.openStateNameEditor();

    // This is not a valid state name.
    component.saveStateName('#!% State');
    expect(stateEditorService.getActiveStateName()).toEqual('Third State');
    expect(autosaveChangeListSpy).not.toHaveBeenCalled();

    // Long state names will not save.
    component.saveStateName(
      'This state name is too long to be saved. Try to be brief next time.'
    );
    expect(stateEditorService.getActiveStateName()).toEqual('Third State');
    expect(autosaveChangeListSpy).not.toHaveBeenCalled();

    // This will not save because it is an already existing state name.
    component.saveStateName('First State');
    expect(stateEditorService.getActiveStateName()).toEqual('Third State');
    expect(autosaveChangeListSpy).not.toHaveBeenCalled();

    // Will not save because the memento is the same as the new state name.
    component.saveStateName('Third State');
    expect(stateEditorService.getActiveStateName()).toEqual('Third State');
    expect(autosaveChangeListSpy).not.toHaveBeenCalled();
  });

  it('should save state name when ExternalSave event occurs', () => {
    spyOn(component, 'saveStateName');
    component.tmpStateName = 'SampleState';
    mockExternalSaveEventEmitter.emit();
    expect(component.saveStateName).toHaveBeenCalledWith('SampleState');
  });

  it('should throw error if state name is null', fakeAsync(() => {
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(null);
    expect(() => {
      component.openStateNameEditor();
      tick();
    }).toThrowError();
  }));
});
