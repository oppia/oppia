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
 * @fileoverview Unit tests for ClickTrackerService.
 */

import {TestBed} from '@angular/core/testing';
import {ClickTrackerService} from './click-tracker.service';

describe('ClickTrackerService', () => {
  let cts: ClickTrackerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    cts = TestBed.get(ClickTrackerService);
  });

  it('should be instantiated', () => {
    expect(cts).toBeTruthy();
  });

  it('should track clicks with .e2e-* class', () => {
    const button = document.createElement('button');
    button.classList.add('e2e-test-button');
    document.body.appendChild(button);

    button.click();

    expect(cts.getClickHistory()).toContain('e2e-test-button');

    document.body.removeChild(button);
  });

  it('should not track clicks without .e2e-* class', () => {
    const div = document.createElement('div');
    div.classList.add('non-e2e-class');
    document.body.appendChild(div);

    div.click();

    expect(cts.getClickHistory()).not.toContain('non-e2e-class');

    document.body.removeChild(div);
  });

  it('should respect maxLength and data size constraints', () => {
    for (let i = 0; i < 100; i++) {
      const div = document.createElement('div');
      div.classList.add(`e2e-test-${i}`);
      document.body.appendChild(div);
      div.click();
      document.body.removeChild(div);
    }

    const history = cts.getClickHistory();
    expect(history.length).toBeLessThanOrEqual(50); // maxLength is 50
  });

  it('should handle errors gracefully', () => {
    spyOn(console, 'error');
    const faultyEvent = {target: null} as unknown as Event;

    cts.trackClick(faultyEvent);

    expect(console.error).toHaveBeenCalledWith(
      'Error tracking click:',
      jasmine.any(Error)
    );
  });
});
