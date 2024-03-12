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
 * @fileoverview Unit tests for the ExplorationLanguageCodeService.
 */

import {TestBed} from '@angular/core/testing';
import {ContextService} from 'services/context.service';
import {ExplorationPropertyService} from './exploration-property.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ExplorationLanguageCodeService} from './exploration-language-code.service';

describe('Exploration Language Code Service', () => {
  let elcs: ExplorationLanguageCodeService;
  let cs: ContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExplorationPropertyService],
    });

    elcs = TestBed.inject(ExplorationLanguageCodeService);
    cs = TestBed.inject(ContextService);
  });

  it('should test the child object properties', () => {
    expect(elcs.propertyName).toBe('language_code');
    expect(elcs.getSupportedContentLanguages()).toBeInstanceOf(Object);
    elcs.displayed = 'en';
    expect(elcs.getCurrentLanguageDescription()).toBe('English');
    elcs.displayed = 'bn';
    expect(elcs.getCurrentLanguageDescription()).toBe('বাংলা (Bangla)');
    elcs.displayed = 'nl';
    expect(elcs.getCurrentLanguageDescription()).toBe('Nederlands (Dutch)');
    expect(elcs._isValid('en')).toBe(true);

    spyOn(cs, 'isExplorationLinkedToStory').and.returnValue(true);
    expect(elcs.getSupportedContentLanguages().length).toBe(1);
    expect(elcs.getSupportedContentLanguages()[0].code).toBe('en');
  });
});
