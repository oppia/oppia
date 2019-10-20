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
 * @fileoverview Utility services for explorations which may be shared by both
 * the learner and editor views.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HtmlEscaperService } from 'services/HtmlEscaperService';
import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';

// Service for assembling extension tags (for interactions).

export class ExtensionTagAssemblerService {
  constructor(private htmlEscaperService: HtmlEscaperService,
              private camelCaseToHyphens: CamelCaseToHyphensPipe) {}

  formatCustomizationArgAttrs(element: any,
      customizationArgSpecs: Object): any {
    for (let caSpecName in customizationArgSpecs) {
      let caSpecValue = customizationArgSpecs[caSpecName].value;
      element.attr(
        this.camelCaseToHyphens.transform(caSpecName) + '-with-value',
        this.htmlEscaperService.objToEscapedJson(caSpecValue));
    }
    return element;
  }
}

angular.module('oppia').factory(
  'ExtensionTagAssemblerService',
  downgradeInjectable(ExtensionTagAssemblerService));

