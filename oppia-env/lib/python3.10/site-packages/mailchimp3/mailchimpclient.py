# coding=utf-8
"""
Mailchimp v3 Api SDK

Documentation: http://developer.mailchimp.com/documentation/mailchimp/
"""
from __future__ import unicode_literals
import functools
import re


import requests
from requests.auth import HTTPBasicAuth
# Handle library reorganisation Python 2 > Python 3.
try:
    from urllib.parse import urljoin
    from urllib.parse import urlencode
except ImportError:
    from urlparse import urljoin
    from urllib import urlencode

import logging

_logger = logging.getLogger('mailchimp3.client')


def _enabled_or_noop(fn):
    @functools.wraps(fn)
    def wrapper(self, *args, **kwargs):
        if self.enabled:
            return fn(self, *args, **kwargs)
    return wrapper


class MailChimpError(Exception):
    pass


def _raise_response_error(r):
    """
    Return a MailChimpError to which we pass:
        - the response object
        - the response's JSON data if found.
    """
    error_data = {"response": r}
    try:
        json_data = r.json()
    except ValueError:
        # in case of a 500 error, the response might not be a JSON
        pass
    else:
        error_data.update(json_data)
    raise MailChimpError(error_data)


class MailChimpClient(object):
    """
    MailChimp class to communicate with the v3 API
    """
    def __init__(self, mc_api=None, mc_user='python-mailchimp', access_token=None, enabled=True, timeout=None,
                 request_hooks=None, request_headers=None):
        """
        Initialize the class with your optional user_id and required api_key.

        If `enabled` is not True, these methods become no-ops. This is
        particularly useful for testing or disabling with configuration.

        :param mc_api: Mailchimp API key
        :type mc_api: :py:class:`str`
        :param mc_user: Mailchimp user id
        :type mc_user: :py:class:`str`
        :param access_token: The OAuth access token
        :type access_token: :py:class:`str`
        :param enabled: Whether the API should execute any requests
        :type enabled: :py:class:`bool`
        :param timeout: (optional) How long to wait for the server to send
            data before giving up, as a float, or a :ref:`(connect timeout,
            read timeout) <timeouts>` tuple.
        :type timeout: float or tuple
        :param request_hooks: (optional) Hooks for :py:func:`requests.requests`.
        :type request_hooks: :py:class:`dict`
        :param request_headers: (optional) Headers for
            :py:func:`requests.requests`.
        :type request_headers: :py:class:`dict`
        """
        super(MailChimpClient, self).__init__()
        self.enabled = enabled
        self.timeout = timeout
        if access_token:
            self.auth = MailChimpOAuth(access_token)
            self.base_url = self.auth.get_base_url() + '/3.0/'
        elif mc_api:
            if not re.match(r"^[0-9a-f]{32}$", mc_api.split('-')[0]):
                raise ValueError('The API key that you have entered is not valid, did you enter a username by mistake?\n'
                                 'The order of arguments for API key and username has reversed in 2.1.0')
            self.auth = HTTPBasicAuth(mc_user, mc_api)
            datacenter = mc_api.split('-').pop()
            self.base_url = 'https://{0}.api.mailchimp.com/3.0/'.format(datacenter)
        else:
            raise Exception('You must provide an OAuth access token or API key')
        self.request_headers = request_headers or requests.utils.default_headers()
        self.request_hooks = request_hooks or requests.hooks.default_hooks()


    def _make_request(self, **kwargs):
        _logger.info(u'{method} Request: {url}'.format(**kwargs))
        if kwargs.get('json'):
            _logger.info('PAYLOAD: {json}'.format(**kwargs))

        response = requests.request(**kwargs)

        _logger.info(u'{method} Response: {status}'\
            .format(method=kwargs['method'], status=response.status_code))

        return response


    @_enabled_or_noop
    def _post(self, url, data=None):
        """
        Handle authenticated POST requests

        :param url: The url for the endpoint including path parameters
        :type url: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:data:`none` or :py:class:`dict`
        :returns: The JSON output from the API or an error message
        """
        url = urljoin(self.base_url, url)
        try:
            r = self._make_request(**dict(
                method='POST',
                url=url,
                json=data,
                auth=self.auth,
                timeout=self.timeout,
                hooks=self.request_hooks,
                headers=self.request_headers
            ))
        except requests.exceptions.RequestException as e:
            raise e
        else:
            if r.status_code >= 400:
                _raise_response_error(r)

            if r.status_code == 204:
                return None
            return r.json()


    @_enabled_or_noop
    def _get(self, url, **queryparams):
        """
        Handle authenticated GET requests

        :param url: The url for the endpoint including path parameters
        :type url: :py:class:`str`
        :param queryparams: The query string parameters
        :returns: The JSON output from the API
        """
        url = urljoin(self.base_url, url)
        if len(queryparams):
            url += '?' + urlencode(queryparams)
        try:
            r = self._make_request(**dict(
                method='GET',
                url=url,
                auth=self.auth,
                timeout=self.timeout,
                hooks=self.request_hooks,
                headers=self.request_headers
            ))
        except requests.exceptions.RequestException as e:
            raise e
        else:
            if r.status_code >= 400:
                _raise_response_error(r)
            return r.json()


    @_enabled_or_noop
    def _delete(self, url):
        """
        Handle authenticated DELETE requests

        :param url: The url for the endpoint including path parameters
        :type url: :py:class:`str`
        :returns: The JSON output from the API
        """
        url = urljoin(self.base_url, url)
        try:
            r = self._make_request(**dict(
                method='DELETE',
                url=url,
                auth=self.auth,
                timeout=self.timeout,
                hooks=self.request_hooks,
                headers=self.request_headers
            ))
        except requests.exceptions.RequestException as e:
            raise e
        else:
            if r.status_code >= 400:
                _raise_response_error(r)
            if r.status_code == 204:
                return
            return r.json()


    @_enabled_or_noop
    def _patch(self, url, data=None):
        """
        Handle authenticated PATCH requests

        :param url: The url for the endpoint including path parameters
        :type url: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:data:`none` or :py:class:`dict`
        :returns: The JSON output from the API
        """
        url = urljoin(self.base_url, url)
        try:
            r = self._make_request(**dict(
                method='PATCH',
                url=url,
                json=data,
                auth=self.auth,
                timeout=self.timeout,
                hooks=self.request_hooks,
                headers=self.request_headers
            ))
        except requests.exceptions.RequestException as e:
            raise e
        else:
            if r.status_code >= 400:
                _raise_response_error(r)
            return r.json()


    @_enabled_or_noop
    def _put(self, url, data=None):
        """
        Handle authenticated PUT requests

        :param url: The url for the endpoint including path parameters
        :type url: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:data:`none` or :py:class:`dict`
        :returns: The JSON output from the API
        """
        url = urljoin(self.base_url, url)
        try:
            r = self._make_request(**dict(
                method='PUT',
                url=url,
                json=data,
                auth=self.auth,
                timeout=self.timeout,
                hooks=self.request_hooks,
                headers=self.request_headers
            ))
        except requests.exceptions.RequestException as e:
            raise e
        else:
            if r.status_code >= 400:
                _raise_response_error(r)
            return r.json()


class MailChimpOAuth(requests.auth.AuthBase):
    """
    Authentication class for authentication with OAuth2. Acquiring an OAuth2
    for MailChimp can be done by following the instructions in the
    documentation found at
    http://developer.mailchimp.com/documentation/mailchimp/guides/how-to-use-oauth2/
    """
    def __init__(self, access_token):
        """
        Initialize the OAuth and save the access token

        :param access_token: The access token provided by OAuth authentication
        :type access_token: :py:class:`str`
        """
        self._access_token = access_token


    def __call__(self, r):
        """
        Authorize with the access token provided in __init__
        """
        r.headers['Authorization'] = 'OAuth ' + self._access_token
        return r


    def get_metadata(self):
        """
        Get the metadata returned after authentication
        """
        try:
            r = requests.get('https://login.mailchimp.com/oauth2/metadata', auth=self)
        except requests.exceptions.RequestException as e:
            raise e
        else:
            r.raise_for_status()
            output = r.json()
            if 'error' in output:
                raise requests.exceptions.RequestException(output['error'])
            return output


    def get_base_url(self):
        """
        Get the base_url from the authentication metadata
        """
        try:
            return self.get_metadata()['api_endpoint']
        except requests.exceptions.RequestException:
            raise
