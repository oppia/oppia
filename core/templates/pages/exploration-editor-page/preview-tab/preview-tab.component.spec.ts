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
 * @fileoverview Unit tests for previewTab.
 */

import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { ParamChangeObjectFactory } from 'domain/exploration/ParamChangeObjectFactory';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { EditableExplorationBackendApiService } from 'domain/exploration/editable-exploration-backend-api.service';
import { ExplorationEngineService } from 'pages/exploration-player-page/services/exploration-engine.service';
import { ExplorationPlayerStateService } from 'pages/exploration-player-page/services/exploration-player-state.service';
import { LearnerParamsService } from 'pages/exploration-player-page/services/learner-params.service';
import { ContextService } from 'services/context.service';
import { ExplorationFeaturesService } from 'services/exploration-features.service';
import { ExplorationInitStateNameService } from '../services/exploration-init-state-name.service';
import { ExplorationParamChangesService } from '../services/exploration-param-changes.service';
import { ExplorationStatesService } from '../services/exploration-states.service';
import { GraphDataService } from '../services/graph-data.service';
import { ParameterMetadataService } from '../services/parameter-metadata.service';
import { RouterService } from '../services/router.service';
import { PreviewTabComponent } from './preview-tab.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ExplorationDataService } from '../services/exploration-data.service';
import { ExplorationBackendDict } from 'domain/exploration/ExplorationObjectFactory';
import { ParamChangesObjectFactory } from 'domain/exploration/ParamChangesObjectFactory';
import { NumberAttemptsService } from 'pages/exploration-player-page/services/number-attempts.service';


