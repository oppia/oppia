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
 * @fileoverview Unit tests for ExplorationGraphModalComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ExplorationGraphModalComponent} from './exploration-graph-modal.component';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {GraphDataService} from 'pages/exploration-editor-page/services/graph-data.service';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
    };
  }
}

describe('Exploration Graph Modal Component', () => {
  let component: ExplorationGraphModalComponent;
  let fixture: ComponentFixture<ExplorationGraphModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let graphDataService: GraphDataService;
  let stateEditorService: StateEditorService;
  let isEditable = true;
  let stateName = 'Introduction';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ExplorationGraphModalComponent],
      providers: [
        GraphDataService,
        StateEditorService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorationGraphModalComponent);
    component = fixture.componentInstance;

    ngbActiveModal = TestBed.inject(NgbActiveModal);
    graphDataService = TestBed.inject(GraphDataService);
    stateEditorService = TestBed.inject(StateEditorService);

    spyOn(graphDataService, 'getGraphData').and.callThrough();
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(stateName);
    spyOn(ngbActiveModal, 'close').and.stub();

    component.isEditable = isEditable;
    component.ngOnInit();
  });

  it('should initialize component properties after Component is initialized', () => {
    expect(component.currentStateName).toBe(stateName);
    expect(component.graphData).toBeUndefined();
    expect(component.isEditable).toBe(isEditable);
  });

  it('should delete state when closing the modal', () => {
    let stateName = 'State Name';
    component.deleteState(stateName);

    expect(ngbActiveModal.close).toHaveBeenCalled();
  });

  it('should select state when closing the modal', () => {
    let stateName = 'State Name';
    component.selectState(stateName);

    expect(ngbActiveModal.close).toHaveBeenCalled();
  });
});
