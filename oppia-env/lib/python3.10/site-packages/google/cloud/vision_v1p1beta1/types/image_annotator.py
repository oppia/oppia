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

from google.rpc import status_pb2  # type: ignore
from google.type import color_pb2  # type: ignore
from google.type import latlng_pb2  # type: ignore
import proto  # type: ignore

from google.cloud.vision_v1p1beta1.types import web_detection as gcv_web_detection
from google.cloud.vision_v1p1beta1.types import geometry, text_annotation

__protobuf__ = proto.module(
    package="google.cloud.vision.v1p1beta1",
    manifest={
        "Likelihood",
        "Feature",
        "ImageSource",
        "Image",
        "FaceAnnotation",
        "LocationInfo",
        "Property",
        "EntityAnnotation",
        "SafeSearchAnnotation",
        "LatLongRect",
        "ColorInfo",
        "DominantColorsAnnotation",
        "ImageProperties",
        "CropHint",
        "CropHintsAnnotation",
        "CropHintsParams",
        "WebDetectionParams",
        "TextDetectionParams",
        "ImageContext",
        "AnnotateImageRequest",
        "AnnotateImageResponse",
        "BatchAnnotateImagesRequest",
        "BatchAnnotateImagesResponse",
    },
)


class Likelihood(proto.Enum):
    r"""A bucketized representation of likelihood, which is intended
    to give clients highly stable results across model upgrades.

    Values:
        UNKNOWN (0):
            Unknown likelihood.
        VERY_UNLIKELY (1):
            It is very unlikely that the image belongs to
            the specified vertical.
        UNLIKELY (2):
            It is unlikely that the image belongs to the
            specified vertical.
        POSSIBLE (3):
            It is possible that the image belongs to the
            specified vertical.
        LIKELY (4):
            It is likely that the image belongs to the
            specified vertical.
        VERY_LIKELY (5):
            It is very likely that the image belongs to
            the specified vertical.
    """
    UNKNOWN = 0
    VERY_UNLIKELY = 1
    UNLIKELY = 2
    POSSIBLE = 3
    LIKELY = 4
    VERY_LIKELY = 5


class Feature(proto.Message):
    r"""Users describe the type of Google Cloud Vision API tasks to perform
    over images by using *Feature*\ s. Each Feature indicates a type of
    image detection task to perform. Features encode the Cloud Vision
    API vertical to operate on and the number of top-scoring results to
    return.

    Attributes:
        type_ (google.cloud.vision_v1p1beta1.types.Feature.Type):
            The feature type.
        max_results (int):
            Maximum number of results of this type.
        model (str):
            Model to use for the feature. Supported values:
            "builtin/stable" (the default if unset) and
            "builtin/latest". ``DOCUMENT_TEXT_DETECTION`` and
            ``TEXT_DETECTION`` also support "builtin/weekly" for the
            bleeding edge release updated weekly.
    """

    class Type(proto.Enum):
        r"""Type of image feature.

        Values:
            TYPE_UNSPECIFIED (0):
                Unspecified feature type.
            FACE_DETECTION (1):
                Run face detection.
            LANDMARK_DETECTION (2):
                Run landmark detection.
            LOGO_DETECTION (3):
                Run logo detection.
            LABEL_DETECTION (4):
                Run label detection.
            TEXT_DETECTION (5):
                Run OCR.
            DOCUMENT_TEXT_DETECTION (11):
                Run dense text document OCR. Takes precedence when both
                DOCUMENT_TEXT_DETECTION and TEXT_DETECTION are present.
            SAFE_SEARCH_DETECTION (6):
                Run computer vision models to compute image
                safe-search properties.
            IMAGE_PROPERTIES (7):
                Compute a set of image properties, such as
                the image's dominant colors.
            CROP_HINTS (9):
                Run crop hints.
            WEB_DETECTION (10):
                Run web detection.
        """
        TYPE_UNSPECIFIED = 0
        FACE_DETECTION = 1
        LANDMARK_DETECTION = 2
        LOGO_DETECTION = 3
        LABEL_DETECTION = 4
        TEXT_DETECTION = 5
        DOCUMENT_TEXT_DETECTION = 11
        SAFE_SEARCH_DETECTION = 6
        IMAGE_PROPERTIES = 7
        CROP_HINTS = 9
        WEB_DETECTION = 10

    type_: Type = proto.Field(
        proto.ENUM,
        number=1,
        enum=Type,
    )
    max_results: int = proto.Field(
        proto.INT32,
        number=2,
    )
    model: str = proto.Field(
        proto.STRING,
        number=3,
    )