class MockNgbModalRef {
  componentInstance: {
    manualParamChanges: null;
  };
}

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve()
    };
  }
}

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Preview Tab Component', () => {
  let component: PreviewTabComponent;
  let fixture: ComponentFixture<PreviewTabComponent>;
  let ngbModal: NgbModal;
  let contextService: ContextService;
  let editableExplorationBackendApiService:
    EditableExplorationBackendApiService;
  let explorationEngineService: ExplorationEngineService;
  let explorationInitStateNameService: ExplorationInitStateNameService;
  let explorationFeaturesService: ExplorationFeaturesService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let explorationParamChangesService: ExplorationParamChangesService;
  let explorationStatesService: ExplorationStatesService;
  let graphDataService: GraphDataService;
  let learnerParamsService: LearnerParamsService;
  let routerService: RouterService;
  let stateEditorService: StateEditorService;
  let stateObjectFactory: StateObjectFactory;
  let paramChangeObjectFactory: ParamChangeObjectFactory;
  let parameterMetadataService: ParameterMetadataService;
  let mockUpdateActiveStateIfInEditorEventEmitter = new EventEmitter();
  let mockPlayerStateChangeEventEmitter = new EventEmitter();
  let paramChangesObjectFactory: ParamChangesObjectFactory;
  let numberAttemptsService: NumberAttemptsService;

  let explorationId = 'exp1';
  let stateName = 'State1';
  let changeObjectName = 'change';
  let exploration = {
    init_state_name: stateName,
    param_changes: [],
    param_specs: {},
    states: {},
    title: 'Exploration Title',
    language_code: 'en',
    correctness_feedback_enabled: true
  };
  let parameters = [{
    paramName: 'paramName1',
    stateName: null,
  }, {
    paramName: 'paramName2',
    stateName: null,
  }];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        PreviewTabComponent
      ],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: ExplorationDataService,
          useValue: {
            getDataAsync: () => Promise.resolve({
              param_changes: [
                paramChangeObjectFactory
                  .createEmpty(changeObjectName).toBackendDict()
              ],
              states: [stateObjectFactory.createDefaultState(stateName)],
              init_state_name: stateName
            })
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewTabComponent);
    component = fixture.componentInstance;
    numberAttemptsService = TestBed.inject(NumberAttemptsService);
    paramChangeObjectFactory = TestBed.inject(ParamChangeObjectFactory);
    stateObjectFactory = TestBed.inject(StateObjectFactory);
    explorationEngineService = TestBed.inject(ExplorationEngineService);
    editableExplorationBackendApiService = TestBed.inject(
      EditableExplorationBackendApiService);
    explorationFeaturesService = TestBed.inject(ExplorationFeaturesService);
    explorationInitStateNameService = TestBed.inject(
      ExplorationInitStateNameService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService);
    explorationParamChangesService = TestBed.inject(
      ExplorationParamChangesService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    graphDataService = TestBed.inject(GraphDataService);
    learnerParamsService = TestBed.inject(LearnerParamsService);
    parameterMetadataService = TestBed.inject(ParameterMetadataService);
    routerService = TestBed.inject(RouterService);
    stateEditorService = TestBed.inject(StateEditorService);
    paramChangesObjectFactory = TestBed.inject(ParamChangesObjectFactory);

    ngbModal = TestBed.inject(NgbModal);
    contextService = TestBed.inject(ContextService);
    spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
    spyOn(parameterMetadataService, 'getUnsetParametersInfo').and.returnValue(
      parameters);
    spyOn(
      editableExplorationBackendApiService, 'fetchApplyDraftExplorationAsync')
      .and.returnValue(Promise.resolve(
        exploration as ExplorationBackendDict));
    explorationParamChangesService.savedMemento = [
      paramChangeObjectFactory.createEmpty(changeObjectName).toBackendDict()
    ];
    spyOnProperty(
      explorationEngineService,
      'onUpdateActiveStateIfInEditor').and.returnValue(
      mockUpdateActiveStateIfInEditorEventEmitter);
    spyOnProperty(
      explorationPlayerStateService,
      'onPlayerStateChange').and.returnValue(
      mockPlayerStateChangeEventEmitter);
    spyOn(explorationEngineService, 'initSettingsFromEditor').and.stub();

    explorationInitStateNameService.savedMemento = 'state';
    explorationParamChangesService.savedMemento = null;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize controller properties after its initialization',
    fakeAsync(() => {
      spyOn(stateEditorService, 'getActiveStateName').and.returnValue('state');
      spyOn(explorationParamChangesService, 'init').and.stub();
      spyOn(explorationStatesService, 'init').and.stub();
      spyOn(explorationInitStateNameService, 'init').and.stub();
      spyOn(graphDataService, 'recompute').and.stub();
      spyOn(explorationStatesService, 'getState').and.returnValue(null);
      spyOn(component, 'getManualParamChanges').and.returnValue(
        Promise.resolve(null));
      spyOn(component, 'loadPreviewState').and.stub();
      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: new MockNgbModalRef(),
        result: Promise.resolve()
      } as NgbModalRef);

      component.ngOnInit();
      tick();
      flush();

      // Get data from exploration data service.
      expect(component.isExplorationPopulated).toBe(false);
      expect(component.previewWarning).toBe('');
    }));

  it('should initialize controller properties after its initialization',
    fakeAsync(() => {
      explorationInitStateNameService.savedMemento = 'state2';
      explorationParamChangesService.savedMemento = null;
      spyOn(stateEditorService, 'getActiveStateName').and.returnValue('state');
      spyOn(explorationParamChangesService, 'init').and.stub();
      spyOn(explorationStatesService, 'init').and.stub();
      spyOn(explorationInitStateNameService, 'init').and.stub();
      spyOn(graphDataService, 'recompute').and.stub();
      spyOn(explorationStatesService, 'getState').and.returnValue(null);
      spyOn(component, 'getManualParamChanges').and.returnValue(
        Promise.resolve(null));
      spyOn(component, 'loadPreviewState').and.stub();
      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: new MockNgbModalRef(),
        result: Promise.resolve()
      } as NgbModalRef);

      component.ngOnInit();
      tick();
      mockUpdateActiveStateIfInEditorEventEmitter.emit('stateName');
      mockPlayerStateChangeEventEmitter.emit();
      tick();
      flush();

      // Get data from exploration data service.
      expect(component.isExplorationPopulated).toBe(false);
      expect(component.previewWarning).toBe(
        'Preview started from "state"');
    }));

  fit('should reset preview settings', fakeAsync(() => {
    spyOn(numberAttemptsService, 'reset').and.stub();
    spyOn(explorationEngineService, 'init').and.callFake(
      (value, value1, value2, value3, value4, callback) => {
        callback(null, null);
      });
    explorationInitStateNameService.savedMemento = 'null';
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject()
    } as NgbModalRef);

    // Get data from exploration data service and resolve promise in open
    // modal.
    component.resetPreview();
    tick();
    tick(300);
    flush();

    expect(
      explorationEngineService.initSettingsFromEditor)
      .toHaveBeenCalledWith(null, null);
    expect(component.isExplorationPopulated).toBe(true);
  }));
});


