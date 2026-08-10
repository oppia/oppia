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

export type AssessmentQuestionType =
  | 'multiple_choice'
  | 'multiple_select'
  | 'text_input'
  | 'numeric_input';

export interface AssessmentQuestionOption {
  id: string;
  text: string;
}

export interface AssessmentQuestion {
  id: string;
  type: AssessmentQuestionType;
  prompt: string;
  hint: string;
  options: AssessmentQuestionOption[];
  placeholder?: string;
  correctAnswerText: string;
}

@Component({
  selector: 'certificate-assessment-player-page',
  templateUrl: './certificate-assessment-player-page.component.html',
  styleUrls: ['./certificate-assessment-player-page.component.css'],
})
export class CertificateAssessmentPlayerPageComponent implements OnInit {
  certificateId = '';
  currentStage: 'intro' | 'instructions' | 'questions' = 'intro';
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
      id: 'q1',
      type: 'multiple_choice',
      prompt: 'Which number completes the sequence: 2, 4, 6, ?',
      hint: 'Choose one option.',
      options: [
        {id: 'a', text: '7'},
        {id: 'b', text: '8'},
        {id: 'c', text: '9'},
      ],
      correctAnswerText: '8',
    },
    {
      id: 'q2',
      type: 'multiple_select',
      prompt: 'Select all prime numbers.',
      hint: 'More than one option may be correct.',
      options: [
        {id: 'a', text: '2'},
        {id: 'b', text: '3'},
        {id: 'c', text: '4'},
        {id: 'd', text: '5'},
      ],
      correctAnswerText: '2, 3, 5',
    },
    {
      id: 'q3',
      type: 'text_input',
      prompt: 'Type the name of the shape with three sides.',
      hint: 'Use plain text.',
      options: [],
      placeholder: 'Enter your answer',
      correctAnswerText: 'Triangle',
    },
    {
      id: 'q4',
      type: 'numeric_input',
      prompt: 'What is 12 divided by 3?',
      hint: 'Enter a number.',
      options: [],
      placeholder: '0',
      correctAnswerText: '4',
    },
  ];
  submittedResponses: string[] = [];

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

  previousQuestion(): void {
    if (this.currentQuestionIndex === 0) {
      return;
    }
    this.currentQuestionIndex -= 1;
  }

  submitAssessment(): void {
    const attemptId = `attempt-${Date.now()}`;
    this.router.navigate([
      '/certificate-assessment',
      this.certificateId,
      'result',
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

  isCurrentQuestionLast(): boolean {
    return this.currentQuestionIndex === this.mockQuestions.length - 1;
  }

  getSavedResponse(): string {
    return this.submittedResponses[this.currentQuestionIndex] || '';
  }

  updateResponse(response: string): void {
    this.submittedResponses[this.currentQuestionIndex] = response;
  }
}
