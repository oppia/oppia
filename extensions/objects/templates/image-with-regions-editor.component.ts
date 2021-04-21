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
 * @fileoverview Directive for image with regions editor.
 */
// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

import { Component, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { CustomSchema } from 'services/schema-default-value.service';
import { UtilsService } from 'services/utils.service';
import { ImageWithRegionsResetConfirmationModalComponent } from './image-with-regions-reset-confirmation.component';

// TODO(czx): Uniquify the labels of image regions.
@Component({
  selector: 'image-with-regions-editor',
  templateUrl: './image-with-regions-editor.component.html',
  styleUrls: []
})
export class ImageWithRegionsEditorComponent implements OnInit {
  @Input() modalId: symbol;
  @Input() value;
  @Output() valueChanged = new EventEmitter();
  selectedRegion: number;
  mouseX: number;
  mouseY: number;
  originalMouseX: number;
  originalMouseY: number;
  originalRectArea: { x: number; y: number; width: number; height: number; };
  rectX: number;
  rectY: number;
  rectWidth: number;
  rectHeight: number;
  userIsCurrentlyDrawing: boolean;
  userIsCurrentlyDragging: boolean;
  userIsCurrentlyResizing: boolean;
  xDirection: number;
  yDirection: number;
  yDirectionToggled: boolean;
  xDirectionToggled: boolean;
  movedOutOfRegion: boolean;
  resizableBorderWidthPx: number;
  originalImageWidth: number;
  originalImageHeight: number;
  hoveredRegion: null | number;
  errorText: string;
  alwaysEditable: boolean;
  SCHEMA: { type: string; 'obj_type': string; };

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private contextService: ContextService,
    private el: ElementRef,
    private utilsService: UtilsService,
    private ngbModal: NgbModal
  ) {}

  // Calculates the dimensions of the image, assuming that the width
  // of the image is scaled down to fit the svg element if necessary.
  private _calculateImageDimensions() {
    const svgElement: SVGSVGElement = this.el.nativeElement.querySelectorAll(
      '.oppia-image-with-regions-editor-svg')[0];
    const clientRect = svgElement.getBoundingClientRect();
    const displayedImageWidth = Math.min(
      clientRect.width, this.originalImageWidth);
    const scalingRatio = displayedImageWidth / this.originalImageWidth;
    // Note that scalingRatio may be NaN if this.originalImageWidth is
    // zero.
    const displayedImageHeight = (
      this.originalImageWidth === 0 ? 0.0 :
      this.originalImageHeight * scalingRatio);
    return {
      width: displayedImageWidth,
      height: displayedImageHeight
    };
  }

  private hasDuplicates(originalArray: unknown[]): boolean {
    const array = originalArray.slice(0).sort();
    for (let i = 1; i < array.length; i++) {
      if (array[i - 1] === array[i]) {
        return true;
      }
    }
    return false;
  }

  private convertCoordsToFraction(coords, dimensions) {
    return [coords[0] / dimensions[0], coords[1] / dimensions[1]];
  }
  // Convert to and from region area (which is stored as a fraction of
  // image width and height) and actual width and height.
  private regionAreaFromCornerAndDimensions(x, y, width, height) {
    return [
      this.convertCoordsToFraction(
        [x, y],
        [this.getImageWidth(), this.getImageHeight()]
      ),
      this.convertCoordsToFraction(
        [x + width, y + height],
        [this.getImageWidth(), this.getImageHeight()]
      )
    ];
  }

  private cornerAndDimensionsFromRegionArea(area) {
    return {
      x: area[0][0] * this.getImageWidth(),
      y: area[0][1] * this.getImageHeight(),
      width: (area[1][0] - area[0][0]) * this.getImageWidth(),
      height: (area[1][1] - area[0][1]) * this.getImageHeight()
    };
  }

  private resizeRegion() {
    const labeledRegions = this.value.labeledRegions;
    const resizedRegion = labeledRegions[this.selectedRegion].region;
    const deltaX = this.mouseX - this.originalMouseX;
    const deltaY = this.mouseY - this.originalMouseY;
    let x = this.originalRectArea.x;
    let y = this.originalRectArea.y;
    const width = this.originalRectArea.width;
    const height = this.originalRectArea.height;
    const newWidth = width - this.xDirection * deltaX;
    const newHeight = height - this.yDirection * deltaY;
    // The distance between where the mouse was first clicked to
    // initiate the resize action and the left-most x co-ordinate of
    // rectangle.
    const marginX = Math.abs(
      this.originalRectArea.x - this.originalMouseX);
    // The distance between where the mouse was first clicked to
    // initiate the resize action and the top-most y co-ordinate of
    // rectangle.
    const marginY = Math.abs(
      this.originalRectArea.y - this.originalMouseY);
    if (newHeight <= 0 && !this.yDirectionToggled) {
      this.yDirectionToggled = true;
    } else if (newHeight >= 0 && this.yDirectionToggled) {
      this.yDirectionToggled = false;
    }
    if (this.yDirection === 1) {
      y += this.yDirectionToggled ? (height + marginY) : deltaY;
    } else if (this.yDirection === -1) {
      y += (this.yDirectionToggled ? 1 : 0) * (deltaY + marginY);
    }
    if (newWidth <= 0 && !this.xDirectionToggled) {
      this.xDirectionToggled = true;
    } else if (newWidth >= 0 && this.xDirectionToggled) {
      this.xDirectionToggled = false;
    }
    if (this.xDirection === 1) {
      x += this.xDirectionToggled ? (width + marginX) : deltaX;
    } else if (this.xDirection === -1) {
      x += (this.xDirectionToggled ? 1 : 0) * (deltaX + marginX);
    }
    // Whenever the direction changes the value of newHeight and
    // newWidth computed is negative, hence the absolute value is taken.
    resizedRegion.area = this.regionAreaFromCornerAndDimensions(
      x, y, Math.abs(newWidth), Math.abs(newHeight));
  }

  ngOnInit(): void {
    this.alwaysEditable = true;
    // The initializeEditor function is written separately since it
    // is also called in resetEditor function.
    this.initializeEditor();
    this.imageValueChanged(this.value.imagePath);
    this.SCHEMA = {
      type: 'custom',
      obj_type: 'Filepath'
    };
  }

  // Dynamically defines the CSS style for the region rectangle.
  getRegionStyle(index: number): string {
    if (index === this.selectedRegion) {
      return 'fill: #00f; opacity: 0.5; stroke: #00d';
    } else {
      return 'fill: white; opacity: 0.5; stroke: #ddd';
    }
  }

  // Dynamically defines the CSS style for the region trash icon.
  getRegionTrashStyle(index: number): string {
    if (index === this.selectedRegion) {
      return 'fill: #eee; opacity: 0.7';
    } else {
      return 'fill: #333; opacity: 0.7';
    }
  }

  // Dynamically defines the CSS style for the region label.
  getRegionLabelStyle(index: number): string {
    const commonStyles = 'font-size: 14px; pointer-events: none;';
    if (index === this.selectedRegion) {
      return commonStyles + ' fill: #eee; visibility: hidden;';
    } else {
      return commonStyles + ' fill: #333; visibility: visible;';
    }
  }

  // Dynamically defines the CSS style for the region label text input.
  getRegionLabelEditorStyle(): string {
    if (this.selectedRegion === null) {
      return 'display: none';
    }
    const area = this.cornerAndDimensionsFromRegionArea(
      this.value.labeledRegions[
        this.selectedRegion].region.area);
    return 'left: ' + (area.x + 6) + 'px; ' +
      'top: ' + (area.y + 26) + 'px; ' +
      'width: ' + (area.width - 12) + 'px;';
  }

  initializeEditor(): void {
    // All coordinates have origin at top-left,
    // increasing in x to the right and increasing in y down
    // Current mouse position in SVG coordinates.
    this.mouseX = 0;
    this.mouseY = 0;
    // Original mouse click position for rectangle drawing.
    this.originalMouseX = 0;
    this.originalMouseY = 0;
    // Original position and dimensions for dragged rectangle.
    this.originalRectArea = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
    // Coordinates for currently drawn rectangle (when user is
    // dragging).
    this.rectX = 0;
    this.rectY = 0;
    this.rectWidth = 0;
    this.rectHeight = 0;
    // Is user currently drawing a new region?
    this.userIsCurrentlyDrawing = false;
    // Is user currently dragging an existing region?
    this.userIsCurrentlyDragging = false;
    // Is user currently resizing an existing region?
    this.userIsCurrentlyResizing = false;
    // The horizontal direction along which user resize occurs.
    // 1 -> Left     -1 -> Right     0 -> No resize.
    this.xDirection = 0;
    // The vertical direction along which user resize occurs.
    // 1 -> Top     -1 -> Bottom     0 -> No resize.
    this.yDirection = 0;
    // Flags to check whether the direction changes while resizing.
    this.yDirectionToggled = false;
    this.xDirectionToggled = false;
    // A boolean that is set whenever the cursor moves out of the
    // rectangular region while resizing.
    this.movedOutOfRegion = false;
    // The region along borders that will display the resize cursor.
    this.resizableBorderWidthPx = 10;
    // Dimensions of original image.
    this.originalImageWidth = 0;
    this.originalImageHeight = 0;
    // Index of region currently hovered over.
    this.hoveredRegion = null;
    // Index of region currently selected.
    this.selectedRegion = null;
    // Message to displayed when there is an error.
    this.errorText = '';
  }
  // Use these two functions to get the calculated image width and
  // height.
  getImageWidth(): number {
    return this._calculateImageDimensions().width;
  }
  getImageHeight(): number {
    return this._calculateImageDimensions().height;
  }

  getPreviewUrl(imageUrl: string): string {
    return this.assetsBackendApiService.getImageUrlForPreview(
      AppConstants.ENTITY_TYPE.EXPLORATION,
      this.contextService.getExplorationId(),
      encodeURIComponent(imageUrl));
  }

  regionLabelSetter(label: string): void {
    if (this.utilsService.isDefined(label)) {
      this.value.labeledRegions[this.selectedRegion].label = label;
      this.valueChanged.emit(this.value);
      const labels = this.value.labeledRegions.map(
        region => {
          return region.label;
        }
      );
      if (this.hasDuplicates(labels)) {
        this.errorText = 'Warning: Label "' + label + '" already ' +
            'exists! Please use a different label.';
      } else {
        this.errorText = '';
      }
    }
  }

  onSvgMouseMove(evt: MouseEvent): void {
    const svgElement: SVGSVGElement = this.el.nativeElement.querySelectorAll(
      '.oppia-image-with-regions-editor-svg')[0];
    this.mouseX = evt.pageX - svgElement.getBoundingClientRect().left;
    this.mouseY = evt.pageY - svgElement.getBoundingClientRect().top;
    if (this.userIsCurrentlyDrawing) {
      this.rectX = Math.min(this.originalMouseX, this.mouseX);
      this.rectY = Math.min(this.originalMouseY, this.mouseY);
      this.rectWidth = Math.abs(
        this.originalMouseX - this.mouseX);
      this.rectHeight = Math.abs(
        this.originalMouseY - this.mouseY);
    } else if (this.userIsCurrentlyDragging) {
      const labeledRegions = this.value.labeledRegions;
      const draggedRegion = labeledRegions[this.selectedRegion].region;
      const deltaX = this.mouseX - this.originalMouseX;
      const deltaY = this.mouseY - this.originalMouseY;
      let newX1 = this.originalRectArea.x + deltaX;
      let newY1 = this.originalRectArea.y + deltaY;
      let newX2 = newX1 + this.originalRectArea.width;
      let newY2 = newY1 + this.originalRectArea.height;
      if (newX1 < 0) {
        newX1 = 0;
        newX2 = this.originalRectArea.width;
      }
      if (newY1 < 0) {
        newY1 = 0;
        newY2 = this.originalRectArea.height;
      }
      if (newX2 > this.getImageWidth()) {
        newX2 = this.getImageWidth();
        newX1 = newX2 - this.originalRectArea.width;
      }
      if (newY2 > this.getImageHeight()) {
        newY2 = this.getImageHeight();
        newY1 = newY2 - this.originalRectArea.height;
      }
      draggedRegion.area = this.regionAreaFromCornerAndDimensions(
        newX1,
        newY1,
        this.originalRectArea.width,
        this.originalRectArea.height
      );
    } else if (this.userIsCurrentlyResizing) {
      this.resizeRegion();
    }
  }

  onSvgMouseDown(evt: MouseEvent): void {
    evt.preventDefault();
    this.originalMouseX = this.mouseX;
    this.originalMouseY = this.mouseY;
    if (this.hoveredRegion === null) {
      this.rectWidth = this.rectHeight = 0;
      this.userIsCurrentlyDrawing = true;
    }
  }

  onSvgMouseUp(): void {
    if (this.hoveredRegion === null) {
      this.selectedRegion = null;
    }
    if (this.yDirectionToggled) {
      this.yDirection = (this.yDirection === 1) ? -1 : 1;
    }
    if (this.xDirectionToggled) {
      this.xDirection = (this.xDirection === 1) ? -1 : 1;
    }
    if (this.movedOutOfRegion) {
      this.xDirection = 0;
      this.yDirection = 0;
    }
    if (this.userIsCurrentlyDrawing) {
      if (this.rectWidth !== 0 && this.rectHeight !== 0) {
        const labels = this.value.labeledRegions.map(
          region => {
            return region.label;
          }
        );
        // Searches numbers starting from 1 to find a valid label
        // that doesn't overlap with currently existing labels.
        let newLabel = null;
        for (let i = 1; i <= labels.length + 1; i++) {
          const candidateLabel = 'Region' + i.toString();
          if (labels.indexOf(candidateLabel) === -1) {
            newLabel = candidateLabel;
            break;
          }
        }
        const newRegion = {
          label: newLabel,
          region: {
            regionType: 'Rectangle',
            area: this.regionAreaFromCornerAndDimensions(
              this.rectX,
              this.rectY,
              this.rectWidth,
              this.rectHeight
            )
          }
        };
        this.value.labeledRegions.push(newRegion);
        this.valueChanged.emit(this.value);
        this.selectedRegion = (
          this.value.labeledRegions.length - 1);
      }
    }
    this.userIsCurrentlyDrawing = false;
    this.userIsCurrentlyDragging = false;
    this.userIsCurrentlyResizing = false;
    this.movedOutOfRegion = false;
    this.yDirectionToggled = false;
    this.xDirectionToggled = false;
  }

  onMouseoverRegion(index: number): void {
    if (this.hoveredRegion === null) {
      this.hoveredRegion = index;
    }
    this.movedOutOfRegion = false;
  }

  onMouseMoveRegion(index: number): void {
    if (
      this.userIsCurrentlyDragging ||
      this.userIsCurrentlyResizing) {
      return;
    }
    if (this.hoveredRegion === null) {
      this.hoveredRegion = index;
    }
    const region = this.cornerAndDimensionsFromRegionArea(
      this.value.labeledRegions[
        this.hoveredRegion].region.area);
    if (!this.xDirectionToggled && !this.yDirectionToggled) {
      if (this.mouseY <= region.y + this.resizableBorderWidthPx) {
        this.yDirection = 1;
      } else if (
        this.mouseY >= region.height + region.y -
        this.resizableBorderWidthPx) {
        this.yDirection = -1;
      } else {
        this.yDirection = 0;
      }
      if (this.mouseX <= region.x + this.resizableBorderWidthPx) {
        this.xDirection = 1;
      } else if (
        this.mouseX >= region.width + region.x -
        this.resizableBorderWidthPx) {
        this.xDirection = -1;
      } else {
        this.xDirection = 0;
      }
    }
  }

  onMouseoutRegion(index: number): void {
    if (this.hoveredRegion === index) {
      this.hoveredRegion = null;
    }
    if (!this.userIsCurrentlyResizing) {
      this.xDirection = 0;
      this.yDirection = 0;
    }
    this.movedOutOfRegion = true;
  }

  onMousedownRegion(): void {
    if (this.xDirection || this.yDirection) {
      this.userIsCurrentlyResizing = true;
    } else {
      this.userIsCurrentlyDragging = true;
    }
    this.selectedRegion = this.hoveredRegion;
    this.originalRectArea = this.cornerAndDimensionsFromRegionArea(
      this.value.labeledRegions[
        this.hoveredRegion].region.area
    );
  }

  regionLabelEditorMouseUp(): void {
    this.userIsCurrentlyDragging = false;
    this.userIsCurrentlyResizing = false;
  }

  getCursorStyle(): string {
    let xDirectionCursor = '';
    let yDirectionCursor = '';
    if (this.xDirection || this.yDirection) {
      // User is resizing, so we figure out the direction.
      if (
        (this.xDirection === 1 && !this.xDirectionToggled) ||
          (this.xDirection === -1 && this.xDirectionToggled)) {
        xDirectionCursor = 'w';
      } else if (
        (this.xDirection === -1 && !this.xDirectionToggled) ||
        (this.xDirection === 1 && this.xDirectionToggled)) {
        xDirectionCursor = 'e';
      } else {
        xDirectionCursor = '';
      }
      if (
        (this.yDirection === 1 && !this.yDirectionToggled) ||
        (this.yDirection === -1 && this.yDirectionToggled)) {
        yDirectionCursor = 'n';
      } else if (
        (this.yDirection === -1 && !this.yDirectionToggled) ||
        (this.yDirection === 1 && this.yDirectionToggled)) {
        yDirectionCursor = 's';
      } else {
        yDirectionCursor = '';
      }
      return yDirectionCursor + xDirectionCursor + '-resize';
    } else if (this.hoveredRegion !== null) {
      // User is not resizing but cursor is over a region.
      return 'pointer';
    }
    return 'crosshair';
  }

  resetEditor(): void {
    this.ngbModal.open(ImageWithRegionsResetConfirmationModalComponent, {
      backdrop: 'static',
      keyboard: false,
    }).result.then(() => {
      this.value.imagePath = '';
      this.value.labeledRegions = [];
      this.imageValueChanged('');
      this.initializeEditor();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  deleteRegion(index: number): void {
    if (this.selectedRegion === index) {
      this.selectedRegion = null;
    } else if (this.selectedRegion > index) {
      this.selectedRegion--;
    }
    if (this.hoveredRegion === index) {
      this.hoveredRegion = null;
    } else if (this.hoveredRegion > index) {
      this.hoveredRegion--;
    }
    this.value.labeledRegions.splice(index, 1);
    this.valueChanged.emit(this.value);
  }

  imageValueChanged(newVal: string): void {
    // Called when the image is changed to calculate the required
    // width and height, especially for large images.
    const that = this;
    this.value.imagePath = newVal;
    if (newVal !== '') {
      // Loads the image in hanging <img> tag so as to get the
      // width and height.
      const setHeightAndWidth = (img: HTMLCanvasElement) => {
        that.originalImageWidth = img.width;
        that.originalImageHeight = img.height;
      };
      const img = new Image();
      img.onload = function() {
        setHeightAndWidth((<HTMLCanvasElement> this));
      };
      img.src = this.getPreviewUrl(newVal);
    }
    this.valueChanged.emit(this.value);
  }

  getSchema(): CustomSchema {
    return this.SCHEMA as CustomSchema;
  }
}

angular.module('oppia').directive(
  'imageWithRegionsEditor', downgradeComponent({
    component: ImageWithRegionsEditorComponent
  }) as angular.IDirectiveFactory);
