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


__protobuf__ = proto.module(
    package="google.cloud.recommendationengine.v1beta1",
    manifest={
        "PredictionApiKeyRegistration",
        "CreatePredictionApiKeyRegistrationRequest",
        "ListPredictionApiKeyRegistrationsRequest",
        "ListPredictionApiKeyRegistrationsResponse",
        "DeletePredictionApiKeyRegistrationRequest",
    },
)


class PredictionApiKeyRegistration(proto.Message):
    r"""Registered Api Key.

    Attributes:
        api_key (str):
            The API key.
    """

    api_key = proto.Field(
        proto.STRING,
        number=1,
    )


class CreatePredictionApiKeyRegistrationRequest(proto.Message):
    r"""Request message for the ``CreatePredictionApiKeyRegistration``
    method.

    Attributes:
        parent (str):
            Required. The parent resource path.
            ``projects/*/locations/global/catalogs/default_catalog/eventStores/default_event_store``.
        prediction_api_key_registration (google.cloud.recommendationengine_v1beta1.types.PredictionApiKeyRegistration):
            Required. The prediction API key
            registration.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    prediction_api_key_registration = proto.Field(
        proto.MESSAGE,
        number=2,
        message="PredictionApiKeyRegistration",
    )


class ListPredictionApiKeyRegistrationsRequest(proto.Message):
    r"""Request message for the ``ListPredictionApiKeyRegistrations``.

    Attributes:
        parent (str):
            Required. The parent placement resource name such as
            ``projects/1234/locations/global/catalogs/default_catalog/eventStores/default_event_store``
        page_size (int):
            Optional. Maximum number of results to return
            per page. If unset, the service will choose a
            reasonable default.
        page_token (str):
            Optional. The previous
            ``ListPredictionApiKeyRegistration.nextPageToken``.
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


class ListPredictionApiKeyRegistrationsResponse(proto.Message):
    r"""Response message for the ``ListPredictionApiKeyRegistrations``.

    Attributes:
        prediction_api_key_registrations (Sequence[google.cloud.recommendationengine_v1beta1.types.PredictionApiKeyRegistration]):
            The list of registered API keys.
        next_page_token (str):
            If empty, the list is complete. If nonempty, pass the token
            to the next request's
            ``ListPredictionApiKeysRegistrationsRequest.pageToken``.
    """

    @property
    def raw_page(self):
        return self

    prediction_api_key_registrations = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="PredictionApiKeyRegistration",
    )
    next_page_token = proto.Field(
        proto.STRING,
        number=2,
    )


class DeletePredictionApiKeyRegistrationRequest(proto.Message):
    r"""Request message for ``DeletePredictionApiKeyRegistration`` method.

    Attributes:
        name (str):
            Required. The API key to unregister including full resource
            path.
            ``projects/*/locations/global/catalogs/default_catalog/eventStores/default_event_store/predictionApiKeyRegistrations/<YOUR_API_KEY>``
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
