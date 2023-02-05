// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the exploration title field in forms.
 */

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { Subscription } from 'rxjs';
import { RouterService } from 'pages/exploration-editor-page/services/router.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { AppConstants } from 'app.constants';
import { ExplorationTitleService } from '../services/exploration-title.service';

@Component({
  selector: 'oppia-exploration-title-editor',
  templateUrl: './exploration-title-editor.component.html'
})
export class ExplorationTitleEditorComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();

  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() labelText!: string;
  @Input() titleEditorClass!: string;
  @Input() formStyle!: string;
  @Input() focusLabel!: string;
  @Output() onInputFieldBlur = new EventEmitter<void>();

  MAX_CHARS_IN_EXPLORATION_TITLE!: number;

  constructor(
    public explorationTitleService: ExplorationTitleService,
    private focusManagerService: FocusManagerService,
    private routerService: RouterService,
  ) { }

  inputFieldBlur(): void {
    this.onInputFieldBlur.emit();
  }

  ngOnInit(): void {
    this.MAX_CHARS_IN_EXPLORATION_TITLE = (
      AppConstants.MAX_CHARS_IN_EXPLORATION_TITLE);

    this.directiveSubscriptions.add(
      this.routerService.onRefreshSettingsTab.subscribe(
        () => {
          this.focusManagerService.setFocus(this.focusLabel);
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'oppiaExplorationTitleEditor', downgradeComponent({
    component: ExplorationTitleEditorComponent
  }));
