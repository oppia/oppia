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

from google.cloud.recommendationengine_v1beta1.types import catalog
from google.cloud.recommendationengine_v1beta1.types import common
from google.protobuf import timestamp_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.cloud.recommendationengine.v1beta1",
    manifest={
        "UserEvent",
        "UserInfo",
        "EventDetail",
        "ProductEventDetail",
        "PurchaseTransaction",
        "ProductDetail",
    },
)


class UserEvent(proto.Message):
    r"""UserEvent captures all metadata information recommendation
    engine needs to know about how end users interact with
    customers' website.

    Attributes:
        event_type (str):
            Required. User event type. Allowed values are:

            -  ``add-to-cart`` Products being added to cart.
            -  ``add-to-list`` Items being added to a list (shopping
               list, favorites etc).
            -  ``category-page-view`` Special pages such as sale or
               promotion pages viewed.
            -  ``checkout-start`` User starting a checkout process.
            -  ``detail-page-view`` Products detail page viewed.
            -  ``home-page-view`` Homepage viewed.
            -  ``page-visit`` Generic page visits not included in the
               event types above.
            -  ``purchase-complete`` User finishing a purchase.
            -  ``refund`` Purchased items being refunded or returned.
            -  ``remove-from-cart`` Products being removed from cart.
            -  ``remove-from-list`` Items being removed from a list.
            -  ``search`` Product search.
            -  ``shopping-cart-page-view`` User viewing a shopping cart.
            -  ``impression`` List of items displayed. Used by Google
               Tag Manager.
        user_info (google.cloud.recommendationengine_v1beta1.types.UserInfo):
            Required. User information.
        event_detail (google.cloud.recommendationengine_v1beta1.types.EventDetail):
            Optional. User event detailed information
            common across different recommendation types.
        product_event_detail (google.cloud.recommendationengine_v1beta1.types.ProductEventDetail):
            Optional. Retail product specific user event metadata.

            This field is required for the following event types:

            -  ``add-to-cart``
            -  ``add-to-list``
            -  ``category-page-view``
            -  ``checkout-start``
            -  ``detail-page-view``
            -  ``purchase-complete``
            -  ``refund``
            -  ``remove-from-cart``
            -  ``remove-from-list``
            -  ``search``

            This field is optional for the following event types:

            -  ``page-visit``
            -  ``shopping-cart-page-view`` - note that
               'product_event_detail' should be set for this unless the
               shopping cart is empty.

            This field is not allowed for the following event types:

            -  ``home-page-view``
        event_time (google.protobuf.timestamp_pb2.Timestamp):
            Optional. Only required for ImportUserEvents
            method. Timestamp of user event created.
        event_source (google.cloud.recommendationengine_v1beta1.types.UserEvent.EventSource):
            Optional. This field should *not* be set when using
            JavaScript pixel or the Recommendations AI Tag. Defaults to
            ``EVENT_SOURCE_UNSPECIFIED``.
    """

    class EventSource(proto.Enum):
        r"""User event source."""
        EVENT_SOURCE_UNSPECIFIED = 0
        AUTOML = 1
        ECOMMERCE = 2
        BATCH_UPLOAD = 3

    event_type = proto.Field(
        proto.STRING,
        number=1,
    )
    user_info = proto.Field(
        proto.MESSAGE,
        number=2,
        message="UserInfo",
    )
    event_detail = proto.Field(
        proto.MESSAGE,
        number=3,
        message="EventDetail",
    )
    product_event_detail = proto.Field(
        proto.MESSAGE,
        number=4,
        message="ProductEventDetail",
    )
    event_time = proto.Field(
        proto.MESSAGE,
        number=5,
        message=timestamp_pb2.Timestamp,
    )
    event_source = proto.Field(
        proto.ENUM,
        number=6,
        enum=EventSource,
    )


class UserInfo(proto.Message):
    r"""Information of end users.

    Attributes:
        visitor_id (str):
            Required. A unique identifier for tracking
            visitors with a length limit of 128 bytes.

            For example, this could be implemented with a
            http cookie, which should be able to uniquely
            identify a visitor on a single device. This
            unique identifier should not change if the
            visitor log in/out of the website. Maximum
            length 128 bytes. Cannot be empty.
        user_id (str):
            Optional. Unique identifier for logged-in
            user with a length limit of 128 bytes. Required
            only for logged-in users.
        ip_address (str):
            Optional. IP address of the user. This could be either IPv4
            (e.g. 104.133.9.80) or IPv6 (e.g.
            2001:0db8:85a3:0000:0000:8a2e:0370:7334). This should *not*
            be set when using the javascript pixel or if
            ``direct_user_request`` is set. Used to extract location
            information for personalization.
        user_agent (str):
            Optional. User agent as included in the HTTP header. UTF-8
            encoded string with a length limit of 1 KiB.

            This should *not* be set when using the JavaScript pixel or
            if ``directUserRequest`` is set.
        direct_user_request (bool):
            Optional. Indicates if the request is made directly from the
            end user in which case the user_agent and ip_address fields
            can be populated from the HTTP request. This should *not* be
            set when using the javascript pixel. This flag should be set
            only if the API request is made directly from the end user
            such as a mobile app (and not if a gateway or a server is
            processing and pushing the user events).
    """

    visitor_id = proto.Field(
        proto.STRING,
        number=1,
    )
    user_id = proto.Field(
        proto.STRING,
        number=2,
    )
    ip_address = proto.Field(
        proto.STRING,
        number=3,
    )
    user_agent = proto.Field(
        proto.STRING,
        number=4,
    )
    direct_user_request = proto.Field(
        proto.BOOL,
        number=5,
    )


