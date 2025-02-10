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

import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {AppConstants} from 'app.constants';

import {BaseRootComponent, MetaTagData} from 'pages/base-root.component';
import {WindowRef} from 'services/contextual/window-ref.service';
import {PageHeadService} from 'services/page-head.service';

@Component({
  selector: 'oppia-error-page-root',
  templateUrl: './error-page-root.component.html',
})
export class ErrorPageRootComponent extends BaseRootComponent {
  title: string = AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.TITLE;
  meta: MetaTagData[] = AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR
    .META as unknown as Readonly<MetaTagData>[];

  statusCode: string | null = null;
  validStatusCodes: string[] = ['400', '401', '404', '500'];
  windowRef: WindowRef;
  activatedRoute: ActivatedRoute;

  constructor(
    pageHeadService: PageHeadService,
    translateService: TranslateService,
    windowRef: WindowRef,
    activatedRoute: ActivatedRoute
  ) {
    super(pageHeadService, translateService);
    this.windowRef = windowRef;
    this.activatedRoute = activatedRoute;
  }

  ngOnInit(): void {
    this.statusCode = this.activatedRoute.snapshot.paramMap.get('status_code');
    if (this.statusCode === null) {
      const bodyTag =
        this.windowRef.nativeWindow.document.getElementsByTagName('body');
      this.statusCode = bodyTag[0].getAttribute('errorCode');
    }

    if (
      !this.validStatusCodes.includes(String(this.statusCode)) ||
      this.activatedRoute.snapshot.url.length > 0
    ) {
      this.statusCode = '404';
    }

    super.ngOnInit();
  }

  get titleInterpolationParams(): Object {
    return {statusCode: this.statusCode};
  }
}
