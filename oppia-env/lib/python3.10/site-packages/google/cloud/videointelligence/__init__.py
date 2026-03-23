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
from google.cloud.videointelligence import gapic_version as package_version

__version__ = package_version.__version__


from google.cloud.videointelligence_v1.services.video_intelligence_service.async_client import (
    VideoIntelligenceServiceAsyncClient,
)
from google.cloud.videointelligence_v1.services.video_intelligence_service.client import (
    VideoIntelligenceServiceClient,
)
from google.cloud.videointelligence_v1.types.video_intelligence import (
    AnnotateVideoProgress,
    AnnotateVideoRequest,
    AnnotateVideoResponse,
    DetectedAttribute,
    DetectedLandmark,
    Entity,
    ExplicitContentAnnotation,
    ExplicitContentDetectionConfig,
    ExplicitContentFrame,
    FaceAnnotation,
    FaceDetectionAnnotation,
    FaceDetectionConfig,
    FaceFrame,
    FaceSegment,
    Feature,
    LabelAnnotation,
    LabelDetectionConfig,
    LabelDetectionMode,
    LabelFrame,
    LabelSegment,
    Likelihood,
    LogoRecognitionAnnotation,
    NormalizedBoundingBox,
    NormalizedBoundingPoly,
    NormalizedVertex,
    ObjectTrackingAnnotation,
    ObjectTrackingConfig,
    ObjectTrackingFrame,
    PersonDetectionAnnotation,
    PersonDetectionConfig,
    ShotChangeDetectionConfig,
    SpeechContext,
    SpeechRecognitionAlternative,
    SpeechTranscription,
    SpeechTranscriptionConfig,
    TextAnnotation,
    TextDetectionConfig,
    TextFrame,
    TextSegment,
    TimestampedObject,
    Track,
    VideoAnnotationProgress,
    VideoAnnotationResults,
    VideoContext,
    VideoSegment,
    WordInfo,
)

__all__ = (
    "VideoIntelligenceServiceClient",
    "VideoIntelligenceServiceAsyncClient",
    "AnnotateVideoProgress",
    "AnnotateVideoRequest",
    "AnnotateVideoResponse",
    "DetectedAttribute",
    "DetectedLandmark",
    "Entity",
    "ExplicitContentAnnotation",
    "ExplicitContentDetectionConfig",
    "ExplicitContentFrame",
    "FaceAnnotation",
    "FaceDetectionAnnotation",
    "FaceDetectionConfig",
    "FaceFrame",
    "FaceSegment",
    "LabelAnnotation",
    "LabelDetectionConfig",
    "LabelFrame",
    "LabelSegment",
    "LogoRecognitionAnnotation",
    "NormalizedBoundingBox",
    "NormalizedBoundingPoly",
    "NormalizedVertex",
    "ObjectTrackingAnnotation",
    "ObjectTrackingConfig",
    "ObjectTrackingFrame",
    "PersonDetectionAnnotation",
    "PersonDetectionConfig",
    "ShotChangeDetectionConfig",
    "SpeechContext",
    "SpeechRecognitionAlternative",
    "SpeechTranscription",
    "SpeechTranscriptionConfig",
    "TextAnnotation",
    "TextDetectionConfig",
    "TextFrame",
    "TextSegment",
    "TimestampedObject",
    "Track",
    "VideoAnnotationProgress",
    "VideoAnnotationResults",
    "VideoContext",
    "VideoSegment",
    "WordInfo",
    "Feature",
    "LabelDetectionMode",
    "Likelihood",
)
