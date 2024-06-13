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
 * @fileoverview Unit tests for the Subject Selector Modal component.
 */

import {EventEmitter} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {SubjectSelectorModalComponent} from 'pages/library-page/search-selectors/subject-selector-modal.component';
import {FormsModule} from '@angular/forms';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {MaterialModule} from 'modules/material.module';
import {SearchService} from 'services/search.service';

describe('subject-selector-modal component', () => {
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let component: SubjectSelectorModalComponent;
  let searchService: SearchService;
  let fixture: ComponentFixture<SubjectSelectorModalComponent>;
  let preferredLanguageCodesLoadedEmitter = new EventEmitter();
  let selectionDetailsStub: SelectionDetails;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, MaterialModule],
      declarations: [SubjectSelectorModalComponent, MockTranslatePipe],
    }).compileComponents();
  }));

  beforeEach(() => {
    selectionDetailsStub = {
      categories: {
        description: 'description',
        itemsName: 'categories',
        masterList: [
          {
            id: 'id',
            text: 'category 1',
          },
          {
            id: 'id_2',
            text: 'category 2',
          },
          {
            id: 'id_3',
            text: 'category 3',
          },
          {
            id: 'Algorithms',
            text: '',
          },
        ],
        selections: {id: true, id_2: true, id_3: true},
        numSelections: 0,
        summary: 'all categories',
      },
      languageCodes: {
        description: 'English',
        itemsName: 'languages',
        masterList: [
          {
            id: 'en',
            text: 'English',
          },
          {
            id: 'es',
            text: 'Spanish',
          },
        ],
        numSelections: 1,
        selections: {en: true},
        summary: 'English',
      },
    };

    fixture = TestBed.createComponent(SubjectSelectorModalComponent);
    component = fixture.componentInstance;
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    spyOnProperty(
      i18nLanguageCodeService,
      'onPreferredLanguageCodesLoaded'
    ).and.returnValue(preferredLanguageCodesLoadedEmitter);
    searchService = TestBed.inject(SearchService);
    component.ngOnInit();
    fixture.detectChanges();
    searchService.selectionDetails = selectionDetailsStub;
  });

  it('should initialize', () => {
    component.ngOnInit();
  });
});
