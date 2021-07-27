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
 * @fileoverview Component for registration session expired modal.
 */

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UserService } from 'services/user.service';

@Component({
  selector: 'oppia-registration-session-expired-modal',
  templateUrl: './registration-session-expired-modal.component.html'
})
export class RegistrationSessionExpiredModalComponent {
  constructor(
    private ngbActiveModal: NgbActiveModal,
    private userService: UserService,
    private windowRef: WindowRef
  ) {}

  continueRegistration(): void {
    this.userService.getLoginUrlAsync().then((loginUrl) => {
      if (loginUrl) {
        setTimeout(() => {
          this.windowRef.nativeWindow.location.href = loginUrl;
        }, 150);
      } else {
        this.windowRef.nativeWindow.location.reload();
      }
    });
    this.ngbActiveModal.dismiss('cancel');
  }
}
