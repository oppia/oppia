// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the ImageClickInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ImageClickAnswer } from 'interactions/answer-defs';
import { ImageClickInputCustomizationArgs, ImageWithRegions, LabeledRegion } from 'interactions/customization-args-defs';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService, InteractionRulesService } from 'pages/exploration-player-page/services/current-interaction.service';
import { ImageDimensions, ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { Subscription } from 'rxjs';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { ServicesConstants } from 'services/services.constants';
import { ImageClickInputRulesService } from './image-click-input-rules.service';

interface RectangleRegion extends ImagePoint {
  height: number;
  width: number;
}

interface ImagePoint {
  left: number,
  top: number
}

@Component({
  selector: 'oppia-interactive-image-click-input',
  templateUrl: './image-click-input-interaction.component',
  styleUrls: []
})
export class InteractiveImageClickInput implements OnInit, OnDestroy {
  @Input() imageAndRegionsWithValue: string;
  @Input() highlightRegionsOnHoverWithValue: string;
  @Input() lastAnswer: ImageClickAnswer;
  imageAndRegions: ImageWithRegions;
  highlightRegionsOnHover: boolean = false;
  componentSubscriptions = new Subscription();
  currentlyHoveredRegions: string[] = [];
  filepath: string;
  imageUrl: string;
  mouseX: number;
  mouseY: number;
  interactionIsActive: boolean;
  loadingIndicatorUrl: string;
  isLoadingIndicatorShown: boolean;
  isTryAgainShown: boolean;
  dimensions: ImageDimensions;
  imageContainerStyle: { height: string; width?: string; };
  loadingIndicatorStyle: { height: string; width?: string; };
  allRegions: LabeledRegion[];
  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private contextService: ContextService,
    private currentInteractionService: CurrentInteractionService,
    private el: ElementRef,
    private imageClickInputRulesService: ImageClickInputRulesService,
    private imagePreloaderService: ImagePreloaderService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService,
    private playerPositionService: PlayerPositionService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  private _getAttrs() {
    return {
      imageAndRegionsWithValue: this.imageAndRegionsWithValue,
      highlightRegionsOnHoverWithValue: this.highlightRegionsOnHoverWithValue
    };
  }

  private _isMouseInsideRegion(regionArea): boolean {
    return (
      this.mouseX >= regionArea[0][0] &&
      this.mouseX <= regionArea[1][0] &&
      this.mouseY >= regionArea[0][1] &&
      this.mouseY <= regionArea[1][1]
    );
  }

  ngOnInit(): void {
    const {
      imageAndRegions,
      highlightRegionsOnHover
    } = this.interactionAttributesExtractorService.getValuesFromAttributes(
      'ImageClickInput', this._getAttrs()) as ImageClickInputCustomizationArgs;
    this.imageAndRegions = imageAndRegions.value;
    this.highlightRegionsOnHover = highlightRegionsOnHover.value;
    this.componentSubscriptions.add(
      this.playerPositionService.onNewCardAvailable.subscribe(
        () => {
          this.interactionIsActive = false;
          this.lastAnswer = {
            clickPosition: [this.mouseX, this.mouseY],
            clickedRegions: []
          };
        }
      )
    );
    this.filepath = this.imageAndRegions.imagePath;
    this.imageUrl = '';
    this.loadingIndicatorUrl = this.urlInterpolationService
      .getStaticImageUrl(AppConstants.LOADING_INDICATOR_URL);
    this.isLoadingIndicatorShown = false;
    this.isTryAgainShown = false;
    this.dimensions = (
      this.imagePreloaderService.getDimensionsOfImage(this.filepath));
    this.imageContainerStyle = {
      height: this.dimensions.height + 'px',
      width: this.dimensions.width + 'px'
    };
    if (this.imagePreloaderService.inExplorationPlayer()) {
      this.isLoadingIndicatorShown = true;
      // For aligning the gif to the center of it's container.
      const loadingIndicatorSize = (
                (this.dimensions.height < 124) ? 24 : 120);
      this.imageContainerStyle = {
        height: this.dimensions.height + 'px'
      };
      this.loadingIndicatorStyle = {
        height: loadingIndicatorSize + 'px',
        width: loadingIndicatorSize + 'px'
      };
      this.loadImage();
    } else {
      // This is the case when user is in exploration editor or in
      // preview mode. We don't have loading indicator or try again for
      // showing images in the exploration editor or in preview mode. So
      // we directly assign the url to the imageUrl.
      this.imageUrl = this.assetsBackendApiService.getImageUrlForPreview(
        this.contextService.getEntityType(), this.contextService.getEntityId(),
        this.filepath);
    }

    this.mouseX = 0;
    this.mouseY = 0;
    this.interactionIsActive = (this.lastAnswer === null);

    this.currentlyHoveredRegions = [];
    this.allRegions = this.imageAndRegions.labeledRegions;
    if (!this.interactionIsActive) {
      /**
       * The following lines highlight the learner's last answer for
       * this card. This need only be done at the beginning as if he
       * submits an answer, based on newCardAvailable, the image
       * is made inactive, so his last selection would be highlighted.
       */
      this.mouseX = this.lastAnswer.clickPosition[0];
      this.mouseY = this.lastAnswer.clickPosition[1];
      this.updateCurrentlyHoveredRegions();
    }

    this.currentInteractionService.registerCurrentInteraction(null, null);
  }

  loadImage(): void {
    this.imagePreloaderService.getImageUrlAsync(this.filepath)
      .then((objectUrl: string) => {
        this.isTryAgainShown = false;
        this.isLoadingIndicatorShown = false;
        this.imageUrl = objectUrl;
      }, () => {
        this.isTryAgainShown = true;
        this.isLoadingIndicatorShown = false;
      });
  }

  updateCurrentlyHoveredRegions(): void {
    for (let i = 0; i < this.imageAndRegions.labeledRegions.length; i++) {
      const labeledRegion = this.imageAndRegions.labeledRegions[i];
      const regionArea = labeledRegion.region.area;
      if (this._isMouseInsideRegion(regionArea)) {
        this.currentlyHoveredRegions.push(labeledRegion.label);
      }
    }
  }

  getRegionDimensions(index: number): RectangleRegion {
    const images = this.el.nativeElement.querySelectorAll(
      '.oppia-image-click-img');
    const image = images[0];
    const labeledRegion = this.imageAndRegions.labeledRegions[index];
    const regionArea = labeledRegion.region.area;
    const leftDelta = (
      image.getBoundingClientRect().left -
      image.parentElement.getBoundingClientRect().left);
    const topDelta = (
      image.getBoundingClientRect().top -
      image.parentElement.getBoundingClientRect().top);
    const returnValue = {
      left: regionArea[0][0] * image.width + leftDelta,
      top: regionArea[0][1] * image.height + topDelta,
      width: (regionArea[1][0] - regionArea[0][0]) * image.width,
      height: (regionArea[1][1] - regionArea[0][1]) * image.height
    };
    return returnValue;
  }

  getRegionDisplay(label: string): 'none' | 'inline' {
    if (this.currentlyHoveredRegions.indexOf(label) === -1) {
      return 'none';
    }
    return 'inline';
  }

  getDotDisplay(): 'none' | 'inline' {
    if (this.contextService.getEditorTabContext() ===
        ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT.EDITOR) {
      return 'none';
    }
    return 'inline';
  }

  getDotLocation(): ImagePoint {
    const images = this.el.nativeElement.querySelectorAll(
      '.oppia-image-click-img');
    const image: HTMLImageElement = images[0];
    var dotLocation = {
      left: null,
      top: null
    };
    if (this.lastAnswer) {
      dotLocation.left = (
        this.lastAnswer.clickPosition[0] * image.width +
        image.getBoundingClientRect().left -
        image.parentElement.getBoundingClientRect().left - 5);
      dotLocation.top = (
        this.lastAnswer.clickPosition[1] * image.height +
        image.getBoundingClientRect().top -
        image.parentElement.getBoundingClientRect().top - 5);
    }
    return dotLocation;
  }

  onMousemoveImage(event: MouseEvent): void {
    if (!this.interactionIsActive) {
      return;
    }
    const images = this.el.nativeElement.querySelectorAll(
      '.oppia-image-click-img');
    const image: HTMLImageElement = images[0];
    this.mouseX =
      (event.pageX - image.getBoundingClientRect().left) / image.width;
    this.mouseY =
      (event.pageY - image.getBoundingClientRect().top) / image.height;
    this.currentlyHoveredRegions = [];
    this.updateCurrentlyHoveredRegions();
  }

  onClickImage(): void {
    const answer = {
      clickPosition: [this.mouseX, this.mouseY],
      clickedRegions: this.currentlyHoveredRegions
    };
    this.currentInteractionService.onSubmit(
      answer as unknown as string,
      this.imageClickInputRulesService as unknown as InteractionRulesService);
  }

  ngOnDestroy(): void {
    this.componentSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'oppiaInteractiveImageClickInput', downgradeComponent({
    component: InteractiveImageClickInput
  }) as angular.IDirectiveFactory);
