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
 * @fileoverview Component for displaying summary rating information.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

interface StarDict {
  cssClass: string;
  value: number;
}

@Component({
  selector: 'oppia-rating-display',
  templateUrl: './rating-display.component.html'
})
export class RatingDisplayComponent {
  // This will display a star-rating based on the given data. The attributes
  // passed in are as follows:
  //  - isEditable: true or false; whether the rating is user-editable.
  //  - onEdit: should be supplied iff isEditable is true, and be a function
  //    that will be supplied with the new rating when the rating is
  //    changed.
  //  - ratingValue: an integer 1-5 giving the rating.
  @Output() edit = new EventEmitter<number>();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() isEditable!: boolean;
  @Input() ratingValue!: number;
  status!: string;
  stars: StarDict[] = [];
  POSSIBLE_RATINGS = [1, 2, 3, 4, 5];
  STATUS_ACTIVE = 'active';
  STATUS_INACTIVE = 'inactive';
  STATUS_RATING_SET = 'rating_set';

  ngOnInit(): void {
    this.stars = this.POSSIBLE_RATINGS.map((starValue) => {
      return {
        cssClass: 'far fa-star',
        value: starValue
      };
    });
    this.status = this.STATUS_INACTIVE;
    this.displayValue(this.ratingValue);
  }

  displayValue(ratingValue: number): void {
    for (let i = 0; i < this.stars.length; i++) {
      this.stars[i].cssClass = (
              ratingValue === undefined ? 'far fa-star' :
              ratingValue < this.stars[i].value - 0.75 ? 'far fa-star' :
              ratingValue < this.stars[i].value - 0.25 ? 'far fa-star-half' :
              'fas fa-star');

      if (this.status === this.STATUS_ACTIVE &&
        ratingValue >= this.stars[i].value) {
        this.stars[i].cssClass += ' oppia-rating-star-active';
      }
    }
  }

  clickStar(starValue: number): void {
    if (this.isEditable && this.status === this.STATUS_ACTIVE) {
      this.status = this.STATUS_RATING_SET;
      this.ratingValue = starValue;
      this.displayValue(starValue);
      this.edit.emit(starValue);
    }
  }

  enterStar(starValue: number): void {
    let starsHaveNotBeenClicked = (
      this.status === this.STATUS_ACTIVE ||
      this.status === this.STATUS_INACTIVE
    );

    if (this.isEditable && starsHaveNotBeenClicked) {
      this.status = this.STATUS_ACTIVE;
      this.displayValue(starValue);
    }
  }

  leaveArea(): void {
    this.status = this.STATUS_INACTIVE;
    this.displayValue(this.ratingValue);
  }
}

angular.module('oppia').directive('oppiaRatingDisplay',
  downgradeComponent({
    component: RatingDisplayComponent
  }) as angular.IDirectiveFactory);
