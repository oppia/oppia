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
 * @fileoverview Controller for lost changes modal.
 */

import { Component, Input, OnInit } from '@angular/core';

import { LoggerService } from 'services/contextual/logger.service';
import { LostChangeObjectFactory } from 'domain/exploration/LostChangeObjectFactory';

@Component({
  selector: 'oppia-lost-changes-modal-controller',
  templateUrl: './lost-changes-modal.component.html'
})
export class LostChangesModalControllerComponent implements OnInit {
  @Input() lostChanges:any;

  constructor(
    private loggerService: LoggerService,
    private lostChangeObjectFactory: LostChangeObjectFactory
  ) { }

  ngOnInit (): void {
    this.lostChanges = this.lostChanges.map(
      this.lostChangeObjectFactory.createNew);
    this.loggerService.error('Lost changes: ' + JSON.stringify(this.lostChanges));
  }
}
