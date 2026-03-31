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
 * @fileoverview Component for coord two dim editor.
 */

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {
  icon,
  latLng,
  LeafletEvent,
  LeafletMouseEvent,
  MapOptions,
  Marker,
  marker,
  tileLayer,
} from 'leaflet';

@Component({
  selector: 'coord-two-dim-editor',
  templateUrl: './coord-two-dim-editor.component.html',
  styleUrls: [],
})
export class CoordTwoDimEditorComponent implements OnInit {
  private _attribution =
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  private _optionsUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  @Input() value!: number[];
  @Output() valueChanged: EventEmitter<[number, number]> = new EventEmitter<
    [number, number]
  >();

  mapMarkers!: Marker<string>;
  optionsSpec = {
    layers: [{url: this._optionsUrl, attribution: this._attribution}],
    zoom: 0,
  };

  options!: MapOptions;

  constructor(private urlInterpolationService: UrlInterpolationService) {}

  leafletClick(e: LeafletMouseEvent): void {
    const newLat = e.latlng.lat;
    const newLng = e.latlng.lng;
    this.value = [newLat, newLng];
    this.updateMarker(newLat, newLng);
    this.valueChanged.emit([newLat, newLng]);
  }

  leafletMove(e: LeafletEvent): void {
    this.value = [e.target._latlng.lat, e.target._latlng.lng];
    this.valueChanged.emit([e.target._latlng.lat, e.target._latlng.lng]);
  }

  private updateMarker(lat: number, lng: number) {
    const newMarker = marker([lat, lng], {
      icon: icon({
        iconUrl: this.urlInterpolationService.getExtensionResourceUrl(
          '/interactions/InteractiveMap/static/marker-icon.png'
        ),
        // The size of the icon image in pixels.
        iconSize: [25, 41],
        // The coordinates of the "tip" of the icon.
        iconAnchor: [12, 41],
        shadowUrl: this.urlInterpolationService.getExtensionResourceUrl(
          '/interactions/InteractiveMap/static/marker-shadow.png'
        ),
        // The size of the shadow image in pixels.
        shadowSize: [41, 41],
        // The coordinates of the "tip" of the shadow.
        shadowAnchor: [13, 41],
        // The URL to a retina sized version of the icon image.
        // Used for Retina screen devices.
        iconRetinaUrl: this.urlInterpolationService.getExtensionResourceUrl(
          '/interactions/InteractiveMap/static/marker-icon-2x.png'
        ),
        shadowRetinaUrl: this.urlInterpolationService.getExtensionResourceUrl(
          '/interactions/InteractiveMap/static/marker-shadow.png'
        ),
      }),
      draggable: true,
    });
    newMarker.on('dragend', e => this.leafletMove(e));
    this.mapMarkers = newMarker;
  }

  ngOnInit(): void {
    if (this.value === undefined) {
      this.value = [0, 0];
    }

    this.options = {
      layers: [
        tileLayer(this.optionsSpec.layers[0].url, {
          attribution: this.optionsSpec.layers[0].attribution,
        }),
      ],
      zoom: this.optionsSpec.zoom,
      center: latLng([this.value[0], this.value[1]]),
    };
    this.updateMarker(this.value[0], this.value[1]);
  }
}
