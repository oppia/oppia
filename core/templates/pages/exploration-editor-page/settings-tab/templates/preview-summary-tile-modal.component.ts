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
 * @fileoverview Component for preview summary tile modal.
 */

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { ExplorationCategoryService } from 'pages/exploration-editor-page/services/exploration-category.service';
import { ExplorationObjectiveService } from 'pages/exploration-editor-page/services/exploration-objective.service';
import { ExplorationTitleService } from 'pages/exploration-editor-page/services/exploration-title.service';

@Component({
  selector: 'oppia-preview-summary-tile-modal',
  templateUrl: './preview-summary-tile-modal.component.html',
})
export class PreviewSummaryTileModalComponent extends ConfirmOrCancelModal {
  constructor(
    private ngbActiveModal: NgbActiveModal,
    private explorationCategoryService: ExplorationCategoryService,
    private explorationObjectiveService: ExplorationObjectiveService,
    private explorationTitleService: ExplorationTitleService
  ) {
    super(ngbActiveModal);
  }

  getExplorationTitle(): string {
    return String(this.explorationTitleService.displayed);
  }

  getExplorationObjective(): string {
    return String(this.explorationObjectiveService.displayed);
  }

  getExplorationCategory(): string {
    return String(this.explorationCategoryService.displayed);
  }

  getThumbnailIconUrl(): string {
    let category = this.explorationCategoryService.displayed as string;
    let allCategoryList: string[] = [...AppConstants.ALL_CATEGORIES];
    if (allCategoryList.indexOf(category) === -1) {
      category = AppConstants.DEFAULT_CATEGORY_ICON;
    }
    return '/subjects/' + category + '.svg';
  }

  getThumbnailBgColor(): string {
    let category = this.explorationCategoryService.displayed as string;
    let color = null;
    if (!AppConstants.CATEGORIES_TO_COLORS.hasOwnProperty(category)) {
      color = AppConstants.DEFAULT_COLOR;
    } else {
      color = AppConstants.CATEGORIES_TO_COLORS[
        category as keyof typeof AppConstants.CATEGORIES_TO_COLORS];
    }
    return color;
  }
}
