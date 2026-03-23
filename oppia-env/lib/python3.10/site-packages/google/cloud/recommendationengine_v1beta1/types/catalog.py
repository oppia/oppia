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

from google.cloud.recommendationengine_v1beta1.types import common


__protobuf__ = proto.module(
    package="google.cloud.recommendationengine.v1beta1",
    manifest={
        "CatalogItem",
        "ProductCatalogItem",
        "Image",
    },
)


class CatalogItem(proto.Message):
    r"""CatalogItem captures all metadata information of items to be
    recommended.


    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        id (str):
            Required. Catalog item identifier. UTF-8
            encoded string with a length limit of 128 bytes.
            This id must be unique among all catalog items
            within the same catalog. It should also be used
            when logging user events in order for the user
            events to be joined with the Catalog.
        category_hierarchies (Sequence[google.cloud.recommendationengine_v1beta1.types.CatalogItem.CategoryHierarchy]):
            Required. Catalog item categories. This field is repeated
            for supporting one catalog item belonging to several
            parallel category hierarchies.

            For example, if a shoes product belongs to both ["Shoes &
            Accessories" -> "Shoes"] and ["Sports & Fitness" ->
            "Athletic Clothing" -> "Shoes"], it could be represented as:

            ::

                 "categoryHierarchies": [
                   { "categories": ["Shoes & Accessories", "Shoes"]},
                   { "categories": ["Sports & Fitness", "Athletic Clothing", "Shoes"] }
                 ]
        title (str):
            Required. Catalog item title. UTF-8 encoded
            string with a length limit of 1 KiB.
        description (str):
            Optional. Catalog item description. UTF-8
            encoded string with a length limit of 5 KiB.
        item_attributes (google.cloud.recommendationengine_v1beta1.types.FeatureMap):
            Optional. Highly encouraged. Extra catalog
            item attributes to be included in the
            recommendation model. For example, for retail
            products, this could include the store name,
            vendor, style, color, etc. These are very strong
            signals for recommendation model, thus we highly
            recommend providing the item attributes here.
        language_code (str):
            Optional. Language of the title/description/item_attributes.
            Use language tags defined by BCP 47.
            https://www.rfc-editor.org/rfc/bcp/bcp47.txt. Our supported
            language codes include 'en', 'es', 'fr', 'de', 'ar', 'fa',
            'zh', 'ja', 'ko', 'sv', 'ro', 'nl'. For other languages,
            contact your Google account manager.
        tags (Sequence[str]):
            Optional. Filtering tags associated with the
            catalog item. Each tag should be a UTF-8 encoded
            string with a length limit of 1 KiB.
            This tag can be used for filtering
            recommendation results by passing the tag as
            part of the predict request filter.
        item_group_id (str):
            Optional. Variant group identifier for prediction results.
            UTF-8 encoded string with a length limit of 128 bytes.

            This field must be enabled before it can be used. `Learn
            more </recommendations-ai/docs/catalog#item-group-id>`__.
        product_metadata (google.cloud.recommendationengine_v1beta1.types.ProductCatalogItem):
            Optional. Metadata specific to retail
            products.

            This field is a member of `oneof`_ ``recommendation_type``.
    """

    class CategoryHierarchy(proto.Message):
        r"""Category represents catalog item category hierarchy.

        Attributes:
            categories (Sequence[str]):
                Required. Catalog item categories. Each
                category should be a UTF-8 encoded string with a
                length limit of 2 KiB.
                Note that the order in the list denotes the
                specificity (from least to most specific).
        """

        categories = proto.RepeatedField(
            proto.STRING,
            number=1,
        )

    id = proto.Field(
        proto.STRING,
        number=1,
    )
    category_hierarchies = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message=CategoryHierarchy,
    )
    title = proto.Field(
        proto.STRING,
        number=3,
    )
    description = proto.Field(
        proto.STRING,
        number=4,
    )
    item_attributes = proto.Field(
        proto.MESSAGE,
        number=5,
        message=common.FeatureMap,
    )
    language_code = proto.Field(
        proto.STRING,
        number=6,
    )
    tags = proto.RepeatedField(
        proto.STRING,
        number=8,
    )
    item_group_id = proto.Field(
        proto.STRING,
        number=9,
    )
    product_metadata = proto.Field(
        proto.MESSAGE,
        number=10,
        oneof="recommendation_type",
        message="ProductCatalogItem",
    )


