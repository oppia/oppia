// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TranslationTutorialImageCustomizationModalComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {JoyrideModule} from 'ngx-joyride';
import {RouterTestingModule} from '@angular/router/testing';

import {TranslationTutorialImageCustomizationModalComponent} from './translation-tutorial-image-customization-modal.component';

describe('Translation Tutorial Image Customization Modal Component', () => {
  let component: TranslationTutorialImageCustomizationModalComponent;
  let fixture: ComponentFixture<TranslationTutorialImageCustomizationModalComponent>;
  let activeModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [JoyrideModule.forRoot(), RouterTestingModule],
      declarations: [TranslationTutorialImageCustomizationModalComponent],
      providers: [NgbActiveModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      TranslationTutorialImageCustomizationModalComponent
    );
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal);
  });

  it('should dismiss the modal when the close button is clicked', () => {
    const dismissSpy = spyOn(activeModal, 'dismiss');

    component.close();

    expect(dismissSpy).toHaveBeenCalledWith('cancel');
  });

  it('should dismiss the modal when delete is clicked', () => {
    const dismissSpy = spyOn(activeModal, 'dismiss');

    component.delete();

    expect(dismissSpy).toHaveBeenCalledWith('delete');
  });

  it('should close the modal when done is clicked', () => {
    const closeSpy = spyOn(activeModal, 'close');

    component.done();

    expect(closeSpy).toHaveBeenCalledWith('done');
  });
});
