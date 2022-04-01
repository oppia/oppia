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
 * @fileoverview Component for the Create Exploration/Collection modal.
 */

import { Component, OnInit } from '@angular/core';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UserService } from 'services/user.service';
import { ExplorationCreationService } from 'components/entity-creation-services/exploration-creation.service';
import { CollectionCreationService } from 'components/entity-creation-services/collection-creation.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'create-activity-modal',
  templateUrl: './create-activity-modal.component.html',
})
export class CreateActivityModalComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  explorationImageUrl!: string;
  collectionImageUrl!: string;
  canCreateCollections: boolean = false;
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService,
    private explorationCreationService: ExplorationCreationService,
    private collectionCreationService: CollectionCreationService,
    private activeModal: NgbActiveModal
  ) {}

  ngOnInit(): void {
    this.userService.getUserInfoAsync().then((userInfo) => {
      this.canCreateCollections = (
        userInfo.canCreateCollections());
    });
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  chooseExploration(): void {
    this.explorationCreationService.createNewExploration();
    this.activeModal.dismiss();
  }

  chooseCollection(): void {
    this.collectionCreationService.createNewCollection();
    this.activeModal.dismiss();
  }
}
