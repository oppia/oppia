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
  @Input() buttonText: string = '';
  @Input() customClasses?: string[];
  @Input() disabled?: boolean = false;
  @Input() buttonHref: string | null = null;
  @Output() onClickPrimaryButton: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private windowRef: WindowRef,
  ) {}

  handleButtonClick(): void {
    if (this.onClickPrimaryButton.observers.length > 0) {
      this.onClickPrimaryButton.emit();
    } else if (this.buttonHref) {
      const isExternalLink = this.isExternalLink(this.buttonHref);
      if (isExternalLink) {
        this.openExternalLink(this.buttonHref);
      } else {
        this.windowRef.nativeWindow.location.href = this.buttonHref;
      }
    }
  }

  private isExternalLink(link: string): boolean {
    return link.startsWith('http://') || link.startsWith('https://');
  }

  private openExternalLink(link: string): void {
    const newTab = window.open();
    if (newTab) {
      newTab.opener = null;
      newTab.location.href = link;
    }
  }
}

angular.module('oppia').directive('oppiaPrimaryButton',
  downgradeComponent({
    component: PrimaryButtonComponent
  }) as angular.IDirectiveFactory);
