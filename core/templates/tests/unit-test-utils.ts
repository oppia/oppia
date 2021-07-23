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
 * @fileoverview Utility functions for unit testing in Angular.
 */

import { Input } from '@angular/core';
import { NgModule } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Directive } from '@angular/core';
import { Pipe } from '@angular/core';

@Pipe({name: 'translate'})
export class MockTranslatePipe {
  transform(value: string): string {
    return value;
  }
}

@Directive({
  selector: '[translate],[ngx-translate]'
})
export class MockTranslateDirective {
  @Input() set translate(key: string) {}

  @Input() set translateParams(params: Object) {}

  constructor(private element: ElementRef) {}
}

@NgModule({
  declarations: [
    MockTranslateDirective,
    MockTranslatePipe
  ],
  exports: [
    MockTranslateDirective,
    MockTranslatePipe
  ]
})
export class MockTranslateModule {}
