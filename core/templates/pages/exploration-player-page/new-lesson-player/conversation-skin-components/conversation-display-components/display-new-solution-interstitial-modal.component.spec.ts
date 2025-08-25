// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for DisplayNewSolutionInterstitialModalComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {DisplayNewSolutionInterstititalModalComponent} from './display-new-solution-interstitial-modal.component';
import {MockTranslatePipe} from '../../../../../tests/unit-test-utils';

describe('Display Interstitial Solution Modal', () => {
  let fixture: ComponentFixture<DisplayNewSolutionInterstititalModalComponent>;
  let componentInstance: DisplayNewSolutionInterstititalModalComponent;
  let ngbActiveModal: jasmine.SpyObj<NgbActiveModal>;
  let matBottomSheetRef: jasmine.SpyObj<MatBottomSheetRef>;

  beforeEach(waitForAsync(() => {
    const ngbSpy = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);
    const matSpy = jasmine.createSpyObj('MatBottomSheetRef', ['dismiss']);

    TestBed.configureTestingModule({
      declarations: [
        DisplayNewSolutionInterstititalModalComponent,
        MockTranslatePipe,
      ],
      providers: [
        {provide: NgbActiveModal, useValue: ngbSpy},
        {provide: MatBottomSheetRef, useValue: matSpy},
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      DisplayNewSolutionInterstititalModalComponent
    );
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(
      NgbActiveModal
    ) as jasmine.SpyObj<NgbActiveModal>;
    matBottomSheetRef = TestBed.inject(
      MatBottomSheetRef
    ) as jasmine.SpyObj<MatBottomSheetRef>;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  describe('confirm', () => {
    it('should close NgbActiveModal when available', () => {
      componentInstance.confirm();
      expect(ngbActiveModal.close).toHaveBeenCalled();
    });

    it('should dismiss MatBottomSheetRef with "confirm" when NgbActiveModal is not available', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [
          DisplayNewSolutionInterstititalModalComponent,
          MockTranslatePipe,
        ],
        providers: [{provide: MatBottomSheetRef, useValue: matBottomSheetRef}],
      });

      const newFixture = TestBed.createComponent(
        DisplayNewSolutionInterstititalModalComponent
      );
      const newComponentInstance = newFixture.componentInstance;

      newComponentInstance.confirm();
      expect(matBottomSheetRef.dismiss).toHaveBeenCalledWith('confirm');
    });
  });

  describe('cancel', () => {
    it('should dismiss NgbActiveModal when available', () => {
      componentInstance.cancel();
      expect(ngbActiveModal.dismiss).toHaveBeenCalled();
    });

    it('should dismiss MatBottomSheetRef with "cancel" when NgbActiveModal is not available', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [
          DisplayNewSolutionInterstititalModalComponent,
          MockTranslatePipe,
        ],
        providers: [{provide: MatBottomSheetRef, useValue: matBottomSheetRef}],
      });

      const newFixture = TestBed.createComponent(
        DisplayNewSolutionInterstititalModalComponent
      );
      const newComponentInstance = newFixture.componentInstance;

      newComponentInstance.cancel();
      expect(matBottomSheetRef.dismiss).toHaveBeenCalledWith('cancel');
    });
  });
});