class EventDetail(proto.Message):
    r"""User event details shared by all recommendation types.

    Attributes:
        uri (str):
            Optional. Complete url (window.location.href)
            of the user's current page. When using the
            JavaScript pixel, this value is filled in
            automatically. Maximum length 5KB.
        referrer_uri (str):
            Optional. The referrer url of the current
            page. When using the JavaScript pixel, this
            value is filled in automatically.
        page_view_id (str):
            Optional. A unique id of a web page view. This should be
            kept the same for all user events triggered from the same
            pageview. For example, an item detail page view could
            trigger multiple events as the user is browsing the page.
            The ``pageViewId`` property should be kept the same for all
            these events so that they can be grouped together properly.
            This ``pageViewId`` will be automatically generated if using
            the JavaScript pixel.
        experiment_ids (Sequence[str]):
            Optional. A list of identifiers for the
            independent experiment groups this user event
            belongs to. This is used to distinguish between
            user events associated with different experiment
            setups (e.g. using Recommendation Engine system,
            using different recommendation models).
        recommendation_token (str):
            Optional. Recommendation token included in the
            recommendation prediction response.

            This field enables accurate attribution of recommendation
            model performance.

            This token enables us to accurately attribute page view or
            purchase back to the event and the particular predict
            response containing this clicked/purchased item. If user
            clicks on product K in the recommendation results, pass the
            ``PredictResponse.recommendationToken`` property as a url
            parameter to product K's page. When recording events on
            product K's page, log the
            PredictResponse.recommendation_token to this field.

            Optional, but highly encouraged for user events that are the
            result of a recommendation prediction query.
        event_attributes (google.cloud.recommendationengine_v1beta1.types.FeatureMap):
            Optional. Extra user event features to include in the
            recommendation model.

            For product recommendation, an example of extra user
            information is traffic_channel, i.e. how user arrives at the
            site. Users can arrive at the site by coming to the site
            directly, or coming through Google search, and etc.
    """

    uri = proto.Field(
        proto.STRING,
        number=1,
    )
    referrer_uri = proto.Field(
        proto.STRING,
        number=6,
    )
    page_view_id = proto.Field(
        proto.STRING,
        number=2,
    )
    experiment_ids = proto.RepeatedField(
        proto.STRING,
        number=3,
    )
    recommendation_token = proto.Field(
        proto.STRING,
        number=4,
    )
    event_attributes = proto.Field(
        proto.MESSAGE,
        number=5,
        message=common.FeatureMap,
    )


class ProductEventDetail(proto.Message):
    r"""ProductEventDetail captures user event information specific
    to retail products.

    Attributes:
        search_query (str):
            Required for ``search`` events. Other event types should not
            set this field. The user's search query as UTF-8 encoded
            text with a length limit of 5 KiB.
        page_categories (Sequence[google.cloud.recommendationengine_v1beta1.types.CatalogItem.CategoryHierarchy]):
            Required for ``category-page-view`` events. Other event
            types should not set this field. The categories associated
            with a category page. Category pages include special pages
            such as sales or promotions. For instance, a special sale
            page may have the category hierarchy: categories : ["Sales",
            "2017 Black Friday Deals"].
        product_details (Sequence[google.cloud.recommendationengine_v1beta1.types.ProductDetail]):
            The main product details related to the event.

            This field is required for the following event types:

            -  ``add-to-cart``
            -  ``add-to-list``
            -  ``checkout-start``
            -  ``detail-page-view``
            -  ``purchase-complete``
            -  ``refund``
            -  ``remove-from-cart``
            -  ``remove-from-list``

            This field is optional for the following event types:

            -  ``page-visit``
            -  ``shopping-cart-page-view`` - note that 'product_details'
               should be set for this unless the shopping cart is empty.

            This field is not allowed for the following event types:

            -  ``category-page-view``
            -  ``home-page-view``
            -  ``search``
        list_id (str):
            Required for ``add-to-list`` and ``remove-from-list``
            events. The id or name of the list that the item is being
            added to or removed from. Other event types should not set
            this field.
        cart_id (str):
            Optional. The id or name of the associated shopping cart.
            This id is used to associate multiple items added or present
            in the cart before purchase.

            This can only be set for ``add-to-cart``,
            ``remove-from-cart``, ``checkout-start``,
            ``purchase-complete``, or ``shopping-cart-page-view``
            events.
        purchase_transaction (google.cloud.recommendationengine_v1beta1.types.PurchaseTransaction):
            Optional. A transaction represents the entire purchase
            transaction. Required for ``purchase-complete`` events.
            Optional for ``checkout-start`` events. Other event types
            should not set this field.
    """

    search_query = proto.Field(
        proto.STRING,
        number=1,
    )
    page_categories = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message=catalog.CatalogItem.CategoryHierarchy,
    )
    product_details = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="ProductDetail",
    )
    list_id = proto.Field(
        proto.STRING,
        number=4,
    )
    cart_id = proto.Field(
        proto.STRING,
        number=5,
    )
    purchase_transaction = proto.Field(
        proto.MESSAGE,
        number=6,
        message="PurchaseTransaction",
    )


