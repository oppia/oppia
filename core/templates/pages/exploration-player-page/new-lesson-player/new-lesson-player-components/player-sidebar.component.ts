// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the new lesson player sidebar
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { MobileMenuService } from '../new-lesson-player-services/mobile-menu.service';
import './player-sidebar.component.css';
import { Observable } from 'rxjs';

@Component({
  selector: 'oppia-player-sidebar',
  templateUrl: './player-sidebar.component.html',
  styleUrls: ['./player-sidebar.component.css'],
})
export class PlayerSidebarComponent implements OnInit {
  constructor(
    private mobileMenuService: MobileMenuService
  ) {}

  mobileMenuVisible: boolean;
  isExpanded = false;

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
  }

  ngOnInit() {
    this.mobileMenuService.getMenuVisibility().subscribe((visibility) => {
      this.mobileMenuVisible = visibility;
    });
  }
}

angular.module('oppia').directive('oppiaPlayerHeader',
  downgradeComponent({
    component: PlayerSidebarComponent
  }) as angular.IDirectiveFactory);
