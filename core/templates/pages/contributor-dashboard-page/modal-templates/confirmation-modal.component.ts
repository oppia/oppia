// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the translation modal.
 */
import {Component, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirmation-modal',
  template: `
    <div class="modal-header">
      <h4 class="modal-title">{{ content.title }}</h4>
      <button
        type="button"
        class="close"
        aria-label="Close"
        (click)="modal.dismiss()"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <p>{{ content.message }}</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="modal.dismiss()">
        {{ content.cancelText }}
      </button>
      <button
        type="button"
        class="btn btn-success"
        (click)="modal.close('confirm')"
      >
        {{ content.confirmText }}
      </button>
    </div>
  `,
})
export class ConfirmationModalComponent {
  @Input() content: {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
  };

  constructor(public modal: NgbActiveModal) {}
}
