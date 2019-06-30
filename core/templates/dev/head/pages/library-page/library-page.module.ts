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
 * @fileoverview Module for the Oppia contributors' library page.
 */

import { NgModule } from '@angular/core';

import { LibraryFooterModule } from
  'pages/library-page/library-footer/library-footer.module.ts';
import { SearchBarModule } from
  'pages/library-page/search-bar/search-bar.module.ts';
import { SearchResultsModule } from
  'pages/library-page/search-results/search-results.module.ts';

@NgModule({
  imports: [
    LibraryFooterModule,
    SearchBarModule,
    SearchResultsModule
  ]
})
export class LibraryPageModule {}

require('pages/library-page/library-footer/library-footer.module.ts');
require('pages/library-page/search-bar/search-bar.module.ts');
require('pages/library-page/search-results/search-results.module.ts');

angular.module('libraryPageModule', [
  'libraryFooterModule',
  'searchBarModule',
  'searchResultsModule'
]);
