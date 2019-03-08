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

oppia.factory('InteractiveMapRulesService', [
  function() {
    var RADIUS_OF_EARTH_KM = 6371.0;
    var degreesToRadians = function(angle) {
      return angle / 180 * Math.PI;
    };
    var getDistanceInKm = function(point1, point2) {
      var latitude1 = degreesToRadians(point1[0]);
      var latitude2 = degreesToRadians(point2[0]);
      var latitudeDifference = degreesToRadians(point2[0] - point1[0]);
      var longitudeDifference = degreesToRadians(point2[1] - point1[1]);

      // Use the haversine formula
      var haversineOfCentralAngle = (
        Math.pow(Math.sin(latitudeDifference / 2), 2) +
        Math.cos(latitude1) * Math.cos(latitude2) *
        Math.pow(Math.sin(longitudeDifference / 2), 2));

      return RADIUS_OF_EARTH_KM *
        2 * Math.asin(Math.sqrt(haversineOfCentralAngle));
    };

    return {
      Within: function(answer, inputs) {
        var actualDistance = getDistanceInKm(inputs.p, answer);
        return actualDistance <= inputs.d;
      },
      NotWithin: function(answer, inputs) {
        var actualDistance = getDistanceInKm(inputs.p, answer);
        return actualDistance > inputs.d;
      }
    };
  }]
);