class ImageSource(proto.Message):
    r"""External image source (Google Cloud Storage image location).

    Attributes:
        gcs_image_uri (str):
            NOTE: For new code ``image_uri`` below is preferred. Google
            Cloud Storage image URI, which must be in the following
            form: ``gs://bucket_name/object_name`` (for details, see
            `Google Cloud Storage Request
            URIs <https://cloud.google.com/storage/docs/reference-uris>`__).
            NOTE: Cloud Storage object versioning is not supported.
        image_uri (str):
            Image URI which supports:

            1) Google Cloud Storage image URI, which must be in the
               following form: ``gs://bucket_name/object_name`` (for
               details, see `Google Cloud Storage Request
               URIs <https://cloud.google.com/storage/docs/reference-uris>`__).
               NOTE: Cloud Storage object versioning is not supported.
            2) Publicly accessible image HTTP/HTTPS URL. This is
               preferred over the legacy ``gcs_image_uri`` above. When
               both ``gcs_image_uri`` and ``image_uri`` are specified,
               ``image_uri`` takes precedence.
    """

    gcs_image_uri: str = proto.Field(
        proto.STRING,
        number=1,
    )
    image_uri: str = proto.Field(
        proto.STRING,
        number=2,
    )


class Image(proto.Message):
    r"""Client image to perform Google Cloud Vision API tasks over.

    Attributes:
        content (bytes):
            Image content, represented as a stream of bytes. Note: as
            with all ``bytes`` fields, protobuffers use a pure binary
            representation, whereas JSON representations use base64.
        source (google.cloud.vision_v1p1beta1.types.ImageSource):
            Google Cloud Storage image location. If both ``content`` and
            ``source`` are provided for an image, ``content`` takes
            precedence and is used to perform the image annotation
            request.
    """

    content: bytes = proto.Field(
        proto.BYTES,
        number=1,
    )
    source: "ImageSource" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="ImageSource",
    )


