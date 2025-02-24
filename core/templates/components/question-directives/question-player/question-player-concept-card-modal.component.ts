// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for question player concept card modal.
 */

import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {UrlService} from 'services/contextual/url.service';
import {WindowRef} from 'services/contextual/window-ref.service';

@Component({
  selector: 'oppia-question-player-concept-card-modal',
  templateUrl: './question-player-concept-card-modal.component.html',
})
export class QuestionPlayerConceptCardModalComponent
  extends ConfirmOrCancelModal
  implements OnInit
{
  @Input() skillIds: string[] = [];
  @Input() skills: string[] = [];

  index: number = 0;
  modalHeader: string = '';

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private windowRef: WindowRef,
    private urlService: UrlService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.index = 0;
    this.modalHeader = this.skills[this.index];
  }

  isLastConceptCard(): boolean {
    return this.index === this.skills.length - 1;
  }

  goToNextConceptCard(): void {
    this.index++;
    this.modalHeader = this.skills[this.index];
  }

  retryTest(): void {
    const selectedSubtopics =
      this.urlService.getUrlParams().selected_subtopic_ids;

    this.windowRef.nativeWindow.location.replace(
      this.urlService.getPathname() +
        '?selected_subtopic_ids=' +
        selectedSubtopics
    );
  }
}
