// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to track click of .e2e-* class.
 */

import {Injectable} from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class ClickTrackerService {
  private clickHistory: string[] = [];
  private readonly maxLength = 50;

  constructor() {
    document.addEventListener('click', event => this.trackClick(event));
  }

  trackClick(event: Event): void {
    try {
      const target = event.target as HTMLElement;
      if (!target) {
        return;
      }

      // Checking for .e2e-* class.
      const e2eClass = Array.from(target.classList).find(cls =>
        cls.startsWith('e2e-')
      );
      if (e2eClass) {
        this.clickHistory.push(e2eClass);

        // Checking for maximum length and size constraints.
        let clickDataSize = new Blob([JSON.stringify(this.clickHistory)]).size;
        while (
          (this.clickHistory.length > this.maxLength ||
            clickDataSize > 16 * 1024) &&
          this.clickHistory.length > 0
        ) {
          this.clickHistory.shift();
          clickDataSize = new Blob([JSON.stringify(this.clickHistory)]).size;
        }
      }
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }

  getClickHistory(): string[] {
    return this.clickHistory;
  }
}
