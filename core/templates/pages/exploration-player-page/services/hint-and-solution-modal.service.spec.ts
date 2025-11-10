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
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {HintAndSolutionModalService} from './hint-and-solution-modal.service';
import {WindowDimensionsService} from '../../../services/contextual/window-dimensions.service';

describe('Hint and Solution Modal Service', () => {
  let hintAndSolutionModalService: HintAndSolutionModalService;
  let windowDimensionsService: WindowDimensionsService;

  class MockNgbModal {
    open(): {componentInstance: {index: number; activeHintIndex: number}} {
      return {
        componentInstance: {
          index: 0,
          activeHintIndex: 0,
        },
      };
    }
  }

  class MockMatBottomSheet {
    open() {
      return {
        componentInstance: {},
      };
    }
  }

  class MockWindowDimensionsService {
    getWidth(): number {
      return 1024;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: MatBottomSheet,
          useClass: MockMatBottomSheet,
        },
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    hintAndSolutionModalService = TestBed.inject(HintAndSolutionModalService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
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

  it('should display new hint modal on desktop', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(1024);
    expect(hintAndSolutionModalService.displayNewHintModal(1)).toBeDefined();
  });

  it('should display new hint modal on mobile', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(320);
    expect(hintAndSolutionModalService.displayNewHintModal(1)).toBeDefined();
  });

  it('should display new solution modal on desktop', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(1024);
    expect(hintAndSolutionModalService.displayNewSolutionModal()).toBeDefined();
  });

  it('should display new solution modal on mobile', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(320);
    expect(hintAndSolutionModalService.displayNewSolutionModal()).toBeDefined();
  });

  it('should display new solution interstitial modal on desktop', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(1024);
    expect(
      hintAndSolutionModalService.displayNewSolutionInterstitialModal()
    ).toBeDefined();
  });

  it('should display new solution interstitial modal on mobile', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(320);
    expect(
      hintAndSolutionModalService.displayNewSolutionInterstitialModal()
    ).toBeDefined();
  });
});
