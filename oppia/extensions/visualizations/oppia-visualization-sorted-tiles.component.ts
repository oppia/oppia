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
 * @fileoverview Component for the SortedTiles visualization.
 */

import {Component, Input, OnInit, ViewChildren} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AnswerContentModalComponent} from 'components/common-layout-directives/common-elements/answer-content-modal.component';
import {sum} from 'd3-array';
import {AnswerStats} from 'domain/exploration/answer-stats.model';
import {UtilsService} from 'services/utils.service';

import './oppia-visualization-sorted-tiles.component.css';

@Component({
  selector: 'oppia-visualization-sorted-tiles',
  templateUrl: './oppia-visualization-sorted-tiles.component.html',
})
export class VisualizationSortedTilesComponent implements OnInit {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @ViewChildren('oppiaVisualizationSortedTileAnswers')
  oppiaVisualizationSortedTileAnswers!: HTMLElement;

  @Input() data!: AnswerStats[];
  @Input() totalFrequency!: number;
  @Input() options!: {
    use_percentages: boolean;
    header?: string;
  };

  isSelected!: boolean[];
  percentages!: number[];

  constructor(
    private utilsService: UtilsService,
    private ngbModal: NgbModal
  ) {}

  isAnswerTooLong(
    visualizationSortedTileAnswersElement: HTMLElement
  ): boolean | void {
    if (!visualizationSortedTileAnswersElement) {
      return;
    }

    return this.utilsService.isOverflowing(
      visualizationSortedTileAnswersElement
    );
  }

  select(index: number): void {
    this.isSelected[index] = true;
  }

  unselect(index: number): void {
    this.isSelected[index] = false;
  }

  openAnswerContentModal(index: number): void {
    const modalRef = this.ngbModal.open(AnswerContentModalComponent, {
      backdrop: false,
    });

    modalRef.componentInstance.answerHtml = this.data[index].answer;

    modalRef.result.then(
      () => {},
      () => {}
    );
  }

  ngOnInit(): void {
    const data = this.data as AnswerStats[];
    const totalFrequency = this.totalFrequency || sum(data, a => a.frequency);

    this.isSelected = Array<boolean>(this.data.length).fill(false);

    if (this.options.use_percentages) {
      this.percentages = this.data.map(d =>
        Math.round((100.0 * d.frequency) / totalFrequency)
      );
    }
  }
}
