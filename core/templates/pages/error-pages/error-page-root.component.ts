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
 * @fileoverview Root component for error page.
 */

// This error page is used for status codes 400, 401 and 500.

import { Component } from '@angular/core';
import { WindowRef } from 'services/contextual/window-ref.service';
import { PageTitleService } from 'services/page-title.service';

@Component({
  selector: 'oppia-error-page-root',
  templateUrl: './error-page-root.component.html'
})
export class ErrorPageRootComponent {
  statusCode: string;

  constructor(
    private pageTitleService: PageTitleService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    let bodyTag = (
      this.windowRef.nativeWindow.document.getElementsByTagName('body'));
    // Read status code from errorCode attribute on body tag.
    this.statusCode = bodyTag[0].getAttribute('errorCode') ?
      bodyTag[0].getAttribute('errorCode') : '404';
    // Update the default page title.
    this.pageTitleService.setDocumentTitle(`Error ${this.statusCode} | Oppia`);
  }
}
