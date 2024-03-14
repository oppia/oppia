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
 * @fileoverview Use this directive on html tags to run on the tag init.
 */

import {Directive, OnInit, Output, EventEmitter} from '@angular/core';

@Directive({
  // This should be same as the Ouput below. Please change both if changing one.
  selector: '[oppiaNgInit]',
})
export class NgInitDirective implements OnInit {
  // This should be same as the selector. Please change both if changing one.
  @Output() oppiaNgInit: EventEmitter<void> = new EventEmitter<void>();

  ngOnInit(): void {
    this.oppiaNgInit.emit();
  }
}
