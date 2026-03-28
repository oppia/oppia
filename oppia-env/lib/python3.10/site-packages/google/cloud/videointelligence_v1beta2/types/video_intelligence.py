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
from __future__ import annotations

from typing import MutableMapping, MutableSequence

from google.protobuf import duration_pb2  # type: ignore
from google.protobuf import timestamp_pb2  # type: ignore
from google.rpc import status_pb2  # type: ignore
import proto  # type: ignore

__protobuf__ = proto.module(
    package="google.cloud.videointelligence.v1beta2",
    manifest={
        "Feature",
        "LabelDetectionMode",
        "Likelihood",
        "AnnotateVideoRequest",
        "VideoContext",
        "LabelDetectionConfig",
        "ShotChangeDetectionConfig",
        "ExplicitContentDetectionConfig",
        "FaceDetectionConfig",
        "VideoSegment",
        "LabelSegment",
        "LabelFrame",
        "Entity",
        "LabelAnnotation",
        "ExplicitContentFrame",
        "ExplicitContentAnnotation",
        "NormalizedBoundingBox",
        "FaceSegment",
        "FaceFrame",
        "FaceAnnotation",
        "VideoAnnotationResults",
        "AnnotateVideoResponse",
        "VideoAnnotationProgress",
        "AnnotateVideoProgress",
    },
)


class Feature(proto.Enum):
    r"""Video annotation feature.

    Values:
        FEATURE_UNSPECIFIED (0):
            Unspecified.
        LABEL_DETECTION (1):
            Label detection. Detect objects, such as dog
            or flower.
        SHOT_CHANGE_DETECTION (2):
            Shot change detection.
        EXPLICIT_CONTENT_DETECTION (3):
            Explicit content detection.
        FACE_DETECTION (4):
            Human face detection and tracking.
    """
    FEATURE_UNSPECIFIED = 0
    LABEL_DETECTION = 1
    SHOT_CHANGE_DETECTION = 2
    EXPLICIT_CONTENT_DETECTION = 3
    FACE_DETECTION = 4


class LabelDetectionMode(proto.Enum):
    r"""Label detection mode.

    Values:
        LABEL_DETECTION_MODE_UNSPECIFIED (0):
            Unspecified.
        SHOT_MODE (1):
            Detect shot-level labels.
        FRAME_MODE (2):
            Detect frame-level labels.
        SHOT_AND_FRAME_MODE (3):
            Detect both shot-level and frame-level
            labels.
    """
    LABEL_DETECTION_MODE_UNSPECIFIED = 0
    SHOT_MODE = 1
    FRAME_MODE = 2
    SHOT_AND_FRAME_MODE = 3


class Likelihood(proto.Enum):
    r"""Bucketized representation of likelihood.

    Values:
        LIKELIHOOD_UNSPECIFIED (0):
            Unspecified likelihood.
        VERY_UNLIKELY (1):
            Very unlikely.
        UNLIKELY (2):
            Unlikely.
        POSSIBLE (3):
            Possible.
        LIKELY (4):
            Likely.
        VERY_LIKELY (5):
            Very likely.
    """
    LIKELIHOOD_UNSPECIFIED = 0
    VERY_UNLIKELY = 1
    UNLIKELY = 2
    POSSIBLE = 3
    LIKELY = 4
    VERY_LIKELY = 5


