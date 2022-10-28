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

// This page is used as error page for 404 status code.

import { Component } from '@angular/core';
import { LoggerService } from 'services/contextual/logger.service';
import { WindowRef } from 'services/contextual/window-ref.service';

@Component({
  selector: 'oppia-error-page-root',
  templateUrl: './error-404-page-root.component.html'
})
export class Error404PageRootComponent {
  constructor(
    private loggerService: LoggerService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    let pathname = this.windowRef.nativeWindow.location.pathname;
    // Raise a path not found error. So, e2e tests block the regressions due to
    // wrong route order where an unexpected 404 page shows up instead of
    // the expected page.
    this.loggerService.error(`The requested path ${pathname} is not found.`);
  }
}
