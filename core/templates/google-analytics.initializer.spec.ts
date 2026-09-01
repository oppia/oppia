// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Google Analytics initializer.
 */

import {initializeGoogleAnalytics} from 'google-analytics.initializer';

describe('Google analytics initializer', () => {
  it('should define a no-op gtag function when analytics is disabled', () => {
    // The analytics constants checked into the repository default to
    // CAN_SEND_ANALYTICS_EVENTS being disabled, so the initializer should set
    // up a mock gtag function and should not append any analytics scripts.
    const headAppendChildSpy = spyOn(document.head, 'appendChild');

    initializeGoogleAnalytics();

    expect(window.gtag).toBeDefined();
    expect(window.gtag).toEqual(jasmine.any(Function));
    expect(headAppendChildSpy).not.toHaveBeenCalled();
  });
});
