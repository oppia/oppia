# -*- coding: utf-8 -*-
# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
from google.cloud.vision_v1p1beta1 import gapic_version as package_version

__version__ = package_version.__version__


from google.cloud.vision_helpers import VisionHelpers
from google.cloud.vision_helpers.decorators import add_single_feature_methods

from .services.image_annotator import ImageAnnotatorAsyncClient
from .services.image_annotator import ImageAnnotatorClient as IacImageAnnotatorClient
from .types.geometry import BoundingPoly, Position, Vertex
from .types.image_annotator import (
    AnnotateImageRequest,
    AnnotateImageResponse,
    BatchAnnotateImagesRequest,
    BatchAnnotateImagesResponse,
    ColorInfo,
    CropHint,
    CropHintsAnnotation,
    CropHintsParams,
    DominantColorsAnnotation,
    EntityAnnotation,
    FaceAnnotation,
    Feature,
    Image,
    ImageContext,
    ImageProperties,
    ImageSource,
    LatLongRect,
    Likelihood,
    LocationInfo,
    Property,
    SafeSearchAnnotation,
    TextDetectionParams,
    WebDetectionParams,
)
from .types.text_annotation import Block, Page, Paragraph, Symbol, TextAnnotation, Word
from .types.web_detection import WebDetection


@add_single_feature_methods
class ImageAnnotatorClient(VisionHelpers, IacImageAnnotatorClient):
    __doc__ = IacImageAnnotatorClient.__doc__
    Feature = Feature


__all__ = (
    "ImageAnnotatorAsyncClient",
    "AnnotateImageRequest",
    "AnnotateImageResponse",
    "BatchAnnotateImagesRequest",
    "BatchAnnotateImagesResponse",
    "Block",
    "BoundingPoly",
    "ColorInfo",
    "CropHint",
    "CropHintsAnnotation",
    "CropHintsParams",
    "DominantColorsAnnotation",
    "EntityAnnotation",
    "FaceAnnotation",
    "Feature",
    "Image",
    "ImageAnnotatorClient",
    "ImageContext",
    "ImageProperties",
    "ImageSource",
    "LatLongRect",
    "Likelihood",
    "LocationInfo",
    "Page",
    "Paragraph",
    "Position",
    "Property",
    "SafeSearchAnnotation",
    "Symbol",
    "TextAnnotation",
    "TextDetectionParams",
    "Vertex",
    "WebDetection",
    "WebDetectionParams",
    "Word",
)
