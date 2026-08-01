// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Modal shown when a certificate assessment has unanswered questions.
 */

import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'oppia-unanswered-question-modal',
  templateUrl: './unanswered-question-modal.component.html',
  styleUrls: ['./unanswered-question-modal.component.css'],
})
export class UnansweredQuestionModalComponent
  implements AfterViewInit, OnDestroy
{
  @Input() unansweredQuestionCount = 3;
  @Output() submitAnyway = new EventEmitter<void>();
  @Output() goBackToAssessment = new EventEmitter<void>();
  @ViewChild('assessmentModalCard')
  assessmentModalCard!: ElementRef<HTMLElement>;

  // This property is set in ngAfterViewInit and used to restore focus when
  // the modal is destroyed.
  private previouslyFocusedElement: HTMLElement | null = null;

  ngAfterViewInit(): void {
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
    this.assessmentModalCard.nativeElement.focus();
  }

  ngOnDestroy(): void {
    if (this.previouslyFocusedElement !== null) {
      this.previouslyFocusedElement.focus();
    }
  }

  trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }
    const focusableElements =
      this.assessmentModalCard.nativeElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    const firstFocusableElement = focusableElements[0] as
      | HTMLElement
      | undefined;
    const lastFocusableElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement | undefined;
    if (event.shiftKey && document.activeElement === firstFocusableElement) {
      lastFocusableElement?.focus();
      event.preventDefault();
    } else if (
      !event.shiftKey &&
      document.activeElement === lastFocusableElement
    ) {
      firstFocusableElement?.focus();
      event.preventDefault();
    }
  }

  onSubmitAnyway(): void {
    this.submitAnyway.emit();
  }

  onGoBackToAssessment(): void {
    this.goBackToAssessment.emit();
  }
}
