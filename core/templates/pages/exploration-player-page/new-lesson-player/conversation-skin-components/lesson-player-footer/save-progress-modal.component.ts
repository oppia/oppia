// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for display hint modal.
 */

import {Component, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {UserService} from 'services/user.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {LocalStorageService} from 'services/local-storage.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import './save-progress-modal.component.css';

@Component({
  selector: 'oppia-save-progress-modal',
  templateUrl: './save-progress-modal.component.html',
  styleUrls: ['./save-progress-modal.component.css'],
})
export class SaveProgressModalComponent {
  @Input() loggedOutProgressUniqueUrlId!: string | null;
  @Input() loggedOutProgressUniqueUrl!: string;

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private userService: UserService,
    private windowRef: WindowRef,
    private localStorageService: LocalStorageService,
    private ngbActiveModal: NgbActiveModal
  ) {}

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  onLoginButtonClicked(): void {
    this.userService.getLoginUrlAsync().then(loginUrl => {
      let urlId = this.loggedOutProgressUniqueUrlId;
      /* istanbul ignore if */
      if (urlId === null) {
        throw new Error(
          'User should not be able to login if ' +
            'loggedOutProgressUniqueUrlId is not null.'
        );
      }
      this.localStorageService.updateUniqueProgressIdOfLoggedOutLearner(urlId);
      this.windowRef.nativeWindow.location.href = loginUrl;
    });
  }

  closeModal(): void {
    this.ngbActiveModal.dismiss();
  }
}
