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
 * @fileoverview Unit tests for UnansweredQuestionModalComponent.
 */

import {Pipe, PipeTransform} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {UnansweredQuestionModalComponent} from './unanswered-question-modal.component';

@Pipe({name: 'translate'})
class MockTranslatePipe implements PipeTransform {
  transform(
    value: string,
    params?: {unansweredQuestionCount?: number}
  ): string {
    if (params && params.unansweredQuestionCount !== undefined) {
      return `${value}: ${params.unansweredQuestionCount}`;
    }
    return value;
  }
}

describe('UnansweredQuestionModalComponent', () => {
  let component: UnansweredQuestionModalComponent;
  let fixture: ComponentFixture<UnansweredQuestionModalComponent>;
  let ngbActiveModal: jasmine.SpyObj<NgbActiveModal>;
  let bottomSheetRef: jasmine.SpyObj<MatBottomSheetRef>;

  beforeEach(waitForAsync(() => {
    const ngbSpy = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);
    const matSpy = jasmine.createSpyObj('MatBottomSheetRef', ['dismiss']);

    TestBed.configureTestingModule({
      declarations: [UnansweredQuestionModalComponent, MockTranslatePipe],
      providers: [
        {provide: NgbActiveModal, useValue: ngbSpy},
        {provide: MatBottomSheetRef, useValue: matSpy},
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnansweredQuestionModalComponent);
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
      By.css('#unanswered-question-modal-title')
    );
    const message = fixture.debugElement.query(
      By.css('#unanswered-question-modal-message')
    );

    expect(title).toBeTruthy();
    expect(message).toBeTruthy();
  });

  it('should render the unanswered warning icon as a standalone image', () => {
    const icon = fixture.debugElement.query(By.css('.assessment-modal-icon'));

    expect(icon).toBeTruthy();
    expect(icon.nativeElement.getAttribute('src')).toBe(
      '/assets/images/certificates/unanswered-warning-icon.svg'
    );
    expect(icon.nativeElement.getAttribute('alt')).toBe('');
  });

  it('should render the unanswered question count provided via the input', () => {
    let message = fixture.debugElement.query(
      By.css('#unanswered-question-modal-message')
    );
    expect(message.nativeElement.textContent).toContain('3');

    component.unansweredQuestionCount = 5;
    fixture.detectChanges();
    message = fixture.debugElement.query(
      By.css('#unanswered-question-modal-message')
    );
    expect(message.nativeElement.textContent).toContain('5');
  });

  describe('goBackToAssessment', () => {
    it('should dismiss NgbActiveModal when available', () => {
      component.goBackToAssessment();
      expect(ngbActiveModal.dismiss).toHaveBeenCalled();
    });

    it('should dismiss the modal when the header close button is clicked', () => {
      const closeButton = fixture.debugElement.query(By.css('.btn-close'));

      closeButton.triggerEventHandler('click', null);

      expect(ngbActiveModal.dismiss).toHaveBeenCalled();
    });

    it('should dismiss the modal when the inline go-back button is clicked', () => {
      const goBackButton = fixture.debugElement.query(
        By.css('.assessment-modal-inline-key')
      );

      goBackButton.triggerEventHandler('click', null);

      expect(ngbActiveModal.dismiss).toHaveBeenCalled();
    });

    it('should dismiss MatBottomSheetRef when NgbActiveModal is not available', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [UnansweredQuestionModalComponent, MockTranslatePipe],
        providers: [{provide: MatBottomSheetRef, useValue: bottomSheetRef}],
      });

      const newFixture = TestBed.createComponent(
        UnansweredQuestionModalComponent
      );
      const newComponentInstance = newFixture.componentInstance;

      newComponentInstance.goBackToAssessment();
      expect(bottomSheetRef.dismiss).toHaveBeenCalled();
    });
  });

  describe('submitAnyway', () => {
    it('should close NgbActiveModal when available', () => {
      component.submitAnyway();
      expect(ngbActiveModal.close).toHaveBeenCalled();
    });

    it('should close the modal when the submit button is clicked', () => {
      const submitButton = fixture.debugElement.query(
        By.css('.assessment-modal-action-button')
      );

      submitButton.triggerEventHandler('click', null);

      expect(ngbActiveModal.close).toHaveBeenCalled();
    });

    it('should dismiss MatBottomSheetRef when NgbActiveModal is not available', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [UnansweredQuestionModalComponent, MockTranslatePipe],
        providers: [{provide: MatBottomSheetRef, useValue: bottomSheetRef}],
      });

      const newFixture = TestBed.createComponent(
        UnansweredQuestionModalComponent
      );
      const newComponentInstance = newFixture.componentInstance;

      newComponentInstance.submitAnyway();
      expect(bottomSheetRef.dismiss).toHaveBeenCalled();
    });
  });
});
