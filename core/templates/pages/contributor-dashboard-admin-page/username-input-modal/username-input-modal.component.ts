// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for looking up a user by username.
 */

import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { SignupPageBackendApiService } from '../../signup-page/services/signup-page-backend-api.service';

@Component({
  selector: 'oppia-username-input-modal',
  templateUrl: './username-input-modal.component.html',
})

export class UsernameInputModal implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() activeTab: string[] = [];
  username: string = '';
  isInvalidUsername: boolean = false;
  isChecking: boolean = false;

  constructor(
    private activeModal: NgbActiveModal,
    private signupPageBackendApiService: SignupPageBackendApiService
  ) {}

  close(): void {
    this.activeModal.dismiss();
  }

  saveAndClose(): void {
    this.isChecking = true;
    this.isInvalidUsername = false;
    this.signupPageBackendApiService.checkUsernameAvailableAsync(
      this.username).then(
      response => {
        if (!response.username_is_taken) {
          this.isInvalidUsername = true;
          this.username = '';
        } else {
          this.activeModal.close(this.username);
        }
        this.isChecking = false;
      });
  }

  ngOnInit(): void {}
}
