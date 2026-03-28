# Copyright (C) 2019-2021 Zilliz. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

import copy
import logging
import pathlib
import threading
import time
from typing import Callable, Tuple, Union
from urllib import parse

from pymilvus.client.async_grpc_handler import AsyncGrpcHandler
from pymilvus.client.check import is_legal_address, is_legal_host, is_legal_port
from pymilvus.client.grpc_handler import GrpcHandler
from pymilvus.exceptions import (
    ConnectionConfigException,
    ConnectionNotExistException,
    ExceptionsMessage,
)
from pymilvus.settings import Config

logger = logging.getLogger(__name__)

VIRTUAL_PORT = 443


def synchronized(func: Callable):
    """
    Decorator in order to achieve thread-safe singleton class.
    """
    func.__lock__ = threading.Lock()

    def lock_func(*args, **kwargs):
        with func.__lock__:
            return func(*args, **kwargs)

    return lock_func


class SingleInstanceMetaClass(type):
    instance = None

    def __init__(cls, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    def __call__(cls, *args, **kwargs):
        if cls.instance:
            return cls.instance
        cls.instance = cls.__new__(cls)
        cls.instance.__init__(*args, **kwargs)
        return cls.instance

    @synchronized
    def __new__(cls, *args, **kwargs):
        return super().__new__(cls, *args, **kwargs)


class ReconnectHandler:
    def __init__(self, conns: object, connection_name: str, kwargs: object) -> None:
        self.connection_name = connection_name
        self.conns = conns
        self._kwargs = kwargs
        self.is_idle_state = False
        self.reconnect_lock = threading.Lock()

    def check_state_and_reconnect_later(self):
        check_after_seconds = 3
        logger.debug(f"state is idle, schedule reconnect in {check_after_seconds} seconds")
        time.sleep(check_after_seconds)
        if not self.is_idle_state:
            logger.debug("idle state changed, skip reconnect")
            return
        with self.reconnect_lock:
            logger.info("reconnect on idle state")
            self.is_idle_state = False
            try:
                logger.debug("try disconnecting old connection...")
                self.conns.disconnect(self.connection_name)
            except Exception:
                logger.warning("disconnect failed: {e}")
            finally:
                reconnected = False
                while not reconnected:
                    try:
                        logger.debug("try reconnecting...")
                        self.conns.connect(self.connection_name, **self._kwargs)
                        reconnected = True
                    except Exception as e:
                        logger.warning(
                            f"reconnect failed: {e}, try again after {check_after_seconds} seconds"
                        )
                        time.sleep(check_after_seconds)
            logger.info("reconnected")

    def reconnect_on_idle(self, state: object):
        logger.debug(f"state change to: {state}")
        with self.reconnect_lock:
            if state.value[1] != "idle":
                self.is_idle_state = False
                return
            self.is_idle_state = True
            threading.Thread(target=self.check_state_and_reconnect_later).start()


class Connections(metaclass=SingleInstanceMetaClass):
    """Class for managing all connections of milvus.  Used as a singleton in this module."""

    def __init__(self) -> None:
        """Constructs a default milvus alias config

            default config will be read from env: MILVUS_URI and MILVUS_CONN_ALIAS
            with default value: default="localhost:19530"

         Read default connection config from environment variable: MILVUS_URI.
            Format is:
                [scheme://][<user>@<password>]host[:<port>]

                scheme is one of: http, https, or <empty>

        Examples:
            localhost
            localhost:19530
            test_user@localhost:19530
            http://test_userlocalhost:19530
            https://test_user:password@localhost:19530

        """
        self._alias_config = {}
        self._alias_handlers = {}
        self._env_uri = None

        if Config.MILVUS_URI != "":
            address, parsed_uri = self.__parse_address_from_uri(Config.MILVUS_URI)
            self._env_uri = (address, parsed_uri)

            default_conn_config = {
                "user": parsed_uri.username if parsed_uri.username is not None else "",
                "address": address,
            }
        else:
            default_conn_config = {
                "user": "",
                "address": f"{Config.DEFAULT_HOST}:{Config.DEFAULT_PORT}",
            }

        self.add_connection(**{Config.MILVUS_CONN_ALIAS: default_conn_config})

    def __verify_host_port(self, host: str, port: Union[int, str]):
        if not is_legal_host(host):
            raise ConnectionConfigException(message=ExceptionsMessage.HostType)
        if not is_legal_port(port):
            raise ConnectionConfigException(message=ExceptionsMessage.PortType)
        if not 0 <= int(port) < 65535:
            msg = f"port number {port} out of range, valid range [0, 65535)"
            raise ConnectionConfigException(message=msg)

    def __parse_address_from_uri(self, uri: str) -> (str, parse.ParseResult):
        illegal_uri_msg = (
            "Illegal uri: [{}], expected form 'http[s]://[user:password@]example.com[:12345]'"
        )
        try:
            parsed_uri = parse.urlparse(uri)
        except Exception as e:
            raise ConnectionConfigException(
                message=f"{illegal_uri_msg.format(uri)}: <{type(e).__name__}, {e}>"
            ) from None

        if len(parsed_uri.netloc) == 0:
            raise ConnectionConfigException(message=f"{illegal_uri_msg.format(uri)}") from None

        host = parsed_uri.hostname if parsed_uri.hostname is not None else Config.DEFAULT_HOST
        default_port = "443" if parsed_uri.scheme == "https" else Config.DEFAULT_PORT
        port = parsed_uri.port if parsed_uri.port is not None else default_port
        addr = f"{host}:{port}"

        self.__verify_host_port(host, port)

        if not is_legal_address(addr):
            raise ConnectionConfigException(message=illegal_uri_msg.format(uri))

        return addr, parsed_uri

    def add_connection(self, **kwargs):
        """Configures a milvus connection.

        Addresses priority in kwargs: address, uri, host and port

        :param kwargs:
            * *address* (``str``) -- Optional. The actual address of Milvus instance.
                Example address: "localhost:19530"

            * *uri* (``str``) -- Optional. The uri of Milvus instance.
                Example uri: "http://localhost:19530", "tcp:localhost:19530", "https://ok.s3.south.com:19530".

            * *host* (``str``) -- Optional. The host of Milvus instance.
                Default at "localhost", PyMilvus will fill in the default host
                if only port is provided.

            * *port* (``str/int``) -- Optional. The port of Milvus instance.
                Default at 19530, PyMilvus will fill in the default port if only host is provided.

        Example::

            connections.add_connection(
                default={"host": "localhost", "port": "19530"},
                dev1={"host": "localhost", "port": "19531"},
                dev2={"uri": "http://random.com/random"},
                dev3={"uri": "http://localhost:19530"},
                dev4={"uri": "tcp://localhost:19530"},
                dev5={"address": "localhost:19530"},
                prod={"uri": "http://random.random.random.com:19530"},
            )
        """
        for alias, config in kwargs.items():
            addr, parsed_uri = self.__get_full_address(
                config.get("address", ""),
                config.get("uri", ""),
                config.get("host", ""),
                config.get("port", ""),
            )

            if alias in self._alias_handlers and self._alias_config[alias].get("address") != addr:
                raise ConnectionConfigException(message=ExceptionsMessage.ConnDiffConf % alias)

            alias_config = {
                "address": addr,
                "user": config.get("user", ""),
            }

            if parsed_uri is not None and parsed_uri.scheme == "https":
                alias_config["secure"] = True

            self._alias_config[alias] = alias_config

    def __get_full_address(
        self,
        address: str = "",
        uri: str = "",
        host: str = "",
        port: str = "",
    ) -> (str, parse.ParseResult):
        if address != "":
            if not is_legal_address(address):
                raise ConnectionConfigException(
                    message=f"Illegal address: {address}, should be in form 'localhost:19530'"
                )
            return address, None

        if uri != "":
            if isinstance(uri, str) and uri.startswith("unix:"):
                return uri, None
            address, parsed = self.__parse_address_from_uri(uri)
            return address, parsed

        _host = host if host != "" else Config.DEFAULT_HOST
        _port = port if port != "" else Config.DEFAULT_PORT
        self.__verify_host_port(_host, _port)

        addr = f"{_host}:{_port}"
        if not is_legal_address(addr):
            raise ConnectionConfigException(
                message=f"Illegal host: {host} or port: {port}, should be in form of '111.1.1.1', '19530'"
            )

        return addr, None

    def disconnect(self, alias: str):
        """Disconnects connection from the registry.

        :param alias: The name of milvus connection
        :type alias: str
        """
        if not isinstance(alias, str):
            raise ConnectionConfigException(message=ExceptionsMessage.AliasType % type(alias))

        if alias in self._alias_handlers:
            self._alias_handlers.pop(alias).close()

    async def async_disconnect(self, alias: str):
        if not isinstance(alias, str):
            raise ConnectionConfigException(message=ExceptionsMessage.AliasType % type(alias))

        if alias in self._alias_handlers:
            await self._alias_handlers.pop(alias).close()

    async def async_remove_connection(self, alias: str):
        await self.async_disconnect(alias)
        self._alias_config.pop(alias, None)

    def remove_connection(self, alias: str):
        """Removes connection from the registry.

        :param alias: The name of milvus connection
        :type alias: str
        """
        if not isinstance(alias, str):
            raise ConnectionConfigException(message=ExceptionsMessage.AliasType % type(alias))

        self.disconnect(alias)
        self._alias_config.pop(alias, None)

    def connect(
        self,
        alias: str = Config.MILVUS_CONN_ALIAS,
        user: str = "",
        password: str = "",
        db_name: str = "default",
        token: str = "",
        _async: bool = False,
        **kwargs,
    ) -> None:
        """Constructs a milvus connection and register it under given alias.

        Args:
            alias (str): Default to "default". The name of connection. Each alias corresponds to one
                connection.
            user (str, Optional): The user of milvus server.
            password (str, Optional): The password of milvus server.
            token (str, Optional): Serving as the key for authentication.
            db_name (str): The database name of milvus server.
            timeout (float, Optional) The timeout for the connection. Default is 10 seconds.
                Unit: second

            **kwargs:
                * address (str, Optional) -- The actual address of Milvus instance.
                   Example: "localhost:19530"
                * uri (str, Recommanded) -- The uri of Milvus instance.
                   Example uri: "http://localhost:19530", "tcp:localhost:19530", "https://ok.s3.south.com:19530".
                * host (str, Optional) -- The host of Milvus instance. Default at "localhost",
                    PyMilvus will fill in the default host if only port is provided.
                * port (str/int, Optional) -- The port of Milvus instance. Default at 19530,
                    PyMilvus will fill in the default port if only host is provided.
                * keep_alive (bool, Optional) -- Default is false. If set to true,
                    client will keep an alive connection.
                * secure (bool, Optional) -- Default is false. If set to true, tls will be enabled.
                    If use "https://" scheme in uri, secure will be true.
                * client_key_path (str, Optional) -- Needed when use tls two-way authentication.
                * client_pem_path (str, Optional) -- Needed when use tls two-way authentication.
                * ca_pem_path (str, Optional) -- Needed when use tls two-way authentication.
                * server_pem_path (str, Optional) -- Needed when use tls one-way authentication.
                * server_name (str, Optional) -- Needed when enabled tls.

        Example:
            >>> from pymilvus import connections
            >>> connections.connect("test", uri="http://localhost:19530", token="abcdefg")

        Raises:
            ConnectionConfigException: If connection parameters are illegal.
            MilvusException: If anything goes wrong.

        """
        if kwargs.get("uri") and parse.urlparse(kwargs["uri"]).scheme.lower() not in [
            "unix",
            "http",
            "https",
            "tcp",
            "grpc",
        ]:
            # start milvuslite
            if not kwargs["uri"].endswith(".db"):
                raise ConnectionConfigException(
                    message=f"uri: {kwargs['uri']} is illegal, needs start with [unix, http, https, tcp] or a local file endswith [.db]"
                )
            logger.info(f"Pass in the local path {kwargs['uri']}, and run it using milvus-lite")
            parent_path = pathlib.Path(kwargs["uri"]).parent
            if not parent_path.is_dir():
                raise ConnectionConfigException(
                    message=f"Open local milvus failed, dir: {parent_path} not exists"
                )

            # ruff: noqa: PLC0415
            from milvus_lite.server_manager import (
                server_manager_instance,
            )

            local_uri = server_manager_instance.start_and_get_uri(kwargs["uri"])
            if local_uri is None:
                raise ConnectionConfigException(message="Open local milvus failed")
            kwargs["uri"] = local_uri

        # kwargs_copy is used for auto reconnect
        kwargs_copy = copy.deepcopy(kwargs)
        kwargs_copy["user"] = user
        kwargs_copy["password"] = password
        kwargs_copy["db_name"] = db_name
        kwargs_copy["token"] = token

        def connect_milvus(**kwargs):
            gh = GrpcHandler(**kwargs) if not _async else AsyncGrpcHandler(**kwargs)
            config_to_keep = {
                k: v
                for k, v in kwargs.items()
                if k not in ["password", "token", "db_name", "keep_alive"]
            }
            self._alias_handlers[alias] = gh
            self._alias_config[alias] = config_to_keep

            t = kwargs.get("timeout")
            timeout = t if isinstance(t, (int, float)) else Config.MILVUS_CONN_TIMEOUT

            if not _async:
                try:
                    gh._wait_for_channel_ready(timeout=timeout)

                    if kwargs.pop("keep_alive", False):
                        gh.register_state_change_callback(
                            ReconnectHandler(self, alias, kwargs_copy).reconnect_on_idle
                        )
                except Exception as e:
                    self.remove_connection(alias)
                    raise e from e

        def with_config(config: Tuple) -> bool:
            return any(c != "" for c in config)

        if not isinstance(alias, str):
            raise ConnectionConfigException(message=ExceptionsMessage.AliasType % type(alias))

        config = (
            kwargs.pop("address", ""),
            kwargs.pop("uri", ""),
            kwargs.pop("host", ""),
            kwargs.pop("port", ""),
        )

        # Make sure passed in None doesnt break
        user, password, token = str(user) or "", str(password) or "", str(token) or ""

        # 1st Priority: connection from params
        if with_config(config):
            addr, parsed_uri = self.__get_full_address(*config)
            kwargs["address"] = addr

            if self.has_connection(alias) and self._alias_config[alias].get("address") != addr:
                raise ConnectionConfigException(message=ExceptionsMessage.ConnDiffConf % alias)

            # uri might take extra info
            if parsed_uri is not None:
                # get db_name from uri
                user = parsed_uri.username or user
                password = parsed_uri.password or password

                group = [segment for segment in parsed_uri.path.split("/") if segment]
                db_name = group[1] if len(group) > 1 else db_name

                # Set secure=True if https scheme
                if parsed_uri.scheme == "https":
                    kwargs["secure"] = True

            connect_milvus(**kwargs, user=user, password=password, token=token, db_name=db_name)
            return

        # 2nd Priority, connection configs from env
        if self._env_uri is not None:
            addr, parsed_uri = self._env_uri
            kwargs["address"] = addr

            user = parsed_uri.username if parsed_uri.username is not None else ""
            password = parsed_uri.password if parsed_uri.password is not None else ""

            # Set secure=True if https scheme
            if parsed_uri.scheme == "https":
                kwargs["secure"] = True

            connect_milvus(**kwargs, user=user, password=password, db_name=db_name)
            return

        # 3rd Priority, connect to cached configs with provided user and password
        if alias in self._alias_config:
            connect_alias = dict(self._alias_config[alias].items())
            connect_alias["user"] = user
            connect_milvus(**connect_alias, password=password, db_name=db_name, **kwargs)
            return

        # No params, env, and cached configs for the alias
        raise ConnectionConfigException(message=ExceptionsMessage.ConnLackConf % alias)

    def list_connections(self) -> list:
        """List names of all connections.

        :return list:
            Names of all connections.

        :example:
            >>> from pymilvus import connections
            >>> connections.connect("test", host="localhost", port="19530")
            >>> connections.list_connections()
        """
        return [(k, self._alias_handlers.get(k, None)) for k in self._alias_config]

    def get_connection_addr(self, alias: str):
        """
        Retrieves connection configure by alias.

        :param alias: The name of milvus connection
        :type  alias: str

        :return dict:
            The connection configure which of the name is alias.
            If alias does not exist, return empty dict.

        :example:
            >>> from pymilvus import connections
            >>> connections.connect("test", host="localhost", port="19530")
            >>> connections.list_connections()
            >>> connections.get_connection_addr('test')
            {'host': 'localhost', 'port': '19530'}
        """
        if not isinstance(alias, str):
            raise ConnectionConfigException(message=ExceptionsMessage.AliasType % type(alias))

        return self._alias_config.get(alias, {})

    def has_connection(self, alias: str) -> bool:
        """Check if connection named alias exists.

        :param alias: The name of milvus connection
        :type  alias: str

        :return bool:
            if the connection of name alias exists.

        :example:
            >>> from pymilvus import connections
            >>> connections.connect("test", host="localhost", port="19530")
            >>> connections.list_connections()
            >>> connections.get_connection_addr('test')
            {'host': 'localhost', 'port': '19530'}
        """
        if not isinstance(alias, str):
            raise ConnectionConfigException(message=ExceptionsMessage.AliasType % type(alias))
        return alias in self._alias_handlers

    def _fetch_handler(
        self, alias: str = Config.MILVUS_CONN_ALIAS
    ) -> Union[GrpcHandler, AsyncGrpcHandler]:
        """Retrieves a GrpcHandler by alias."""
        if not isinstance(alias, str):
            raise ConnectionConfigException(message=ExceptionsMessage.AliasType % type(alias))

        conn = self._alias_handlers.get(alias, None)
        if conn is None:
            raise ConnectionNotExistException(message=ExceptionsMessage.ConnectFirst)

        return conn


# Singleton Mode in Python
connections = Connections()
