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
 * @fileoverview Service used to parse expressions. See
 * oppia/core/templates/expressions/README.txt for further details.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import parser from 'expressions/parser';

@Injectable({
  providedIn: 'root'
})
export class ExpressionParserService {
  parse = parser.parse;
  SyntaxError = parser.SyntaxError;
}

angular.module('oppia').factory(
  'ServiceName', downgradeInjectable(ExpressionParserService)
);
