// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Routing module for the create certificate offering page.
 */

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {CreateCertificateOfferingPageAuthGuard} from './create-certificate-offering-page-auth.guard';
import {CreateCertificateOfferingPageRootComponent} from './create-certificate-offering-page-root.component';

const routes: Routes = [
  {
    path: '',
    component: CreateCertificateOfferingPageRootComponent,
    canActivate: [CreateCertificateOfferingPageAuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CreateCertificateOfferingPageRoutingModule {}
