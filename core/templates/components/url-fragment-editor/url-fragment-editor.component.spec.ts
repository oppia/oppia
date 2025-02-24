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
 * @fileoverview Unit tests for UrlFragmentEditorComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {UrlFragmentEditorComponent} from './url-fragment-editor.component';

describe('UrlFragmentEditorComponent', () => {
  let component: UrlFragmentEditorComponent;
  let fixture: ComponentFixture<UrlFragmentEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UrlFragmentEditorComponent],
      imports: [FormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UrlFragmentEditorComponent);
    component = fixture.componentInstance;
    // Set default input values.
    component.label = 'Test Label';
    component.placeholder = 'Enter text here';
    component.maxLength = 30;
    component.fragmentType = 'topic';
    component.generatedUrlPrefix = 'https://example.com';
    component.fragmentIsDuplicate = false;
    component.disabled = false;
    component.urlFragment = '';
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should format URL fragment correctly', () => {
    component.urlFragment = '  Test Fragment   ';
    component.formatUrlFragment();
    expect(component.urlFragment).toBe('test-fragment');
  });

  it('should emit blur event when input loses focus', () => {
    spyOn(component.blur, 'emit');
    component.onBlur();
    expect(component.blur.emit).toHaveBeenCalled();
  });

  it('should emit formatted URL fragment on change', () => {
    spyOn(component.urlFragmentChange, 'emit');
    component.urlFragment = 'New Fragment';
    component.onChange();
    expect(component.urlFragment).toBe('new-fragment');
    expect(component.urlFragmentChange.emit).toHaveBeenCalledWith(
      'new-fragment'
    );
  });

  it('should emit empty string when input is cleared', () => {
    spyOn(component.urlFragmentChange, 'emit');
    component.urlFragment = '';
    component.onChange();
    expect(component.urlFragment).toBe('');
    expect(component.urlFragmentChange.emit).toHaveBeenCalledWith('');
  });

  it('should not change already formatted input', () => {
    component.urlFragment = 'test-fragment';
    component.onChange();
    expect(component.urlFragment).toBe('test-fragment');
  });

  it('should apply valid URL fragment regex validation', () => {
    const validFragment = 'valid-fragment';
    const invalidFragment = 'Invalid Fragment!';

    component.urlFragment = validFragment;
    expect(
      component.validUrlFragmentRegex.test(component.urlFragment)
    ).toBeTrue();

    component.urlFragment = invalidFragment;
    expect(
      component.validUrlFragmentRegex.test(component.urlFragment)
    ).toBeFalse();
  });

  it('should display error message for invalid URL fragments', () => {
    component.urlFragment = 'Invalid Fragment!';
    fixture.detectChanges();

    const errorElement: HTMLElement = fixture.nativeElement.querySelector(
      '.oppia-input-box-subtitle.text-danger'
    );
    expect(errorElement.hidden).toBeFalse();
    expect(errorElement.textContent?.trim()).toBe(
      'Please use only lowercase letters and hyphens.'
    );
  });

  it('should hide error message for valid URL fragments', () => {
    component.urlFragment = 'valid-fragment';
    fixture.detectChanges();

    const errorElement: HTMLElement = fixture.nativeElement.querySelector(
      '.oppia-input-box-subtitle.text-danger'
    );
    expect(errorElement.hidden).toBeTrue();
  });

  it('should display duplicate fragment error if fragmentIsDuplicate is true', () => {
    component.fragmentIsDuplicate = true;
    fixture.detectChanges();

    const duplicateErrorElement: HTMLElement =
      fixture.nativeElement.querySelector(
        '.oppia-input-box-subtitle.text-danger em'
      );
    expect(duplicateErrorElement.textContent?.trim()).toBe(
      'This topic URL fragment already exists.'
    );
  });

  it('should hide duplicate fragment error if fragmentIsDuplicate is false', () => {
    component.fragmentIsDuplicate = false;
    fixture.detectChanges();

    const duplicateErrorElement: HTMLElement =
      fixture.nativeElement.querySelector(
        '.oppia-input-box-subtitle.text-danger em'
      );
    expect(duplicateErrorElement).toBeNull();
  });

  it('should enable input field when disabled input is false', async () => {
    component.disabled = false;
    await fixture.whenStable();
    fixture.detectChanges();

    const inputElement: HTMLInputElement =
      fixture.nativeElement.querySelector('.form-control');
    expect(inputElement.disabled).toBeFalse();
  });

  it('should disable input field when disabled input is true', async () => {
    component.disabled = true;
    await fixture.whenStable();
    fixture.detectChanges();

    const inputElement: HTMLInputElement =
      fixture.nativeElement.querySelector('.form-control');
    expect(inputElement.disabled).toBeTrue();
  });

  it('should return false when urlFragment is empty', () => {
    component.urlFragment = '';
    component.fragmentIsDuplicate = false;
    expect(component.shouldInvalidUrlFragmentMessageBeShown()).toBeFalse();
  });

  it('should return false when urlFragment contains spaces', () => {
    component.urlFragment = '   ';
    component.fragmentIsDuplicate = false;
    expect(component.shouldInvalidUrlFragmentMessageBeShown()).toBeFalse();
  });

  it('should return true when urlFragment is duplicate', () => {
    component.urlFragment = 'test-url';
    component.fragmentIsDuplicate = true;
    expect(component.shouldInvalidUrlFragmentMessageBeShown()).toBeTrue();
  });

  it('should return true when urlFragment does not match regex', () => {
    component.urlFragment = 'Invalid@Url!';
    component.fragmentIsDuplicate = false;
    expect(component.shouldInvalidUrlFragmentMessageBeShown()).toBeTrue();
  });

  it('should return false when urlFragment is valid and not duplicate', () => {
    component.urlFragment = 'valid-url';
    component.fragmentIsDuplicate = false;
    expect(component.shouldInvalidUrlFragmentMessageBeShown()).toBeFalse();
  });
});
