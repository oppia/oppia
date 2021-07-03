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
 * @fileoverview Controller for a modal that confirms that the user wants to
 * refresh the exploration when changing languages.
 */

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { WindowRef } from 'services/contextual/window-ref.service';

export const INITIAL_CONTENT_LANGUAGE_CODE_URL_PARAM = (
  'initialContentLanguageCode');

@Component({
  selector: 'switch-content-language-refresh-required-modal',
  templateUrl:
    './switch-content-language-refresh-required-modal.component.html',
  styleUrls: []
})
export class SwitchContentLanguageRefreshRequiredModalComponent {
  @Input() languageCode!: string;

  constructor(
    private activeModal: NgbActiveModal,
    private windowRef: WindowRef
  ) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirm(): void {
    const url = new URL(this.windowRef.nativeWindow.location.href);
    url.searchParams.set(
      INITIAL_CONTENT_LANGUAGE_CODE_URL_PARAM, this.languageCode);
    this.windowRef.nativeWindow.location.href = url.href;
  }
}

angular.module('oppia').factory(
  'SwitchContentLanguageRefreshRequiredModalComponent',
  downgradeComponent(
    {component: SwitchContentLanguageRefreshRequiredModalComponent}));
