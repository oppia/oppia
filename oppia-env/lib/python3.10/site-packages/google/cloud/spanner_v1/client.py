# Copyright 2016 Google LLC All rights reserved.
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

"""Parent client for calling the Cloud Spanner API.

This is the base from which all interactions with the API occur.

In the hierarchy of API concepts

* a :class:`~google.cloud.spanner_v1.client.Client` owns an
  :class:`~google.cloud.spanner_v1.instance.Instance`
* a :class:`~google.cloud.spanner_v1.instance.Instance` owns a
  :class:`~google.cloud.spanner_v1.database.Database`
"""
import grpc
import os
import warnings

from google.api_core.gapic_v1 import client_info
from google.auth.credentials import AnonymousCredentials
import google.api_core.client_options
from google.cloud.client import ClientWithProject


from google.cloud.spanner_admin_database_v1 import DatabaseAdminClient
from google.cloud.spanner_admin_database_v1.services.database_admin.transports.grpc import (
    DatabaseAdminGrpcTransport,
)
from google.cloud.spanner_admin_instance_v1 import InstanceAdminClient
from google.cloud.spanner_admin_instance_v1.services.instance_admin.transports.grpc import (
    InstanceAdminGrpcTransport,
)
from google.cloud.spanner_admin_instance_v1 import ListInstanceConfigsRequest
from google.cloud.spanner_admin_instance_v1 import ListInstancesRequest
from google.cloud.spanner_v1 import __version__
from google.cloud.spanner_v1 import ExecuteSqlRequest
from google.cloud.spanner_v1._helpers import _merge_query_options
from google.cloud.spanner_v1._helpers import _metadata_with_prefix
from google.cloud.spanner_v1.instance import Instance

_CLIENT_INFO = client_info.ClientInfo(client_library_version=__version__)
EMULATOR_ENV_VAR = "SPANNER_EMULATOR_HOST"
_EMULATOR_HOST_HTTP_SCHEME = (
    "%s contains a http scheme. When used with a scheme it may cause gRPC's "
    "DNS resolver to endlessly attempt to resolve. %s is intended to be used "
    "without a scheme: ex %s=localhost:8080."
) % ((EMULATOR_ENV_VAR,) * 3)
SPANNER_ADMIN_SCOPE = "https://www.googleapis.com/auth/spanner.admin"
OPTIMIZER_VERSION_ENV_VAR = "SPANNER_OPTIMIZER_VERSION"
OPTIMIZER_STATISITCS_PACKAGE_ENV_VAR = "SPANNER_OPTIMIZER_STATISTICS_PACKAGE"


def _get_spanner_emulator_host():
    return os.getenv(EMULATOR_ENV_VAR)


def _get_spanner_optimizer_version():
    return os.getenv(OPTIMIZER_VERSION_ENV_VAR, "")


def _get_spanner_optimizer_statistics_package():
    return os.getenv(OPTIMIZER_STATISITCS_PACKAGE_ENV_VAR, "")


