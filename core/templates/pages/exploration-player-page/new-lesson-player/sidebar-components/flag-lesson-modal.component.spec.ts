// Copyright 2025 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for FlagExplorationModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {SharedPipesModule} from '../../../../filters/shared-pipes.module';
import {FocusManagerService} from '../../../../services/stateful/focus-manager.service';
import {PlayerPositionService} from '../../services/player-position.service';
import {NewFlagExplorationModalComponent} from './flag-lesson-modal.component';
import {MockTranslatePipe} from '../../../../tests/unit-test-utils';
import {PageContextService} from '../../../../services/page-context.service';
import {LearnerLocalNavBackendApiService} from '../../services/learner-local-nav-backend-api.service';
import {AlertsService} from '../../../../services/alerts.service';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';

describe('Flag lesson modal', () => {
  let component: NewFlagExplorationModalComponent;
  let fixture: ComponentFixture<NewFlagExplorationModalComponent>;
  let stateName: string = 'test_state';
  let explorationId: string = 'test_exploration_id';
  let focusManagerService: FocusManagerService;
  let ngbActiveModal: NgbActiveModal;
  let bottomSheetRef: MatBottomSheetRef;
  let learnerLocalNavBackendApiService: LearnerLocalNavBackendApiService;
  let alertsService: AlertsService;

  class MockPlayerPositionService {
    getCurrentStateName(): string {
      return stateName;
    }
  }

  class MockPageContextService {
    getExplorationId(): string {
      return explorationId;
    }
  }

  class MockLearnerLocalNavBackendApiService {
    postReportAsync(): Promise<void> {
      return Promise.resolve();
    }
  }

  class MockAlertsService {
    addWarning(): void {}
  }

  class MockMatBottomSheetRef {
    dismiss(): void {}
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, SharedPipesModule, FormsModule],
      declarations: [NewFlagExplorationModalComponent, MockTranslatePipe],
      providers: [
        NgbActiveModal,
        FocusManagerService,
        {
          provide: PlayerPositionService,
          useClass: MockPlayerPositionService,
        },
        {
          provide: PageContextService,
          useClass: MockPageContextService,
        },
        {
          provide: LearnerLocalNavBackendApiService,
          useClass: MockLearnerLocalNavBackendApiService,
        },
        {
          provide: AlertsService,
          useClass: MockAlertsService,
        },
        {
          provide: MatBottomSheetRef,
          useClass: MockMatBottomSheetRef,
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewFlagExplorationModalComponent);
    component = fixture.componentInstance;
    focusManagerService = TestBed.inject(FocusManagerService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    bottomSheetRef = TestBed.inject(MatBottomSheetRef);
    learnerLocalNavBackendApiService = TestBed.inject(
      LearnerLocalNavBackendApiService
    );
    alertsService = TestBed.inject(AlertsService);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should show flag message textarea', () => {
    spyOn(focusManagerService, 'setFocus');
    component.showFlagMessageTextarea(true);
    expect(component.flagMessageTextareaIsShown).toBeTrue();
    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'flagMessageTextarea'
    );
  });

  it('should not show flag message textarea when value is false', () => {
    spyOn(focusManagerService, 'setFocus');
    component.showFlagMessageTextarea(false);
    expect(component.flagMessageTextareaIsShown).toBeFalse();
    expect(focusManagerService.setFocus).not.toHaveBeenCalled();
  });

  it('should submit report successfully when textarea is shown', fakeAsync(() => {
    let flag = true;
    let flagMessage = 'test message';
    spyOn(learnerLocalNavBackendApiService, 'postReportAsync').and.callFake(
      () => Promise.resolve()
    );

    component.flagMessageTextareaIsShown = true;
    component.flag = flag;
    component.flagMessage = flagMessage;

    component.submitReport();
    tick();

    expect(
      learnerLocalNavBackendApiService.postReportAsync
    ).toHaveBeenCalledWith(explorationId, {
      report_type: flag,
      report_text: flagMessage,
      state: stateName,
    });
    expect(component.thankYouModalIsShown).toBe(true);
  }));

  it('should handle error when submitting report', fakeAsync(() => {
    let flag = true;
    let flagMessage = 'test message';
    let errorMessage = 'Something went wrong';

    spyOn(learnerLocalNavBackendApiService, 'postReportAsync').and.callFake(
      () => Promise.reject(errorMessage)
    );
    spyOn(alertsService, 'addWarning');

    component.flagMessageTextareaIsShown = true;
    component.flag = flag;
    component.flagMessage = flagMessage;

    component.submitReport();
    tick();

    expect(
      learnerLocalNavBackendApiService.postReportAsync
    ).toHaveBeenCalledWith(explorationId, {
      report_type: flag,
      report_text: flagMessage,
      state: stateName,
    });
    expect(alertsService.addWarning).toHaveBeenCalledWith(errorMessage);
    expect(component.thankYouModalIsShown).toBe(true);
  }));

  it('should not submit report when textarea is not shown', () => {
    spyOn(learnerLocalNavBackendApiService, 'postReportAsync');

    component.flagMessageTextareaIsShown = false;
    component.submitReport();

    expect(
      learnerLocalNavBackendApiService.postReportAsync
    ).not.toHaveBeenCalled();
    expect(component.thankYouModalIsShown).toBe(false);
  });

  it('should close modal with MatBottomSheetRef', () => {
    spyOn(bottomSheetRef, 'dismiss');
    // Mock the component to use bottomSheetRef instead of ngbActiveModal.
    const componentRef = component as unknown as {
      ngbActiveModal: NgbActiveModal | null;
    };
    componentRef.ngbActiveModal = null;

    component.closeModal();

    expect(bottomSheetRef.dismiss).toHaveBeenCalled();
  });

  it('should close modal with NgbActiveModal', () => {
    spyOn(ngbActiveModal, 'dismiss');
    // Ensure bottomSheetRef is null so ngbActiveModal is used.
    const componentRef = component as unknown as {
      bottomSheetRef: MatBottomSheetRef | null;
    };
    componentRef.bottomSheetRef = null;

    component.closeModal();

    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });
});
