// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Mastery challenge card displayed at the end of a story section.
 */

import {Component, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import {WindowRef} from 'services/contextual/window-ref.service';

import './mastery-challenge-card.component.css';

@Component({
  selector: 'topic-mastery-challenge-card',
  templateUrl: './mastery-challenge-card.component.html',
  styleUrls: ['./mastery-challenge-card.component.css'],
})
export class MasteryChallengeCardComponent implements OnDestroy {
  @Input() actionUrl: string = '#';
  @Input() isUnlocked: boolean = false;
  @Output() buttonClicked = new EventEmitter<void>();

  showLockedTooltip: boolean = false;
  private helperTooltipTimeoutId: number | null = null;

  constructor(private windowRef: WindowRef) {}

  ngOnDestroy(): void {
    this.clearHelperTooltipTimeout();
  }

  onChallengeButtonClick(): void {
    if (this.isUnlocked && this.hasActionUrl()) {
      this.navigateToAction();
      return;
    }
    this.buttonClicked.emit();
  }

  onButtonMouseEnter(): void {
    if (!this.isUnlocked) {
      this.showHelperTooltip();
    }
  }

  onButtonMouseLeave(): void {
    this.clearHelperTooltipTimeout();
    this.showLockedTooltip = false;
  }

  navigateToAction(): void {
    if (this.hasActionUrl()) {
      this.windowRef.nativeWindow.location.assign(this.actionUrl);
    }
  }

  hasActionUrl(): boolean {
    return this.actionUrl !== '' && this.actionUrl !== '#';
  }

  isActionDisabled(): boolean {
    return !this.isUnlocked || !this.hasActionUrl();
  }

  private showHelperTooltip(): void {
    this.showLockedTooltip = true;
    this.clearHelperTooltipTimeout();
    this.helperTooltipTimeoutId = this.windowRef.nativeWindow.setTimeout(() => {
      this.showLockedTooltip = false;
      this.helperTooltipTimeoutId = null;
    }, 5000);
  }

  private clearHelperTooltipTimeout(): void {
    if (this.helperTooltipTimeoutId !== null) {
      this.windowRef.nativeWindow.clearTimeout(this.helperTooltipTimeoutId);
      this.helperTooltipTimeoutId = null;
    }
  }
}
