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
 * @fileoverview Service for using the js-yaml library for yaml
 * conversions.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import yaml from 'js-yaml';

@Injectable({
  providedIn: 'root'
})
export class YamlService {
  constructor() {}

  stringify(objectToBeStringified: Object): string {
    return yaml.dump(objectToBeStringified);
  }

  // Unknown has been used here becuase of use of dependency yaml load.
  // The return type of yaml load is unknown.
  parse(yamlStringToBeParsed: string): unknown {
    return yaml.load(yamlStringToBeParsed);
  }
}

angular.module('oppia').factory(
  'YamlService', downgradeInjectable(YamlService));
