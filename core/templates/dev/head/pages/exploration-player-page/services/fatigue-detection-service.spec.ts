// Copyright 2017 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for the Fatigue Detection service.
 */

require('pages/exploration-player-page/services/fatigue-detection.service.ts');

describe('Fatigue detection service', function() {
  beforeEach(angular.mock.module('oppia'));

  var FatigueDetectionService = null;
  beforeEach(angular.mock.inject(function($injector) {
    FatigueDetectionService = $injector.get('FatigueDetectionService');
  }));

  beforeEach(function() {
    jasmine.clock().uninstall();
    jasmine.clock().install();
    jasmine.clock().mockDate();
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  describe('isSubmittingTooFast', function() {
    it('should return true for 4 or more submissions in under 10 seconds',
      function() {
        FatigueDetectionService.recordSubmissionTimestamp();
        jasmine.clock().tick(100);
        FatigueDetectionService.recordSubmissionTimestamp();
        jasmine.clock().tick(100);
        FatigueDetectionService.recordSubmissionTimestamp();
        jasmine.clock().tick(100);
        FatigueDetectionService.recordSubmissionTimestamp();
        expect(FatigueDetectionService.isSubmittingTooFast()).toBe(true);

        jasmine.clock().tick(100);
        FatigueDetectionService.recordSubmissionTimestamp();
        expect(FatigueDetectionService.isSubmittingTooFast()).toBe(true);
      });

    it('should return false for 4 or more submissions in over 10 seconds',
      function() {
        FatigueDetectionService.recordSubmissionTimestamp();
        jasmine.clock().tick(100);
        FatigueDetectionService.recordSubmissionTimestamp();
        jasmine.clock().tick(100);
        FatigueDetectionService.recordSubmissionTimestamp();
        jasmine.clock().tick(10000);
        FatigueDetectionService.recordSubmissionTimestamp();
        expect(FatigueDetectionService.isSubmittingTooFast()).toBe(false);

        jasmine.clock().tick(100);
        FatigueDetectionService.recordSubmissionTimestamp();
        expect(FatigueDetectionService.isSubmittingTooFast()).toBe(false);
      });

    it('should return false for less than 4 submissions', function() {
      FatigueDetectionService.recordSubmissionTimestamp();
      expect(FatigueDetectionService.isSubmittingTooFast()).toBe(false);

      jasmine.clock().tick(1000);
      FatigueDetectionService.recordSubmissionTimestamp();
      expect(FatigueDetectionService.isSubmittingTooFast()).toBe(false);

      jasmine.clock().tick(1000);
      FatigueDetectionService.recordSubmissionTimestamp();
      expect(FatigueDetectionService.isSubmittingTooFast()).toBe(false);
    });
  });

  describe('reset', function() {
    it('should properly reset submissions', function() {
      FatigueDetectionService.recordSubmissionTimestamp();
      jasmine.clock().tick(1000);
      FatigueDetectionService.recordSubmissionTimestamp();
      jasmine.clock().tick(1000);
      FatigueDetectionService.recordSubmissionTimestamp();
      jasmine.clock().tick(1000);
      FatigueDetectionService.recordSubmissionTimestamp();
      expect(FatigueDetectionService.isSubmittingTooFast()).toBe(true);

      FatigueDetectionService.reset();

      expect(FatigueDetectionService.isSubmittingTooFast()).toBe(false);
    });
  });
});
