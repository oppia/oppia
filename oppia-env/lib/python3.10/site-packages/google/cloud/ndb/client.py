# Copyright 2018 Google LLC
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

"""A client for NDB which manages credentials, project, namespace, and database."""

import contextlib
import grpc
import os
import requests

import google.api_core.client_options

from google.api_core.gapic_v1 import client_info
from google.cloud import environment_vars
from google.cloud import _helpers
from google.cloud import client as google_client
from google.cloud.datastore_v1.services.datastore.transports import (
    grpc as datastore_grpc,
)

from google.cloud.ndb import __version__
from google.cloud.ndb import context as context_module
from google.cloud.ndb import key as key_module


_CLIENT_INFO = client_info.ClientInfo(
    user_agent="google-cloud-ndb/{}".format(__version__)
)

DATASTORE_API_HOST = "datastore.googleapis.com"


def _get_gcd_project():
    """Gets the GCD application ID if it can be inferred."""
    return os.getenv(environment_vars.GCD_DATASET)


def _determine_default_project(project=None):
    """Determine default project explicitly or implicitly as fall-back.

        In implicit case, supports four environments. In order of precedence, the
        implicit environments are:

        * DATASTORE_DATASET environment variable (for ``gcd`` / emulator testing)
        * GOOGLE_CLOUD_PROJECT environment variable
        * Google App Engine application ID
        * Google Compute Engine project ID (from metadata server)
    _
        Arguments:
            project (Optional[str]): The project to use as default.

        Returns:
            Union([str, None]): Default project if it can be determined.
    """
    if project is None:
        project = _get_gcd_project()

    if project is None:
        project = _helpers._determine_default_project(project=project)

    return project


class Client(google_client.ClientWithProject):
    """An NDB client.

    The NDB client must be created in order to use NDB, and any use of NDB must
    be within the context of a call to :meth:`context`.

    The Datastore Emulator is used for the client if and only if the
    DATASTORE_EMULATOR_HOST environment variable is set.

    Arguments:
        project (Optional[str]): The project to pass to proxied API methods. If
            not passed, falls back to the default inferred from the
            environment.
        namespace (Optional[str]): Namespace to pass to proxied API methods.
        credentials (Optional[:class:`~google.auth.credentials.Credentials`]):
            The OAuth2 Credentials to use for this client. If not passed, falls
            back to the default inferred from the environment.
        client_options (Optional[:class:`~google.api_core.client_options.ClientOptions` or :class:`dict`])
            Client options used to set user options on the client.
            API Endpoint should be set through client_options.
        database (Optional[str]): Database to access. Defaults to the (default) database.
    """

    SCOPE = ("https://www.googleapis.com/auth/datastore",)
    """The scopes required for authenticating as a Cloud Datastore consumer."""

    def __init__(
        self,
        project=None,
        namespace=None,
        credentials=None,
        client_options=None,
        database=None,
    ):
        self.namespace = namespace
        self.host = os.environ.get(environment_vars.GCD_HOST, DATASTORE_API_HOST)
        self.client_info = _CLIENT_INFO
        self._client_options = client_options
        self.database = database

        # Use insecure connection when using Datastore Emulator, otherwise
        # use secure connection
        emulator = bool(os.environ.get(environment_vars.GCD_HOST))
        self.secure = not emulator

        # Use Datastore API host from client_options if provided, otherwise use default
        api_endpoint = DATASTORE_API_HOST
        if client_options is not None:
            if isinstance(client_options, dict):
                client_options = google.api_core.client_options.from_dict(
                    client_options
                )
            if client_options.api_endpoint:
                api_endpoint = client_options.api_endpoint

        self.host = os.environ.get(environment_vars.GCD_HOST, api_endpoint)

        if emulator:
            # When using the emulator, in theory, the client shouldn't need to
            # call home to authenticate, as you don't need to authenticate to
            # use the local emulator. Unfortunately, the client calls home to
            # authenticate anyway, unless you pass ``requests.Session`` to
            # ``_http`` which seems to be the preferred work around.
            super(Client, self).__init__(
                project=project,
                credentials=credentials,
                client_options=client_options,
                _http=requests.Session,
            )
        else:
            super(Client, self).__init__(
                project=project, credentials=credentials, client_options=client_options
            )

        if emulator:
            channel = grpc.insecure_channel(
                self.host,
                options=[
                    # Default options provided in DatastoreGrpcTransport, but not when we override the channel.
                    ("grpc.max_send_message_length", -1),
                    ("grpc.max_receive_message_length", -1),
                ],
            )
        else:
            user_agent = self.client_info.to_user_agent()
            channel = _helpers.make_secure_channel(
                self._credentials, user_agent, self.host
            )
        self.stub = datastore_grpc.DatastoreGrpcTransport(
            host=self.host,
            credentials=credentials,
            client_info=self.client_info,
            channel=channel,
        )

    @contextlib.contextmanager
    def context(
        self,
        namespace=key_module.UNDEFINED,
        cache_policy=None,
        global_cache=None,
        global_cache_policy=None,
        global_cache_timeout_policy=None,
        legacy_data=True,
    ):
        """Establish a context for a set of NDB calls.

        This method provides a context manager which establishes the runtime
        state for using NDB.

        For example:

        .. code-block:: python

            from google.cloud import ndb

            client = ndb.Client()
            with client.context():
                # Use NDB for some stuff
                pass

        Use of a context is required--NDB can only be used inside a running
        context. The context is used to manage the connection to Google Cloud
        Datastore, an event loop for asynchronous API calls, runtime caching
        policy, and other essential runtime state.

        Code within an asynchronous context should be single threaded.
        Internally, a :class:`threading.local` instance is used to track the
        current event loop.

        In a web application, it is recommended that a single context be used
        per HTTP request. This can typically be accomplished in a middleware
        layer.

        Arguments:
            cache_policy (Optional[Callable[[key.Key], bool]]): The
                cache policy to use in this context. See:
                :meth:`~google.cloud.ndb.context.Context.set_cache_policy`.
            global_cache (Optional[global_cache.GlobalCache]):
                The global cache for this context. See:
                :class:`~google.cloud.ndb.global_cache.GlobalCache`.
            global_cache_policy (Optional[Callable[[key.Key], bool]]): The
                global cache policy to use in this context. See:
                :meth:`~google.cloud.ndb.context.Context.set_global_cache_policy`.
            global_cache_timeout_policy (Optional[Callable[[key.Key], int]]):
                The global cache timeout to use in this context. See:
                :meth:`~google.cloud.ndb.context.Context.set_global_cache_timeout_policy`.
            legacy_data (bool): Set to ``True`` (the default) to write data in
                a way that can be read by the legacy version of NDB.
        """
        context = context_module.get_context(False)
        if context is not None:
            raise RuntimeError("Context is already created for this thread.")

        context = context_module.Context(
            self,
            namespace=namespace,
            cache_policy=cache_policy,
            global_cache=global_cache,
            global_cache_policy=global_cache_policy,
            global_cache_timeout_policy=global_cache_timeout_policy,
            legacy_data=legacy_data,
        )
        with context.use():
            yield context

            # Finish up any work left to do on the event loop
            context.eventloop.run()

    @property
    def _http(self):
        """Getter for object used for HTTP transport.

        Raises:
            NotImplementedError: Always, HTTP transport is not supported.
        """
        raise NotImplementedError("HTTP transport is not supported.")

    @staticmethod
    def _determine_default(project):
        """Helper:  override default project detection."""
        return _determine_default_project(project)
