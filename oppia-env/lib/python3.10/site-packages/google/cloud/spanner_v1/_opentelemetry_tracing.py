# Copyright 2020 Google LLC All rights reserved.
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

"""Manages OpenTelemetry trace creation and handling"""

from contextlib import contextmanager

from google.api_core.exceptions import GoogleAPICallError
from google.cloud.spanner_v1 import SpannerClient

try:
    from opentelemetry import trace
    from opentelemetry.trace.status import Status, StatusCode

    HAS_OPENTELEMETRY_INSTALLED = True
except ImportError:
    HAS_OPENTELEMETRY_INSTALLED = False


@contextmanager
def trace_call(name, session, extra_attributes=None):
    if not HAS_OPENTELEMETRY_INSTALLED or not session:
        # Empty context manager. Users will have to check if the generated value is None or a span
        yield None
        return

    tracer = trace.get_tracer(__name__)

    # Set base attributes that we know for every trace created
    attributes = {
        "db.type": "spanner",
        "db.url": SpannerClient.DEFAULT_ENDPOINT,
        "db.instance": session._database.name,
        "net.host.name": SpannerClient.DEFAULT_ENDPOINT,
    }

    if extra_attributes:
        attributes.update(extra_attributes)

    with tracer.start_as_current_span(
        name, kind=trace.SpanKind.CLIENT, attributes=attributes
    ) as span:
        try:
            span.set_status(Status(StatusCode.OK))
            yield span
        except GoogleAPICallError as error:
            span.set_status(Status(StatusCode.ERROR))
            span.record_exception(error)
            raise
