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
 * @fileoverview Component for add worked example modal.
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

interface HtmlFormSchema {
  type: 'html';
  'ui_config': object;
}

@Component({
  selector: 'oppia-add-worked-example-modal',
  templateUrl: './add-worked-example.component.html'
})
export class AddWorkedExampleModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  tmpWorkedExampleExplanationHtml!: string;
  tmpWorkedExampleQuestionHtml!: string;
  WORKED_EXAMPLE_FORM_SCHEMA: HtmlFormSchema = {
    type: 'html',
    ui_config: {}
  };

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private ngbActiveModal: NgbActiveModal
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.tmpWorkedExampleQuestionHtml = '';
    this.tmpWorkedExampleExplanationHtml = '';
  }

  getSchema(): HtmlFormSchema {
    return this.WORKED_EXAMPLE_FORM_SCHEMA;
  }

  updateLocalQues($event: string): void {
    if (this.tmpWorkedExampleQuestionHtml !== $event) {
      this.tmpWorkedExampleQuestionHtml = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  updateLocalExp($event: string): void {
    if (this.tmpWorkedExampleExplanationHtml !== $event) {
      this.tmpWorkedExampleExplanationHtml = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  saveWorkedExample(): void {
    this.ngbActiveModal.close({
      workedExampleQuestionHtml:
        this.tmpWorkedExampleQuestionHtml,
      workedExampleExplanationHtml:
        this.tmpWorkedExampleExplanationHtml
    });
  }
}
