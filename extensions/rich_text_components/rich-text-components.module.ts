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
 * @fileoverview Module for the rich text extension components.
 */
import 'core-js/es7/reflect';
import 'zone.js';

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { NoninteractiveCollapsible } from './Collapsible/directives/oppia-noninteractive-collapsible.directive';
import { DynamicContentModule } from 'components/angular-html-bind/dynamic-content.module';


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    DynamicContentModule,
    NgbAccordionModule
  ],
  declarations: [
    NoninteractiveCollapsible
  ],
  entryComponents: [
    NoninteractiveCollapsible
  ],
  exports: [
    NoninteractiveCollapsible
  ],
})

export class RichTextComponentsModule { }
