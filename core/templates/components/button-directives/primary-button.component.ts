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
 * @fileoverview Component for the primary buttons displayed on static pages.
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { WindowRef } from
  'services/contextual/window-ref.service';
import './primary-button.component.css';


@Component({
  selector: 'oppia-primary-button',
  templateUrl: './primary-button.component.html',
  styleUrls: ['./primary-button.component.css']
})
export class PrimaryButtonComponent {
  @Input() buttonText: string;
  @Input() customClasses: string[];
  @Input() buttonHref: string | null = null; // Optional href attribute
  @Output() onClickPrimaryButton: EventEmitter<void> = new EventEmitter<void>(); // Optional function attribute if no buttonHref is passed

  constructor(
    private windowRef: WindowRef,
  ) {}

  handleButtonClick(): void {
    if (this.onClickPrimaryButton && typeof this.onClickPrimaryButton === 'function') {
      this.onClickPrimaryButton.emit();
    } else if (this.buttonHref && typeof this.buttonHref === 'string') {
      this.windowRef.nativeWindow.location.href = this.buttonHref;
    }
  }
}

angular.module('oppia').directive('oppiaPrimaryButton',
  downgradeComponent({
    component: PrimaryButtonComponent
  }) as angular.IDirectiveFactory);
