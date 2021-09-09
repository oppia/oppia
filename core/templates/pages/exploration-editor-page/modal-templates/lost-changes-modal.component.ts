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

import { Component, ElementRef, Input, OnInit } from '@angular/core';

import { LoggerService } from 'services/contextual/logger.service';
import { LostChange, LostChangeObjectFactory } from 'domain/exploration/LostChangeObjectFactory';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WindowRef } from 'services/contextual/window-ref.service';

@Component({
  selector: 'oppia-lost-changes-modal',
  templateUrl: './lost-changes-modal.component.html'
})
export class LostChangesModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  @Input() lostChanges: LostChange[];
  hasLostChanges: boolean;

  constructor(
    private elRef: ElementRef,
    private windowRef: WindowRef,
    private loggerService: LoggerService,
    private lostChangeObjectFactory: LostChangeObjectFactory,
    private ngbActiveModal: NgbActiveModal,
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.hasLostChanges = (this.lostChanges && this.lostChanges.length > 0);
    this.lostChanges = this.lostChanges.map(
      this.lostChangeObjectFactory.createNew);
  }

  cancel(): void {
    this.ngbActiveModal.dismiss();
  }

  exportChangesAndClose(): void {
    let lostChangesData: HTMLElement = (
      this.elRef.nativeElement.getElementsByClassName(
        'oppia-lost-changes'));
    let blob = new Blob([lostChangesData[0].innerText], {type: 'text/plain'});
    var elem = this.windowRef.nativeWindow.document.createElement('a');
    elem.href = URL.createObjectURL(blob);
    elem.download = 'lostChanges.txt';
    elem.click();
    this.ngbActiveModal.dismiss();
  }
}
