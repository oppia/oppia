// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Oppia root component.
 */

import {Component} from '@angular/core';
import {ClickTrackerService} from 'services/contextual/click-tracker.service';

@Component({
  selector: 'oppia-root',
  templateUrl: './oppia-root.component.html',
})
export class OppiaRootComponent {
  // The constructor is used to inject dependencies into the component.
  // Angular's dependency injection system automatically provides an instance of
  // `ClickTrackerService` when this component is created.
  constructor(private clickTracker: ClickTrackerService) {}
}
