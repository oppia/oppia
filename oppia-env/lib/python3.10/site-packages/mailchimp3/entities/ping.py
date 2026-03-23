# coding=utf-8
"""
The Google Analytics API Endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/ping
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi

class Ping(BaseApi):
    """
    A health check endpoint for MailChimp API 3.0.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(Ping, self).__init__(*args, **kwargs)
        self.endpoint = 'ping'

    def get(self):
        """
        A health check for the API that won’t return any account-specific information.
        """
        return self._mc_client._get(url=self._build_path())
