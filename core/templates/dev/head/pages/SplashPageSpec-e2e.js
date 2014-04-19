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
 * @fileoverview End-to-end tests for the splash page.
 *
 * @author sll@google.com (Sean Lip)
 */

describe('splash page', function() {
  var ptor = protractor.getInstance();

  it('should have welcome text', function() {
    // Load the Oppia splash page.
    browser.get('/');

    element.all(by.css('.oppia-splash')).then(function(items) {
      expect(items.length).toBe(2);
      expect(items[0].getText()).toBe(
        'Bite-sized learning journeys, by anyone and for everyone');
    });
  });

  it('should show the correct buttons for a non-logged-in user', function() {
    browser.get('/');

    element.all(by.css('.btn-large')).then(function(items) {
      expect(items.length).toBe(3);
      expect(items[0].getText()).toBe('Browse the explorations gallery');
      expect(items[1].getText()).toBe('Learn more');
      expect(items[2].getText()).toBe('Create an Oppia account');

      items[1].click();
      expect(ptor.getCurrentUrl()).toContain('/about');
    });
  });
});
