// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CertificateAssessmentPlayerPageComponent.
 */

import {CommonModule} from '@angular/common';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {
  NgbModal,
  NgbModalOptions,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import {TimeExpiredModalComponent} from 'components/certificate-assessment-offering-helper/time-expired-modal.component';
import {UnansweredQuestionModalComponent} from 'components/certificate-assessment-offering-helper/unanswered-question-modal.component';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {CertificateAssessmentPlayerPageComponent} from './certificate-assessment-player-page.component';

class MockNgbModal {
  open(component: unknown, options: NgbModalOptions): NgbModalRef {
    return {
      componentInstance: {},
      result: Promise.resolve(null),
      close: () => {},
      dismiss: () => {},
    } as NgbModalRef;
  }
}

describe('CertificateAssessmentPlayerPageComponent', () => {
  let component: CertificateAssessmentPlayerPageComponent;
  let fixture: ComponentFixture<CertificateAssessmentPlayerPageComponent>;
  let router: Router;
  let activatedRouteStubValue: {
    snapshot: {
      paramMap: {get: (name: string) => string | null};
      url: {path: string}[];
    };
  };

  const configureComponent = async (
    routePath: string | null
  ): Promise<void> => {
    const bottomSheetSpy = jasmine.createSpyObj('MatBottomSheet', ['open']);
    const windowDimensionsServiceSpy = jasmine.createSpyObj(
      'WindowDimensionsService',
      ['getWidth']
    );
    windowDimensionsServiceSpy.getWidth.and.returnValue(800);
    activatedRouteStubValue = {
      snapshot: {
        paramMap: {
          get: (name: string) => {
            if (name === 'certificate_id') {
              return 'cert-123';
            }
            return null;
          },
        },
        url: routePath ? [{path: routePath}] : [],
      },
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      declarations: [CertificateAssessmentPlayerPageComponent],
      imports: [CommonModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: activatedRouteStubValue,
        },
        {
          provide: MatBottomSheet,
          useValue: bottomSheetSpy,
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy('navigate'),
          },
        },
        {
          provide: WindowDimensionsService,
          useValue: windowDimensionsServiceSpy,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CertificateAssessmentPlayerPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  };

  beforeEach(async () => {
    await configureComponent(null);
  });

  it('should initialize intro stage for the base route and expose the certificate id', () => {
    fixture.detectChanges();

    expect(component.certificateId).toBe('cert-123');
    expect(component.currentStage).toBe('intro');
  });

  it('should set current stage to questions when route is session', async () => {
    await configureComponent('session');
    fixture.detectChanges();
    expect(component.currentStage).toBe('questions');
  });

  it('should keep intro stage when the route path is unrecognized', async () => {
    await configureComponent('unknown');
    fixture.detectChanges();
    expect(component.currentStage).toBe('intro');
  });

  it('should navigate to the session route on startAssessment', () => {
    fixture.detectChanges();

    component.startAssessment();

    expect(router.navigate).toHaveBeenCalledWith(['session'], {
      relativeTo: TestBed.inject(ActivatedRoute),
    });
  });

  it('should navigate to the result route on submitAssessment', () => {
    spyOn(Date, 'now').and.returnValue(1234);
    fixture.detectChanges();

    component.submitAssessment();

    expect(router.navigate).toHaveBeenCalledWith([
      '/certificate-assessment',
      'cert-123',
      'result',
      'attempt-1234',
    ]);
  });

  it('should switch to the instructions stage on showInstructions', () => {
    fixture.detectChanges();
    expect(component.currentStage).toBe('intro');

    component.showInstructions();

    expect(component.currentStage).toBe('instructions');
  });

  it('should advance to the next question on nextQuestion when not at the last question', () => {
    fixture.detectChanges();
    expect(component.currentQuestionIndex).toBe(0);

    component.nextQuestion();

    expect(component.currentQuestionIndex).toBe(1);
  });

  it('should not advance past the last question on nextQuestion', () => {
    fixture.detectChanges();
    component.currentQuestionIndex = component.mockQuestions.length - 1;

    component.nextQuestion();

    expect(component.currentQuestionIndex).toBe(
      component.mockQuestions.length - 1
    );
  });

  it('should go back one question when previousQuestion is called away from the start', () => {
    fixture.detectChanges();
    component.currentQuestionIndex = 2;

    component.previousQuestion();

    expect(component.currentQuestionIndex).toBe(1);
  });

  it('should not go back past the first question', () => {
    fixture.detectChanges();
    component.currentQuestionIndex = 0;

    component.previousQuestion();

    expect(component.currentQuestionIndex).toBe(0);
  });

  it('should compute the progress percentage based on the current question index', () => {
    fixture.detectChanges();
    component.currentQuestionIndex = 0;
    expect(component.getProgressPercentage()).toBe(
      Math.round((1 / component.mockQuestions.length) * 100)
    );

    component.currentQuestionIndex = component.mockQuestions.length - 1;
    expect(component.getProgressPercentage()).toBe(100);
  });

  it('should return the question at the current question index', () => {
    fixture.detectChanges();
    component.currentQuestionIndex = 1;

    expect(component.getCurrentQuestion()).toEqual(component.mockQuestions[1]);
  });

  it('should not render the time-expired modal inline in the page', () => {
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('oppia-time-expired-modal'))
    ).toBeNull();
  });

  it('should open the time-expired modal when showTimeExpiredModal is true', () => {
    const ngbModal = TestBed.inject(NgbModal);
    spyOn(ngbModal, 'open').and.callThrough();
    component.showTimeExpiredModal = true;
    component.showUnansweredQuestionModal = false;
    fixture.detectChanges();

    expect(ngbModal.open).toHaveBeenCalledWith(TimeExpiredModalComponent, {
      backdrop: 'static',
      centered: true,
      windowClass: 'oppia-time-expired-modal',
    });
  });

  it('should not open the time-expired modal when showTimeExpiredModal is false', () => {
    const ngbModal = TestBed.inject(NgbModal);
    spyOn(ngbModal, 'open').and.callThrough();
    component.showTimeExpiredModal = false;
    component.showUnansweredQuestionModal = false;
    fixture.detectChanges();

    expect(ngbModal.open).not.toHaveBeenCalled();
  });

  it('should handle the time-expired modal result when it is dismissed', fakeAsync(() => {
    const ngbModal = TestBed.inject(NgbModal);
    const modalRef = {
      componentInstance: {},
      result: Promise.reject('dismissed'),
    } as NgbModalRef;
    spyOn(ngbModal, 'open').and.returnValue(modalRef);
    component.showTimeExpiredModal = true;
    component.showUnansweredQuestionModal = false;

    fixture.detectChanges();
    flushMicrotasks();

    expect(ngbModal.open).toHaveBeenCalledWith(TimeExpiredModalComponent, {
      backdrop: 'static',
      centered: true,
      windowClass: 'oppia-time-expired-modal',
    });
  }));

  it('should open the unanswered-question modal when showUnansweredQuestionModal is true', () => {
    const ngbModal = TestBed.inject(NgbModal);
    spyOn(ngbModal, 'open').and.callThrough();
    component.showTimeExpiredModal = false;
    component.showUnansweredQuestionModal = true;
    fixture.detectChanges();

    const modalRef = (ngbModal.open as jasmine.Spy).calls.mostRecent()
      .returnValue as NgbModalRef;
    expect(ngbModal.open).toHaveBeenCalledWith(
      UnansweredQuestionModalComponent,
      {
        backdrop: 'static',
        centered: true,
        windowClass: 'oppia-unanswered-question-modal',
      }
    );
    expect(modalRef.componentInstance.unansweredQuestionCount).toBe(3);
  });

  it('should handle the unanswered-question modal result when it is dismissed', fakeAsync(() => {
    const ngbModal = TestBed.inject(NgbModal);
    const modalRef = {
      componentInstance: {},
      result: Promise.reject('dismissed'),
    } as NgbModalRef;
    spyOn(ngbModal, 'open').and.returnValue(modalRef);
    component.showTimeExpiredModal = false;
    component.showUnansweredQuestionModal = true;

    fixture.detectChanges();
    flushMicrotasks();

    expect(ngbModal.open).toHaveBeenCalledWith(
      UnansweredQuestionModalComponent,
      {
        backdrop: 'static',
        centered: true,
        windowClass: 'oppia-unanswered-question-modal',
      }
    );
  }));

  it('should not open any modal when both modal flags are false', () => {
    const ngbModal = TestBed.inject(NgbModal);
    spyOn(ngbModal, 'open').and.callThrough();
    component.showTimeExpiredModal = false;
    component.showUnansweredQuestionModal = false;
    fixture.detectChanges();

    expect(ngbModal.open).not.toHaveBeenCalled();
  });

  it('should open the time-expired modal as a bottom sheet on mobile screens', () => {
    const bottomSheet = TestBed.inject(MatBottomSheet);
    const windowDimensionsService = TestBed.inject(
      WindowDimensionsService
    ) as jasmine.SpyObj<WindowDimensionsService>;
    windowDimensionsService.getWidth.and.returnValue(400);
    component.showTimeExpiredModal = true;
    component.showUnansweredQuestionModal = false;
    fixture.detectChanges();

    expect(bottomSheet.open).toHaveBeenCalledWith(TimeExpiredModalComponent);
  });

  it('should open the unanswered-question modal as a bottom sheet on mobile screens', () => {
    const bottomSheet = TestBed.inject(MatBottomSheet);
    const windowDimensionsService = TestBed.inject(
      WindowDimensionsService
    ) as jasmine.SpyObj<WindowDimensionsService>;
    windowDimensionsService.getWidth.and.returnValue(400);
    component.showTimeExpiredModal = false;
    component.showUnansweredQuestionModal = true;
    fixture.detectChanges();

    expect(bottomSheet.open).toHaveBeenCalledWith(
      UnansweredQuestionModalComponent
    );
  });

  it('should report whether the current question is the last one', () => {
    fixture.detectChanges();
    component.currentQuestionIndex = 0;
    expect(component.isCurrentQuestionLast()).toBeFalse();

    component.currentQuestionIndex = component.mockQuestions.length - 1;
    expect(component.isCurrentQuestionLast()).toBeTrue();
  });

  it('should read and store submitted responses by question index', () => {
    fixture.detectChanges();

    expect(component.getSavedResponse()).toBe('');

    component.updateResponse('b');
    expect(component.getSavedResponse()).toBe('b');

    component.currentQuestionIndex = 1;
    expect(component.getSavedResponse()).toBe('');
  });
});