class FaceAnnotation(proto.Message):
    r"""A face annotation object contains the results of face
    detection.

    Attributes:
        bounding_poly (google.cloud.vision_v1p1beta1.types.BoundingPoly):
            The bounding polygon around the face. The coordinates of the
            bounding box are in the original image's scale, as returned
            in ``ImageParams``. The bounding box is computed to "frame"
            the face in accordance with human expectations. It is based
            on the landmarker results. Note that one or more x and/or y
            coordinates may not be generated in the ``BoundingPoly``
            (the polygon will be unbounded) if only a partial face
            appears in the image to be annotated.
        fd_bounding_poly (google.cloud.vision_v1p1beta1.types.BoundingPoly):
            The ``fd_bounding_poly`` bounding polygon is tighter than
            the ``boundingPoly``, and encloses only the skin part of the
            face. Typically, it is used to eliminate the face from any
            image analysis that detects the "amount of skin" visible in
            an image. It is not based on the landmarker results, only on
            the initial face detection, hence the fd (face detection)
            prefix.
        landmarks (MutableSequence[google.cloud.vision_v1p1beta1.types.FaceAnnotation.Landmark]):
            Detected face landmarks.
        roll_angle (float):
            Roll angle, which indicates the amount of
            clockwise/anti-clockwise rotation of the face relative to
            the image vertical about the axis perpendicular to the face.
            Range [-180,180].
        pan_angle (float):
            Yaw angle, which indicates the leftward/rightward angle that
            the face is pointing relative to the vertical plane
            perpendicular to the image. Range [-180,180].
        tilt_angle (float):
            Pitch angle, which indicates the upwards/downwards angle
            that the face is pointing relative to the image's horizontal
            plane. Range [-180,180].
        detection_confidence (float):
            Detection confidence. Range [0, 1].
        landmarking_confidence (float):
            Face landmarking confidence. Range [0, 1].
        joy_likelihood (google.cloud.vision_v1p1beta1.types.Likelihood):
            Joy likelihood.
        sorrow_likelihood (google.cloud.vision_v1p1beta1.types.Likelihood):
            Sorrow likelihood.
        anger_likelihood (google.cloud.vision_v1p1beta1.types.Likelihood):
            Anger likelihood.
        surprise_likelihood (google.cloud.vision_v1p1beta1.types.Likelihood):
            Surprise likelihood.
        under_exposed_likelihood (google.cloud.vision_v1p1beta1.types.Likelihood):
            Under-exposed likelihood.
        blurred_likelihood (google.cloud.vision_v1p1beta1.types.Likelihood):
            Blurred likelihood.
        headwear_likelihood (google.cloud.vision_v1p1beta1.types.Likelihood):
            Headwear likelihood.
    """

    class Landmark(proto.Message):
        r"""A face-specific landmark (for example, a face feature).

        Attributes:
            type_ (google.cloud.vision_v1p1beta1.types.FaceAnnotation.Landmark.Type):
                Face landmark type.
            position (google.cloud.vision_v1p1beta1.types.Position):
                Face landmark position.
        """

        class Type(proto.Enum):
            r"""Face landmark (feature) type. Left and right are defined from the
            vantage of the viewer of the image without considering mirror
            projections typical of photos. So, ``LEFT_EYE``, typically, is the
            person's right eye.

            Values:
                UNKNOWN_LANDMARK (0):
                    Unknown face landmark detected. Should not be
                    filled.
                LEFT_EYE (1):
                    Left eye.
                RIGHT_EYE (2):
                    Right eye.
                LEFT_OF_LEFT_EYEBROW (3):
                    Left of left eyebrow.
                RIGHT_OF_LEFT_EYEBROW (4):
                    Right of left eyebrow.
                LEFT_OF_RIGHT_EYEBROW (5):
                    Left of right eyebrow.
                RIGHT_OF_RIGHT_EYEBROW (6):
                    Right of right eyebrow.
                MIDPOINT_BETWEEN_EYES (7):
                    Midpoint between eyes.
                NOSE_TIP (8):
                    Nose tip.
                UPPER_LIP (9):
                    Upper lip.
                LOWER_LIP (10):
                    Lower lip.
                MOUTH_LEFT (11):
                    Mouth left.
                MOUTH_RIGHT (12):
                    Mouth right.
                MOUTH_CENTER (13):
                    Mouth center.
                NOSE_BOTTOM_RIGHT (14):
                    Nose, bottom right.
                NOSE_BOTTOM_LEFT (15):
                    Nose, bottom left.
                NOSE_BOTTOM_CENTER (16):
                    Nose, bottom center.
                LEFT_EYE_TOP_BOUNDARY (17):
                    Left eye, top boundary.
                LEFT_EYE_RIGHT_CORNER (18):
                    Left eye, right corner.
                LEFT_EYE_BOTTOM_BOUNDARY (19):
                    Left eye, bottom boundary.
                LEFT_EYE_LEFT_CORNER (20):
                    Left eye, left corner.
                RIGHT_EYE_TOP_BOUNDARY (21):
                    Right eye, top boundary.
                RIGHT_EYE_RIGHT_CORNER (22):
                    Right eye, right corner.
                RIGHT_EYE_BOTTOM_BOUNDARY (23):
                    Right eye, bottom boundary.
                RIGHT_EYE_LEFT_CORNER (24):
                    Right eye, left corner.
                LEFT_EYEBROW_UPPER_MIDPOINT (25):
                    Left eyebrow, upper midpoint.
                RIGHT_EYEBROW_UPPER_MIDPOINT (26):
                    Right eyebrow, upper midpoint.
                LEFT_EAR_TRAGION (27):
                    Left ear tragion.
                RIGHT_EAR_TRAGION (28):
                    Right ear tragion.
                LEFT_EYE_PUPIL (29):
                    Left eye pupil.
                RIGHT_EYE_PUPIL (30):
                    Right eye pupil.
                FOREHEAD_GLABELLA (31):
                    Forehead glabella.
                CHIN_GNATHION (32):
                    Chin gnathion.
                CHIN_LEFT_GONION (33):
                    Chin left gonion.
                CHIN_RIGHT_GONION (34):
                    Chin right gonion.
            """
            UNKNOWN_LANDMARK = 0
            LEFT_EYE = 1
            RIGHT_EYE = 2
            LEFT_OF_LEFT_EYEBROW = 3
            RIGHT_OF_LEFT_EYEBROW = 4
            LEFT_OF_RIGHT_EYEBROW = 5
            RIGHT_OF_RIGHT_EYEBROW = 6
            MIDPOINT_BETWEEN_EYES = 7
            NOSE_TIP = 8
            UPPER_LIP = 9
            LOWER_LIP = 10
            MOUTH_LEFT = 11
            MOUTH_RIGHT = 12
            MOUTH_CENTER = 13
            NOSE_BOTTOM_RIGHT = 14
            NOSE_BOTTOM_LEFT = 15
            NOSE_BOTTOM_CENTER = 16
            LEFT_EYE_TOP_BOUNDARY = 17
            LEFT_EYE_RIGHT_CORNER = 18
            LEFT_EYE_BOTTOM_BOUNDARY = 19
            LEFT_EYE_LEFT_CORNER = 20
            RIGHT_EYE_TOP_BOUNDARY = 21
            RIGHT_EYE_RIGHT_CORNER = 22
            RIGHT_EYE_BOTTOM_BOUNDARY = 23
            RIGHT_EYE_LEFT_CORNER = 24
            LEFT_EYEBROW_UPPER_MIDPOINT = 25
            RIGHT_EYEBROW_UPPER_MIDPOINT = 26
            LEFT_EAR_TRAGION = 27
            RIGHT_EAR_TRAGION = 28
            LEFT_EYE_PUPIL = 29
            RIGHT_EYE_PUPIL = 30
            FOREHEAD_GLABELLA = 31
            CHIN_GNATHION = 32
            CHIN_LEFT_GONION = 33
            CHIN_RIGHT_GONION = 34

        type_: "FaceAnnotation.Landmark.Type" = proto.Field(
            proto.ENUM,
            number=3,
            enum="FaceAnnotation.Landmark.Type",
        )
        position: geometry.Position = proto.Field(
            proto.MESSAGE,
            number=4,
            message=geometry.Position,
        )

    bounding_poly: geometry.BoundingPoly = proto.Field(
        proto.MESSAGE,
        number=1,
        message=geometry.BoundingPoly,
    )
    fd_bounding_poly: geometry.BoundingPoly = proto.Field(
        proto.MESSAGE,
        number=2,
        message=geometry.BoundingPoly,
    )
    landmarks: MutableSequence[Landmark] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message=Landmark,
    )
    roll_angle: float = proto.Field(
        proto.FLOAT,
        number=4,
    )
    pan_angle: float = proto.Field(
        proto.FLOAT,
        number=5,
    )
    tilt_angle: float = proto.Field(
        proto.FLOAT,
        number=6,
    )
    detection_confidence: float = proto.Field(
        proto.FLOAT,
        number=7,
    )
    landmarking_confidence: float = proto.Field(
        proto.FLOAT,
        number=8,
    )
    joy_likelihood: "Likelihood" = proto.Field(
        proto.ENUM,
        number=9,
        enum="Likelihood",
    )
    sorrow_likelihood: "Likelihood" = proto.Field(
        proto.ENUM,
        number=10,
        enum="Likelihood",
    )
    anger_likelihood: "Likelihood" = proto.Field(
        proto.ENUM,
        number=11,
        enum="Likelihood",
    )
    surprise_likelihood: "Likelihood" = proto.Field(
        proto.ENUM,
        number=12,
        enum="Likelihood",
    )
    under_exposed_likelihood: "Likelihood" = proto.Field(
        proto.ENUM,
        number=13,
        enum="Likelihood",
    )
    blurred_likelihood: "Likelihood" = proto.Field(
        proto.ENUM,
        number=14,
        enum="Likelihood",
    )
    headwear_likelihood: "Likelihood" = proto.Field(
        proto.ENUM,
        number=15,
        enum="Likelihood",
    )