class AnnotateVideoRequest(proto.Message):
    r"""Video annotation request.

    Attributes:
        input_uri (str):
            Input video location. Currently, only `Google Cloud
            Storage <https://cloud.google.com/storage/>`__ URIs are
            supported, which must be specified in the following format:
            ``gs://bucket-id/object-id`` (other URI formats return
            [google.rpc.Code.INVALID_ARGUMENT][google.rpc.Code.INVALID_ARGUMENT]).
            For more information, see `Request
            URIs <https://cloud.google.com/storage/docs/request-endpoints>`__.
            A video URI may include wildcards in ``object-id``, and thus
            identify multiple videos. Supported wildcards: '*' to match
            0 or more characters; '?' to match 1 character. If unset,
            the input video should be embedded in the request as
            ``input_content``. If set, ``input_content`` should be
            unset.
        input_content (bytes):
            The video data bytes. If unset, the input video(s) should be
            specified via ``input_uri``. If set, ``input_uri`` should be
            unset.
        features (MutableSequence[google.cloud.videointelligence_v1beta2.types.Feature]):
            Required. Requested video annotation
            features.
        video_context (google.cloud.videointelligence_v1beta2.types.VideoContext):
            Additional video context and/or
            feature-specific parameters.
        output_uri (str):
            Optional. Location where the output (in JSON format) should
            be stored. Currently, only `Google Cloud
            Storage <https://cloud.google.com/storage/>`__ URIs are
            supported, which must be specified in the following format:
            ``gs://bucket-id/object-id`` (other URI formats return
            [google.rpc.Code.INVALID_ARGUMENT][google.rpc.Code.INVALID_ARGUMENT]).
            For more information, see `Request
            URIs <https://cloud.google.com/storage/docs/request-endpoints>`__.
        location_id (str):
            Optional. Cloud region where annotation should take place.
            Supported cloud regions: ``us-east1``, ``us-west1``,
            ``europe-west1``, ``asia-east1``. If no region is specified,
            a region will be determined based on video file location.
    """

    input_uri: str = proto.Field(
        proto.STRING,
        number=1,
    )
    input_content: bytes = proto.Field(
        proto.BYTES,
        number=6,
    )
    features: MutableSequence["Feature"] = proto.RepeatedField(
        proto.ENUM,
        number=2,
        enum="Feature",
    )
    video_context: "VideoContext" = proto.Field(
        proto.MESSAGE,
        number=3,
        message="VideoContext",
    )
    output_uri: str = proto.Field(
        proto.STRING,
        number=4,
    )
    location_id: str = proto.Field(
        proto.STRING,
        number=5,
    )


class VideoContext(proto.Message):
    r"""Video context and/or feature-specific parameters.

    Attributes:
        segments (MutableSequence[google.cloud.videointelligence_v1beta2.types.VideoSegment]):
            Video segments to annotate. The segments may
            overlap and are not required to be contiguous or
            span the whole video. If unspecified, each video
            is treated as a single segment.
        label_detection_config (google.cloud.videointelligence_v1beta2.types.LabelDetectionConfig):
            Config for LABEL_DETECTION.
        shot_change_detection_config (google.cloud.videointelligence_v1beta2.types.ShotChangeDetectionConfig):
            Config for SHOT_CHANGE_DETECTION.
        explicit_content_detection_config (google.cloud.videointelligence_v1beta2.types.ExplicitContentDetectionConfig):
            Config for EXPLICIT_CONTENT_DETECTION.
        face_detection_config (google.cloud.videointelligence_v1beta2.types.FaceDetectionConfig):
            Config for FACE_DETECTION.
    """

    segments: MutableSequence["VideoSegment"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="VideoSegment",
    )
    label_detection_config: "LabelDetectionConfig" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="LabelDetectionConfig",
    )
    shot_change_detection_config: "ShotChangeDetectionConfig" = proto.Field(
        proto.MESSAGE,
        number=3,
        message="ShotChangeDetectionConfig",
    )
    explicit_content_detection_config: "ExplicitContentDetectionConfig" = proto.Field(
        proto.MESSAGE,
        number=4,
        message="ExplicitContentDetectionConfig",
    )
    face_detection_config: "FaceDetectionConfig" = proto.Field(
        proto.MESSAGE,
        number=5,
        message="FaceDetectionConfig",
    )


class LabelDetectionConfig(proto.Message):
    r"""Config for LABEL_DETECTION.

    Attributes:
        label_detection_mode (google.cloud.videointelligence_v1beta2.types.LabelDetectionMode):
            What labels should be detected with LABEL_DETECTION, in
            addition to video-level labels or segment-level labels. If
            unspecified, defaults to ``SHOT_MODE``.
        stationary_camera (bool):
            Whether the video has been shot from a stationary (i.e.
            non-moving) camera. When set to true, might improve
            detection accuracy for moving objects. Should be used with
            ``SHOT_AND_FRAME_MODE`` enabled.
        model (str):
            Model to use for label detection.
            Supported values: "builtin/stable" (the default
            if unset) and "builtin/latest".
    """

    label_detection_mode: "LabelDetectionMode" = proto.Field(
        proto.ENUM,
        number=1,
        enum="LabelDetectionMode",
    )
    stationary_camera: bool = proto.Field(
        proto.BOOL,
        number=2,
    )
    model: str = proto.Field(
        proto.STRING,
        number=3,
    )


