// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for TimeExpiredModalComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {TimeExpiredModalComponent} from './time-expired-modal.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';

describe('TimeExpiredModalComponent', () => {
  let component: TimeExpiredModalComponent;
  let fixture: ComponentFixture<TimeExpiredModalComponent>;
  let ngbActiveModal: jasmine.SpyObj<NgbActiveModal>;
  let bottomSheetRef: jasmine.SpyObj<MatBottomSheetRef>;

  beforeEach(waitForAsync(() => {
    const ngbSpy = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);
    const matSpy = jasmine.createSpyObj('MatBottomSheetRef', ['dismiss']);

    TestBed.configureTestingModule({
      declarations: [TimeExpiredModalComponent, MockTranslatePipe],
      providers: [
        {provide: NgbActiveModal, useValue: ngbSpy},
        {provide: MatBottomSheetRef, useValue: matSpy},
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeExpiredModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(
      NgbActiveModal
    ) as jasmine.SpyObj<NgbActiveModal>;
    bottomSheetRef = TestBed.inject(
      MatBottomSheetRef
    ) as jasmine.SpyObj<MatBottomSheetRef>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should render the title and message', () => {
    const title = fixture.debugElement.query(
      By.css('#time-expired-modal-title')
    );
    const message = fixture.debugElement.query(
      By.css('#time-expired-modal-message')
    );

    expect(title).toBeTruthy();
    expect(message).toBeTruthy();
  });

  it('should render the time-up icon as a standalone image', () => {
    const icon = fixture.debugElement.query(By.css('.assessment-modal-icon'));

    expect(icon).toBeTruthy();
    expect(icon.nativeElement.getAttribute('src')).toBe(
      '/assets/images/certificates/time-up-icon.svg'
    );
    expect(icon.nativeElement.getAttribute('alt')).toBe('');
  });

  describe('dismiss', () => {
    it('should dismiss NgbActiveModal when available', () => {
      component.dismiss();
      expect(ngbActiveModal.dismiss).toHaveBeenCalled();
    });

    it('should dismiss the modal when the header close button is clicked', () => {
      const closeButton = fixture.debugElement.query(By.css('.btn-close'));

      closeButton.triggerEventHandler('click', null);

      expect(ngbActiveModal.dismiss).toHaveBeenCalled();
    });

    it('should dismiss MatBottomSheetRef when NgbActiveModal is not available', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [TimeExpiredModalComponent, MockTranslatePipe],
        providers: [{provide: MatBottomSheetRef, useValue: bottomSheetRef}],
      });

      const newFixture = TestBed.createComponent(TimeExpiredModalComponent);
      const newComponentInstance = newFixture.componentInstance;

      newComponentInstance.dismiss();
      expect(bottomSheetRef.dismiss).toHaveBeenCalled();
    });
  });

  describe('viewResults', () => {
    it('should close NgbActiveModal when available', () => {
      component.viewResults();
      expect(ngbActiveModal.close).toHaveBeenCalled();
    });

    it('should close the modal when the action button is clicked', () => {
      const viewResultsButton = fixture.debugElement.query(
        By.css('.assessment-modal-action-button')
      );

      viewResultsButton.triggerEventHandler('click', null);

      expect(ngbActiveModal.close).toHaveBeenCalled();
    });

    it('should dismiss MatBottomSheetRef when NgbActiveModal is not available', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [TimeExpiredModalComponent, MockTranslatePipe],
        providers: [{provide: MatBottomSheetRef, useValue: bottomSheetRef}],
      });

      const newFixture = TestBed.createComponent(TimeExpiredModalComponent);
      const newComponentInstance = newFixture.componentInstance;

      newComponentInstance.viewResults();
      expect(bottomSheetRef.dismiss).toHaveBeenCalled();
    });
  });
});
