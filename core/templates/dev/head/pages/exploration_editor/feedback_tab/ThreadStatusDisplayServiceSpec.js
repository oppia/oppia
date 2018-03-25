// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ThreadStatusDisplayService, that provides
 * information about how to display the status label for a thread in the
 * feedback tab of the exploration editor.
 */

describe('Thread Status Display Service', function() {
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
  var ThreadStatusDisplayService;
  beforeEach(inject(function(_ThreadStatusDisplayService_) {
    ThreadStatusDisplayService = _ThreadStatusDisplayService_;
  }));

  it('should give human readable status for status choice', function() {
    var mockStatusChoices = ThreadStatusDisplayService.STATUS_CHOICES;

    for (var i = 0; i < mockStatusChoices.length; i++) {
      mockStatusID = mockStatusChoices[i].id;
      expect(
        ThreadStatusDisplayService.getHumanReadableStatus(
          mockStatusID)).toBe(mockStatusChoices[i].text);
    }

    var mockStatusID = 'INVALID_STATUS';
    expect(
      ThreadStatusDisplayService.getHumanReadableStatus(
        mockStatusID)).toBe('');
  });

  it('should give appropriate label class for status id', function() {
    var mockStatusID = 'open';
    expect(ThreadStatusDisplayService.getLabelClass(mockStatusID)).toBe(
      'label label-info');

    mockStatusID = 'fixed';
    expect(ThreadStatusDisplayService.getLabelClass(mockStatusID)).toBe(
      'label label-default');

    mockStatusID = 'ignored';
    expect(ThreadStatusDisplayService.getLabelClass(mockStatusID)).toBe(
      'label label-default');

    mockStatusID = 'not_actionable';
    expect(ThreadStatusDisplayService.getLabelClass(mockStatusID)).toBe(
      'label label-default');

    mockStatusID = 'compliment';
    expect(ThreadStatusDisplayService.getLabelClass(mockStatusID)).toBe(
      'label label-default');
  });
});
