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
 * @fileoverview End-to-end tests for the reader view.
 *
 * @author sll@google.com (Sean Lip)
 */

describe('Iframed reader view', function() {
  // TODO(sll): Ensure that exploration 0 is loaded prior to running the
  // checks.

  beforeEach(function() {
    browser().navigateTo('/explore/0?iframed=true');
  });

  it('should have a \'Clear history and restart\' link', function() {
    expect(element('a').text()).toContain('Clear history and restart');
  });

  it('should not have a \'Return to the gallery\' link', function() {
    expect(element('a').text()).not().toContain('Return to the gallery');
  });
});
