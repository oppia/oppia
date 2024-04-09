// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for showing metadata diff between different
 * exploration versions.
 */

import {Input, OnInit} from '@angular/core';
import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {ExplorationMetadata} from 'domain/exploration/ExplorationMetadataObjectFactory';
import {HistoryTabYamlConversionService} from '../services/history-tab-yaml-conversion.service';

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
  selector: 'oppia-exploration-metadata-diff',
  templateUrl: './exploration-metadata-diff-modal.component.html',
})
export class ExplorationMetadataDiffModalComponent
  extends ConfirmOrCancelModal
  implements OnInit
{
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1

  // The following properties will be null when there is no change introduced
  // in either of the state. It remains same as original State.
  @Input() oldMetadata!: ExplorationMetadata | null;
  @Input() newMetadata!: ExplorationMetadata | null;
  @Input() headers!: headersAndYamlStrs;
  yamlStrs: headersAndYamlStrs = {
    leftPane: '',
    rightPane: '',
  };

  CODEMIRROR_MERGEVIEW_OPTIONS: mergeviewOptions = {
    lineNumbers: true,
    readOnly: true,
    mode: 'yaml',
    viewportMargin: 100,
  };

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private historyTabYamlConversionService: HistoryTabYamlConversionService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.historyTabYamlConversionService
      .getYamlStringFromStateOrMetadata(this.oldMetadata)
      .then(result => {
        this.yamlStrs.leftPane = result;
      });

    this.historyTabYamlConversionService
      .getYamlStringFromStateOrMetadata(this.newMetadata)
      .then(result => {
        this.yamlStrs.rightPane = result;
      });
  }
}
