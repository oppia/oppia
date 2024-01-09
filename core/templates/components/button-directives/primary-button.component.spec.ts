// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for PrimaryButtonComponent
 */

import { PrimaryButtonComponent } from './primary-button.component';
import { TestBed, ComponentFixture } from '@angular/core/testing';

describe('PrimaryButtonComponent', () => {
  let component: PrimaryButtonComponent;
  let fixture: ComponentFixture<PrimaryButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PrimaryButtonComponent],
    });

    fixture = TestBed.createComponent(PrimaryButtonComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the correct buttonText', () => {
    component.buttonText = 'Click me';
    fixture.detectChanges();
    const buttonElement = fixture.nativeElement.querySelector('button');
    expect(buttonElement.textContent.trim()).toBe('Click me');
  });

  it('should apply custom classes to the button', () => {
    component.customClasses = ['custom-class-1', 'custom-class-2'];
    fixture.detectChanges();
    const buttonElement = fixture.nativeElement.querySelector('button');
    expect(buttonElement.classList.contains('custom-class-1')).toBe(true);
    expect(buttonElement.classList.contains('custom-class-2')).toBe(true);
  });
});