// describe('when there are manual param changes', () => {
//   beforeEach(() => {

//   });

//   afterEach(() => {
//     component.ngOnDestroy();
//   });

//   it('should initialize controller properties after its initialization',
//     () => {
//       spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
//         stateName);

//       // Get data from exploration data service.

//       expect(component.isExplorationPopulated).toBe(false);
//       expect(component.previewWarning)
//         .toBe('Preview started from \"State1\"');
//     });

//   it('should init param changes if they are undefined', () => {
//     spyOn(explorationParamChangesService, 'init').and.callThrough();
//     spyOn(explorationStatesService, 'init');
//     spyOn(explorationInitStateNameService, 'init').and.callThrough();
//     spyOn(graphDataService, 'recompute');
//     spyOn(stateEditorService, 'getActiveStateName').and.returnValue(null);
//     spyOn(stateEditorService, 'setActiveStateName');
//     explorationParamChangesService.savedMemento = undefined;

//     // Get data from exploration data service.

//     expect(explorationParamChangesService.init).toHaveBeenCalledWith(
//       [paramChangeObjectFactory.createEmpty(changeObjectName)]
//     );
//     expect(explorationStatesService.init).toHaveBeenCalledWith(
//       [stateObjectFactory.createDefaultState(stateName)]
//     );
//     expect(explorationInitStateNameService.init).toHaveBeenCalledWith(
//       stateName
//     );
//     expect(graphDataService.recompute).toHaveBeenCalled();
//     expect(stateEditorService.setActiveStateName).toHaveBeenCalledWith(
//       stateName
//     );
//     expect(explorationParamChangesService.savedMemento).toEqual(
//       [paramChangeObjectFactory.createEmpty(changeObjectName)]
//     );
//     expect(explorationInitStateNameService.savedMemento).toEqual(stateName);
//   });

//   it('should set active state name when broadcasting' +
//     ' updateActiveStateIfInEditor', () => {
//     spyOn(stateEditorService, 'setActiveStateName');
//     spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
//       stateName);
//     mockUpdateActiveStateIfInEditorEventEmitter.emit('State2');

//     expect(stateEditorService.setActiveStateName).toHaveBeenCalledWith(
//       'State2');
//   });

//   it('should get all learner params when broadcasting playerStateChange',
//     () => {
//       spyOn(learnerParamsService, 'getAllParams').and.returnValue({
//         foo: []
//       });
//       mockPlayerStateChangeEventEmitter.emit();

//       expect(component.allParams).toEqual({
//         foo: []
//       });
//     });

//   it('should evaluate whenever parameter summary is shown', () => {
//     spyOn(explorationFeaturesService, 'areParametersEnabled')
//       .and.returnValue(true);
//     expect(component.showParameterSummary()).toBe(false);

//     spyOn(learnerParamsService, 'getAllParams').and.returnValue({
//       foo: []
//     });
//     mockPlayerStateChangeEventEmitter.emit();
//     expect(component.showParameterSummary()).toBe(true);
//   });

//   it('should open set params modal when opening preview tab',
//     fakeAsync(() => {
//       spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
//         stateName);
//       spyOn(ngbModal, 'open').and.returnValue(
//         {
//           componentInstance: new MockNgbModalRef(),
//           result: Promise.resolve()
//         } as NgbModalRef
//       );

//       // Get data from exploration data service.
//       tick();

//       expect(ngbModal.open).toHaveBeenCalled();
//     }));

