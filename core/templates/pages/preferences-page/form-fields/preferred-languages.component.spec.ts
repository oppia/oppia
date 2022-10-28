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

import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from 'modules/material.module';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { PreferredLanguagesComponent } from './preferred-languages.component';

describe('Preferred Languages Component', () => {
  let componentInstance: PreferredLanguagesComponent;
  let fixture: ComponentFixture<PreferredLanguagesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule
      ],
      declarations: [
        MockTranslatePipe,
        PreferredLanguagesComponent
      ]
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
    componentInstance.choices = [{
      id: 'en',
      text: 'English'
    }];
    componentInstance.formCtrl = {
      valueChanges: {
        subscribe(callb: (val: string) => void) {
          callb(value);
        }
      }
    } as FormControl;
    componentInstance.ngOnInit();
    expect(componentInstance.chipList.errorState).toBeFalse();
    value = '';
    componentInstance.formCtrl = {
      valueChanges: {
        subscribe(callb: (val: string) => void) {
          callb(value);
        }
      }
    } as FormControl;
    componentInstance.ngOnInit();
    expect(componentInstance.chipList.errorState).toBeTrue();
  });

  it('should validate input', () => {
    componentInstance.preferredLanguages = [];
    componentInstance.choices = [{
      id: 'en',
      text: 'English'
    }];
    expect(componentInstance.validInput('en')).toBeTrue();
  });

  it('should add language', () => {
    spyOn(componentInstance.preferredLanguagesChange, 'emit');
    spyOn(componentInstance, 'validInput').and.returnValue(true);
    componentInstance.preferredLanguages = [];
    componentInstance.choices = [{
      id: 'en',
      text: 'English'
    }];
    componentInstance.languageInput = {
      nativeElement: {
        value: ''
      }
    } as ElementRef;
    componentInstance.add({value: 'en'});
    componentInstance.add({value: ''});
    expect(componentInstance.preferredLanguagesChange.emit).toHaveBeenCalled();
  });

  it('should remove language', () => {
    componentInstance.preferredLanguages = ['en'];
    let choices = [{
      id: 'en',
      text: 'English'
    }];
    componentInstance.choices = choices;
    componentInstance.remove('en');
    expect(componentInstance.preferredLanguages).toEqual([]);
    expect(componentInstance.choices).toEqual(choices);
  });

  it('should handle when user selects a language', () => {
    spyOn(componentInstance, 'add');
    spyOn(componentInstance, 'remove');
    componentInstance.preferredLanguages = ['en'];
    componentInstance.selected(
      { option: { value: 'en' }});
    expect(componentInstance.remove).toHaveBeenCalled();
    expect(componentInstance.add).not.toHaveBeenCalled();
    componentInstance.preferredLanguages = [];
    componentInstance.selected(
      { option: { value: 'en' }});
    expect(componentInstance.add).toHaveBeenCalled();
  });
});
