#!/usr/bin/env python
# encoding: utf-8

"""Support for clusters using Kerberos_ authentication.

This extension adds a new :class:`hdfs.client.Client` subclass,
:class:`KerberosClient`, which handles authentication appropriately with
Kerberized clusters:

.. code-block:: python

  from hdfs.ext.kerberos import KerberosClient
  client = KerberosClient('http://host:port')

To expose this class to the command line interface (so that it can be used by
aliases), we add the following line inside the `global` section of
`~/.hdfscli.cfg` (or wherever our configuration file is located):

.. code-block:: cfg

  autoload.modules = hdfs.ext.kerberos

Here is what our earlier configuration would look like if we updated it to
support a Kerberized production grid:

.. code-block:: cfg

  [global]
  default.alias = dev
  autoload.modules = hdfs.ext.kerberos

  [dev.alias]
  url = http://dev.namenode:port

  [prod.alias]
  url = http://prod.namenode:port
  client = KerberosClient

.. _Kerberos: http://web.mit.edu/kerberos/

"""

from ..client import Client
from ..util import HdfsError
from six import string_types
from threading import Lock, Semaphore
from time import sleep, time
import requests as rq
import requests_kerberos # For mutual authentication globals.


class _HdfsHTTPKerberosAuth(requests_kerberos.HTTPKerberosAuth):

  """Kerberos authenticator which throttles authentication requests.

  Without it, authentication will otherwise fail if too many concurrent
  requests are being made. To avoid replay errors, a timeout of 1 ms is also
  enforced between requests.

  """

  _delay = 0.001 # Seconds.

  def __init__(self, max_concurrency, **kwargs):
    self._lock = Lock()
    self._sem = Semaphore(max_concurrency)
    self._timestamp = time() - self._delay
    super(_HdfsHTTPKerberosAuth, self).__init__(**kwargs)

  def __call__(self, req):
    with self._sem:
      with self._lock:
        delay = self._timestamp + self._delay - time()
        if delay > 0:
          sleep(delay) # Avoid replay errors.
        self._timestamp = time()
      return super(_HdfsHTTPKerberosAuth, self).__call__(req)


class KerberosClient(Client):

  r"""HDFS web client using Kerberos authentication.

  :param url: Hostname or IP address of HDFS namenode, prefixed with protocol,
    followed by WebHDFS port on namenode.
  :param mutual_auth: Whether to enforce mutual authentication or not (possible
    values: `'REQUIRED'`, `'OPTIONAL'`, `'DISABLED'`).
  :param max_concurrency: Maximum number of allowed concurrent authentication
    requests. This is required since requests exceeding the threshold allowed
    by the server will be unable to authenticate.
  :param proxy: User to proxy as.
  :param root: Root path, this will be prefixed to all HDFS paths passed to the
    client. If the root is relative, the path will be assumed relative to the
    user's home directory.
  :param timeout: Connection timeouts, forwarded to the request handler. How
    long to wait for the server to send data before giving up, as a float, or a
    `(connect_timeout, read_timeout)` tuple. If the timeout is reached, an
    appropriate exception will be raised. See the requests_ documentation for
    details.
  :param session: `requests.Session` instance, used to emit all requests.
  :param \*\*kwargs: Additional arguments passed to the underlying
    :class:`~requests_kerberos.HTTPKerberosAuth` class.

  To avoid replay errors, a timeout of 1 ms is enforced between requests. If a
  session argument is passed in, it will be modified in-place to support
  authentication.

  """

  def __init__(self, url, mutual_auth='OPTIONAL', max_concurrency=1, root=None,
    proxy=None, timeout=None, session=None, **kwargs):
    # We allow passing in a string as mutual authentication value.
    if isinstance(mutual_auth, string_types):
      try:
        mutual_auth = getattr(requests_kerberos, mutual_auth)
      except AttributeError:
        raise HdfsError('Invalid mutual authentication type: %r', mutual_auth)
    kwargs['mutual_authentication'] = mutual_auth
    if not session:
      session = rq.Session()
    session.auth = _HdfsHTTPKerberosAuth(int(max_concurrency), **kwargs)
    super(KerberosClient, self).__init__(
      url, root=root, proxy=proxy, timeout=timeout, session=session
    )
