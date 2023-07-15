// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the feedback Updates page.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { LoaderService } from 'services/loader.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import './contributor-admin-dashboard-page.component.css';

@Component({
  selector: 'contributor-admin-dashboard-page',
  styleUrls: ['./contributor-admin-dashboard-page.component.css'],
  templateUrl: './contributor-admin-dashboard-page.component.html',
})
export class ContributorAdminDashboardPageComponent implements OnInit {
  constructor(
    private loaderService: LoaderService,
    private windowDimensionsService: WindowDimensionsService,
  ) {}

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
  }

  checkTabletView(): boolean {
    console.log((this.windowDimensionsService.getWidth() < 768));
    return (this.windowDimensionsService.getWidth() < 768);
  }
}


angular.module('oppia').directive('contributorAdminDashboardPage',
  downgradeComponent({
    component: ContributorAdminDashboardPageComponent
  }) as angular.IDirectiveFactory);
