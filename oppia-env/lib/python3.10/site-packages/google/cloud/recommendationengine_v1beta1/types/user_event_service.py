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
from google.protobuf import timestamp_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.cloud.recommendationengine.v1beta1",
    manifest={
        "PurgeUserEventsRequest",
        "PurgeUserEventsMetadata",
        "PurgeUserEventsResponse",
        "WriteUserEventRequest",
        "CollectUserEventRequest",
        "ListUserEventsRequest",
        "ListUserEventsResponse",
    },
)


class PurgeUserEventsRequest(proto.Message):
    r"""Request message for PurgeUserEvents method.

    Attributes:
        parent (str):
            Required. The resource name of the event_store under which
            the events are created. The format is
            ``projects/${projectId}/locations/global/catalogs/${catalogId}/eventStores/${eventStoreId}``
        filter (str):
            Required. The filter string to specify the events to be
            deleted. Empty string filter is not allowed. This filter can
            also be used with ListUserEvents API to list events that
            will be deleted. The eligible fields for filtering are:

            -  eventType - UserEvent.eventType field of type string.
            -  eventTime - in ISO 8601 "zulu" format.
            -  visitorId - field of type string. Specifying this will
               delete all events associated with a visitor.
            -  userId - field of type string. Specifying this will
               delete all events associated with a user. Example 1:
               Deleting all events in a time range.
               ``eventTime > "2012-04-23T18:25:43.511Z" eventTime < "2012-04-23T18:30:43.511Z"``
               Example 2: Deleting specific eventType in time range.
               ``eventTime > "2012-04-23T18:25:43.511Z" eventType = "detail-page-view"``
               Example 3: Deleting all events for a specific visitor
               ``visitorId = visitor1024`` The filtering fields are
               assumed to have an implicit AND.
        force (bool):
            Optional. The default value is false.
            Override this flag to true to actually perform
            the purge. If the field is not set to true, a
            sampling of events to be deleted will be
            returned.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    filter = proto.Field(
        proto.STRING,
        number=2,
    )
    force = proto.Field(
        proto.BOOL,
        number=3,
    )


class PurgeUserEventsMetadata(proto.Message):
    r"""Metadata related to the progress of the PurgeUserEvents
    operation. This will be returned by the
    google.longrunning.Operation.metadata field.

    Attributes:
        operation_name (str):
            The ID of the request / operation.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Operation create time.
    """

    operation_name = proto.Field(
        proto.STRING,
        number=1,
    )
    create_time = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )


class PurgeUserEventsResponse(proto.Message):
    r"""Response of the PurgeUserEventsRequest. If the long running
    operation is successfully done, then this message is returned by
    the google.longrunning.Operations.response field.

    Attributes:
        purged_events_count (int):
            The total count of events purged as a result
            of the operation.
        user_events_sample (Sequence[google.cloud.recommendationengine_v1beta1.types.UserEvent]):
            A sampling of events deleted (or will be deleted) depending
            on the ``force`` property in the request. Max of 500 items
            will be returned.
    """

    purged_events_count = proto.Field(
        proto.INT64,
        number=1,
    )
    user_events_sample = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message=gcr_user_event.UserEvent,
    )


class WriteUserEventRequest(proto.Message):
    r"""Request message for WriteUserEvent method.

    Attributes:
        parent (str):
            Required. The parent eventStore resource name, such as
            ``projects/1234/locations/global/catalogs/default_catalog/eventStores/default_event_store``.
        user_event (google.cloud.recommendationengine_v1beta1.types.UserEvent):
            Required. User event to write.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    user_event = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gcr_user_event.UserEvent,
    )


class CollectUserEventRequest(proto.Message):
    r"""Request message for CollectUserEvent method.

    Attributes:
        parent (str):
            Required. The parent eventStore name, such as
            ``projects/1234/locations/global/catalogs/default_catalog/eventStores/default_event_store``.
        user_event (str):
            Required. URL encoded UserEvent proto.
        uri (str):
            Optional. The url including cgi-parameters
            but excluding the hash fragment. The URL must be
            truncated to 1.5K bytes to conservatively be
            under the 2K bytes. This is often more useful
            than the referer url, because many browsers only
            send the domain for 3rd party requests.
        ets (int):
            Optional. The event timestamp in
            milliseconds. This prevents browser caching of
            otherwise identical get requests. The name is
            abbreviated to reduce the payload bytes.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    user_event = proto.Field(
        proto.STRING,
        number=2,
    )
    uri = proto.Field(
        proto.STRING,
        number=3,
    )
    ets = proto.Field(
        proto.INT64,
        number=4,
    )


class ListUserEventsRequest(proto.Message):
    r"""Request message for ListUserEvents method.

    Attributes:
        parent (str):
            Required. The parent eventStore resource name, such as
            ``projects/*/locations/*/catalogs/default_catalog/eventStores/default_event_store``.
        page_size (int):
            Optional. Maximum number of results to return
            per page. If zero, the service will choose a
            reasonable default.
        page_token (str):
            Optional. The previous
            ListUserEventsResponse.next_page_token.
        filter (str):
            Optional. Filtering expression to specify restrictions over
            returned events. This is a sequence of terms, where each
            term applies some kind of a restriction to the returned user
            events. Use this expression to restrict results to a
            specific time range, or filter events by eventType. eg:
            eventTime > "2012-04-23T18:25:43.511Z"
            eventsMissingCatalogItems
            eventTime<"2012-04-23T18:25:43.511Z" eventType=search

            We expect only 3 types of fields:

            ::

               * eventTime: this can be specified a maximum of 2 times, once with a
                 less than operator and once with a greater than operator. The
                 eventTime restrict should result in one contiguous valid eventTime
                 range.

               * eventType: only 1 eventType restriction can be specified.

               * eventsMissingCatalogItems: specififying this will restrict results
                 to events for which catalog items were not found in the catalog. The
                 default behavior is to return only those events for which catalog
                 items were found.

            Some examples of valid filters expressions:

            -  Example 1: eventTime > "2012-04-23T18:25:43.511Z"
               eventTime < "2012-04-23T18:30:43.511Z"
            -  Example 2: eventTime > "2012-04-23T18:25:43.511Z"
               eventType = detail-page-view
            -  Example 3: eventsMissingCatalogItems eventType = search
               eventTime < "2018-04-23T18:30:43.511Z"
            -  Example 4: eventTime > "2012-04-23T18:25:43.511Z"
            -  Example 5: eventType = search
            -  Example 6: eventsMissingCatalogItems
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


class ListUserEventsResponse(proto.Message):
    r"""Response message for ListUserEvents method.

    Attributes:
        user_events (Sequence[google.cloud.recommendationengine_v1beta1.types.UserEvent]):
            The user events.
        next_page_token (str):
            If empty, the list is complete. If nonempty, the token to
            pass to the next request's ListUserEvents.page_token.
    """

    @property
    def raw_page(self):
        return self

    user_events = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=gcr_user_event.UserEvent,
    )
    next_page_token = proto.Field(
        proto.STRING,
        number=2,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
