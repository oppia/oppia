# Copyright 2020 The Oppia Authors. All Rights Reserved.
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
# Adapted from portserver.py in the python_portpicker project (commit
# bf6250b121cd610c3280cd748b5702a2be040f41) at
# https://github.com/google/python_portpicker/blob/main/src/portserver.py,
# which is Copyright 2015 Google Inc. All Rights Reserved. The following
# changes have been made by The Oppia Authors to this file since it was
# copied from the python_portpicker project:
#
# * We used threading instead of asyncio for compatibility with Python 2.
#   This change involved adding a Server class to replace asyncio's
#   event loop.
# * We re-wrote the logger format string to be compatible with Python 2.
#   We kept the same general string structure.
# * We renamed _handle_port_request to handle_port_request and removed
#   the original handle_port_request function from the
#   _PortServerRequestHandler class. We also made _handle_port_request
#   return the request response instead of writing it to a provided
#   writer.
# * We re-wrote the main function to use the Server class instead of
#   asyncio. In doing so we also simplified the main function by
#   removing the signal.SIGUSR1 handler.
# * We changed the default portserver address to `portserver.sock` to
#   avoid problems introduced by using an address beginning with a null
#   byte.

"""A server to hand out network ports to applications running on one host.
Typical usage:
 1) Run one instance of this process on each of your unittest farm hosts.
 2) Set the PORTSERVER_ADDRESS environment variable in your test runner
    environment to let the portpicker library know to use a port server
    rather than attempt to find ports on its own.
$ /path/to/portserver.py &
$ export PORTSERVER_ADDRESS=portserver.sock
$ # ... launch a bunch of tests that use portpicker ...
"""

import argparse
import collections
import logging
import os
import socket
import sys
import threading

log = None  # Initialized to a logging.Logger by _configure_logging().

_PROTOS = [(socket.SOCK_STREAM, socket.IPPROTO_TCP),
           (socket.SOCK_DGRAM, socket.IPPROTO_UDP)]


def _get_process_command_line(pid):
    try:
        with open('/proc/{}/cmdline'.format(pid), 'rt') as cmdline_f:
            return cmdline_f.read()
    except IOError:
        return ''


def _get_process_start_time(pid):
    try:
        with open('/proc/{}/stat'.format(pid), 'rt') as pid_stat_f:
            return int(pid_stat_f.readline().split()[21])
    except IOError:
        return 0


def _bind(port, socket_type, socket_proto):
    """Try to bind to a socket of the specified type, protocol, and port.
    For the port to be considered available, the kernel must support at least
    one of (IPv6, IPv4), and the port must be available on each supported
    family.
    Args:
      port: The port number to bind to, or 0 to have the OS pick a free port.
      socket_type: The type of the socket (ex: socket.SOCK_STREAM).
      socket_proto: The protocol of the socket (ex: socket.IPPROTO_TCP).
    Returns:
      The port number on success or None on failure.
    """
    got_socket = False
    for family in (socket.AF_INET6, socket.AF_INET):
        try:
            sock = socket.socket(family, socket_type, socket_proto)
            got_socket = True
        except socket.error:
            continue
        try:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            sock.bind(('', port))
            if socket_type == socket.SOCK_STREAM:
                sock.listen(1)
            port = sock.getsockname()[1]
        except socket.error:
            return None
        finally:
            sock.close()
    return port if got_socket else None


def _is_port_free(port):
    """Check if specified port is free.
    Args:
      port: integer, port to check
    Returns:
      boolean, whether it is free to use for both TCP and UDP
    """
    return _bind(port, *_PROTOS[0]) and _bind(port, *_PROTOS[1])


def _should_allocate_port(pid):
    """Determine if we should allocate a port for use by the given process id."""
    if pid <= 0:
        log.info('Not allocating a port to invalid pid')
        return False
    if pid == 1:
        # The client probably meant to send us its parent pid but
        # had been reparented to init.
        log.info('Not allocating a port to init.')
        return False
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        log.info('Not allocating a port to a non-existent process')
        return False
    return True


class _PortInfo(object):
    """Container class for information about a given port assignment.
    Attributes:
      port: integer port number
      pid: integer process id or 0 if unassigned.
      start_time: Time in seconds since the epoch that the process started.
    """

    __slots__ = ('port', 'pid', 'start_time')

    def __init__(self, port):
        self.port = port
        self.pid = 0
        self.start_time = 0


