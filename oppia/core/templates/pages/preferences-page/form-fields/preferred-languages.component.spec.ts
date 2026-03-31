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
 * @fileoverview Unit tests for the preferred languages component.
 */

import {ElementRef} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MaterialModule} from 'modules/material.module';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {PreferredLanguagesComponent} from './preferred-languages.component';

describe('Preferred Languages Component', () => {
  let componentInstance: PreferredLanguagesComponent;
  let fixture: ComponentFixture<PreferredLanguagesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
      ],
      declarations: [MockTranslatePipe, PreferredLanguagesComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreferredLanguagesComponent);
    componentInstance = fixture.componentInstance;
  });

  it('should be defined', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', () => {
    fixture.detectChanges();
    let value = 'en';
    componentInstance.preferredLanguages = [];
    componentInstance.choices = [
      {
        id: 'en',
        text: 'English',
        ariaLabelInEnglish: 'English',
      },
    ];
    componentInstance.formCtrl = new FormControl(value);
    componentInstance.ngAfterViewInit();
    fixture.detectChanges();
    expect(componentInstance.chipList.errorState).toBeFalse();
    componentInstance.formCtrl.setValue('fr');
    componentInstance.ngAfterViewInit();
    fixture.detectChanges();
    expect(componentInstance.chipList.errorState).toBeTrue();
    componentInstance.formCtrl.setValue('en');
    componentInstance.ngAfterViewInit();
    fixture.detectChanges();
    expect(componentInstance.chipList.errorState).toBeFalse();
  });

  it('should validate input', () => {
    componentInstance.preferredLanguages = [];
    componentInstance.choices = [
      {
        id: 'en',
        text: 'English',
        ariaLabelInEnglish: 'English',
      },
    ];
    componentInstance.filteredChoices = [
      {
        id: 'en',
        text: 'English',
        ariaLabelInEnglish: 'English',
      },
    ];
    expect(componentInstance.validInput('en')).toBeTrue();
  });

  it('should filter choices when search query is non-empty', () => {
    const mockChoices = [
      {id: 'en', text: 'English', ariaLabelInEnglish: 'English'},
      {id: 'fr', text: 'French', ariaLabelInEnglish: 'French'},
      {id: 'de', text: 'German', ariaLabelInEnglish: 'German'},
    ];
    componentInstance.choices = [...mockChoices];
    componentInstance.searchQuery = 'en';
    componentInstance.onSearchInputChange();
    const expectedFilteredChoice = [
      {id: 'en', text: 'English', ariaLabelInEnglish: 'English'},
      {id: 'fr', text: 'French', ariaLabelInEnglish: 'French'},
    ];
    expect(componentInstance.filteredChoices).toEqual(expectedFilteredChoice);
  });

  it('should not show any choices when search query does not match', () => {
    const mockChoices = [
      {id: 'en', text: 'English', ariaLabelInEnglish: 'English'},
      {id: 'fr', text: 'French', ariaLabelInEnglish: 'French'},
    ];
    componentInstance.choices = [...mockChoices];
    componentInstance.searchQuery = 'de';
    expect(componentInstance.filteredChoices).toEqual([]);
  });

  it('should add language', () => {
    spyOn(componentInstance, 'onChange');
    spyOn(componentInstance, 'validInput').and.returnValue(true);
    componentInstance.preferredLanguages = [];
    componentInstance.choices = [
      {
        id: 'en',
        text: 'English',
        ariaLabelInEnglish: 'English',
      },
    ];
    componentInstance.languageInput = {
      nativeElement: {
        value: '',
      },
    } as ElementRef;
    componentInstance.add({value: 'en'});
    componentInstance.add({value: ''});
    expect(componentInstance.onChange).toHaveBeenCalled();
  });

  it('should remove language', () => {
    componentInstance.preferredLanguages = ['en'];
    let choices = [
      {
        id: 'en',
        text: 'English',
        ariaLabelInEnglish: 'English',
      },
    ];
    componentInstance.choices = choices;
    componentInstance.remove('en');
    expect(componentInstance.preferredLanguages).toEqual([]);
    expect(componentInstance.choices).toEqual(choices);
  });

  it('should handle when user selects a language', () => {
    spyOn(componentInstance, 'add');
    spyOn(componentInstance, 'remove');
    componentInstance.preferredLanguages = ['en'];
    componentInstance.selected({option: {value: 'en'}});
    expect(componentInstance.remove).toHaveBeenCalled();
    expect(componentInstance.add).not.toHaveBeenCalled();
    componentInstance.preferredLanguages = [];
    componentInstance.selected({option: {value: 'en'}});
    expect(componentInstance.add).toHaveBeenCalled();
  });

  it('should write value', () => {
    const codes = ['en', 'hi'];
    componentInstance.writeValue(codes);
    expect(componentInstance.preferredLanguages).toEqual(codes);
  });

  it('should register onChange function', () => {
    const fn = (value: string[]) => {};
    componentInstance.registerOnChange(fn);
    expect(componentInstance.onChange).toBe(fn);
  });

  it('should register onTouched function', () => {
    const fn = () => {};
    componentInstance.registerOnTouched(fn);
    expect(componentInstance.onTouched).toBe(fn);
  });
});
