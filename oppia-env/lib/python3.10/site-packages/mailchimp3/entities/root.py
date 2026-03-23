# coding=utf-8
"""
The API Root endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/root/
Schema: https://api.mailchimp.com/schema/3.0/Root.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class Root(BaseApi):
    """
    The API root resource links to all other resources available in the API.
    Calling the root directory also returns details about the MailChimp user
    account.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(Root, self).__init__(*args, **kwargs)
        self.endpoint = ''


    def get(self, **queryparams):
        """
        Get links to all other resources available in the API.

        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        return self._mc_client._get(url=self._build_path(), **queryparams)
