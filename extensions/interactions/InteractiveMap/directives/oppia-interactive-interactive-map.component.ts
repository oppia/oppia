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
 * @fileoverview Component for the InteractiveMap interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the component is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {BrowserCheckerService} from 'domain/utilities/browser-checker.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {InteractiveMapCustomizationArgs} from 'interactions/customization-args-defs';
import {InteractionAttributesExtractorService} from 'interactions/interaction-attributes-extractor.service';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {Subscription} from 'rxjs';
import {InteractiveMapRulesService} from './interactive-map-rules.service';
import {
  icon,
  LatLng,
  latLng,
  LeafletMouseEvent,
  Marker,
  marker,
  TileLayer,
  tileLayer,
} from 'leaflet';

interface OverlayStyle {
  'background-color': string;
  opacity: number;
  'z-index': number;
}

interface MapOptions {
  center: LatLng;
  layers: TileLayer[];
  zoom: number;
}

@Component({
  selector: 'oppia-interactive-interactive-map',
  templateUrl: './interactive-map-interaction.component.html',
})
export class InteractiveInteractiveMapComponent implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() latitudeWithValue!: string;
  // Last amswer property only exist in exploration_player view (including the
  // preview mode). Otherwise, it is null.
  @Input() lastAnswer!: number[] | null;
  @Input() longitudeWithValue!: string;
  @Input() zoomWithValue!: string;
  mapMarkers!: Marker<string>;
  mapOptions!: MapOptions;
  coords!: [number, number];
  zoomLevel!: number;
  overlayStyle!: OverlayStyle;

  zoom!: number;
  private _attribution =
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  private _optionsUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  optionsSpec = {
    layers: [{url: this._optionsUrl, attribution: this._attribution}],
    zoom: 0,
  };

  directiveSubscriptions = new Subscription();
  interactionIsActive: boolean = false;

  constructor(
    private browserCheckerService: BrowserCheckerService,
    private currentInteractionService: CurrentInteractionService,
    private interactionAttributesExtractorService: InteractionAttributesExtractorService,
    private interactiveMapRulesService: InteractiveMapRulesService,
    private playerPositionService: PlayerPositionService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardAvailable.subscribe(() => {
        this.interactionIsActive = false;
        this.setOverlay();
      })
    );

    const {latitude, longitude, zoom} =
      this.interactionAttributesExtractorService.getValuesFromAttributes(
        'InteractiveMap',
        this._getArgs()
      ) as InteractiveMapCustomizationArgs;
    this.coords = [latitude.value, longitude.value];
    if (latitude.value === undefined || longitude.value === undefined) {
      this.coords = [0, 0];
    }
    this.zoom = zoom.value;
    this.zoomLevel = parseInt(this.zoom + '', 10) || 0;
    this.interactionIsActive = this.lastAnswer === null;
    this.mapOptions = {
      layers: [
        tileLayer(this.optionsSpec.layers[0].url, {
          attribution: this.optionsSpec.layers[0].attribution,
        }),
      ],
      zoom: this.zoomLevel,
      center: latLng([this.coords[0], this.coords[1]]),
    };
    if (!this.interactionIsActive && this.lastAnswer !== null) {
      this._changeMarkerPosition(this.lastAnswer[0], this.lastAnswer[1]);
    }
  }

  private _getArgs() {
    return {
      latitudeWithValue: this.latitudeWithValue,
      longitudeWithValue: this.longitudeWithValue,
      zoomWithValue: this.zoomWithValue,
    };
  }

  private _changeMarkerPosition(lat: number, lng: number): void {
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
    });
    this.mapMarkers = newMarker;
  }

  leafletClick(e: LeafletMouseEvent): void {
    if (this.interactionIsActive) {
      const newLat = e.latlng.lat;
      const newLng = e.latlng.lng;
      this._changeMarkerPosition(newLat, newLng);
      this.currentInteractionService.onSubmit(
        [newLat, newLng],
        this.interactiveMapRulesService
      );
    }
  }

  leafletMouseOver(): void {
    if (!this.interactionIsActive) {
      this.setOverlay();
    }
  }

  leafletMouseOut(): void {
    if (!this.interactionIsActive) {
      this.hideOverlay();
    }
  }

  setOverlay(): void {
    this.overlayStyle = {
      'background-color': '#fff',
      opacity: 0.5,
      'z-index': 1001,
    };
  }

  hideOverlay(): void {
    this.overlayStyle = {
      'background-color': '#fff',
      opacity: 0,
      'z-index': 0,
    };
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
