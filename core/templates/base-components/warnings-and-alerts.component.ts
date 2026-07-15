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
 * @fileoverview Component for warning and alerts.
 */

import {Component, OnInit, OnDestroy} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Subscription} from 'rxjs';
import {AlertsService, Message, Warning} from 'services/alerts.service';
import {ErrorModalComponent} from 'components/common-layout-directives/common-elements/error-modal.component';

import './warnings-and-alerts.component.css';

@Component({
  selector: 'oppia-warnings-and-alerts',
  templateUrl: './warnings-and-alerts.component.html',
  styleUrls: ['./warnings-and-alerts.component.css'],
})
export class WarningsAndAlertsComponent implements OnInit, OnDestroy {
  private directiveSubscriptions = new Subscription();

  constructor(
    private alertsService: AlertsService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    if (this.alertsService.warnings.length > 0) {
      this.openErrorModal(this.alertsService.warnings[0].content);
    }

    this.directiveSubscriptions.add(
      this.alertsService.onWarningAdded.subscribe((warningMessage: string) => {
        this.openErrorModal(warningMessage);
      })
    );
  }

  openErrorModal(warningMessage: string): void {
    const modalRef = this.modalService.open(ErrorModalComponent, {
      backdropClass: 'oppia-error-modal-backdrop',
      windowClass: 'oppia-error-modal-window',
      backdrop: 'static',
    });
    modalRef.componentInstance.errorMessage = warningMessage;

    modalRef.result.finally(() => {
      if (this.alertsService.warnings.length > 0) {
        this.alertsService.deleteWarning(this.alertsService.warnings[0]);
      }

      if (this.alertsService.warnings.length > 0) {
        this.openErrorModal(this.alertsService.warnings[0].content);
      }
    });
  }

  getWarnings(): Warning[] {
    return this.alertsService.warnings;
  }

  deleteWarning(warning: Warning): void {
    this.alertsService.deleteWarning(warning);
  }

  getMessages(): Message[] {
    return this.alertsService.messages;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
