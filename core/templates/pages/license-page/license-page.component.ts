// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the playbook page.
 */

 import { Component, OnInit } from '@angular/core';
 import { downgradeComponent } from '@angular/upgrade/static';
 
 import { UrlInterpolationService } from
   'domain/utilities/url-interpolation.service';
 import { WindowRef } from 'services/contextual/window-ref.service';
 import { SiteAnalyticsService } from 'services/site-analytics.service';
 
 @Component({
   selector: 'license-page',
   templateUrl: './license-page.component.html',
   styleUrls: []
 })
 export class LicensePageComponent implements OnInit {
 
   constructor(
     private siteAnalyticsService: SiteAnalyticsService,
     private urlInterpolationService: UrlInterpolationService,
     private windowRef: WindowRef
   ) {}
 
   ngOnInit(): void {}
 }
 
 angular.module('oppia').directive('licensePageComponent',
   downgradeComponent({component: LicensePageComponent}));
 