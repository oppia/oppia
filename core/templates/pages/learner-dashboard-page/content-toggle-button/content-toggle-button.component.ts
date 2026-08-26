// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for content toggle button
 */
import {Component, EventEmitter, Output} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
@Component({
  selector: 'oppia-content-toggle-button',
  templateUrl: './content-toggle-button.component.html',
})
export class ContentToggleButtonComponent {
  isExpanded: boolean = false;
  buttonText: string = '';
  @Output() contentToggleEmitter = new EventEmitter<boolean>();

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    this.buttonText = this.translateService.instant(
      'I18N_LEARNER_DASHBOARD_CONTENT_TOGGLE_BUTTON_MORE'
    );
  }

  toggle(): void {
    this.isExpanded = !this.isExpanded;
    this.buttonText = this.translateService.instant(
      this.isExpanded
        ? 'I18N_LEARNER_DASHBOARD_CONTENT_TOGGLE_BUTTON_LESS'
        : 'I18N_LEARNER_DASHBOARD_CONTENT_TOGGLE_BUTTON_MORE'
    );
    this.contentToggleEmitter.emit(this.isExpanded);
  }
}
