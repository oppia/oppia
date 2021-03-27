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
 * @fileoverview Directive for coord two dim editor.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { icon, latLng, marker } from 'leaflet';
@Component({
  selector: 'coord-two-dim-editor',
  templateUrl: './coord-two-dim-editor.directive.html',
  styleUrls: []
})
export class CoordTwoDimEditorComponent implements OnInit {
  @Input() value;
  latLangValue;
  mapEvents = {
    map: {
      enable: ['click'],
      logic: 'emit'
    },
    markers: {
      enable: ['dragend'],
      logic: 'emit'
    }
  };
  mapCenter = latLng(0, 0);
  mapMarkers;
  constructor(private urlInterpolationService: UrlInterpolationService) {}

  leafletClick(e: any): void {
    const newLat = e.leafletEvent.latlng.lat;
    const newLng = e.leafletEvent.latlng.lng;
    this.value = [newLat, newLng];
    this.updateMarker(newLat, newLng);
  }

  leafletMove(e: any): void {
    this.value = [e.model.lat, e.model.lng];
  }

  private updateMarker(lat, lng) {
    this.mapMarkers.mainMarker.lat = lat;
    this.mapMarkers.mainMarker.lng = lng;
  }

  ngOnInit(): void {
    this.mapCenter = latLng(this.value[0], this.value[1]);
    this.mapMarkers = marker(latLng(this.value[0], this.value[1]), {
      icon: icon({
        iconUrl: this.urlInterpolationService.getExtensionResourceUrl(
          '/interactions/InteractiveMap/static/marker-icon.png'),
        // The size of the icon image in pixels.
        iconSize: [25, 41],
        // The coordinates of the "tip" of the icon.
        iconAnchor: [12, 41],
        shadowUrl: this.urlInterpolationService.getExtensionResourceUrl(
          '/interactions/InteractiveMap/static/marker-shadow.png'),
        // The size of the shadow image in pixels.
        shadowSize: [41, 41],
        // The coordinates of the "tip" of the shadow.
        shadowAnchor: [13, 41],
        // The URL to a retina sized version of the icon image.
        // Used for Retina screen devices.
        iconRetinaUrl: this.urlInterpolationService.getExtensionResourceUrl(
          '/interactions/InteractiveMap/static/marker-icon-2x.png'),
        shadowRetinaUrl:
      this.urlInterpolationService.getExtensionResourceUrl(
        '/interactions/InteractiveMap/static/marker-shadow.png')
      }),
      draggable: true
    }
    );
  }
}

angular.module('oppia').directive(
  'coordTwoDimEditor', downgradeComponent({
    component: CoordTwoDimEditorComponent
  }));
