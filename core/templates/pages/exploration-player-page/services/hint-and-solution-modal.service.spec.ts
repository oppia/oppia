// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for HintAndSolutionModalService.
 */

import {TestBed, waitForAsync} from '@angular/core/testing';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {HintAndSolutionModalService} from './hint-and-solution-modal.service';

describe('Hint and Solution Modal Service', () => {
  let hintAndSolutionModalService: HintAndSolutionModalService;

  class MockNgbModal {
    open(): {componentInstance: {index: number}} {
      return {
        componentInstance: {
          index: 0,
        },
      };
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    hintAndSolutionModalService = TestBed.inject(HintAndSolutionModalService);
  });

  it('should display hint modal', () => {
    expect(hintAndSolutionModalService.displayHintModal(1)).toBeDefined();
  });

  it('should display solution modal', () => {
    expect(hintAndSolutionModalService.displaySolutionModal()).toBeDefined();
  });

  it('should display solution interstitial modal', () => {
    expect(
      hintAndSolutionModalService.displaySolutionInterstitialModal()
    ).toBeDefined();
  });
});
