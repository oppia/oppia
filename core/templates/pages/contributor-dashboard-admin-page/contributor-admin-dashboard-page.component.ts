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
import { trigger, state, style, transition,
  animate, group } from '@angular/animations';
import { LoaderService } from 'services/loader.service';

@Component({
  selector: 'oppia-feedback-updates-page',
  templateUrl: './contributor-admin-dashboard-page.component.html',
  styleUrls: ['./contributor-admin-dashboard-page.component.css'],
  animations: [
    trigger('slideInOut', [
      state('true', style({
        'max-height': '500px', opacity: '1', visibility: 'visible'
      })),
      state('false', style({
        'max-height': '0px', opacity: '0', visibility: 'hidden'
      })),
      transition('true => false', [group([
        animate('500ms ease-in-out', style({
          opacity: '0'
        })),
        animate('500ms ease-in-out', style({
          'max-height': '0px'
        })),
        animate('500ms ease-in-out', style({
          visibility: 'hidden'
        }))
      ]
      )]),
      transition('false => true', [group([
        animate('500ms ease-in-out', style({
          visibility: 'visible'
        })),
        animate('500ms ease-in-out', style({
          'max-height': '500px'
        })),
        animate('500ms ease-in-out', style({
          opacity: '1'
        }))
      ]
      )])
    ])
  ]
})
export class ContributorAdminDashboardPageComponent implements OnInit {
  constructor(
    private loaderService: LoaderService,
  ) {}

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
  }
}

angular.module('oppia').directive('contributorAdminDashboardPage',
  downgradeComponent({
    component: ContributorAdminDashboardPageComponent
  }) as angular.IDirectiveFactory);
