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
  let service: ClickTrackerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClickTrackerService],
    });
    service = TestBed.get(ClickTrackerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should track clicks with .e2e-* class', () => {
    const element = document.createElement('div');
    element.classList.add('e2e-test-button');
    document.body.appendChild(element);

    element.click();

    const clickHistory = service.getClickHistory();
    expect(clickHistory).toContain('e2e-test-button');
    document.body.removeChild(element);
  });

  it('should not track clicks without .e2e-* class', () => {
    const element = document.createElement('div');
    element.classList.add('non-e2e-button');
    document.body.appendChild(element);

    element.click();

    const clickHistory = service.getClickHistory();
    expect(clickHistory).not.toContain('non-e2e-button');
    document.body.removeChild(element);
  });

  it('should limit click history to maxLength', () => {
    for (let i = 0; i < 60; i++) {
      const element = document.createElement('div');
      element.classList.add(`e2e-test-button-${i}`);
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }

    const clickHistory = service.getClickHistory();
    expect(clickHistory.length).toBe(50);
    expect(clickHistory).toContain('e2e-test-button-59');
    expect(clickHistory).not.toContain('e2e-test-button-0');
  });

  it('should limit click history size to 16KB', () => {
    const largeClass = 'e2e-' + 'a'.repeat(10000); // Create a large class name.
    for (let i = 0; i < 10; i++) {
      const element = document.createElement('div');
      element.classList.add(largeClass);
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }

    const clickHistory = service.getClickHistory();
    expect(new Blob([JSON.stringify(clickHistory)]).size).toBeLessThanOrEqual(
      16 * 1024
    );
  });

  it('should handle errors gracefully during click tracking', () => {
    const invalidEvent = {} as Event;
    expect(() => service.trackClick(invalidEvent)).not.toThrowError();
  });
});
