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

import { ComponentFixture, fakeAsync, flush, flushMicrotasks, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { ParamChangeObjectFactory } from 'domain/exploration/ParamChangeObjectFactory';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { EditableExplorationBackendApiService } from 'domain/exploration/editable-exploration-backend-api.service';
import { ExplorationEngineService } from 'pages/exploration-player-page/services/exploration-engine.service';
import { ExplorationPlayerStateService } from 'pages/exploration-player-page/services/exploration-player-state.service';
import { ContextService } from 'services/context.service';
import { ExplorationFeaturesService } from 'services/exploration-features.service';
import { ExplorationInitStateNameService } from '../services/exploration-init-state-name.service';
import { ExplorationParamChangesService } from '../services/exploration-param-changes.service';
import { ExplorationStatesService } from '../services/exploration-states.service';
import { GraphDataService } from '../services/graph-data.service';
import { ParameterMetadataService } from '../services/parameter-metadata.service';
import { PreviewTabComponent } from './preview-tab.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ExplorationDataService } from '../services/exploration-data.service';
import { ExplorationBackendDict } from 'domain/exploration/ExplorationObjectFactory';
import { NumberAttemptsService } from 'pages/exploration-player-page/services/number-attempts.service';
import { RouterService } from '../services/router.service';


class MockNgbModalRef {
  componentInstance: {
    manualParamChanges: null;
  };
}

class MockNgbModal {
  open(): object {
    return {
      result: Promise.resolve()
    };
  }
}

describe('Preview Tab Component', () => {
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
  let routerService: RouterService;
  let stateEditorService: StateEditorService;
  let stateObjectFactory: StateObjectFactory;
  let paramChangeObjectFactory: ParamChangeObjectFactory;
  let parameterMetadataService: ParameterMetadataService;
  let mockUpdateActiveStateIfInEditorEventEmitter = new EventEmitter();
  let mockPlayerStateChangeEventEmitter = new EventEmitter();
  let numberAttemptsService: NumberAttemptsService;

  let getUnsetParametersInfo;
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
              states: [stateObjectFactory.createDefaultState(
                stateName, 'content_0', 'default_outcome_1')],
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
    routerService = TestBed.inject(RouterService);
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
    parameterMetadataService = TestBed.inject(ParameterMetadataService);
    stateEditorService = TestBed.inject(StateEditorService);

    ngbModal = TestBed.inject(NgbModal);
    contextService = TestBed.inject(ContextService);
    spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
    getUnsetParametersInfo = spyOn(
      parameterMetadataService, 'getUnsetParametersInfo');
    getUnsetParametersInfo.and.returnValue(
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

      component.ngOnDestroy();
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

  it('should initialize open ngbModal and navigate to mainTab',
    fakeAsync(() => {
      spyOn(explorationFeaturesService, 'areParametersEnabled')
        .and.returnValue(false);
      spyOn(routerService, 'navigateToMainTab');
      component.allParams = {};

      expect(component.showParameterSummary()).toBe(false);

      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {
          manualParamChanges: null,
        },
        result: Promise.reject()
      } as NgbModalRef);

      component.loadPreviewState('', '');
      component.showSetParamsModal(null, () => {});
      tick();
      tick();
      flush();
      flushMicrotasks();

      expect(ngbModal.open).toHaveBeenCalled();
      expect(routerService.navigateToMainTab).toHaveBeenCalled();
    }));

  it('should getManualParamChanges', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        manualParamChanges: null,
      },
      result: Promise.resolve()
    } as NgbModalRef);
    component.getManualParamChanges('state');
    tick();
    flush();

    expect(ngbModal.open).toHaveBeenCalled();
  }));

  it('should exmpty getManualParamChanges', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        manualParamChanges: null,
      },
      result: Promise.resolve()
    } as NgbModalRef);
    getUnsetParametersInfo.and.returnValue([]);

    component.getManualParamChanges('state').then((value) => {
      expect(value).toEqual([]);
    });

    expect(ngbModal.open).not.toHaveBeenCalled();
  });

  it('should reset preview settings', fakeAsync(() => {
    spyOn(component, 'loadPreviewState');
    explorationInitStateNameService.savedMemento = 'state';
    spyOn(numberAttemptsService, 'reset').and.stub();
    spyOn(explorationEngineService, 'init').and.callFake(
      (value, value1, value2, value3, value4, callback) => {});

    // Get data from exploration data service and resolve promise in open
    // modal.
    component.resetPreview();
    tick(300);
    flush();

    expect(component.loadPreviewState).toHaveBeenCalled();
  }));
});
