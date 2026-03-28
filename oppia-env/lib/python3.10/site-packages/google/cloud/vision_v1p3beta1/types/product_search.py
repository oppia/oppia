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

from google.protobuf import timestamp_pb2  # type: ignore
import proto  # type: ignore

from google.cloud.vision_v1p3beta1.types import geometry, product_search_service

__protobuf__ = proto.module(
    package="google.cloud.vision.v1p3beta1",
    manifest={
        "ProductSearchParams",
        "ProductSearchResults",
    },
)


class ProductSearchParams(proto.Message):
    r"""Parameters for a product search request.

    Attributes:
        bounding_poly (google.cloud.vision_v1p3beta1.types.BoundingPoly):
            The bounding polygon around the area of
            interest in the image. If it is not specified,
            system discretion will be applied.
        product_set (str):
            The resource name of a
            [ProductSet][google.cloud.vision.v1p3beta1.ProductSet] to be
            searched for similar images.

            Format is:
            ``projects/PROJECT_ID/locations/LOC_ID/productSets/PRODUCT_SET_ID``.
        product_categories (MutableSequence[str]):
            The list of product categories to search in.
            Currently, we only consider the first category,
            and either "homegoods-v2", "apparel-v2",
            "toys-v2", "packagedgoods-v1", or "general-v1"
            should be specified. The legacy categories
            "homegoods", "apparel", and "toys" are still
            supported but will be deprecated. For new
            products, please use "homegoods-v2",
            "apparel-v2", or "toys-v2" for better product
            search accuracy. It is recommended to migrate
            existing products to these categories as well.
        filter (str):
            The filtering expression. This can be used to
            restrict search results based on Product labels.
            We currently support an AND of OR of key-value
            expressions, where each expression within an OR
            must have the same key. An '=' should be used to
            connect the key and value.

            For example, "(color = red OR color = blue) AND
            brand = Google" is acceptable, but "(color = red
            OR brand = Google)" is not acceptable. "color:
            red" is not acceptable because it uses a ':'
            instead of an '='.
    """

    bounding_poly: geometry.BoundingPoly = proto.Field(
        proto.MESSAGE,
        number=9,
        message=geometry.BoundingPoly,
    )
    product_set: str = proto.Field(
        proto.STRING,
        number=6,
    )
    product_categories: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=7,
    )
    filter: str = proto.Field(
        proto.STRING,
        number=8,
    )


class ProductSearchResults(proto.Message):
    r"""Results for a product search request.

    Attributes:
        index_time (google.protobuf.timestamp_pb2.Timestamp):
            Timestamp of the index which provided these
            results. Products added to the product set and
            products removed from the product set after this
            time are not reflected in the current results.
        results (MutableSequence[google.cloud.vision_v1p3beta1.types.ProductSearchResults.Result]):
            List of results, one for each product match.
        product_grouped_results (MutableSequence[google.cloud.vision_v1p3beta1.types.ProductSearchResults.GroupedResult]):
            List of results grouped by products detected
            in the query image. Each entry corresponds to
            one bounding polygon in the query image, and
            contains the matching products specific to that
            region. There may be duplicate product matches
            in the union of all the per-product results.
    """

    class Result(proto.Message):
        r"""Information about a product.

        Attributes:
            product (google.cloud.vision_v1p3beta1.types.Product):
                The Product.
            score (float):
                A confidence level on the match, ranging from
                0 (no confidence) to 1 (full confidence).
            image (str):
                The resource name of the image from the
                product that is the closest match to the query.
        """

        product: product_search_service.Product = proto.Field(
            proto.MESSAGE,
            number=1,
            message=product_search_service.Product,
        )
        score: float = proto.Field(
            proto.FLOAT,
            number=2,
        )
        image: str = proto.Field(
            proto.STRING,
            number=3,
        )

    class ObjectAnnotation(proto.Message):
        r"""Prediction for what the object in the bounding box is.

        Attributes:
            mid (str):
                Object ID that should align with
                EntityAnnotation mid.
            language_code (str):
                The BCP-47 language code, such as "en-US" or "sr-Latn". For
                more information, see
                http://www.unicode.org/reports/tr35/#Unicode_locale_identifier.
            name (str):
                Object name, expressed in its ``language_code`` language.
            score (float):
                Score of the result. Range [0, 1].
        """

        mid: str = proto.Field(
            proto.STRING,
            number=1,
        )
        language_code: str = proto.Field(
            proto.STRING,
            number=2,
        )
        name: str = proto.Field(
            proto.STRING,
            number=3,
        )
        score: float = proto.Field(
            proto.FLOAT,
            number=4,
        )

    class GroupedResult(proto.Message):
        r"""Information about the products similar to a single product in
        a query image.

        Attributes:
            bounding_poly (google.cloud.vision_v1p3beta1.types.BoundingPoly):
                The bounding polygon around the product
                detected in the query image.
            results (MutableSequence[google.cloud.vision_v1p3beta1.types.ProductSearchResults.Result]):
                List of results, one for each product match.
            object_annotations (MutableSequence[google.cloud.vision_v1p3beta1.types.ProductSearchResults.ObjectAnnotation]):
                List of generic predictions for the object in
                the bounding box.
        """

        bounding_poly: geometry.BoundingPoly = proto.Field(
            proto.MESSAGE,
            number=1,
            message=geometry.BoundingPoly,
        )
        results: MutableSequence["ProductSearchResults.Result"] = proto.RepeatedField(
            proto.MESSAGE,
            number=2,
            message="ProductSearchResults.Result",
        )
        object_annotations: MutableSequence[
            "ProductSearchResults.ObjectAnnotation"
        ] = proto.RepeatedField(
            proto.MESSAGE,
            number=3,
            message="ProductSearchResults.ObjectAnnotation",
        )

    index_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    results: MutableSequence[Result] = proto.RepeatedField(
        proto.MESSAGE,
        number=5,
        message=Result,
    )
    product_grouped_results: MutableSequence[GroupedResult] = proto.RepeatedField(
        proto.MESSAGE,
        number=6,
        message=GroupedResult,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
