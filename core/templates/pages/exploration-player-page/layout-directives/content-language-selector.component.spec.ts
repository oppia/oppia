// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the CkEditor copy toolbar component.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { By } from '@angular/platform-browser';
import { ContentLanguageSelectorComponent } from
  // eslint-disable-next-line max-len
  'pages/exploration-player-page/layout-directives/content-language-selector.component';
import { ContentTranslationLanguageService } from
  'pages/exploration-player-page/services/content-translation-language.service';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslatePipe } from 'filters/translate.pipe';

class MockContentTranslationLanguageService {
  getCurrentContentLanguageCode() {
    return 'en';
  }
  getLanguageOptionsForDropdown() {
    return [
      {value: 'fr', displayed: 'français (French)'},
      {value: 'zh', displayed: '中文 (Chinese)'},
      {value: 'en', displayed: 'English'}
    ];
  }
  setCurrentContentLanguageCode(languageCode: string) {}
}

describe('Content language selector component', () => {
  let component: ContentLanguageSelectorComponent;
  let fixture: ComponentFixture<ContentLanguageSelectorComponent>;
  let select: HTMLSelectElement;
  let contentTranslationLanguageService: ContentTranslationLanguageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      declarations: [ContentLanguageSelectorComponent, TranslatePipe],
      providers: [{
        provide: ContentTranslationLanguageService,
        useClass: MockContentTranslationLanguageService
      }]
    }).compileComponents();

    contentTranslationLanguageService = TestBed.get(
      ContentTranslationLanguageService);
    fixture = TestBed.createComponent(ContentLanguageSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    select = fixture.debugElement.query(
      By.css('.oppia-content-language-selector')
    ).nativeElement;
  });

  it('should correctly initialize selectedLanguageCode and ' +
     'languagesInExploration', () => {
    expect(component.selectedLanguageCode).toBe('en');
    expect(component.languagesInExploration).toEqual([
      {value: 'fr', displayed: 'français (French)'},
      {value: 'zh', displayed: '中文 (Chinese)'},
      {value: 'en', displayed: 'English'}
    ]);
  });

  it('should correctly display the options', () => {
    expect(select.options.length).toBe(3);
    expect(select.options[0].innerText).toBe('français (French)');
    expect(select.options[1].innerText).toBe('中文 (Chinese)');
    expect(select.options[2].innerText).toBe('English');
  });

  it('should correctly select an option', () => {
    const setCurrentContentLanguageCodeSpy = spyOn(
      contentTranslationLanguageService,
      'setCurrentContentLanguageCode');

    // Select french.
    expect(select.options[0].innerText).toBe('français (French)');
    select.value = select.options[0].value;
    select.dispatchEvent(new Event(select.value));
    fixture.detectChanges();

    expect(setCurrentContentLanguageCodeSpy).toHaveBeenCalledWith('fr');
    expect(component.selectedLanguageCode).toBe('fr');
  });
});