class _PortPool(object):
    """Manage available ports for processes.
    Ports are reclaimed when the reserving process exits and the reserved port
    is no longer in use.  Only ports which are free for both TCP and UDP will be
    handed out.  It is easier to not differentiate between protocols.
    The pool must be pre-seeded with add_port_to_free_pool() calls
    after which get_port_for_process() will allocate and reclaim ports.
    The len() of a _PortPool returns the total number of ports being managed.
    Attributes:
      ports_checked_for_last_request: The number of ports examined in order to
          return from the most recent get_port_for_process() request.  A high
          number here likely means the number of available ports with no active
          process using them is getting low.
    """

    def __init__(self):
        self._port_queue = collections.deque()
        self.ports_checked_for_last_request = 0

    def num_ports(self):
        return len(self._port_queue)

    def get_port_for_process(self, pid):
        """Allocates and returns port for pid or 0 if none could be allocated."""
        if not self._port_queue:
            raise RuntimeError('No ports being managed.')

        # Avoid an infinite loop if all ports are currently assigned.
        check_count = 0
        max_ports_to_test = len(self._port_queue)
        while check_count < max_ports_to_test:
            # Get the next candidate port and move it to the back of the queue.
            candidate = self._port_queue.pop()
            self._port_queue.appendleft(candidate)
            check_count += 1
            if (candidate.start_time == 0 or
                candidate.start_time != _get_process_start_time(candidate.pid)):
                if _is_port_free(candidate.port):
                    candidate.pid = pid
                    candidate.start_time = _get_process_start_time(pid)
                    if not candidate.start_time:
                        log.info("Can't read start time for pid %d.", pid)
                    self.ports_checked_for_last_request = check_count
                    return candidate.port
                else:
                    log.info(
                        'Port %d unexpectedly in use, last owning pid %d.',
                        candidate.port, candidate.pid)

        log.info('All ports in use.')
        self.ports_checked_for_last_request = check_count
        return 0

    def add_port_to_free_pool(self, port):
        """Add a new port to the free pool for allocation."""
        if port < 1 or port > 65535:
            raise ValueError(
                'Port must be in the [1, 65535] range, not %d.' % port)
        port_info = _PortInfo(port=port)
        self._port_queue.append(port_info)


class _PortServerRequestHandler(object):
    """A class to handle port allocation and status requests.
    Allocates ports to process ids via the dead simple port server protocol
    when the handle_port_request asyncio.coroutine handler has been registered.
    Statistics can be logged using the dump_stats method.
    """

    def __init__(self, ports_to_serve):
        """Initialize a new port server.
        Args:
          ports_to_serve: A sequence of unique port numbers to test and offer
              up to clients.
        """
        self._port_pool = _PortPool()
        self._total_allocations = 0
        self._denied_allocations = 0
        self._client_request_errors = 0
        for port in ports_to_serve:
            self._port_pool.add_port_to_free_pool(port)

    def handle_port_request(self, client_data):
        """Given a port request body, parse it and respond appropriately.
        Args:
          client_data: The request bytes from the client.
        Returns:
          The response to return to the client
        """
        try:
            pid = int(client_data)
        except ValueError as error:
            self._client_request_errors += 1
            log.warning('Could not parse request: %s', error)
            return

        log.info('Request on behalf of pid %d.', pid)
        log.info('cmdline: %s', _get_process_command_line(pid))

        if not _should_allocate_port(pid):
            self._denied_allocations += 1
            return

        port = self._port_pool.get_port_for_process(pid)
        if port > 0:
            self._total_allocations += 1
            log.debug('Allocated port %d to pid %d', port, pid)
            return '{:d}\n'.format(port).encode('utf-8')
        else:
            self._denied_allocations += 1
            log.info('Denied allocation to pid %d', pid)
            return ''

    def dump_stats(self):
        """Logs statistics of our operation."""
        log.info('Dumping statistics:')
        stats = []
        stats.append(
            'client-request-errors {}'.format(self._client_request_errors))
        stats.append('denied-allocations {}'.format(self._denied_allocations))
        stats.append('num-ports-managed {}'.format(self._port_pool.num_ports()))
        stats.append('num-ports-checked-for-last-request {}'.format(
            self._port_pool.ports_checked_for_last_request))
        stats.append('total-allocations {}'.format(self._total_allocations))
        for stat in stats:
            log.info(stat)


