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
 * @fileoverview Component for lost changes modal.
 */

import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {
  LostChange,
  LostChangeBackendDict,
} from 'domain/exploration/lost-change.model';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {WindowRef} from 'services/contextual/window-ref.service';
import {UtilsService} from 'services/utils.service';
import {ExplorationChange} from 'domain/exploration/exploration-draft.model';

@Component({
  selector: 'oppia-lost-changes-modal',
  templateUrl: './lost-changes-modal.component.html',
})
export class LostChangesModalComponent
  extends ConfirmOrCancelModal
  implements OnInit
{
  @Input() lostChanges!: (ExplorationChange | LostChangeBackendDict)[];
  hasLostChanges: boolean = false;

  constructor(
    private utilsService: UtilsService,
    private elRef: ElementRef,
    private windowRef: WindowRef,
    private ngbActiveModal: NgbActiveModal
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.hasLostChanges = this.lostChanges && this.lostChanges.length > 0;
    this.lostChanges = this.lostChanges.map(
      (change: ExplorationChange | LostChangeBackendDict) =>
        LostChange.createNew(this.utilsService, change)
    );
  }

  cancel(): void {
    this.ngbActiveModal.dismiss();
  }

  exportChangesAndClose(): void {
    const lostChangesData = this.elRef.nativeElement.getElementsByClassName(
      'oppia-lost-changes'
    )[0] as HTMLInputElement;

    const blob = new Blob([lostChangesData.innerText], {type: 'text/plain'});
    const elem = this.windowRef.nativeWindow.document.createElement('a');
    elem.href = URL.createObjectURL(blob);
    elem.download = 'lostChanges.txt';
    elem.click();
    this.ngbActiveModal.dismiss();
  }
}
