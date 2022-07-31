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
 * @fileoverview Unit tests for ConstructTranslationIdsService.
 */

import { TestBed } from '@angular/core/testing';
import { ConstructTranslationIdsService } from
  'services/construct-translation-ids.service';

describe('Construct Translation Ids Service', () => {
  let ctis: ConstructTranslationIdsService;

  beforeEach(() => {
    ctis = TestBed.get(ConstructTranslationIdsService);
  });

  it('should get library id', () => {
    expect(ctis.getLibraryId('categories', 'Algorithms'))
      .toBe('I18N_LIBRARY_CATEGORIES_ALGORITHMS');

    expect(ctis.getLibraryId('', '')).toBe('I18N_LIBRARY__');
  });

  it('should get classroom title id', () => {
    expect(ctis.getClassroomTitleId('math'))
      .toBe('I18N_CLASSROOM_MATH_TITLE');

    expect(ctis.getClassroomTitleId('')).toBe('I18N_CLASSROOM__TITLE');
  });

  it('should get syllabus type title id', () => {
    expect(ctis.getSyllabusTypeTitleId('skill'))
      .toBe('I18N_SYLLABUS_SKILL_TITLE');

    expect(ctis.getSyllabusTypeTitleId('')).toBe('I18N_SYLLABUS__TITLE');
  });
});
