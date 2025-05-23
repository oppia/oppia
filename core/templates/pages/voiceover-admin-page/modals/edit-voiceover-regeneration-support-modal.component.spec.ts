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
 * @fileoverview Tests for language accent settings for Oppia’s voiceover.
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  waitForAsync,
} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {EditVoiceoverRegenerationSupportModalComponent} from './edit-voiceover-regeneration-support-modal.component';
import {MatTableModule} from '@angular/material/table';
import {MaterialModule} from 'modules/material.module';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('Edit voiceover regeneration support confirmation modal', () => {
  let fixture: ComponentFixture<EditVoiceoverRegenerationSupportModalComponent>;
  let componentInstance: EditVoiceoverRegenerationSupportModalComponent;

  let closeSpy: jasmine.Spy;
  let dismissSpy: jasmine.Spy;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatTableModule,
        MaterialModule,
        FormsModule,
        HttpClientTestingModule,
      ],
      declarations: [EditVoiceoverRegenerationSupportModalComponent],
      providers: [NgbActiveModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      EditVoiceoverRegenerationSupportModalComponent
    );
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
  });

  it('should initialize component', fakeAsync(() => {
    expect(componentInstance.headerText).toBe('');

    componentInstance.supportsAutogeneration = true;
    componentInstance.ngOnInit();

    expect(componentInstance.headerText).toBe(
      `Do you want to turn on autogeneration for ${componentInstance.languageDescription} voiceovers?`
    );

    componentInstance.supportsAutogeneration = false;
    componentInstance.ngOnInit();

    expect(componentInstance.headerText).toBe(
      `Do you want to turn off autogeneration for ${componentInstance.languageDescription} voiceovers?`
    );
  }));

  it('should be able to close modal', () => {
    componentInstance.update();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should be able to dismiss modal', () => {
    componentInstance.cancel();
    expect(dismissSpy).toHaveBeenCalled();
  });
});
