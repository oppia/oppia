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
 * @fileoverview Modal that celebrates the learner after they complete all
 * lessons of an adventure.
 */

import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  Input,
  OnInit,
  Optional,
  ViewChild,
} from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

import './adventure-mastered-modal.component.css';

@Component({
  selector: 'adventure-mastered-modal',
  templateUrl: './adventure-mastered-modal.component.html',
  styleUrls: ['./adventure-mastered-modal.component.css'],
})
export class AdventureMasteredModalComponent
  extends ConfirmOrCancelModal
  implements OnInit
{
  @Input() title!: string;
  @Input() message!: string;

  @ViewChild('dialog') private dialog!: ElementRef<HTMLElement>;
  private modalFocusRestoreElement: HTMLElement | null = null;
  protected bottomSheetRef: MatBottomSheetRef | undefined;
  constructor(
    private ngbActiveModal: NgbActiveModal,
    @Optional() bottomSheetRef: MatBottomSheetRef | null,
    @Optional()
    @Inject(MAT_BOTTOM_SHEET_DATA)
    private data: {title: string; message: string} | null
  ) {
    super(ngbActiveModal);
    this.bottomSheetRef = bottomSheetRef ?? undefined;
    if (this.data) {
      this.title = this.data.title;
      this.message = this.data.message;
    }
  }

  confirm<T>(value?: T): void {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss('confirm');
    } else {
      super.confirm(value);
    }
  }

  cancel<T>(value: T | 'cancel' = 'cancel'): void {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss('cancel');
    } else {
      super.cancel(value);
    }
  }

  ngOnInit(): void {
    this.modalFocusRestoreElement =
      document.activeElement as HTMLElement | null;
    // Defer focus so Angular has rendered the dialog into the DOM.
    setTimeout(() => {
      this.dialog?.nativeElement.focus();
    }, 0);
  }

  onContinue(): void {
    this.restoreModalFocus();
    this.confirm();
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onContinue();
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