class ShotChangeDetectionConfig(proto.Message):
    r"""Config for SHOT_CHANGE_DETECTION.

    Attributes:
        model (str):
            Model to use for shot change detection.
            Supported values: "builtin/stable" (the default
            if unset) and "builtin/latest".
    """

    model: str = proto.Field(
        proto.STRING,
        number=1,
    )


class ExplicitContentDetectionConfig(proto.Message):
    r"""Config for EXPLICIT_CONTENT_DETECTION.

    Attributes:
        model (str):
            Model to use for explicit content detection.
            Supported values: "builtin/stable" (the default
            if unset) and "builtin/latest".
    """

    model: str = proto.Field(
        proto.STRING,
        number=1,
    )


class FaceDetectionConfig(proto.Message):
    r"""Config for FACE_DETECTION.

    Attributes:
        model (str):
            Model to use for face detection.
            Supported values: "builtin/stable" (the default
            if unset) and "builtin/latest".
        include_bounding_boxes (bool):
            Whether bounding boxes be included in the
            face annotation output.
    """

    model: str = proto.Field(
        proto.STRING,
        number=1,
    )
    include_bounding_boxes: bool = proto.Field(
        proto.BOOL,
        number=2,
    )


class VideoSegment(proto.Message):
    r"""Video segment.

    Attributes:
        start_time_offset (google.protobuf.duration_pb2.Duration):
            Time-offset, relative to the beginning of the
            video, corresponding to the start of the segment
            (inclusive).
        end_time_offset (google.protobuf.duration_pb2.Duration):
            Time-offset, relative to the beginning of the
            video, corresponding to the end of the segment
            (inclusive).
    """

    start_time_offset: duration_pb2.Duration = proto.Field(
        proto.MESSAGE,
        number=1,
        message=duration_pb2.Duration,
    )
    end_time_offset: duration_pb2.Duration = proto.Field(
        proto.MESSAGE,
        number=2,
        message=duration_pb2.Duration,
    )


class LabelSegment(proto.Message):
    r"""Video segment level annotation results for label detection.

    Attributes:
        segment (google.cloud.videointelligence_v1beta2.types.VideoSegment):
            Video segment where a label was detected.
        confidence (float):
            Confidence that the label is accurate. Range: [0, 1].
    """

    segment: "VideoSegment" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="VideoSegment",
    )
    confidence: float = proto.Field(
        proto.FLOAT,
        number=2,
    )


class LabelFrame(proto.Message):
    r"""Video frame level annotation results for label detection.

    Attributes:
        time_offset (google.protobuf.duration_pb2.Duration):
            Time-offset, relative to the beginning of the
            video, corresponding to the video frame for this
            location.
        confidence (float):
            Confidence that the label is accurate. Range: [0, 1].
    """

    time_offset: duration_pb2.Duration = proto.Field(
        proto.MESSAGE,
        number=1,
        message=duration_pb2.Duration,
    )
    confidence: float = proto.Field(
        proto.FLOAT,
        number=2,
    )


class Entity(proto.Message):
    r"""Detected entity from video analysis.

    Attributes:
        entity_id (str):
            Opaque entity ID. Some IDs may be available in `Google
            Knowledge Graph Search
            API <https://developers.google.com/knowledge-graph/>`__.
        description (str):
            Textual description, e.g. ``Fixed-gear bicycle``.
        language_code (str):
            Language code for ``description`` in BCP-47 format.
    """

    entity_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    description: str = proto.Field(
        proto.STRING,
        number=2,
    )
    language_code: str = proto.Field(
        proto.STRING,
        number=3,
    )


class LabelAnnotation(proto.Message):
    r"""Label annotation.

    Attributes:
        entity (google.cloud.videointelligence_v1beta2.types.Entity):
            Detected entity.
        category_entities (MutableSequence[google.cloud.videointelligence_v1beta2.types.Entity]):
            Common categories for the detected entity. E.g. when the
            label is ``Terrier`` the category is likely ``dog``. And in
            some cases there might be more than one categories e.g.
            ``Terrier`` could also be a ``pet``.
        segments (MutableSequence[google.cloud.videointelligence_v1beta2.types.LabelSegment]):
            All video segments where a label was
            detected.
        frames (MutableSequence[google.cloud.videointelligence_v1beta2.types.LabelFrame]):
            All video frames where a label was detected.
    """

    entity: "Entity" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Entity",
    )
    category_entities: MutableSequence["Entity"] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="Entity",
    )
    segments: MutableSequence["LabelSegment"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="LabelSegment",
    )
    frames: MutableSequence["LabelFrame"] = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message="LabelFrame",
    )


