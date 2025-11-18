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
 * @fileoverview A directive to detect swipe events.
 */

import {Directive, EventEmitter, HostListener, Output} from '@angular/core';

@Directive({
  selector: '[swipeDetector]',
})
export class SwipeDetectorDirective {
  // Define the outputs to match the old Hammer.js event names.
  @Output() swipeleft = new EventEmitter<void>();
  @Output() swiperight = new EventEmitter<void>();

  private startX: number = 0;
  // Minimum horizontal distance in pixels.
  private SWIPE_THRESHOLD_PX: number = 50;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    // Only record the start of the touch.
    this.startX = event.touches[0].clientX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    const endX = event.changedTouches[0].clientX;
    const diffX = endX - this.startX;

    // Check if the movement exceeds the threshold.
    if (Math.abs(diffX) > this.SWIPE_THRESHOLD_PX) {
      if (diffX > 0) {
        this.swiperight.emit();
      } else {
        this.swipeleft.emit();
      }
    }

    // Reset the start position.
    this.startX = 0;
  }
}
