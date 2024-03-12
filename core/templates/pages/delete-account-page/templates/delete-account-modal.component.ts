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
 * @fileoverview Component for delete account modal.
 */

import {Component} from '@angular/core';
import {OnInit} from '@angular/core';
import {UserService} from 'services/user.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'oppia-delete-account-modal',
  templateUrl: './delete-account-modal.component.html',
})
export class DeleteAccountModalComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  expectedUsername!: string;
  username!: string;
  constructor(
    private userService: UserService,
    private ngbActiveModal: NgbActiveModal
  ) {}

  ngOnInit(): void {
    this.userService.getUserInfoAsync().then(userInfo => {
      const expectedUsername = userInfo.getUsername();

      if (expectedUsername === null) {
        throw new Error('Cannot fetch username.');
      }
      this.expectedUsername = expectedUsername;
    });
  }

  isValid(): boolean {
    return this.username === this.expectedUsername;
  }

  confirm(): void {
    this.ngbActiveModal.close();
  }

  cancel(): void {
    this.ngbActiveModal.dismiss();
  }
}