class ExplicitContentFrame(proto.Message):
    r"""Video frame level annotation results for explicit content.

    Attributes:
        time_offset (google.protobuf.duration_pb2.Duration):
            Time-offset, relative to the beginning of the
            video, corresponding to the video frame for this
            location.
        pornography_likelihood (google.cloud.videointelligence_v1beta2.types.Likelihood):
            Likelihood of the pornography content..
    """

    time_offset: duration_pb2.Duration = proto.Field(
        proto.MESSAGE,
        number=1,
        message=duration_pb2.Duration,
    )
    pornography_likelihood: "Likelihood" = proto.Field(
        proto.ENUM,
        number=2,
        enum="Likelihood",
    )


class ExplicitContentAnnotation(proto.Message):
    r"""Explicit content annotation (based on per-frame visual
    signals only). If no explicit content has been detected in a
    frame, no annotations are present for that frame.

    Attributes:
        frames (MutableSequence[google.cloud.videointelligence_v1beta2.types.ExplicitContentFrame]):
            All video frames where explicit content was
            detected.
    """

    frames: MutableSequence["ExplicitContentFrame"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="ExplicitContentFrame",
    )


class NormalizedBoundingBox(proto.Message):
    r"""Normalized bounding box. The normalized vertex coordinates are
    relative to the original image. Range: [0, 1].

    Attributes:
        left (float):
            Left X coordinate.
        top (float):
            Top Y coordinate.
        right (float):
            Right X coordinate.
        bottom (float):
            Bottom Y coordinate.
    """

    left: float = proto.Field(
        proto.FLOAT,
        number=1,
    )
    top: float = proto.Field(
        proto.FLOAT,
        number=2,
    )
    right: float = proto.Field(
        proto.FLOAT,
        number=3,
    )
    bottom: float = proto.Field(
        proto.FLOAT,
        number=4,
    )


class FaceSegment(proto.Message):
    r"""Video segment level annotation results for face detection.

    Attributes:
        segment (google.cloud.videointelligence_v1beta2.types.VideoSegment):
            Video segment where a face was detected.
    """

    segment: "VideoSegment" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="VideoSegment",
    )


class FaceFrame(proto.Message):
    r"""Video frame level annotation results for face detection.

    Attributes:
        normalized_bounding_boxes (MutableSequence[google.cloud.videointelligence_v1beta2.types.NormalizedBoundingBox]):
            Normalized Bounding boxes in a frame.
            There can be more than one boxes if the same
            face is detected in multiple locations within
            the current frame.
        time_offset (google.protobuf.duration_pb2.Duration):
            Time-offset, relative to the beginning of the
            video, corresponding to the video frame for this
            location.
    """

    normalized_bounding_boxes: MutableSequence[
        "NormalizedBoundingBox"
    ] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="NormalizedBoundingBox",
    )
    time_offset: duration_pb2.Duration = proto.Field(
        proto.MESSAGE,
        number=2,
        message=duration_pb2.Duration,
    )


class FaceAnnotation(proto.Message):
    r"""Face annotation.

    Attributes:
        thumbnail (bytes):
            Thumbnail of a representative face view (in
            JPEG format).
        segments (MutableSequence[google.cloud.videointelligence_v1beta2.types.FaceSegment]):
            All video segments where a face was detected.
        frames (MutableSequence[google.cloud.videointelligence_v1beta2.types.FaceFrame]):
            All video frames where a face was detected.
    """

    thumbnail: bytes = proto.Field(
        proto.BYTES,
        number=1,
    )
    segments: MutableSequence["FaceSegment"] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="FaceSegment",
    )
    frames: MutableSequence["FaceFrame"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="FaceFrame",
    )


