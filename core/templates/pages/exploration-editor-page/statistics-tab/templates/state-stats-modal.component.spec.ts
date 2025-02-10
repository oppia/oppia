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
 * @fileoverview Unit tests for StateStatsModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, waitForAsync, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {RouterService} from 'pages/exploration-editor-page/services/router.service';
import {StateStatsModalComponent} from './state-stats-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('State Stats Modal Component', () => {
  let component: StateStatsModalComponent;
  let fixture: ComponentFixture<StateStatsModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let routerService: RouterService;

  let stateName = 'State 1';
  let stateStats = {
    usefulFeedbackCount: 0,
    totalAnswersCount: 10,
    numTimesSolutionViewed: 4,
    totalHitCount: 13,
    numCompletions: 8,
  };
  let visualizationsInfo = [
    {
      data: 'Hola',
      options: 'Options',
      id: '1',
      addressed_info_is_supported: true,
    },
  ];
  let interactionArgs = {};

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StateStatsModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateStatsModalComponent);
    component = fixture.componentInstance;

    routerService = TestBed.inject(RouterService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);

    spyOn(ngbActiveModal, 'close').and.stub();

    component.stateStats = stateStats;
    component.visualizationsInfo = visualizationsInfo;
    component.interactionArgs = interactionArgs;
    component.stateName = stateName;

    component.ngOnInit();
    fixture.detectChanges();
  });

  it('should initialize component properties after component is initialized', () => {
    expect(component.stateName).toBe(stateName);
    expect(component.numEnters).toEqual(stateStats.totalHitCount);
    expect(component.numQuits).toEqual(
      stateStats.totalHitCount - stateStats.numCompletions
    );
    expect(component.interactionArgs).toBe(interactionArgs);
    expect(component.visualizationsInfo).toEqual(visualizationsInfo);
  });

  it('should navigate to state editor', () => {
    spyOn(ngbActiveModal, 'dismiss').and.stub();
    spyOn(routerService, 'navigateToMainTab').and.stub();

    component.stateName = stateName;
    component.navigateToStateEditor();

    expect(component.makeCompletionRatePieChartOptions('title')).toEqual({
      left: 20,
      pieHole: 0.6,
      pieSliceTextStyleColor: 'black',
      pieSliceBorderColor: 'black',
      chartAreaWidth: 240,
      colors: ['#d8d8d8', '#008808', 'blue'],
      height: 270,
      legendPosition: 'right',
      title: 'title',
      width: 240,
    });
    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
    expect(routerService.navigateToMainTab).toHaveBeenCalledWith(stateName);
  });
});
