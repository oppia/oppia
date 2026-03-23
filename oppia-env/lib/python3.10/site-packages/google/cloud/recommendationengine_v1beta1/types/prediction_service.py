# -*- coding: utf-8 -*-
# Copyright 2022 Google LLC
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
import proto  # type: ignore

from google.cloud.recommendationengine_v1beta1.types import user_event as gcr_user_event
from google.protobuf import struct_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.cloud.recommendationengine.v1beta1",
    manifest={
        "PredictRequest",
        "PredictResponse",
    },
)


class PredictRequest(proto.Message):
    r"""Request message for Predict method.

    Attributes:
        name (str):
            Required. Full resource name of the format:
            ``{name=projects/*/locations/global/catalogs/default_catalog/eventStores/default_event_store/placements/*}``
            The id of the recommendation engine placement. This id is
            used to identify the set of models that will be used to make
            the prediction.

            We currently support three placements with the following IDs
            by default:

            -  ``shopping_cart``: Predicts items frequently bought
               together with one or more catalog items in the same
               shopping session. Commonly displayed after
               ``add-to-cart`` events, on product detail pages, or on
               the shopping cart page.

            -  ``home_page``: Predicts the next product that a user will
               most likely engage with or purchase based on the shopping
               or viewing history of the specified ``userId`` or
               ``visitorId``. For example - Recommendations for you.

            -  ``product_detail``: Predicts the next product that a user
               will most likely engage with or purchase. The prediction
               is based on the shopping or viewing history of the
               specified ``userId`` or ``visitorId`` and its relevance
               to a specified ``CatalogItem``. Typically used on product
               detail pages. For example - More items like this.

            -  ``recently_viewed_default``: Returns up to 75 items
               recently viewed by the specified ``userId`` or
               ``visitorId``, most recent ones first. Returns nothing if
               neither of them has viewed any items yet. For example -
               Recently viewed.

            The full list of available placements can be seen at
            https://console.cloud.google.com/recommendation/datafeeds/default_catalog/dashboard
        user_event (google.cloud.recommendationengine_v1beta1.types.UserEvent):
            Required. Context about the user, what they
            are looking at and what action they took to
            trigger the predict request. Note that this user
            event detail won't be ingested to userEvent
            logs. Thus, a separate userEvent write request
            is required for event logging.
        page_size (int):
            Optional. Maximum number of results to return
            per page. Set this property to the number of
            prediction results required. If zero, the
            service will choose a reasonable default.
        page_token (str):
            Optional. The previous PredictResponse.next_page_token.
        filter (str):
            Optional. Filter for restricting prediction results. Accepts
            values for tags and the ``filterOutOfStockItems`` flag.

            -  Tag expressions. Restricts predictions to items that
               match all of the specified tags. Boolean operators ``OR``
               and ``NOT`` are supported if the expression is enclosed
               in parentheses, and must be separated from the tag values
               by a space. ``-"tagA"`` is also supported and is
               equivalent to ``NOT "tagA"``. Tag values must be double
               quoted UTF-8 encoded strings with a size limit of 1 KiB.

            -  filterOutOfStockItems. Restricts predictions to items
               that do not have a stockState value of OUT_OF_STOCK.

            Examples:

            -  tag=("Red" OR "Blue") tag="New-Arrival" tag=(NOT
               "promotional")
            -  filterOutOfStockItems tag=(-"promotional")
            -  filterOutOfStockItems
        dry_run (bool):
            Optional. Use dryRun mode for this prediction
            query. If set to true, a dummy model will be
            used that returns arbitrary catalog items. Note
            that the dryRun mode should only be used for
            testing the API, or if the model is not ready.
        params (Mapping[str, google.protobuf.struct_pb2.Value]):
            Optional. Additional domain specific parameters for the
            predictions.

            Allowed values:

            -  ``returnCatalogItem``: Boolean. If set to true, the
               associated catalogItem object will be returned in the
               ``PredictResponse.PredictionResult.itemMetadata`` object
               in the method response.
            -  ``returnItemScore``: Boolean. If set to true, the
               prediction 'score' corresponding to each returned item
               will be set in the ``metadata`` field in the prediction
               response. The given 'score' indicates the probability of
               an item being clicked/purchased given the user's context
               and history.
        labels (Mapping[str, str]):
            Optional. The labels for the predict request.

            -  Label keys can contain lowercase letters, digits and
               hyphens, must start with a letter, and must end with a
               letter or digit.
            -  Non-zero label values can contain lowercase letters,
               digits and hyphens, must start with a letter, and must
               end with a letter or digit.
            -  No more than 64 labels can be associated with a given
               request.

            See https://goo.gl/xmQnxf for more information on and
            examples of labels.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    user_event = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gcr_user_event.UserEvent,
    )
    page_size = proto.Field(
        proto.INT32,
        number=7,
    )
    page_token = proto.Field(
        proto.STRING,
        number=8,
    )
    filter = proto.Field(
        proto.STRING,
        number=3,
    )
    dry_run = proto.Field(
        proto.BOOL,
        number=4,
    )
    params = proto.MapField(
        proto.STRING,
        proto.MESSAGE,
        number=6,
        message=struct_pb2.Value,
    )
    labels = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=9,
    )


class PredictResponse(proto.Message):
    r"""Response message for predict method.

    Attributes:
        results (Sequence[google.cloud.recommendationengine_v1beta1.types.PredictResponse.PredictionResult]):
            A list of recommended items. The order
            represents the ranking (from the most relevant
            item to the least).
        recommendation_token (str):
            A unique recommendation token. This should be
            included in the user event logs resulting from
            this recommendation, which enables accurate
            attribution of recommendation model performance.
        items_missing_in_catalog (Sequence[str]):
            IDs of items in the request that were missing
            from the catalog.
        dry_run (bool):
            True if the dryRun property was set in the
            request.
        metadata (Mapping[str, google.protobuf.struct_pb2.Value]):
            Additional domain specific prediction
            response metadata.
        next_page_token (str):
            If empty, the list is complete. If nonempty, the token to
            pass to the next request's PredictRequest.page_token.
    """

    class PredictionResult(proto.Message):
        r"""PredictionResult represents the recommendation prediction
        results.

        Attributes:
            id (str):
                ID of the recommended catalog item
            item_metadata (Mapping[str, google.protobuf.struct_pb2.Value]):
                Additional item metadata / annotations.

                Possible values:

                -  ``catalogItem``: JSON representation of the catalogItem.
                   Will be set if ``returnCatalogItem`` is set to true in
                   ``PredictRequest.params``.
                -  ``score``: Prediction score in double value. Will be set
                   if ``returnItemScore`` is set to true in
                   ``PredictRequest.params``.
        """

        id = proto.Field(
            proto.STRING,
            number=1,
        )
        item_metadata = proto.MapField(
            proto.STRING,
            proto.MESSAGE,
            number=2,
            message=struct_pb2.Value,
        )

    @property
    def raw_page(self):
        return self

    results = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=PredictionResult,
    )
    recommendation_token = proto.Field(
        proto.STRING,
        number=2,
    )
    items_missing_in_catalog = proto.RepeatedField(
        proto.STRING,
        number=3,
    )
    dry_run = proto.Field(
        proto.BOOL,
        number=4,
    )
    metadata = proto.MapField(
        proto.STRING,
        proto.MESSAGE,
        number=5,
        message=struct_pb2.Value,
    )
    next_page_token = proto.Field(
        proto.STRING,
        number=6,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