class VideoAnnotationResults(proto.Message):
    r"""Annotation results for a single video.

    Attributes:
        input_uri (str):
            Video file location in `Google Cloud
            Storage <https://cloud.google.com/storage/>`__.
        segment_label_annotations (MutableSequence[google.cloud.videointelligence_v1beta2.types.LabelAnnotation]):
            Label annotations on video level or user
            specified segment level. There is exactly one
            element for each unique label.
        shot_label_annotations (MutableSequence[google.cloud.videointelligence_v1beta2.types.LabelAnnotation]):
            Label annotations on shot level.
            There is exactly one element for each unique
            label.
        frame_label_annotations (MutableSequence[google.cloud.videointelligence_v1beta2.types.LabelAnnotation]):
            Label annotations on frame level.
            There is exactly one element for each unique
            label.
        face_annotations (MutableSequence[google.cloud.videointelligence_v1beta2.types.FaceAnnotation]):
            Face annotations. There is exactly one
            element for each unique face.
        shot_annotations (MutableSequence[google.cloud.videointelligence_v1beta2.types.VideoSegment]):
            Shot annotations. Each shot is represented as
            a video segment.
        explicit_annotation (google.cloud.videointelligence_v1beta2.types.ExplicitContentAnnotation):
            Explicit content annotation.
        error (google.rpc.status_pb2.Status):
            If set, indicates an error. Note that for a single
            ``AnnotateVideoRequest`` some videos may succeed and some
            may fail.
    """

    input_uri: str = proto.Field(
        proto.STRING,
        number=1,
    )
    segment_label_annotations: MutableSequence["LabelAnnotation"] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="LabelAnnotation",
    )
    shot_label_annotations: MutableSequence["LabelAnnotation"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="LabelAnnotation",
    )
    frame_label_annotations: MutableSequence["LabelAnnotation"] = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message="LabelAnnotation",
    )
    face_annotations: MutableSequence["FaceAnnotation"] = proto.RepeatedField(
        proto.MESSAGE,
        number=5,
        message="FaceAnnotation",
    )
    shot_annotations: MutableSequence["VideoSegment"] = proto.RepeatedField(
        proto.MESSAGE,
        number=6,
        message="VideoSegment",
    )
    explicit_annotation: "ExplicitContentAnnotation" = proto.Field(
        proto.MESSAGE,
        number=7,
        message="ExplicitContentAnnotation",
    )
    error: status_pb2.Status = proto.Field(
        proto.MESSAGE,
        number=9,
        message=status_pb2.Status,
    )


class AnnotateVideoResponse(proto.Message):
    r"""Video annotation response. Included in the ``response`` field of the
    ``Operation`` returned by the ``GetOperation`` call of the
    ``google::longrunning::Operations`` service.

    Attributes:
        annotation_results (MutableSequence[google.cloud.videointelligence_v1beta2.types.VideoAnnotationResults]):
            Annotation results for all videos specified in
            ``AnnotateVideoRequest``.
    """

    annotation_results: MutableSequence["VideoAnnotationResults"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="VideoAnnotationResults",
    )


class VideoAnnotationProgress(proto.Message):
    r"""Annotation progress for a single video.

    Attributes:
        input_uri (str):
            Video file location in `Google Cloud
            Storage <https://cloud.google.com/storage/>`__.
        progress_percent (int):
            Approximate percentage processed thus far.
            Guaranteed to be 100 when fully processed.
        start_time (google.protobuf.timestamp_pb2.Timestamp):
            Time when the request was received.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            Time of the most recent update.
    """

    input_uri: str = proto.Field(
        proto.STRING,
        number=1,
    )
    progress_percent: int = proto.Field(
        proto.INT32,
        number=2,
    )
    start_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=4,
        message=timestamp_pb2.Timestamp,
    )


class AnnotateVideoProgress(proto.Message):
    r"""Video annotation progress. Included in the ``metadata`` field of the
    ``Operation`` returned by the ``GetOperation`` call of the
    ``google::longrunning::Operations`` service.

    Attributes:
        annotation_progress (MutableSequence[google.cloud.videointelligence_v1beta2.types.VideoAnnotationProgress]):
            Progress metadata for all videos specified in
            ``AnnotateVideoRequest``.
    """

    annotation_progress: MutableSequence[
        "VideoAnnotationProgress"
    ] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="VideoAnnotationProgress",
    )


__all__ = tuple(sorted(__protobuf__.manifest))