//   it('should load preview state when closing set params modal',
//     fakeAsync(() => {
//       spyOn(ngbModal, 'open').and.returnValue(
//         {
//           componentInstance: NgbModalRef,
//           result: Promise.resolve()
//         } as NgbModalRef
//       );
//       spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
//         stateName);
//       // Get data from exploration data service and resolve promise in open
//       // modal.
//       tick();
//       tick();

//       expect(
//         explorationEngineService.initSettingsFromEditor).toHaveBeenCalled();
//       expect(component.isExplorationPopulated).toBeTrue();
//     }));

//   it('should go to main tab when dismissing set params modal',
//     fakeAsync(() => {
//       spyOn(ngbModal, 'open').and.callFake(() =>(
//         {
//           componentInstance: {},
//           result: Promise.reject()
//         } as NgbModalRef
//       ));
//       spyOn(routerService, 'navigateToMainTab');
//       spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
//         stateName);

//       // Get data from exploration data service and resolve promise in open
//       // modal.
//       tick();
//       tick();

//       expect(routerService.navigateToMainTab).toHaveBeenCalled();
//     }));
// });

// describe('when there are no manual param changes', () => {
//   beforeEach(() => {
//     ngbModal = TestBed.inject(NgbModal);
//     contextService = TestBed.inject(ContextService);
//     spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
//     editableExplorationBackendApiService = TestBed.inject(
//       EditableExplorationBackendApiService);
//     explorationInitStateNameService = TestBed.inject(
//       ExplorationInitStateNameService);
//     explorationEngineService = TestBed.inject(ExplorationEngineService);
//     explorationParamChangesService = TestBed.inject(
//       ExplorationParamChangesService);
//     numberAttemptsService = TestBed.inject(NumberAttemptsService);
//     parameterMetadataService = TestBed.inject(ParameterMetadataService);
//     routerService = TestBed.inject(RouterService);
//     stateEditorService = TestBed.inject(StateEditorService);

//     explorationInitStateNameService.init(stateName);

//     spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
//       stateName);
//     spyOn(parameterMetadataService, 'getUnsetParametersInfo')
//       .and.returnValue([]);
//     spyOn(
//       editableExplorationBackendApiService, 'fetchApplyDraftExplorationAsync')
//       .and.returnValue(Promise.resolve(
//         exploration as ExplorationBackendDict));
//     explorationParamChangesService.savedMemento = [
//       paramChangeObjectFactory.createEmpty(changeObjectName).toBackendDict()
//     ];
//     // Mock init just to call the callback directly.
//     spyOn(explorationEngineService, 'init').and.callFake(function(
//         explorationDict, explorationVersion, preferredAudioLanguage,
//         autoTtsEnabled, preferredContentLanguageCodes,
//         successCallback) {
//       successCallback(null, null);
//     });

//     component.ngOnInit();
//   });

//   it('should initialize controller properties after its initialization',
//     fakeAsync(() => {
//       component.ngOnInit();
//       tick();

//       // Get data from exploration data service.
//       expect(component.isExplorationPopulated).toBe(false);
//       expect(component.previewWarning).toBe('');
//     }));

//   it('should load preview state when closing set params modal', fakeAsync(
//     () => {
//       spyOn(ngbModal, 'open');

//       // Get data from exploration data service and resolve promise in open
//       // modal.
//       tick();

//       expect(ngbModal.open).not.toHaveBeenCalled();
//       expect(
//         explorationEngineService.initSettingsFromEditor)
//         .toHaveBeenCalledWith(stateName, []);
//       expect(component.isExplorationPopulated).toBe(true);
//     }));

//   it('should reset preview settings', fakeAsync(() => {
//     spyOn(ngbModal, 'open').and.returnValue({
//       result: Promise.reject()
//     } as NgbModalRef);
//     spyOn(numberAttemptsService, 'reset').and.callThrough();

//     // Get data from exploration data service and resolve promise in open
//     // modal.
//     tick();

//     component.resetPreview();

//     flush();

//     expect(numberAttemptsService.reset).toHaveBeenCalled();
//     expect(
//       explorationEngineService.initSettingsFromEditor)
//       .toHaveBeenCalledWith(stateName, []);
//     expect(component.isExplorationPopulated).toBe(true);
//   }));
// });