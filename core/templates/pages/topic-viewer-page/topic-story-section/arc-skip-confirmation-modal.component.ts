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
 * @fileoverview Modal that asks the learner to confirm skipping an adventure
 * when they select a lesson in a later adventure from the navigation.
 */

import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

import './arc-skip-confirmation-modal.component.css';

@Component({
  selector: 'arc-skip-confirmation-modal',
  templateUrl: './arc-skip-confirmation-modal.component.html',
  styleUrls: ['./arc-skip-confirmation-modal.component.css'],
})
export class ArcSkipConfirmationModalComponent
  extends ConfirmOrCancelModal
  implements OnInit
{
  // The label of the adventure that the navigation is trying to jump to,
  // e.g. "Adventure 2".
  @Input() adventureLabel!: string;
  // The message listing the adventures that will be skipped.
  @Input() confirmationMessage!: string;

  @ViewChild('dialog') private dialog!: ElementRef<HTMLElement>;
  private modalFocusRestoreElement: HTMLElement | null = null;

  constructor(private ngbActiveModal: NgbActiveModal) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.modalFocusRestoreElement =
      document.activeElement as HTMLElement | null;
    // Defer focus so Angular has rendered the dialog into the DOM.
    setTimeout(() => {
      this.dialog?.nativeElement.focus();
    }, 0);
  }

  onCancel(): void {
    this.restoreModalFocus();
    this.cancel();
  }

  onConfirm(): void {
    this.restoreModalFocus();
    this.confirm();
  }

  onBackdropClick(): void {
    this.onCancel();
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCancel();
    }
  }

  onDialogTab(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }

    const dialogElement = this.dialog?.nativeElement;
    if (!dialogElement) {
      return;
    }

    const focusableElements = this.getFocusableElements(dialogElement);
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement | null;

    if (
      event.shiftKey &&
      (activeElement === firstFocusable || activeElement === dialogElement)
    ) {
      event.preventDefault();
      lastFocusable.focus();
    } else if (!event.shiftKey && activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  }

  private getFocusableElements(dialogElement: HTMLElement): HTMLElement[] {
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    return Array.from(
      dialogElement.querySelectorAll<HTMLElement>(focusableSelector)
    );
  }

  private restoreModalFocus(): void {
    if (this.modalFocusRestoreElement) {
      this.modalFocusRestoreElement.focus();
    }
    this.modalFocusRestoreElement = null;
  }
}
