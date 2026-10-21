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
 * @fileoverview Auto-generated granular module for one shared component.
 * Each component lives in its own module so pages import only what they use.
 */

import {NgModule} from '@angular/core';
import {RatingsAndRecommendationsComponent} from '../../pages/exploration-player-page/current-lesson-player/learner-experience/ratings-and-recommendations.component';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {ExplorationSummaryTileModule} from 'components/shared_parts/exploration-summary-tile.module';
import {FeedbackPopupModule} from 'components/shared_parts/feedback-popup.module';
import {MaterialModule} from 'modules/material.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {RatingDisplayModule} from 'components/shared_parts/rating-display.module';
import {RecommendationsModule} from 'components/recommendations/recommendations.module';
import {SharedPipesModule} from 'filters/shared-pipes.module';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    ExplorationSummaryTileModule,
    FeedbackPopupModule,
    MaterialModule,
    NgbModule,
    RatingDisplayModule,
    RecommendationsModule,
    SharedPipesModule,
  ],
  declarations: [RatingsAndRecommendationsComponent],
  exports: [RatingsAndRecommendationsComponent],
})
export class RatingsAndRecommendationsModule {}
