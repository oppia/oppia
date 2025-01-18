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
 * @fileoverview Unit tests for ConfirmationModalComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ConfirmationModalComponent} from './confirmation-modal.component';

describe('ConfirmationModalComponent', () => {
  let component: ConfirmationModalComponent;
  let fixture: ComponentFixture<ConfirmationModalComponent>;
  let activeModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmationModalComponent],
      providers: [NgbActiveModal],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmationModalComponent);
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal);
    component.content = {
      title: 'Test Title',
      message: 'Test Message',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('UI elements', () => {
    it('should display correct title', () => {
      const titleElement = fixture.nativeElement.querySelector('.modal-title');
      expect(titleElement.textContent).toContain('Test Title');
    });

    it('should display correct message', () => {
      const messageElement =
        fixture.nativeElement.querySelector('.modal-body p');
      expect(messageElement.textContent).toContain('Test Message');
    });

    it('should display correct button texts', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const cancelButton = buttons[1];
      const confirmButton = buttons[2];
      expect(cancelButton.textContent.trim()).toBe('Cancel');
      expect(confirmButton.textContent.trim()).toBe('Confirm');
    });
  });

  describe('Modal interactions', () => {
    it('should dismiss modal when close button is clicked', () => {
      spyOn(activeModal, 'dismiss');
      const closeButton = fixture.nativeElement.querySelector('.close');
      closeButton.click();
      expect(activeModal.dismiss).toHaveBeenCalled();
    });

    it('should dismiss modal when cancel button is clicked', () => {
      spyOn(activeModal, 'dismiss');
      const cancelButton =
        fixture.nativeElement.querySelector('.btn-secondary');
      cancelButton.click();
      expect(activeModal.dismiss).toHaveBeenCalled();
    });

    it('should close modal with "confirm" when confirm button is clicked', () => {
      spyOn(activeModal, 'close');
      const confirmButton = fixture.nativeElement.querySelector('.btn-success');
      confirmButton.click();
      expect(activeModal.close).toHaveBeenCalledWith('confirm');
    });
  });

  describe('Content updates', () => {
    it('should update display when content input changes', () => {
      component.content = {
        title: 'New Title',
        message: 'New Message',
        confirmText: 'Yes',
        cancelText: 'No',
      };
      fixture.detectChanges();

      const titleElement = fixture.nativeElement.querySelector('.modal-title');
      const messageElement =
        fixture.nativeElement.querySelector('.modal-body p');
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const cancelButton = buttons[1];
      const confirmButton = buttons[2];

      expect(titleElement.textContent).toContain('New Title');
      expect(messageElement.textContent).toContain('New Message');
      expect(cancelButton.textContent.trim()).toBe('No');
      expect(confirmButton.textContent.trim()).toBe('Yes');
    });

    it('should handle undefined content gracefully', () => {
      const newFixture = TestBed.createComponent(ConfirmationModalComponent);
      const newComponent = newFixture.componentInstance;

      expect(() => {
        newFixture.detectChanges();
      }).not.toThrow();
    });
  });

  describe('Input validation', () => {
    it('should handle empty strings in content', () => {
      component.content = {
        title: '',
        message: '',
        confirmText: '',
        cancelText: '',
      };
      fixture.detectChanges();

      const titleElement = fixture.nativeElement.querySelector('.modal-title');
      const messageElement =
        fixture.nativeElement.querySelector('.modal-body p');
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const cancelButton = buttons[1];
      const confirmButton = buttons[2];

      expect(titleElement.textContent).toBe('');
      expect(messageElement.textContent).toBe('');
      expect(cancelButton.textContent.trim()).toBe('');
      expect(confirmButton.textContent.trim()).toBe('');
    });
  });
});
