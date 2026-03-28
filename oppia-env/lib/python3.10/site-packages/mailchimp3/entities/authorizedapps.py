# coding=utf-8
"""
The Authorized Apps endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/authorized-apps/
Schema: http://api.mailchimp.com/schema/3.0/AuthorizedApps/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class AuthorizedApps(BaseApi):
    """
    Manage registered, connected apps for your MailChimp account with the
    Authorized Apps endpoints.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(AuthorizedApps, self).__init__(*args, **kwargs)
        self.endpoint = 'authorized-apps'
        self.app_id = None


    def create(self, data):
        """
        Retrieve OAuth2-based credentials to associate API calls with your
        application.

        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "client_id": string*,
            "client_secret": string*
        }
        """
        self.app_id = None
        if 'client_id' not in data:
            raise KeyError('The authorized app must have a client_id')
        if 'client_secret' not in data:
            raise KeyError('The authorized app must have a client_secret')
        return self._mc_client._post(url=self._build_path(), data=data)


    def all(self, get_all=False, **queryparams):
        """
        Get a list of an account’s registered, connected applications.

        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        """
        self.app_id = None
        if get_all:
            return self._iterate(url=self._build_path(), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(), **queryparams)


    def get(self, app_id, **queryparams):
        """
        Get information about a specific authorized application

        :param app_id: The unique id for the connected authorized application
        :type app_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.app_id = app_id
        return self._mc_client._get(url=self._build_path(app_id), **queryparams)
