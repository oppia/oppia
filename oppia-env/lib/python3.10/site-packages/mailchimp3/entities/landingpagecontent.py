# coding=utf-8
"""
The Landing Page Content API endpoint

Documentation: https://mailchimp.com/developer/reference/landing-pages/landing-pages_content/
Schema: https://api.mailchimp.com/schema/3.0/Definitions/LandingPages/Content/Response.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class LandingPageContent(BaseApi):
    """
    The HTML content for your Mailchimp landing pages.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(LandingPageContent, self).__init__(*args, **kwargs)
        self.endpoint = 'landing-pages'
        self.page_id = None


    def get(self, page_id, **queryparams):
        """
        Get the the HTML for your landing page.

        :param page_id: The unique id for the page.
        :type page_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.page_id = page_id
        return self._mc_client._get(url=self._build_path(page_id, 'content'), **queryparams)
