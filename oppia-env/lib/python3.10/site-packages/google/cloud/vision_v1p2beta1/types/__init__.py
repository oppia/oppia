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
from .geometry import BoundingPoly, NormalizedVertex, Position, Vertex
from .image_annotator import (
    AnnotateFileResponse,
    AnnotateImageRequest,
    AnnotateImageResponse,
    AsyncAnnotateFileRequest,
    AsyncAnnotateFileResponse,
    AsyncBatchAnnotateFilesRequest,
    AsyncBatchAnnotateFilesResponse,
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
    GcsDestination,
    GcsSource,
    Image,
    ImageAnnotationContext,
    ImageContext,
    ImageProperties,
    ImageSource,
    InputConfig,
    LatLongRect,
    Likelihood,
    LocationInfo,
    OperationMetadata,
    OutputConfig,
    Property,
    SafeSearchAnnotation,
    TextDetectionParams,
    WebDetectionParams,
)
from .text_annotation import Block, Page, Paragraph, Symbol, TextAnnotation, Word
from .web_detection import WebDetection

__all__ = (
    "BoundingPoly",
    "NormalizedVertex",
    "Position",
    "Vertex",
    "AnnotateFileResponse",
    "AnnotateImageRequest",
    "AnnotateImageResponse",
    "AsyncAnnotateFileRequest",
    "AsyncAnnotateFileResponse",
    "AsyncBatchAnnotateFilesRequest",
    "AsyncBatchAnnotateFilesResponse",
    "BatchAnnotateImagesRequest",
    "BatchAnnotateImagesResponse",
    "ColorInfo",
    "CropHint",
    "CropHintsAnnotation",
    "CropHintsParams",
    "DominantColorsAnnotation",
    "EntityAnnotation",
    "FaceAnnotation",
    "Feature",
    "GcsDestination",
    "GcsSource",
    "Image",
    "ImageAnnotationContext",
    "ImageContext",
    "ImageProperties",
    "ImageSource",
    "InputConfig",
    "LatLongRect",
    "LocationInfo",
    "OperationMetadata",
    "OutputConfig",
    "Property",
    "SafeSearchAnnotation",
    "TextDetectionParams",
    "WebDetectionParams",
    "Likelihood",
    "Block",
    "Page",
    "Paragraph",
    "Symbol",
    "TextAnnotation",
    "Word",
    "WebDetection",
)