class ProductCatalogItem(proto.Message):
    r"""ProductCatalogItem captures item metadata specific to retail
    products.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        exact_price (google.cloud.recommendationengine_v1beta1.types.ProductCatalogItem.ExactPrice):
            Optional. The exact product price.

            This field is a member of `oneof`_ ``price``.
        price_range (google.cloud.recommendationengine_v1beta1.types.ProductCatalogItem.PriceRange):
            Optional. The product price range.

            This field is a member of `oneof`_ ``price``.
        costs (Mapping[str, float]):
            Optional. A map to pass the costs associated with the
            product.

            For example: {"manufacturing": 45.5} The profit of selling
            this item is computed like so:

            -  If 'exactPrice' is provided, profit = displayPrice -
               sum(costs)
            -  If 'priceRange' is provided, profit = minPrice -
               sum(costs)
        currency_code (str):
            Optional. Only required if the price is set.
            Currency code for price/costs. Use
            three-character ISO-4217 code.
        stock_state (google.cloud.recommendationengine_v1beta1.types.ProductCatalogItem.StockState):
            Optional. Online stock state of the catalog item. Default is
            ``IN_STOCK``.
        available_quantity (int):
            Optional. The available quantity of the item.
        canonical_product_uri (str):
            Optional. Canonical URL directly linking to
            the item detail page with a length limit of 5
            KiB..
        images (Sequence[google.cloud.recommendationengine_v1beta1.types.Image]):
            Optional. Product images for the catalog
            item.
    """

    class StockState(proto.Enum):
        r"""Item stock state. If this field is unspecified, the item is
        assumed to be in stock.
        """
        _pb_options = {"allow_alias": True}
        STOCK_STATE_UNSPECIFIED = 0
        IN_STOCK = 0
        OUT_OF_STOCK = 1
        PREORDER = 2
        BACKORDER = 3

    class ExactPrice(proto.Message):
        r"""Exact product price.

        Attributes:
            display_price (float):
                Optional. Display price of the product.
            original_price (float):
                Optional. Price of the product without any
                discount. If zero, by default set to be the
                'displayPrice'.
        """

        display_price = proto.Field(
            proto.FLOAT,
            number=1,
        )
        original_price = proto.Field(
            proto.FLOAT,
            number=2,
        )

    class PriceRange(proto.Message):
        r"""Product price range when there are a range of prices for
        different variations of the same product.

        Attributes:
            min_ (float):
                Required. The minimum product price.
            max_ (float):
                Required. The maximum product price.
        """

        min_ = proto.Field(
            proto.FLOAT,
            number=1,
        )
        max_ = proto.Field(
            proto.FLOAT,
            number=2,
        )

    exact_price = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="price",
        message=ExactPrice,
    )
    price_range = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="price",
        message=PriceRange,
    )
    costs = proto.MapField(
        proto.STRING,
        proto.FLOAT,
        number=3,
    )
    currency_code = proto.Field(
        proto.STRING,
        number=4,
    )
    stock_state = proto.Field(
        proto.ENUM,
        number=5,
        enum=StockState,
    )
    available_quantity = proto.Field(
        proto.INT64,
        number=6,
    )
    canonical_product_uri = proto.Field(
        proto.STRING,
        number=7,
    )
    images = proto.RepeatedField(
        proto.MESSAGE,
        number=8,
        message="Image",
    )


class Image(proto.Message):
    r"""Catalog item thumbnail/detail image.

    Attributes:
        uri (str):
            Required. URL of the image with a length
            limit of 5 KiB.
        height (int):
            Optional. Height of the image in number of
            pixels.
        width (int):
            Optional. Width of the image in number of
            pixels.
    """

    uri = proto.Field(
        proto.STRING,
        number=1,
    )
    height = proto.Field(
        proto.INT32,
        number=2,
    )
    width = proto.Field(
        proto.INT32,
        number=3,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
