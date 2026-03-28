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
from google.protobuf import field_mask_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.cloud.recommendationengine.v1beta1",
    manifest={
        "CreateCatalogItemRequest",
        "GetCatalogItemRequest",
        "ListCatalogItemsRequest",
        "ListCatalogItemsResponse",
        "UpdateCatalogItemRequest",
        "DeleteCatalogItemRequest",
    },
)


class CreateCatalogItemRequest(proto.Message):
    r"""Request message for CreateCatalogItem method.

    Attributes:
        parent (str):
            Required. The parent catalog resource name, such as
            ``projects/*/locations/global/catalogs/default_catalog``.
        catalog_item (google.cloud.recommendationengine_v1beta1.types.CatalogItem):
            Required. The catalog item to create.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    catalog_item = proto.Field(
        proto.MESSAGE,
        number=2,
        message=catalog.CatalogItem,
    )


class GetCatalogItemRequest(proto.Message):
    r"""Request message for GetCatalogItem method.

    Attributes:
        name (str):
            Required. Full resource name of catalog item, such as
            ``projects/*/locations/global/catalogs/default_catalog/catalogitems/some_catalog_item_id``.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class ListCatalogItemsRequest(proto.Message):
    r"""Request message for ListCatalogItems method.

    Attributes:
        parent (str):
            Required. The parent catalog resource name, such as
            ``projects/*/locations/global/catalogs/default_catalog``.
        page_size (int):
            Optional. Maximum number of results to return
            per page. If zero, the service will choose a
            reasonable default.
        page_token (str):
            Optional. The previous
            ListCatalogItemsResponse.next_page_token.
        filter (str):
            Optional. A filter to apply on the list
            results.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    page_size = proto.Field(
        proto.INT32,
        number=2,
    )
    page_token = proto.Field(
        proto.STRING,
        number=3,
    )
    filter = proto.Field(
        proto.STRING,
        number=4,
    )


class ListCatalogItemsResponse(proto.Message):
    r"""Response message for ListCatalogItems method.

    Attributes:
        catalog_items (Sequence[google.cloud.recommendationengine_v1beta1.types.CatalogItem]):
            The catalog items.
        next_page_token (str):
            If empty, the list is complete. If nonempty, the token to
            pass to the next request's
            ListCatalogItemRequest.page_token.
    """

    @property
    def raw_page(self):
        return self

    catalog_items = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=catalog.CatalogItem,
    )
    next_page_token = proto.Field(
        proto.STRING,
        number=2,
    )


class UpdateCatalogItemRequest(proto.Message):
    r"""Request message for UpdateCatalogItem method.

    Attributes:
        name (str):
            Required. Full resource name of catalog item, such as
            ``projects/*/locations/global/catalogs/default_catalog/catalogItems/some_catalog_item_id``
        catalog_item (google.cloud.recommendationengine_v1beta1.types.CatalogItem):
            Required. The catalog item to update/create. The
            'catalog_item_id' field has to match that in the 'name'.
        update_mask (google.protobuf.field_mask_pb2.FieldMask):
            Optional. Indicates which fields in the
            provided 'item' to update. If not set, will by
            default update all fields.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    catalog_item = proto.Field(
        proto.MESSAGE,
        number=2,
        message=catalog.CatalogItem,
    )
    update_mask = proto.Field(
        proto.MESSAGE,
        number=3,
        message=field_mask_pb2.FieldMask,
    )


class DeleteCatalogItemRequest(proto.Message):
    r"""Request message for DeleteCatalogItem method.

    Attributes:
        name (str):
            Required. Full resource name of catalog item, such as
            ``projects/*/locations/global/catalogs/default_catalog/catalogItems/some_catalog_item_id``.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
