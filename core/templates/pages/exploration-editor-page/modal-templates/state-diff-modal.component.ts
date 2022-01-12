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
 * @fileoverview Component for state diff modal.
 */

import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { State } from 'domain/state/StateObjectFactory';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ContextService } from 'services/context.service';
import { StateDiffModalBackendApiService } from '../services/state-diff-modal-backend-api.service';

interface headersAndYamlStrs {
  leftPane: string;
  rightPane: string;
}

interface mergeviewOptions {
  lineNumbers: boolean;
  readOnly: boolean;
  mode: string;
  viewportMargin: number;
}

@Component({
  selector: 'oppia-state-diff',
  templateUrl: './state-diff-modal.component.html',
})
export class StateDiffModalComponent
    extends ConfirmOrCancelModal implements OnInit {
  newState: State | null;
  oldState: State | null;
  newStateName: string;
  oldStateName: string;
  headers: headersAndYamlStrs;
  yamlStrs: headersAndYamlStrs = {
    leftPane: '',
    rightPane: '',
  };
  CODEMIRROR_MERGEVIEW_OPTIONS: mergeviewOptions = {
    lineNumbers: true,
    readOnly: true,
    mode: 'yaml',
    viewportMargin: 100
  };

  constructor(
      private ngbActiveModal: NgbActiveModal,
      private contextService: ContextService,
      private urlInterpolationService: UrlInterpolationService,
      private stateDiffModalBackendApiService:
      StateDiffModalBackendApiService,
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    const url = this.urlInterpolationService.interpolateUrl(
      '/createhandler/state_yaml/<exploration_id>', {
        exploration_id: (
          this.contextService.getExplorationId())
      });

    if (this.oldState) {
      this.stateDiffModalBackendApiService.fetchYaml(
        this.oldState.toBackendDict(), 50, url).then(response => {
        this.yamlStrs.leftPane = response.yaml;
      });
    } else {
      // Note: the timeout is needed or the string will be sent
      // before codemirror has fully loaded and will not be
      // displayed. This causes issues with the e2e tests.
      setTimeout(() => {
        this.yamlStrs.leftPane = '';
      }, 200);
    }

    if (this.newState) {
      this.stateDiffModalBackendApiService.fetchYaml(
        this.newState.toBackendDict(), 50, url).then(response => {
        this.yamlStrs.rightPane = response.yaml;
      });
    } else {
      // Note: the timeout is needed or the string will be sent
      // before codemirror has fully loaded and will not be
      // displayed. This causes issues with the e2e tests.
      setTimeout(() => {
        this.yamlStrs.rightPane = '';
      }, 200);
    }
  }
}
