#!/usr/bin/env python
#
# NOTE: This is a copy of the Google Cloud SDK file at
# platform/google_appengine/google/appengine/tools/devappserver2/wsgi_server.py.
# This copy has been edited by Oppia to wrap poll.poll() calls in try-except
# blocks. This edited version of the file is then copied into the Google Cloud
# SDK installation to overwrite the original wsgi_server.py file to fix #19271.
#
# Copyright 2007 Google LLC
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
# Lint as: python2, python3
"""A WSGI server implementation using a shared thread pool."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import collections
import errno
import logging
import os
import re
import select
import socket
import sys
import threading
import time

import google
import ipaddr

from google.appengine._internal import six_subset
from google.appengine.tools.devappserver2 import errors
from google.appengine.tools.devappserver2 import http_runtime_constants
from google.appengine.tools.devappserver2 import shutdown
from google.appengine.tools.devappserver2 import thread_executor

# pylint: disable=g-import-not-at-top
if six_subset.PY2:
  import httplib as http_client
else:
  import http.client as http_client












from cherrypy import wsgiserver


_HAS_POLL = hasattr(select, 'poll')

# TODO: the only reason we need to timeout is to pick up added or remove
# descriptors. But AFAICT, we only add descriptors at startup and remove them at
# shutdown so for the bulk of the run, the timeout is useless and just simply
# wastes CPU. For startup, if we wait to start the thread until after all
# WSGI servers are created, we are good (although may need to be careful in the
# runtime instances depending on when servers are created relative to the
# sandbox being enabled). For shutdown, more research is needed (one idea is
# simply not remove descriptors as the process is about to exit).
_READINESS_TIMEOUT_SECONDS = 1
_SECONDS_TO_MILLISECONDS = 1000

# Due to reports of failure to find a consistent port, trying a higher value
# to see if that reduces the problem sufficiently.  If it doesn't we can try
# increasing it (on my circa 2010 desktop, it takes about 1/2 second per 1024
# tries) but it would probably be better to either figure out a better
# algorithm or make it possible for code to work with inconsistent ports.


_PORT_0_RETRIES = 2048

# Per RFC2732, IPv6 addresses in URLs are enclosed in []
_IPV6_HOST_RE = re.compile(r'^\[(.*)\]')


class BindError(errors.Error):
  """The server failed to bind its address."""

_THREAD_POOL = thread_executor.ThreadExecutor()


class _SharedCherryPyThreadPool(object):
  """A mimic of wsgiserver.ThreadPool that delegates to a shared thread pool."""

  def __init__(self):
    self._condition = threading.Condition()
    self._connections = set()  # Protected by self._condition.

  def stop(self, timeout=5):
    timeout_time = time.time() + timeout
    with self._condition:
      while self._connections and time.time() < timeout_time:
        self._condition.wait(timeout_time - time.time())
      for connection in self._connections:
        self._shutdown_connection(connection)

  @staticmethod
  def _shutdown_connection(connection):
    if not connection.rfile.closed:
      connection.socket.shutdown(socket.SHUT_RD)

  def put(self, obj):
    with self._condition:
      self._connections.add(obj)
    _THREAD_POOL.submit(self._handle, obj)

  def _handle(self, obj):
    try:
      obj.communicate()
    finally:
      obj.close()
      with self._condition:
        self._connections.remove(obj)
        self._condition.notify()


class SelectThread(object):
  """A thread that selects on sockets and calls corresponding callbacks."""

  def __init__(self):
    self._lock = threading.Lock()
    # self._file_descriptors is a frozenset and
    # self._file_descriptor_to_callback is never mutated so they can be
    # snapshotted by the select thread without needing to copy.
    self._file_descriptors = frozenset()
    self._file_descriptor_to_callback = {}
    self._select_thread = threading.Thread(
        target=self._loop_forever, name='WSGI select')
    self._select_thread.daemon = True

  def start(self):
    self._select_thread.start()

  def add_socket(self, s, callback):
    """Add a new socket to watch.

    Args:
      s: A socket to select on.
      callback: A callable with no args to be called when s is ready for a read.
    """
    with self._lock:
      self._file_descriptors = self._file_descriptors.union([s.fileno()])
      new_file_descriptor_to_callback = self._file_descriptor_to_callback.copy()
      new_file_descriptor_to_callback[s.fileno()] = callback
      self._file_descriptor_to_callback = new_file_descriptor_to_callback

  def remove_socket(self, s):
    """Remove a watched socket."""
    with self._lock:
      self._file_descriptors = self._file_descriptors.difference([s.fileno()])
      new_file_descriptor_to_callback = self._file_descriptor_to_callback.copy()
      del new_file_descriptor_to_callback[s.fileno()]
      self._file_descriptor_to_callback = new_file_descriptor_to_callback

  def _loop_forever(self):
    while shutdown and not shutdown.shutting_down():
      # Check shutdown as it may be gc-ed during shutdown. See
      # http://stackoverflow.com/questions/17084260/imported-modules-become-none-when-running-a-function
      self._select()

  def _select(self):
    with self._lock:
      fds = self._file_descriptors
      fd_to_callback = self._file_descriptor_to_callback
    if fds:
      if _HAS_POLL:
        # With 100 file descriptors, it is approximately 5x slower to
        # recreate and reinitialize the Poll object on every call to _select
        # rather reuse one. But the absolute cost of contruction,
        # initialization and calling poll(0) is ~25us so code simplicity
        # wins.
        poll = select.poll()
        for fd in fds:
          poll.register(fd, select.POLLIN)
        failed = True
        while failed:
          try:
            ready_file_descriptors = [fd for fd, _ in poll.poll(
              _READINESS_TIMEOUT_SECONDS * _SECONDS_TO_MILLISECONDS)]
            failed = False
          except select.error:
            pass
      else:
        ready_file_descriptors, _, _ = select.select(fds, [], [],
                                                     _READINESS_TIMEOUT_SECONDS)
      for fd in ready_file_descriptors:
        fd_to_callback[fd]()
    else:
      # select([], [], [], 1) is not supported on Windows.
      time.sleep(_READINESS_TIMEOUT_SECONDS)

_SELECT_THREAD = SelectThread()
_SELECT_THREAD.start()


class _SingleAddressWsgiServer(wsgiserver.CherryPyWSGIServer):
  """A WSGI server that uses a shared SelectThread and thread pool."""

  def __init__(self, host, app):
    """Constructs a _SingleAddressWsgiServer.

    Args:
      host: A (hostname, port) tuple containing the hostname and port to bind.
          The port can be 0 to allow any port.
      app: A WSGI app to handle requests.
    """
    super(_SingleAddressWsgiServer, self).__init__(host, self)
    self._lock = threading.Lock()
    self._app = app  # Protected by _lock.
    self._error = None  # Protected by _lock.
    self.requests = _SharedCherryPyThreadPool()
    self.software = http_runtime_constants.SERVER_SOFTWARE
    # Some servers, especially the API server, may receive many simultaneous
    # requests so set the listen() backlog to something high to reduce the
    # likelihood of refused connections.
    self.request_queue_size = 100

  def start(self):
    """Starts the _SingleAddressWsgiServer.

    This is a modified version of the base class implementation. Changes:
      - Removed unused functionality (Unix domain socket and SSL support).
      - Raises BindError instead of socket.error.
      - Uses _SharedCherryPyThreadPool instead of wsgiserver.ThreadPool.
      - Calls _SELECT_THREAD.add_socket instead of looping forever.

    Raises:
      BindError: The address could not be bound.
    """
    # AF_INET or AF_INET6 socket
    # Get the correct address family for our host (allows IPv6 addresses)
    host, port = self.bind_addr
    try:
      info = socket.getaddrinfo(host, port, socket.AF_UNSPEC,
                                socket.SOCK_STREAM, 0, socket.AI_PASSIVE)
    except socket.gaierror:
      if ':' in host:
        info = [(socket.AF_INET6, socket.SOCK_STREAM, 0, '',
                 self.bind_addr + (0, 0))]
      else:
        info = [(socket.AF_INET, socket.SOCK_STREAM, 0, '', self.bind_addr)]

    self.socket = None
    saved_socket_error = None
    for res in info:
      af, socktype, proto, _, _ = res
      try:
        self.bind(af, socktype, proto)
      except socket.error as socket_error:
        if self.socket:
          self.socket.close()
        self.socket = None
        saved_socket_error = socket_error
        continue
      break
    if not self.socket:
      raise BindError('Unable to bind %s:%s' % self.bind_addr,
                      saved_socket_error)

    # Timeout so KeyboardInterrupt can be caught on Win32
    self.socket.settimeout(1)
    self.socket.listen(self.request_queue_size)

    self.ready = True
    self._start_time = time.time()
    _SELECT_THREAD.add_socket(self.socket, self.tick)

  def quit(self):
    """Quits the _SingleAddressWsgiServer."""
    _SELECT_THREAD.remove_socket(self.socket)
    self.requests.stop(timeout=1)

  @property
  def port(self):
    """Returns the port that the server is bound to."""
    return self.socket.getsockname()[1]

  def set_app(self, app):
    """Sets the PEP-333 app to use to serve requests."""
    with self._lock:
      self._app = app

  def set_error(self, error):
    """Sets the HTTP status code to serve for all requests."""
    with self._lock:
      self._error = error
      self._app = None

  def __call__(self, environ, start_response):
    with self._lock:
      app = self._app
      error = self._error
    if app:
      return app(environ, start_response)
    else:
      start_response('%d %s' % (error, http_client.responses[error]), [])
      return []


class WsgiHostCheck(object):
  """WSGI middleware for whitelisting incoming Host HTTP header values."""

  def __init__(self, whitelisted_hosts, app):
    self.whitelisted_hosts = set()
    self.whitelisted_wildcard_hosts = set()
    self.whitelisted_deep_wildcard_hosts = set()
    for host in whitelisted_hosts:
      if six_subset.ensure_str(host).startswith('**.'):
        self.whitelisted_deep_wildcard_hosts.add(self._get_base_host_name(host))
      elif six_subset.ensure_str(host).startswith('*.'):
        self.whitelisted_wildcard_hosts.add(self._get_base_host_name(host))
      else:
        self.whitelisted_hosts.add(host)
    self.app = app

  def __call__(self, environ, start_response):
    http_host = environ.get('HTTP_HOST', '')

    if not http_host:
      # Only allow requests without a Host header for HTTP/1.0 requests
      if environ.get('SERVER_PROTOCOL', '') == 'HTTP/1.0':
        return self.app(environ, start_response)
      else:
        logging.info('No Host header set in request')
        start_response('400 Bad Request', [])
        return ['No Host header set in request.']

    canonical_host = self._get_canonical_host_name(http_host)

    if (self._is_local_host(canonical_host) or
        self._is_whitelisted_host(canonical_host) or
        self._is_whitelisted_wildcard_host(canonical_host) or
        self._is_whitelisted_deep_wildcard_host(canonical_host)):
      return self.app(environ, start_response)
    else:
      logging.error(
          ('Request Host %s not whitelisted. Enabled hosts are %s'



          ),
          canonical_host, self.whitelisted_hosts)
      start_response('400 Bad Request', [])
      return [('Request host is not whitelist enabled for this server. '
               'Please use the --host command-line flag to whitelist a '
               'specific host (recommended) or use --enable_host_checking to '
               'disable host checking. See the command-line flags help '
               'text for more information. '



              )]

  def _is_local_host(self, host):
    if host == 'localhost':
      return True

    try:
      return ipaddr.IPAddress(host).is_loopback
    except ValueError:
      return False

  def _is_whitelisted_host(self, host):
    """Checks whether the provided host is whitelisted."""
    return host in self.whitelisted_hosts

  def _is_whitelisted_wildcard_host(self, host):
    """Checks whether the provided host is whitelisted through wildcarding."""
    base_host = self._get_base_host_name(host)
    return base_host in self.whitelisted_wildcard_hosts if base_host else False

  def _is_whitelisted_deep_wildcard_host(self, host):
    """Checks the provided host for whitelisting through deep wildcarding."""
    return any(
        host.endswith('.' + six_subset.ensure_str(deep_wildcard_host))
        for deep_wildcard_host in self.whitelisted_deep_wildcard_hosts)

  def _get_canonical_host_name(self, host):
    """Returns just the host name from a HTTP_HOST header value."""
    ipv6_match = _IPV6_HOST_RE.match(six_subset.ensure_str(host))
    if ipv6_match:
      return ipv6_match.group(1)
    else:
      return six_subset.ensure_str(host).rsplit(':', 1)[0]

  def _get_base_host_name(self, host):
    """Returns the host name without the lowest level domain part."""
    return six_subset.ensure_str(host).split('.',
                                             1)[-1] if '.' in host else None


class WsgiServer(object):

  def __init__(self, host, app, ssl_certificate_paths=None, ssl_port=None):
    """Constructs a WsgiServer.

    Args:
      host: A (hostname, port) tuple containing the hostname and port to bind.
          The port can be 0 to allow any port.
      app: A WSGI app to handle requests.
      ssl_certificate_paths: A ssl_utils.SSLCertificatePaths instance. This must
        be specified in conjunction with ssl_port.
      ssl_port: Port to bind to for https connections. This must be specified in
        conjunction with ssl_certificate_paths.

    Raises:
      ValueError: If only one of ssl_certificate_paths or ssl_port is specified.
    """
    if ((ssl_certificate_paths and not ssl_port) or
        (ssl_port and not ssl_certificate_paths)):
      raise ValueError('Must specify both ssl_certificate_paths and ssl_port')
    self.bind_addr = host
    self._app = app
    self._servers = []
    self._ssl_certificate_paths = ssl_certificate_paths
    self._ssl_port = ssl_port

  def start(self):
    """Starts the WsgiServer.

    This starts multiple _SingleAddressWsgiServers to bind the address in all
    address families.

    Raises:
      BindError: The address could not be bound.
    """
    host, port = self.bind_addr
    host_ports = self._get_all_host_ports(host, port)

    ssl_host_ports = self._get_all_host_ports(
        host, self._ssl_port
    ) if self.ssl_enabled else []
    ssl_adapter = self._create_ssl_adapter() if self.ssl_enabled else None

    if port != 0:
      self._start_all_fixed_port(host_ports)
      self._start_all_fixed_port(ssl_host_ports, ssl_adapter)
      if not self._servers:
        raise BindError('Unable to bind %s:%s' % self.bind_addr)
    else:
      for _ in range(_PORT_0_RETRIES):
        if self._start_all_dynamic_port(
            host_ports) and self._start_all_dynamic_port(
                ssl_host_ports, ssl_adapter):
          break
      else:
        raise BindError('Unable to find a consistent port for %s' % host)

  def _get_all_host_ports(self, host, port):
    """Uses socket.getaddrinfo to return all address families for the host/port.

    Args:
      host: str, hostname to bind to.
      port: int, port to bind to.

    Returns:
      An itertable of (host, port) tuples.
    """
    try:
      addrinfo = socket.getaddrinfo(host, port, socket.AF_UNSPEC,
                                    socket.SOCK_STREAM, 0, socket.AI_PASSIVE)
      sockaddrs = [addr[-1] for addr in addrinfo]
      host_ports = [sockaddr[:2] for sockaddr in sockaddrs]
      # Remove duplicate addresses caused by bad hosts file. Retain the
      # order to minimize behavior change (and so we don't have to tweak
      # unit tests to deal with different order).
      return list(collections.OrderedDict.fromkeys(host_ports))
    except socket.gaierror:
      return [(host, port)]

  def _create_ssl_adapter(self):
    """Returns an ssl adapter for the wsgi server, or None if not using ssl."""
    # Use the 'builtin' adapter instead of 'pyopenssl' to use python's
    # standard ssl module instead of OpenSSL
    return wsgiserver.get_ssl_adapter_class('builtin')(
        certificate=self._ssl_certificate_paths.ssl_certificate_path,
        private_key=self._ssl_certificate_paths.ssl_certificate_key_path)

  def _start_all_fixed_port(self, host_ports, ssl_adapter=None):
    """Starts a server for each specified address with a fixed port.

    Does the work of actually trying to create a _SingleAddressWsgiServer for
    each specified address.

    Args:
      host_ports: An iterable of host, port tuples.
      ssl_adapter: An wsgiserver.SSLAdapter instance. If specified, all
        _SingleAddressWsgiServers will have their ssl_adapter set to this.

    Raises:
      BindError: The address could not be bound.
    """
    for host, port in host_ports:
      assert port != 0
      server = _SingleAddressWsgiServer((host, port), self._app)
      if ssl_adapter:
        server.ssl_adapter = ssl_adapter
      try:
        server.start()
      except BindError as bind_error:
        # TODO: I'm not sure about the behavior of quietly ignoring an
        # EADDRINUSE as long as the bind succeeds on at least one interface. I
        # think we should either:
        # - Fail (just like we do now when bind fails on every interface).
        # - Retry on next highest port.
        logging.debug('Failed to bind "%s:%s": %s', host, port, bind_error)
        continue
      else:
        self._servers.append(server)

  def _start_all_dynamic_port(self, host_ports, ssl_adapter=None):
    """Starts a server for each specified address with a dynamic port.

    Does the work of actually trying to create a _SingleAddressWsgiServer for
    each specified address.

    Args:
      host_ports: An iterable of host, port tuples.
      ssl_adapter: An wsgiserver.SSLAdapter instance. If specified, all
        _SingleAddressWsgiServers will have their ssl_adapter set to this.

    Returns:
      The list of all servers (also saved as self._servers). A non empty list
      indicates success while an empty list indicates failure.
    """
    port = 0
    for host, _ in host_ports:
      server = _SingleAddressWsgiServer((host, port), self._app)
      if ssl_adapter:
        server.ssl_adapter = ssl_adapter
      try:
        server.start()
        if port == 0:
          port = server.port
      except BindError as bind_error:
        err = bind_error[1][0] if six_subset.PY2 else bind_error.args[1][0]
        if err == errno.EADDRINUSE:
          # The port picked at random for first interface was not available
          # on one of the other interfaces. Forget them and try again.
          for server in self._servers:
            server.quit()
          self._servers = []
          break
        else:
          # Ignore the interface if we get an error other than EADDRINUSE.
          logging.debug('Failed to bind "%s:%s": %s', host, port, bind_error)
          continue
      else:
        self._servers.append(server)
    return self._servers

  def quit(self):
    """Quits the WsgiServer."""
    for server in self._servers:
      server.quit()

  @property
  def host(self):
    """Returns the host that the server is bound to."""
    return self._servers[0].socket.getsockname()[0]

  @property
  def port(self):
    """Returns the port that the server is bound to."""
    return self._servers[0].socket.getsockname()[1]

  @property
  def ssl_enabled(self):
    """Returns whether this server is using SSL."""
    return self._ssl_port and self._ssl_certificate_paths

  def set_app(self, app):
    """Sets the PEP-333 app to use to serve requests."""
    self._app = app

    for server in self._servers:
      server.set_app(app)

  def set_error(self, error):
    """Sets the HTTP status code to serve for all requests."""
    self._error = error
    self._app = None
    for server in self._servers:
      server.set_error(error)

  @property
  def ready(self):
    return all(server.ready for server in self._servers)
#