class PurchaseTransaction(proto.Message):
    r"""A transaction represents the entire purchase transaction.

    Attributes:
        id (str):
            Optional. The transaction ID with a length
            limit of 128 bytes.
        revenue (float):
            Required. Total revenue or grand total associated with the
            transaction. This value include shipping, tax, or other
            adjustments to total revenue that you want to include as
            part of your revenue calculations. This field is not
            required if the event type is ``refund``.
        taxes (Mapping[str, float]):
            Optional. All the taxes associated with the
            transaction.
        costs (Mapping[str, float]):
            Optional. All the costs associated with the product. These
            can be manufacturing costs, shipping expenses not borne by
            the end user, or any other costs.

            Total product cost such that profit = revenue - (sum(taxes)
            + sum(costs)) If product_cost is not set, then profit =
            revenue - tax - shipping - sum(CatalogItem.costs).

            If CatalogItem.cost is not specified for one of the items,
            CatalogItem.cost based profit *cannot* be calculated for
            this Transaction.
        currency_code (str):
            Required. Currency code. Use three-character ISO-4217 code.
            This field is not required if the event type is ``refund``.
    """

    id = proto.Field(
        proto.STRING,
        number=1,
    )
    revenue = proto.Field(
        proto.FLOAT,
        number=2,
    )
    taxes = proto.MapField(
        proto.STRING,
        proto.FLOAT,
        number=3,
    )
    costs = proto.MapField(
        proto.STRING,
        proto.FLOAT,
        number=4,
    )
    currency_code = proto.Field(
        proto.STRING,
        number=6,
    )


class ProductDetail(proto.Message):
    r"""Detailed product information associated with a user event.

    Attributes:
        id (str):
            Required. Catalog item ID. UTF-8 encoded
            string with a length limit of 128 characters.
        currency_code (str):
            Optional. Currency code for price/costs. Use
            three-character ISO-4217 code. Required only if
            originalPrice or displayPrice is set.
        original_price (float):
            Optional. Original price of the product. If
            provided, this will override the original price
            in Catalog for this product.
        display_price (float):
            Optional. Display price of the product (e.g.
            discounted price). If provided, this will
            override the display price in Catalog for this
            product.
        stock_state (google.cloud.recommendationengine_v1beta1.types.ProductCatalogItem.StockState):
            Optional. Item stock state. If provided, this
            overrides the stock state in Catalog for items
            in this event.
        quantity (int):
            Optional. Quantity of the product associated with the user
            event. For example, this field will be 2 if two products are
            added to the shopping cart for ``add-to-cart`` event.
            Required for ``add-to-cart``, ``add-to-list``,
            ``remove-from-cart``, ``checkout-start``,
            ``purchase-complete``, ``refund`` event types.
        available_quantity (int):
            Optional. Quantity of the products in stock when a user
            event happens. Optional. If provided, this overrides the
            available quantity in Catalog for this event. and can only
            be set if ``stock_status`` is set to ``IN_STOCK``.

            Note that if an item is out of stock, you must set the
            ``stock_state`` field to be ``OUT_OF_STOCK``. Leaving this
            field unspecified / as zero is not sufficient to mark the
            item out of stock.
        item_attributes (google.cloud.recommendationengine_v1beta1.types.FeatureMap):
            Optional. Extra features associated with a
            product in the user event.
    """

    id = proto.Field(
        proto.STRING,
        number=1,
    )
    currency_code = proto.Field(
        proto.STRING,
        number=2,
    )
    original_price = proto.Field(
        proto.FLOAT,
        number=3,
    )
    display_price = proto.Field(
        proto.FLOAT,
        number=4,
    )
    stock_state = proto.Field(
        proto.ENUM,
        number=5,
        enum=catalog.ProductCatalogItem.StockState,
    )
    quantity = proto.Field(
        proto.INT32,
        number=6,
    )
    available_quantity = proto.Field(
        proto.INT32,
        number=7,
    )
    item_attributes = proto.Field(
        proto.MESSAGE,
        number=8,
        message=common.FeatureMap,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