class Client(ClientWithProject):
    """Client for interacting with Cloud Spanner API.

    .. note::

        Since the Cloud Spanner API requires the gRPC transport, no
        ``_http`` argument is accepted by this class.

    :type project: :class:`str` or :func:`unicode <unicode>`
    :param project: (Optional) The ID of the project which owns the
                    instances, tables and data. If not provided, will
                    attempt to determine from the environment.

    :type credentials:
        :class:`Credentials <google.auth.credentials.Credentials>` or
        :data:`NoneType <types.NoneType>`
    :param credentials: (Optional) The authorization credentials to attach to requests.
                        These credentials identify this application to the service.
                        If none are specified, the client will attempt to ascertain
                        the credentials from the environment.

    :type client_info: :class:`~google.api_core.gapic_v1.client_info.ClientInfo`
    :param client_info:
        (Optional) The client info used to send a user-agent string along with
        API requests. If ``None``, then default info will be used. Generally,
        you only need to set this if you're developing your own library or
        partner tool.

    :type client_options: :class:`~google.api_core.client_options.ClientOptions`
        or :class:`dict`
    :param client_options: (Optional) Client options used to set user options
        on the client. API Endpoint should be set through client_options.

    :type query_options:
        :class:`~google.cloud.spanner_v1.types.ExecuteSqlRequest.QueryOptions`
        or :class:`dict`
    :param query_options:
        (Optional) Query optimizer configuration to use for the given query.
        If a dict is provided, it must be of the same form as the protobuf
        message :class:`~google.cloud.spanner_v1.types.QueryOptions`

    :raises: :class:`ValueError <exceptions.ValueError>` if both ``read_only``
             and ``admin`` are :data:`True`
    """

    _instance_admin_api = None
    _database_admin_api = None
    _SET_PROJECT = True  # Used by from_service_account_json()

    SCOPE = (SPANNER_ADMIN_SCOPE,)
    """The scopes required for Google Cloud Spanner."""

    def __init__(
        self,
        project=None,
        credentials=None,
        client_info=_CLIENT_INFO,
        client_options=None,
        query_options=None,
    ):
        self._emulator_host = _get_spanner_emulator_host()

        if client_options and type(client_options) == dict:
            self._client_options = google.api_core.client_options.from_dict(
                client_options
            )
        else:
            self._client_options = client_options

        if self._emulator_host:
            credentials = AnonymousCredentials()
        elif isinstance(credentials, AnonymousCredentials):
            self._emulator_host = self._client_options.api_endpoint

        # NOTE: This API has no use for the _http argument, but sending it
        #       will have no impact since the _http() @property only lazily
        #       creates a working HTTP object.
        super(Client, self).__init__(
            project=project,
            credentials=credentials,
            client_options=client_options,
            _http=None,
        )
        self._client_info = client_info

        env_query_options = ExecuteSqlRequest.QueryOptions(
            optimizer_version=_get_spanner_optimizer_version(),
            optimizer_statistics_package=_get_spanner_optimizer_statistics_package(),
        )

        # Environment flag config has higher precedence than application config.
        self._query_options = _merge_query_options(query_options, env_query_options)

        if self._emulator_host is not None and (
            "http://" in self._emulator_host or "https://" in self._emulator_host
        ):
            warnings.warn(_EMULATOR_HOST_HTTP_SCHEME)

    @property
    def credentials(self):
        """Getter for client's credentials.

        :rtype:
            :class:`Credentials <google.auth.credentials.Credentials>`
        :returns: The credentials stored on the client.
        """
        return self._credentials

    @property
    def project_name(self):
        """Project name to be used with Spanner APIs.

        .. note::

            This property will not change if ``project`` does not, but the
            return value is not cached.

        The project name is of the form

            ``"projects/{project}"``

        :rtype: str
        :returns: The project name to be used with the Cloud Spanner Admin
                  API RPC service.
        """
        return "projects/" + self.project

    @property
    def instance_admin_api(self):
        """Helper for session-related API calls."""
        if self._instance_admin_api is None:
            if self._emulator_host is not None:
                transport = InstanceAdminGrpcTransport(
                    channel=grpc.insecure_channel(target=self._emulator_host)
                )
                self._instance_admin_api = InstanceAdminClient(
                    client_info=self._client_info,
                    client_options=self._client_options,
                    transport=transport,
                )
            else:
                self._instance_admin_api = InstanceAdminClient(
                    credentials=self.credentials,
                    client_info=self._client_info,
                    client_options=self._client_options,
                )
        return self._instance_admin_api

    @property
    def database_admin_api(self):
        """Helper for session-related API calls."""
        if self._database_admin_api is None:
            if self._emulator_host is not None:
                transport = DatabaseAdminGrpcTransport(
                    channel=grpc.insecure_channel(target=self._emulator_host)
                )
                self._database_admin_api = DatabaseAdminClient(
                    client_info=self._client_info,
                    client_options=self._client_options,
                    transport=transport,
                )
            else:
                self._database_admin_api = DatabaseAdminClient(
                    credentials=self.credentials,
                    client_info=self._client_info,
                    client_options=self._client_options,
                )
        return self._database_admin_api

    def copy(self):
        """Make a copy of this client.

        Copies the local data stored as simple types but does not copy the
        current state of any open connections with the Cloud Bigtable API.

        :rtype: :class:`.Client`
        :returns: A copy of the current client.
        """
        return self.__class__(project=self.project, credentials=self._credentials)

    def list_instance_configs(self, page_size=None):
        """List available instance configurations for the client's project.

        .. _RPC docs: https://cloud.google.com/spanner/docs/reference/rpc/\
                      google.spanner.admin.instance.v1#google.spanner.admin.\
                      instance.v1.InstanceAdmin.ListInstanceConfigs

        See `RPC docs`_.

        :type page_size: int
        :param page_size:
            Optional. The maximum number of configs in each page of results
            from this request. Non-positive values are ignored. Defaults
            to a sensible value set by the API.

        :rtype: :class:`~google.api_core.page_iterator.Iterator`
        :returns:
            Iterator of
            :class:`~google.cloud.spanner_admin_instance_v1.types.InstanceConfig`
            resources within the client's project.
        """
        metadata = _metadata_with_prefix(self.project_name)
        request = ListInstanceConfigsRequest(
            parent=self.project_name, page_size=page_size
        )
        page_iter = self.instance_admin_api.list_instance_configs(
            request=request, metadata=metadata
        )
        return page_iter

    def instance(
        self,
        instance_id,
        configuration_name=None,
        display_name=None,
        node_count=None,
        labels=None,
        processing_units=None,
    ):
        """Factory to create a instance associated with this client.

        :type instance_id: str
        :param instance_id: The ID of the instance.

        :type configuration_name: string
        :param configuration_name:
           (Optional) Name of the instance configuration used to set up the
           instance's cluster, in the form:
           ``projects/<project>/instanceConfigs/``
           ``<config>``.
           **Required** for instances which do not yet exist.

        :type display_name: str
        :param display_name: (Optional) The display name for the instance in
                             the Cloud Console UI. (Must be between 4 and 30
                             characters.) If this value is not set in the
                             constructor, will fall back to the instance ID.

        :type node_count: int
        :param node_count: (Optional) The number of nodes in the instance's
                            cluster; used to set up the instance's cluster.

        :type processing_units: int
        :param processing_units: (Optional) The number of processing units
                                allocated to this instance.

        :type labels: dict (str -> str) or None
        :param labels: (Optional) User-assigned labels for this instance.

        :rtype: :class:`~google.cloud.spanner_v1.instance.Instance`
        :returns: an instance owned by this client.
        """
        return Instance(
            instance_id,
            self,
            configuration_name,
            node_count,
            display_name,
            self._emulator_host,
            labels,
            processing_units,
        )

    def list_instances(self, filter_="", page_size=None):
        """List instances for the client's project.

        See
        https://cloud.google.com/spanner/reference/rpc/google.spanner.admin.database.v1#google.spanner.admin.database.v1.InstanceAdmin.ListInstances

        :type filter_: string
        :param filter_: (Optional) Filter to select instances listed.  See
                        the ``ListInstancesRequest`` docs above for examples.

        :type page_size: int
        :param page_size:
            Optional. The maximum number of instances in each page of results
            from this request. Non-positive values are ignored. Defaults
            to a sensible value set by the API.

        :rtype: :class:`~google.api_core.page_iterator.Iterator`
        :returns:
            Iterator of :class:`~google.cloud.spanner_admin_instance_v1.types.Instance`
            resources within the client's project.
        """
        metadata = _metadata_with_prefix(self.project_name)
        request = ListInstancesRequest(
            parent=self.project_name, filter=filter_, page_size=page_size
        )
        page_iter = self.instance_admin_api.list_instances(
            request=request, metadata=metadata
        )
        return page_iter
