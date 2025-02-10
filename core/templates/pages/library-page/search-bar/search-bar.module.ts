// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the search bar component.
 */

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {SearchBarComponent} from 'pages/library-page/search-bar/search-bar.component';
import {StringUtilityPipesModule} from 'filters/string-utility-filters/string-utility-pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    StringUtilityPipesModule,
    TranslateModule,
  ],
  declarations: [SearchBarComponent],
  entryComponents: [SearchBarComponent],
  exports: [SearchBarComponent],
})
export class SearchBarModule {}
