// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to dynamically construct translation ids for i18n.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConstructTranslationIdsService {
  // Construct a translation id for library from name and a prefix.
  // Ex: 'categories', 'art' -> 'I18N_LIBRARY_CATEGORIES_ART'.
  getLibraryId(prefix: string, name: string): string {
    return (
      'I18N_LIBRARY_' + prefix.toUpperCase() + '_' +
        name.toUpperCase().split(' ').join('_'));
  }

  // Construct a translation id for a classroom title from name.
  getClassroomTitleId(name: string): string {
    return (
      'I18N_CLASSROOM_' + name.toUpperCase() + '_TITLE');
  }

  getSyllabusTypeTitleId(name: string): string {
    return (
      'I18N_SYLLABUS_' + name.toUpperCase() + '_TITLE');
  }
}

angular.module('oppia').factory(
  'ConstructTranslationIdsService',
  downgradeInjectable(ConstructTranslationIdsService));
