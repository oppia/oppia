// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for Alert Messages
 */

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ToastrService } from 'ngx-toastr';
import { AlertsService } from 'services/alerts.service';
require('ngx-toastr/toastr.css');

export interface MessageObject {
  type: string;
  content: string;
  timeout: number;
}

@Component({
  selector: 'oppia-alert-message',
  template: '<div class="oppia-alert-message"></div>'
})
export class AlertMessageComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() messageObject!: MessageObject;
  @Input() messageIndex!: number;

  constructor(
    private alertsService: AlertsService,
    private toastrService: ToastrService
  ) {}

  ngOnInit(): void {
    if (this.messageObject.type === 'info') {
      this.toastrService.info(this.messageObject.content, '', {
        timeOut: this.messageObject.timeout,
      }).onHidden.toPromise().then(() => {
        this.alertsService.deleteMessage(this.messageObject);
      });
    } else if (this.messageObject.type === 'success') {
      this.toastrService.success(this.messageObject.content, '', {
        timeOut: this.messageObject.timeout
      }).onHidden.toPromise().then(() => {
        this.alertsService.deleteMessage(this.messageObject);
      });
    }
  }
}

angular.module('oppia').directive('oppiaAlertMessage',
  downgradeComponent({
    component: AlertMessageComponent
  }) as angular.IDirectiveFactory);
