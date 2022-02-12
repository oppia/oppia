// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Rules service for the interaction.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { InteractiveMapAnswer } from 'interactions/answer-defs';
import { InteractiveMapRuleInputs } from 'interactions/rule-input-defs';

@Injectable({
  providedIn: 'root'
})
export class InteractiveMapRulesService {
  static RADIUS_OF_EARTH_KM: number = 6371.0;
  static degreesToRadians(angle: number): number {
    return angle / 180 * Math.PI;
  }

  static getDistanceInKm(point1: number[], point2: number[]): number {
    var latitude1: number = InteractiveMapRulesService.degreesToRadians(
      point1[0]);
    var latitude2: number = InteractiveMapRulesService.degreesToRadians(
      point2[0]);
    var latitudeDifference: number = (
      InteractiveMapRulesService.degreesToRadians(point2[0] - point1[0]));
    var longitudeDifference: number = (
      InteractiveMapRulesService.degreesToRadians(point2[1] - point1[1]));

    // Use the haversine formula.
    var haversineOfCentralAngle: number = (
      Math.pow(Math.sin(latitudeDifference / 2), 2) +
      Math.cos(latitude1) * Math.cos(latitude2) *
      Math.pow(Math.sin(longitudeDifference / 2), 2));

    return InteractiveMapRulesService.RADIUS_OF_EARTH_KM *
      2 * Math.asin(Math.sqrt(haversineOfCentralAngle));
  }

  Within(
      answer: InteractiveMapAnswer,
      inputs: InteractiveMapRuleInputs): boolean {
    var actualDistance = InteractiveMapRulesService.getDistanceInKm(
      inputs.p, answer);
    return actualDistance <= inputs.d;
  }

  NotWithin(
      answer: InteractiveMapAnswer,
      inputs: InteractiveMapRuleInputs): boolean {
    var actualDistance = InteractiveMapRulesService.getDistanceInKm(
      inputs.p, answer);
    return actualDistance > inputs.d;
  }
}

angular.module('oppia').factory(
  'InteractiveMapRulesService',
  downgradeInjectable(InteractiveMapRulesService));
