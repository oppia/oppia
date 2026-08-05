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
 * @fileoverview Certificate assessment player page component.
 */

import {Component, OnInit, Optional} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {TimeExpiredModalComponent} from 'components/certificate-assessment-offering-helper/time-expired-modal.component';
import {UnansweredQuestionModalComponent} from 'components/certificate-assessment-offering-helper/unanswered-question-modal.component';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';

const MOBILE_SCREEN_BREAKPOINT = 480;

interface AssessmentQuestion {
  prompt: string;
  choices: string[];
}

@Component({
  selector: 'certificate-assessment-player-page',
  templateUrl: './certificate-assessment-player-page.component.html',
})
export class CertificateAssessmentPlayerPageComponent implements OnInit {
  certificateId = '';
  currentStage: 'intro' | 'instructions' | 'questions' | 'result' = 'intro';
  // TODO(#24717-m2.18-m2.19): The showTimeExpiredModal and
  // showUnansweredQuestionModal flags are currently initialized with default
  // values. Update these flags based on the appropriate conditions once the
  // logic for determining when the modals should be shown or hidden is
  // implemented.
  showUnansweredQuestionModal = false;
  showTimeExpiredModal = false;
  currentQuestionIndex = 0;
  readonly mockQuestions: AssessmentQuestion[] = [
    {
      prompt: 'Mock question 1: What is 2 + 2?',
      choices: ['3', '4', '5'],
    },
    {
      prompt: 'Mock question 2: Pick the correct answer.',
      choices: ['Option A', 'Option B', 'Option C'],
    },
    {
      prompt: 'Mock question 3: Final sample question.',
      choices: ['Yes', 'No', 'Maybe'],
    },
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    @Optional() private bottomSheet: MatBottomSheet,
    @Optional() private ngbModal: NgbModal,
    private router: Router,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  ngOnInit(): void {
    this.certificateId =
      this.activatedRoute.snapshot.paramMap.get('certificate_id') || '';
    const currentRoute = this.activatedRoute.snapshot.url[0]?.path || '';
    if (currentRoute === 'session') {
      this.currentStage = 'questions';
    } else if (currentRoute === 'result') {
      this.currentStage = 'result';
    }
    if (this.showTimeExpiredModal) {
      this.openTimeExpiredModal();
    }
    if (this.showUnansweredQuestionModal) {
      this.openUnansweredQuestionModal();
    }
  }

  private isMobileScreenSize(): boolean {
    return this.windowDimensionsService.getWidth() < MOBILE_SCREEN_BREAKPOINT;
  }

  openTimeExpiredModal(): void {
    if (this.isMobileScreenSize()) {
      this.bottomSheet.open(TimeExpiredModalComponent);
      return;
    }
    const modalRef = this.ngbModal.open(TimeExpiredModalComponent, {
      backdrop: 'static',
      centered: true,
      windowClass: 'oppia-time-expired-modal',
    });
    // TODO(#24717-m2.19): Wire the viewResult and dismiss actions once the
    // backend is integrated.
    modalRef.result.catch(() => null);
  }

  openUnansweredQuestionModal(): void {
    if (this.isMobileScreenSize()) {
      this.bottomSheet.open(UnansweredQuestionModalComponent);
      return;
    }
    const modalRef = this.ngbModal.open(UnansweredQuestionModalComponent, {
      backdrop: 'static',
      centered: true,
      windowClass: 'oppia-unanswered-question-modal',
    });
    // The unanswered-question count is mocked until the backend is integrated.
    modalRef.componentInstance.unansweredQuestionCount = 3;
    // TODO(#24717-m2.19): Wire the submitAnyway and goBackToAssessment actions
    // once the backend is integrated.
    modalRef.result.catch(() => null);
  }

  showInstructions(): void {
    this.currentStage = 'instructions';
  }

  startAssessment(): void {
    this.router.navigate(['session'], {relativeTo: this.activatedRoute});
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.mockQuestions.length - 1) {
      this.currentQuestionIndex += 1;
      return;
    }
  }

  submitAssessment(): void {
    const attemptId = `attempt-${Date.now()}`;
    this.router.navigate([
      `/certificate-assessment/${this.certificateId}/result`,
      attemptId,
    ]);
  }

  getProgressPercentage(): number {
    return Math.round(
      ((this.currentQuestionIndex + 1) / this.mockQuestions.length) * 100
    );
  }

  getCurrentQuestion(): AssessmentQuestion {
    return this.mockQuestions[this.currentQuestionIndex];
  }
}
