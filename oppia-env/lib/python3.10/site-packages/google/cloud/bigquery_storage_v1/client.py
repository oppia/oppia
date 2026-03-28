# -*- coding: utf-8 -*-
#
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Parent client for calling the Cloud BigQuery Storage API.

This is the base from which all interactions with the API occur.
"""

from __future__ import absolute_import

import google.api_core.gapic_v1.method

from google.cloud.bigquery_storage_v1 import reader
from google.cloud.bigquery_storage_v1.services import big_query_read
from google.cloud.bigquery_storage_v1.services import big_query_write


_SCOPES = (
    "https://www.googleapis.com/auth/bigquery",
    "https://www.googleapis.com/auth/cloud-platform",
)


class BigQueryReadClient(big_query_read.BigQueryReadClient):
    """Client for interacting with BigQuery Storage API.

    The BigQuery storage API can be used to read data stored in BigQuery.
    """

    def read_rows(
        self,
        name,
        offset=0,
        retry=google.api_core.gapic_v1.method.DEFAULT,
        timeout=google.api_core.gapic_v1.method.DEFAULT,
        metadata=(),
        retry_delay_callback=None,
    ):
        """
        Reads rows from the table in the format prescribed by the read
        session. Each response contains one or more table rows, up to a
        maximum of 10 MiB per response; read requests which attempt to read
        individual rows larger than this will fail.

        Each request also returns a set of stream statistics reflecting the
        estimated total number of rows in the read stream. This number is
        computed based on the total table size and the number of active
        streams in the read session, and may change as other streams continue
        to read data.

        Example:
            >>> from google.cloud import bigquery_storage
            >>>
            >>> client = bigquery_storage.BigQueryReadClient()
            >>>
            >>> # TODO: Initialize ``table``:
            >>> table = "projects/{}/datasets/{}/tables/{}".format(
            ...     'project_id': 'your-data-project-id',
            ...     'dataset_id': 'your_dataset_id',
            ...     'table_id': 'your_table_id',
            ... )
            >>>
            >>> # TODO: Initialize `parent`:
            >>> parent = 'projects/your-billing-project-id'
            >>>
            >>> requested_session = bigquery_storage.types.ReadSession(
            ...     table=table,
            ...     data_format=bigquery_storage.types.DataFormat.AVRO,
            ... )
            >>> session = client.create_read_session(
            ...     parent=parent, read_session=requested_session
            ... )
            >>>
            >>> stream = session.streams[0],  # TODO: Also read any other streams.
            >>> read_rows_stream = client.read_rows(stream.name)
            >>>
            >>> for element in read_rows_stream.rows(session):
            ...     # process element
            ...     pass

        Args:
            name (str):
                Required. Name of the stream to start
                reading from, of the form
                `projects/{project_id}/locations/{location}/sessions/{session_id}/streams/{stream_id}`
            offset (Optional[int]):
                The starting offset from which to begin reading rows from
                in the stream. The offset requested must be less than the last
                row read from ReadRows. Requesting a larger offset is
                undefined.
            retry (Optional[google.api_core.retry.Retry]):  A retry object used
                to retry requests. If ``None`` is specified, requests will not
                be retried.
            timeout (Optional[float]): The amount of time, in seconds, to wait
                for the request to complete. Note that if ``retry`` is
                specified, the timeout applies to each individual attempt.
            metadata (Optional[Sequence[Tuple[str, str]]]): Additional metadata
                that is provided to the method.
            retry_delay_callback (Optional[Callable[[float], None]]):
                If the client receives a retryable error that asks the client to
                delay its next attempt and retry_delay_callback is not None,
                BigQueryReadClient will call retry_delay_callback with the delay
                duration (in seconds) before it starts sleeping until the next
                attempt.

        Returns:
            ~google.cloud.bigquery_storage_v1.reader.ReadRowsStream:
                An iterable of
                :class:`~google.cloud.bigquery_storage_v1.types.ReadRowsResponse`.

        Raises:
            google.api_core.exceptions.GoogleAPICallError: If the request
                    failed for any reason.
            google.api_core.exceptions.RetryError: If the request failed due
                    to a retryable error and retry attempts failed.
            ValueError: If the parameters are invalid.
        """
        gapic_client = super(BigQueryReadClient, self)
        stream = reader.ReadRowsStream(
            gapic_client,
            name,
            offset,
            {"retry": retry, "timeout": timeout, "metadata": metadata},
            retry_delay_callback=retry_delay_callback,
        )
        stream._reconnect()
        return stream


class BigQueryWriteClient(big_query_write.BigQueryWriteClient):
    __doc__ = big_query_write.BigQueryWriteClient.__doc__
