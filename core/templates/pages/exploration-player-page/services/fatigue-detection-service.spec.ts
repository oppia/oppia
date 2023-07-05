// Copyright 2020 The Oppia Authors. All Rights Reserved.
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



import { TestBed } from '@angular/core/testing';
import { FatigueDetectionService } from 'pages/exploration-player-page/services/fatigue-detection.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

describe('Fatigue detection service', () => {
  let fatigueDetectionService: FatigueDetectionService;
  let ngbModal: NgbModal;

  beforeEach(() => {
    fatigueDetectionService = TestBed.inject(FatigueDetectionService);
    ngbModal = TestBed.inject(NgbModal);
  });

  beforeEach(() => {
    jasmine.clock().uninstall();
    jasmine.clock().install();
    jasmine.clock().mockDate();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe('isSubmittingTooFast', () => {
    it('should return true for 4 or more submissions in under 10 seconds',
      () => {
        fatigueDetectionService.recordSubmissionTimestamp();
        jasmine.clock().tick(100);
        fatigueDetectionService.recordSubmissionTimestamp();
        jasmine.clock().tick(100);
        fatigueDetectionService.recordSubmissionTimestamp();
        jasmine.clock().tick(100);
        fatigueDetectionService.recordSubmissionTimestamp();
        expect(fatigueDetectionService.isSubmittingTooFast()).toBe(true);

        jasmine.clock().tick(100);
        fatigueDetectionService.recordSubmissionTimestamp();
        expect(fatigueDetectionService.isSubmittingTooFast()).toBe(true);
      });

    it('should return false for 4 or more submissions in over 10 seconds',
      () => {
        fatigueDetectionService.recordSubmissionTimestamp();
        jasmine.clock().tick(100);
        fatigueDetectionService.recordSubmissionTimestamp();
        jasmine.clock().tick(100);
        fatigueDetectionService.recordSubmissionTimestamp();
        jasmine.clock().tick(10000);
        fatigueDetectionService.recordSubmissionTimestamp();
        expect(fatigueDetectionService.isSubmittingTooFast()).toBe(false);

        jasmine.clock().tick(100);
        fatigueDetectionService.recordSubmissionTimestamp();
        expect(fatigueDetectionService.isSubmittingTooFast()).toBe(false);
      });

    it('should return false for less than 4 submissions', () => {
      fatigueDetectionService.recordSubmissionTimestamp();
      expect(fatigueDetectionService.isSubmittingTooFast()).toBe(false);

      jasmine.clock().tick(1000);
      fatigueDetectionService.recordSubmissionTimestamp();
      expect(fatigueDetectionService.isSubmittingTooFast()).toBe(false);

      jasmine.clock().tick(1000);
      fatigueDetectionService.recordSubmissionTimestamp();
      expect(fatigueDetectionService.isSubmittingTooFast()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should properly reset submissions', () => {
      fatigueDetectionService.recordSubmissionTimestamp();
      jasmine.clock().tick(1000);
      fatigueDetectionService.recordSubmissionTimestamp();
      jasmine.clock().tick(1000);
      fatigueDetectionService.recordSubmissionTimestamp();
      jasmine.clock().tick(1000);
      fatigueDetectionService.recordSubmissionTimestamp();
      expect(fatigueDetectionService.isSubmittingTooFast()).toBe(true);

      fatigueDetectionService.reset();

      expect(fatigueDetectionService.isSubmittingTooFast()).toBe(false);
    });
  });

  it('should display take break message', () => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
      return {
        result: Promise.resolve()
      } as NgbModalRef;
    });
    fatigueDetectionService.displayTakeBreakMessage();

    expect(modalSpy).toHaveBeenCalled();
  });
});
