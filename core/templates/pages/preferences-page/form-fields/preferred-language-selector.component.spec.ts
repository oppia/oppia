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
 * @fileoverview Unit tests for the preferred site language component.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from 'modules/material.module';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { PreferredSiteLanguageSelectorComponent } from './preferred-language-selector.component';

describe('Preferred Site Language Selector Component', () => {
  let componentInstance: PreferredSiteLanguageSelectorComponent;
  let fixture: ComponentFixture<PreferredSiteLanguageSelectorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
      ],
      declarations: [
        MockTranslatePipe,
        PreferredSiteLanguageSelectorComponent
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreferredSiteLanguageSelectorComponent);
    componentInstance = fixture.componentInstance;
  });

  it('should be defined', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', () => {
    componentInstance.choices = [{
      id: 'en',
      text: 'english',
      dir: 'ltr'
    }];
    componentInstance.ngOnInit();
    expect(componentInstance.filteredChoices).toEqual(
      componentInstance.choices);
  });

  it('should filter choices', () => {
    componentInstance.choices = [{
      id: 'en',
      text: 'english',
      dir: 'ltr'
    }];
    componentInstance.filterChoices('eng');
    expect(componentInstance.filteredChoices).toEqual(
      componentInstance.choices);
  });

  it('should update preferred language', () => {
    componentInstance.updateLanguage('en');
    expect(componentInstance.preferredLanguageCode).toEqual('en');
  });
});