class LocationInfo(proto.Message):
    r"""Detected entity location information.

    Attributes:
        lat_lng (google.type.latlng_pb2.LatLng):
            lat/long location coordinates.
    """

    lat_lng: latlng_pb2.LatLng = proto.Field(
        proto.MESSAGE,
        number=1,
        message=latlng_pb2.LatLng,
    )


class Property(proto.Message):
    r"""A ``Property`` consists of a user-supplied name/value pair.

    Attributes:
        name (str):
            Name of the property.
        value (str):
            Value of the property.
        uint64_value (int):
            Value of numeric properties.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    value: str = proto.Field(
        proto.STRING,
        number=2,
    )
    uint64_value: int = proto.Field(
        proto.UINT64,
        number=3,
    )


class EntityAnnotation(proto.Message):
    r"""Set of detected entity features.

    Attributes:
        mid (str):
            Opaque entity ID. Some IDs may be available in `Google
            Knowledge Graph Search
            API <https://developers.google.com/knowledge-graph/>`__.
        locale (str):
            The language code for the locale in which the entity textual
            ``description`` is expressed.
        description (str):
            Entity textual description, expressed in its ``locale``
            language.
        score (float):
            Overall score of the result. Range [0, 1].
        confidence (float):
            The accuracy of the entity detection in an image. For
            example, for an image in which the "Eiffel Tower" entity is
            detected, this field represents the confidence that there is
            a tower in the query image. Range [0, 1].
        topicality (float):
            The relevancy of the ICA (Image Content Annotation) label to
            the image. For example, the relevancy of "tower" is likely
            higher to an image containing the detected "Eiffel Tower"
            than to an image containing a detected distant towering
            building, even though the confidence that there is a tower
            in each image may be the same. Range [0, 1].
        bounding_poly (google.cloud.vision_v1p1beta1.types.BoundingPoly):
            Image region to which this entity belongs. Not produced for
            ``LABEL_DETECTION`` features.
        locations (MutableSequence[google.cloud.vision_v1p1beta1.types.LocationInfo]):
            The location information for the detected entity. Multiple
            ``LocationInfo`` elements can be present because one
            location may indicate the location of the scene in the
            image, and another location may indicate the location of the
            place where the image was taken. Location information is
            usually present for landmarks.
        properties (MutableSequence[google.cloud.vision_v1p1beta1.types.Property]):
            Some entities may have optional user-supplied ``Property``
            (name/value) fields, such a score or string that qualifies
            the entity.
    """

    mid: str = proto.Field(
        proto.STRING,
        number=1,
    )
    locale: str = proto.Field(
        proto.STRING,
        number=2,
    )
    description: str = proto.Field(
        proto.STRING,
        number=3,
    )
    score: float = proto.Field(
        proto.FLOAT,
        number=4,
    )
    confidence: float = proto.Field(
        proto.FLOAT,
        number=5,
    )
    topicality: float = proto.Field(
        proto.FLOAT,
        number=6,
    )
    bounding_poly: geometry.BoundingPoly = proto.Field(
        proto.MESSAGE,
        number=7,
        message=geometry.BoundingPoly,
    )
    locations: MutableSequence["LocationInfo"] = proto.RepeatedField(
        proto.MESSAGE,
        number=8,
        message="LocationInfo",
    )
    properties: MutableSequence["Property"] = proto.RepeatedField(
        proto.MESSAGE,
        number=9,
        message="Property",
    )


class SafeSearchAnnotation(proto.Message):
    r"""Set of features pertaining to the image, computed by computer
    vision methods over safe-search verticals (for example, adult,
    spoof, medical, violence).

    Attributes:
        adult (google.cloud.vision_v1p1beta1.types.Likelihood):
            Represents the adult content likelihood for
            the image. Adult content may contain elements
            such as nudity, pornographic images or cartoons,
            or sexual activities.
        spoof (google.cloud.vision_v1p1beta1.types.Likelihood):
            Spoof likelihood. The likelihood that an
            modification was made to the image's canonical
            version to make it appear funny or offensive.
        medical (google.cloud.vision_v1p1beta1.types.Likelihood):
            Likelihood that this is a medical image.
        violence (google.cloud.vision_v1p1beta1.types.Likelihood):
            Likelihood that this image contains violent
            content.
        racy (google.cloud.vision_v1p1beta1.types.Likelihood):
            Likelihood that the request image contains
            racy content. Racy content may include (but is
            not limited to) skimpy or sheer clothing,
            strategically covered nudity, lewd or
            provocative poses, or close-ups of sensitive
            body areas.
    """

    adult: "Likelihood" = proto.Field(
        proto.ENUM,
        number=1,
        enum="Likelihood",
    )
    spoof: "Likelihood" = proto.Field(
        proto.ENUM,
        number=2,
        enum="Likelihood",
    )
    medical: "Likelihood" = proto.Field(
        proto.ENUM,
        number=3,
        enum="Likelihood",
    )
    violence: "Likelihood" = proto.Field(
        proto.ENUM,
        number=4,
        enum="Likelihood",
    )
    racy: "Likelihood" = proto.Field(
        proto.ENUM,
        number=9,
        enum="Likelihood",
    )


class LatLongRect(proto.Message):
    r"""Rectangle determined by min and max ``LatLng`` pairs.

    Attributes:
        min_lat_lng (google.type.latlng_pb2.LatLng):
            Min lat/long pair.
        max_lat_lng (google.type.latlng_pb2.LatLng):
            Max lat/long pair.
    """

    min_lat_lng: latlng_pb2.LatLng = proto.Field(
        proto.MESSAGE,
        number=1,
        message=latlng_pb2.LatLng,
    )
    max_lat_lng: latlng_pb2.LatLng = proto.Field(
        proto.MESSAGE,
        number=2,
        message=latlng_pb2.LatLng,
    )


class ColorInfo(proto.Message):
    r"""Color information consists of RGB channels, score, and the
    fraction of the image that the color occupies in the image.

    Attributes:
        color (google.type.color_pb2.Color):
            RGB components of the color.
        score (float):
            Image-specific score for this color. Value in range [0, 1].
        pixel_fraction (float):
            The fraction of pixels the color occupies in the image.
            Value in range [0, 1].
    """

    color: color_pb2.Color = proto.Field(
        proto.MESSAGE,
        number=1,
        message=color_pb2.Color,
    )
    score: float = proto.Field(
        proto.FLOAT,
        number=2,
    )
    pixel_fraction: float = proto.Field(
        proto.FLOAT,
        number=3,
    )


class DominantColorsAnnotation(proto.Message):
    r"""Set of dominant colors and their corresponding scores.

    Attributes:
        colors (MutableSequence[google.cloud.vision_v1p1beta1.types.ColorInfo]):
            RGB color values with their score and pixel
            fraction.
    """

    colors: MutableSequence["ColorInfo"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="ColorInfo",
    )


class ImageProperties(proto.Message):
    r"""Stores image properties, such as dominant colors.

    Attributes:
        dominant_colors (google.cloud.vision_v1p1beta1.types.DominantColorsAnnotation):
            If present, dominant colors completed
            successfully.
    """

    dominant_colors: "DominantColorsAnnotation" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="DominantColorsAnnotation",
    )


class CropHint(proto.Message):
    r"""Single crop hint that is used to generate a new crop when
    serving an image.

    Attributes:
        bounding_poly (google.cloud.vision_v1p1beta1.types.BoundingPoly):
            The bounding polygon for the crop region. The coordinates of
            the bounding box are in the original image's scale, as
            returned in ``ImageParams``.
        confidence (float):
            Confidence of this being a salient region. Range [0, 1].
        importance_fraction (float):
            Fraction of importance of this salient region
            with respect to the original image.
    """

    bounding_poly: geometry.BoundingPoly = proto.Field(
        proto.MESSAGE,
        number=1,
        message=geometry.BoundingPoly,
    )
    confidence: float = proto.Field(
        proto.FLOAT,
        number=2,
    )
    importance_fraction: float = proto.Field(
        proto.FLOAT,
        number=3,
    )


class CropHintsAnnotation(proto.Message):
    r"""Set of crop hints that are used to generate new crops when
    serving images.

    Attributes:
        crop_hints (MutableSequence[google.cloud.vision_v1p1beta1.types.CropHint]):
            Crop hint results.
    """

    crop_hints: MutableSequence["CropHint"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="CropHint",
    )


class CropHintsParams(proto.Message):
    r"""Parameters for crop hints annotation request.

    Attributes:
        aspect_ratios (MutableSequence[float]):
            Aspect ratios in floats, representing the
            ratio of the width to the height of the image.
            For example, if the desired aspect ratio is 4/3,
            the corresponding float value should be 1.33333.
            If not specified, the best possible crop is
            returned. The number of provided aspect ratios
            is limited to a maximum of 16; any aspect ratios
            provided after the 16th are ignored.
    """

    aspect_ratios: MutableSequence[float] = proto.RepeatedField(
        proto.FLOAT,
        number=1,
    )


class WebDetectionParams(proto.Message):
    r"""Parameters for web detection request.

    Attributes:
        include_geo_results (bool):
            Whether to include results derived from the
            geo information in the image.
    """

    include_geo_results: bool = proto.Field(
        proto.BOOL,
        number=2,
    )


class TextDetectionParams(proto.Message):
    r"""Parameters for text detections. This is used to control
    TEXT_DETECTION and DOCUMENT_TEXT_DETECTION features.

    Attributes:
        enable_text_detection_confidence_score (bool):
            By default, Cloud Vision API only includes confidence score
            for DOCUMENT_TEXT_DETECTION result. Set the flag to true to
            include confidence score for TEXT_DETECTION as well.
        advanced_ocr_options (MutableSequence[str]):
            A list of advanced OCR options to fine-tune
            OCR behavior.
    """

    enable_text_detection_confidence_score: bool = proto.Field(
        proto.BOOL,
        number=9,
    )
    advanced_ocr_options: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=11,
    )


class ImageContext(proto.Message):
    r"""Image context and/or feature-specific parameters.

    Attributes:
        lat_long_rect (google.cloud.vision_v1p1beta1.types.LatLongRect):
            lat/long rectangle that specifies the
            location of the image.
        language_hints (MutableSequence[str]):
            List of languages to use for TEXT_DETECTION. In most cases,
            an empty value yields the best results since it enables
            automatic language detection. For languages based on the
            Latin alphabet, setting ``language_hints`` is not needed. In
            rare cases, when the language of the text in the image is
            known, setting a hint will help get better results (although
            it will be a significant hindrance if the hint is wrong).
            Text detection returns an error if one or more of the
            specified languages is not one of the `supported
            languages <https://cloud.google.com/vision/docs/languages>`__.
        crop_hints_params (google.cloud.vision_v1p1beta1.types.CropHintsParams):
            Parameters for crop hints annotation request.
        web_detection_params (google.cloud.vision_v1p1beta1.types.WebDetectionParams):
            Parameters for web detection.
        text_detection_params (google.cloud.vision_v1p1beta1.types.TextDetectionParams):
            Parameters for text detection and document
            text detection.
    """

    lat_long_rect: "LatLongRect" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="LatLongRect",
    )
    language_hints: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=2,
    )
    crop_hints_params: "CropHintsParams" = proto.Field(
        proto.MESSAGE,
        number=4,
        message="CropHintsParams",
    )
    web_detection_params: "WebDetectionParams" = proto.Field(
        proto.MESSAGE,
        number=6,
        message="WebDetectionParams",
    )
    text_detection_params: "TextDetectionParams" = proto.Field(
        proto.MESSAGE,
        number=12,
        message="TextDetectionParams",
    )


class AnnotateImageRequest(proto.Message):
    r"""Request for performing Google Cloud Vision API tasks over a
    user-provided image, with user-requested features.

    Attributes:
        image (google.cloud.vision_v1p1beta1.types.Image):
            The image to be processed.
        features (MutableSequence[google.cloud.vision_v1p1beta1.types.Feature]):
            Requested features.
        image_context (google.cloud.vision_v1p1beta1.types.ImageContext):
            Additional context that may accompany the
            image.
    """

    image: "Image" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Image",
    )
    features: MutableSequence["Feature"] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="Feature",
    )
    image_context: "ImageContext" = proto.Field(
        proto.MESSAGE,
        number=3,
        message="ImageContext",
    )


class AnnotateImageResponse(proto.Message):
    r"""Response to an image annotation request.

    Attributes:
        face_annotations (MutableSequence[google.cloud.vision_v1p1beta1.types.FaceAnnotation]):
            If present, face detection has completed
            successfully.
        landmark_annotations (MutableSequence[google.cloud.vision_v1p1beta1.types.EntityAnnotation]):
            If present, landmark detection has completed
            successfully.
        logo_annotations (MutableSequence[google.cloud.vision_v1p1beta1.types.EntityAnnotation]):
            If present, logo detection has completed
            successfully.
        label_annotations (MutableSequence[google.cloud.vision_v1p1beta1.types.EntityAnnotation]):
            If present, label detection has completed
            successfully.
        text_annotations (MutableSequence[google.cloud.vision_v1p1beta1.types.EntityAnnotation]):
            If present, text (OCR) detection has
            completed successfully.
        full_text_annotation (google.cloud.vision_v1p1beta1.types.TextAnnotation):
            If present, text (OCR) detection or document
            (OCR) text detection has completed successfully.
            This annotation provides the structural
            hierarchy for the OCR detected text.
        safe_search_annotation (google.cloud.vision_v1p1beta1.types.SafeSearchAnnotation):
            If present, safe-search annotation has
            completed successfully.
        image_properties_annotation (google.cloud.vision_v1p1beta1.types.ImageProperties):
            If present, image properties were extracted
            successfully.
        crop_hints_annotation (google.cloud.vision_v1p1beta1.types.CropHintsAnnotation):
            If present, crop hints have completed
            successfully.
        web_detection (google.cloud.vision_v1p1beta1.types.WebDetection):
            If present, web detection has completed
            successfully.
        error (google.rpc.status_pb2.Status):
            If set, represents the error message for the operation. Note
            that filled-in image annotations are guaranteed to be
            correct, even when ``error`` is set.
    """

    face_annotations: MutableSequence["FaceAnnotation"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="FaceAnnotation",
    )
    landmark_annotations: MutableSequence["EntityAnnotation"] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="EntityAnnotation",
    )
    logo_annotations: MutableSequence["EntityAnnotation"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="EntityAnnotation",
    )
    label_annotations: MutableSequence["EntityAnnotation"] = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message="EntityAnnotation",
    )
    text_annotations: MutableSequence["EntityAnnotation"] = proto.RepeatedField(
        proto.MESSAGE,
        number=5,
        message="EntityAnnotation",
    )
    full_text_annotation: text_annotation.TextAnnotation = proto.Field(
        proto.MESSAGE,
        number=12,
        message=text_annotation.TextAnnotation,
    )
    safe_search_annotation: "SafeSearchAnnotation" = proto.Field(
        proto.MESSAGE,
        number=6,
        message="SafeSearchAnnotation",
    )
    image_properties_annotation: "ImageProperties" = proto.Field(
        proto.MESSAGE,
        number=8,
        message="ImageProperties",
    )
    crop_hints_annotation: "CropHintsAnnotation" = proto.Field(
        proto.MESSAGE,
        number=11,
        message="CropHintsAnnotation",
    )
    web_detection: gcv_web_detection.WebDetection = proto.Field(
        proto.MESSAGE,
        number=13,
        message=gcv_web_detection.WebDetection,
    )
    error: status_pb2.Status = proto.Field(
        proto.MESSAGE,
        number=9,
        message=status_pb2.Status,
    )


class BatchAnnotateImagesRequest(proto.Message):
    r"""Multiple image annotation requests are batched into a single
    service call.

    Attributes:
        requests (MutableSequence[google.cloud.vision_v1p1beta1.types.AnnotateImageRequest]):
            Required. Individual image annotation
            requests for this batch.
    """

    requests: MutableSequence["AnnotateImageRequest"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="AnnotateImageRequest",
    )


class BatchAnnotateImagesResponse(proto.Message):
    r"""Response to a batch image annotation request.

    Attributes:
        responses (MutableSequence[google.cloud.vision_v1p1beta1.types.AnnotateImageResponse]):
            Individual responses to image annotation
            requests within the batch.
    """

    responses: MutableSequence["AnnotateImageResponse"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="AnnotateImageResponse",
    )


__all__ = tuple(sorted(__protobuf__.manifest))
