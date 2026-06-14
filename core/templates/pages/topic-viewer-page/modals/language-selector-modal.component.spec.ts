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
 * @fileoverview Unit tests for LanguageSelectorModalComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {NO_ERRORS_SCHEMA} from '@angular/core';

import {LanguageSelectorModalComponent} from './language-selector-modal.component';
import {LanguageUtilService} from 'domain/utilities/language-util.service';

describe('LanguageSelectorModalComponent', () => {
  let component: LanguageSelectorModalComponent;
  let fixture: ComponentFixture<LanguageSelectorModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let languageUtilService: jasmine.SpyObj<LanguageUtilService>;

  beforeEach(waitForAsync(() => {
    const languageUtilServiceSpy = jasmine.createSpyObj('LanguageUtilService', [
      'getContentLanguageDescription',
      'getAudioLanguageDescription',
    ]);

    TestBed.configureTestingModule({
      declarations: [LanguageSelectorModalComponent],
      providers: [
        NgbActiveModal,
        {
          provide: LanguageUtilService,
          useValue: languageUtilServiceSpy,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSelectorModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    languageUtilService = TestBed.inject(
      LanguageUtilService
    ) as jasmine.SpyObj<LanguageUtilService>;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dismiss the modal on cancel', () => {
    spyOn(ngbActiveModal, 'dismiss');

    component.cancel();

    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should set showValidationError when startLesson is called without text language', () => {
    component.selectedTextLanguageCode = null;
    component.showValidationError = false;

    component.startLesson();

    expect(component.showValidationError).toBeTrue();
  });

  it('should close the modal with result when startLesson is called with text language', () => {
    spyOn(ngbActiveModal, 'close');

    component.selectedTextLanguageCode = 'fr';
    component.selectedVoiceoverLanguageCode = 'hi';

    component.startLesson();

    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      selectedTextLanguageCode: 'fr',
      selectedVoiceoverLanguageCode: 'hi',
    });
  });

  it('should close the modal with null voiceover when not selected', () => {
    spyOn(ngbActiveModal, 'close');

    component.selectedTextLanguageCode = 'en';
    component.selectedVoiceoverLanguageCode = null;

    component.startLesson();

    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      selectedTextLanguageCode: 'en',
      selectedVoiceoverLanguageCode: null,
    });
  });

  it('should return preferred language description', () => {
    languageUtilService.getContentLanguageDescription.and.returnValue(
      'Portuguese'
    );
    component.preferredLanguageCode = 'pt';

    expect(component.getPreferredLanguageDescription()).toBe('Portuguese');
    expect(
      languageUtilService.getContentLanguageDescription
    ).toHaveBeenCalledWith('pt');
  });

  it('should return language code when description is not available', () => {
    languageUtilService.getContentLanguageDescription.and.returnValue('');
    component.preferredLanguageCode = 'xx';

    expect(component.getPreferredLanguageDescription()).toBe('xx');
  });
});