def _parse_command_line():
    """Configure and parse our command line flags."""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--portserver_static_pool',
        type=str,
        default='15000-24999',
        help='Comma separated N-P Range(s) of ports to manage (inclusive).')
    parser.add_argument(
        '--portserver_unix_socket_address',
        type=str,
        default='portserver.sock',
        help='Address of AF_UNIX socket on which to listen (first @ is a NUL).')
    parser.add_argument('--verbose',
                        action='store_true',
                        default=False,
                        help='Enable verbose messages.')
    parser.add_argument('--debug',
                        action='store_true',
                        default=False,
                        help='Enable full debug messages.')
    return parser.parse_args(sys.argv[1:])


def _parse_port_ranges(pool_str):
    """Given a 'N-P,X-Y' description of port ranges, return a set of ints."""
    ports = set()
    for range_str in pool_str.split(','):
        try:
            a, b = range_str.split('-', 1)
            start, end = int(a), int(b)
        except ValueError:
            log.error('Ignoring unparsable port range %r.', range_str)
            continue
        if start < 1 or end > 65535:
            log.error('Ignoring out of bounds port range %r.', range_str)
            continue
        ports.update(set(range(start, end + 1)))
    return ports


def _configure_logging(verbose=False, debug=False):
    """Configure the log global, message format, and verbosity settings."""
    overall_level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(
        format=(
            '[%(levelname)s %(asctime)s %(thread)s '
            '%(filename)s : %(lineno)s] %(message)s'
        ),
        datefmt='%m%d %H:%M:%S',
        style='{',
        level=overall_level)
    global log
    log = logging.getLogger('portserver')
    # The verbosity controls our loggers logging level, not the global
    # one above. This avoids debug messages from libraries such as asyncio.
    log.setLevel(logging.DEBUG if verbose else overall_level)


class Server:

    max_backlog = 5
    message_size = 1024

    def __init__(self, handler, socket_path):
        self.socket_path = socket_path
        self.sock = self._start_server(self.socket_path)
        self.handler = handler

    def run(self):
        while True:
            conn, addr = self.sock.accept()
            thread = threading.Thread(
                target=Server.handle_connection,
                args=(conn, self.handler),
            )
            thread.start()

    def close(self):
        try:
            self.sock.shutdown(socket.SHUT_RDWR)
        except socket.error:
            pass
        finally:
            self.sock.close()
        if not self.socket_path.startswith('\0'):
            os.remove(self.socket_path)

    @staticmethod
    def handle_connection(connection, handler):
        request = connection.recv(Server.message_size)
        response = handler(request)
        connection.sendall(response)
        connection.close()

    def _start_server(self, path):
        sock = self._get_socket()
        try:
            sock.bind(path)
        except socket.error as err:
            raise RuntimeError(
                'Failed to bind socket {}. Error: {}'.format(
                    path, err)
            )
        sock.listen(self.max_backlog)
        return sock

    def _get_socket(self):
        if hasattr(socket, 'AF_UNIX'):
            return socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        else:
            # fallback to AF_INET if this is not unix
            return socket.socket(socket.AF_INET, socket.SOCK_STREAM)


def main():
    config = _parse_command_line()
    _configure_logging(verbose=config.verbose, debug=config.debug)
    ports_to_serve = _parse_port_ranges(config.portserver_static_pool)
    if not ports_to_serve:
        log.error('No ports.  Invalid port ranges in --portserver_static_pool?')
        sys.exit(1)

    request_handler = _PortServerRequestHandler(ports_to_serve)

    server = Server(
        request_handler.handle_port_request,
        config.portserver_unix_socket_address.replace('@', '\0', 1),
    )
    log.info('Serving on %s', config.portserver_unix_socket_address)
    try:
        server.run()
    except KeyboardInterrupt:
        log.info('Stopping due to ^C.')

    server.close()
    request_handler.dump_stats()
    log.info('Goodbye.')


if __name__ == '__main__':
    main()
