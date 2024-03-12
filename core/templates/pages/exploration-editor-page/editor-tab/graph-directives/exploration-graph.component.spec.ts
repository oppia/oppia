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
 * @fileoverview Unit tests for explorationGraph.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {NgbModule, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {ExplorationWarningsService} from 'pages/exploration-editor-page/services/exploration-warnings.service';
import {RouterService} from 'pages/exploration-editor-page/services/router.service';
import {AlertsService} from 'services/alerts.service';
import {LoggerService} from 'services/contextual/logger.service';
import {EditabilityService} from 'services/editability.service';
import {ExplorationGraphModalComponent} from '../templates/modal-templates/exploration-graph-modal.component';
import {ExplorationGraphComponent} from './exploration-graph.component';

describe('Exploration Graph Component', () => {
  let component: ExplorationGraphComponent;
  let fixture: ComponentFixture<ExplorationGraphComponent>;
  let alertsService: AlertsService;
  let editabilityService: EditabilityService;
  let explorationStatesService: ExplorationStatesService;
  let explorationWarningsService: ExplorationWarningsService;
  let loggerService: LoggerService;
  let routerService: RouterService;
  let stateEditorService: StateEditorService;
  let ngbModal: NgbModal;
  let isEditableSpy: jasmine.Spy;

  class MockNgbModal {
    open() {
      return {
        result: Promise.resolve(),
      };
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgbModule],
      declarations: [ExplorationGraphComponent, ExplorationGraphModalComponent],
      providers: [
        StateEditorService,
        RouterService,
        LoggerService,
        ExplorationWarningsService,
        ExplorationStatesService,
        EditabilityService,
        AlertsService,
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
  });

  beforeEach(() => {
    ngbModal = TestBed.inject(NgbModal);
    alertsService = TestBed.inject(AlertsService);
    editabilityService = TestBed.inject(EditabilityService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    explorationWarningsService = TestBed.inject(ExplorationWarningsService);
    loggerService = TestBed.inject(LoggerService);
    routerService = TestBed.inject(RouterService);
    stateEditorService = TestBed.inject(StateEditorService);

    isEditableSpy = spyOn(editabilityService, 'isEditable');
    isEditableSpy.and.returnValue(true);

    fixture = TestBed.createComponent(ExplorationGraphComponent);
    component = fixture.componentInstance;
  });

  it('should show graph when exploration states service is initialized', () => {
    expect(component.isGraphShown()).toBe(false);
    explorationStatesService.init({}, false);
    expect(component.isGraphShown()).toBe(true);
  });

  it('should get name from the active state', () => {
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      'Introduction'
    );
    expect(component.getActiveStateName()).toBe('Introduction');
  });

  it(
    'should get null graph data from graph data service when it is not' +
      ' recomputed',
    () => {
      expect(component.isGraphShown()).toBe(false);
      expect(component.getGraphData()).toBeUndefined();
    }
  );

  it('should evaluate if exploration graph is editable', () => {
    isEditableSpy.and.returnValue(true);

    expect(component.isEditable()).toBe(true);

    isEditableSpy.and.returnValue(false);

    expect(component.isEditable()).toBe(false);
  });

  it('should delete state when closing state graph modal', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        isEditable: true,
      },
      result: Promise.resolve({
        action: 'delete',
        stateName: 'Introduction',
      }),
    } as NgbModalRef);
    spyOn(explorationStatesService, 'deleteState');

    component.openStateGraphModal();
    tick();

    expect(explorationStatesService.deleteState).toHaveBeenCalledWith(
      'Introduction'
    );
  }));

  it('should navigate to main tab when closing state graph modal', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        isEditable: true,
      },
      result: Promise.resolve({
        action: 'navigate',
        stateName: 'Introduction',
      }),
    } as NgbModalRef);
    spyOn(routerService, 'navigateToMainTab');

    component.openStateGraphModal();
    tick();

    expect(routerService.navigateToMainTab).toHaveBeenCalledWith(
      'Introduction'
    );
  }));

  it('should handle invalid actions when state graph modal is opened', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        isEditable: true,
      },
      result: Promise.resolve({
        action: 'add',
        stateName: 'Introduction',
      }),
    } as NgbModalRef);
    spyOn(loggerService, 'error');

    component.openStateGraphModal();
    tick();

    expect(loggerService.error).toHaveBeenCalledWith(
      'Invalid closeDict action: add'
    );
  }));

  it('should dismiss state graph modal', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        isEditable: true,
      },
      result: Promise.reject(),
    } as NgbModalRef);
    spyOn(alertsService, 'clearWarnings');

    component.openStateGraphModal();
    tick();

    expect(alertsService.clearWarnings).toHaveBeenCalled();
  }));

  it('should return checkpoint count', () => {
    spyOn(explorationStatesService, 'getCheckpointCount').and.returnValue(5);

    expect(component.getCheckpointCount()).toEqual(5);
  });

  it('should return checkpoint count warning', () => {
    spyOn(
      explorationWarningsService,
      'getCheckpointCountWarning'
    ).and.returnValue(
      'Only a maximum of 8 checkpoints are allowed per lesson.'
    );

    expect(component.showCheckpointCountWarningSign()).toEqual(
      'Only a maximum of 8 checkpoints are allowed per lesson.'
    );
    expect(component.checkpointCountWarning).toEqual(
      'Only a maximum of 8 checkpoints are allowed per lesson.'
    );
  });
});
