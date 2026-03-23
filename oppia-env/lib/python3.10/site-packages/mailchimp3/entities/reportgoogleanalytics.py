# coding=utf-8
"""
The Google Analytics API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/reports/google-analytics/
Schema: https://api.mailchimp.com/schema/3.0/Reports/GoogleAnalytics/Collection.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi

class ReportGoogleAnalytics(BaseApi):
    """
    Get top open locations for a specific campaign.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ReportGoogleAnalytics, self).__init__(*args, **kwargs)
        self.endpoint = 'reports'
        self.campaign_id = None
        self.profile_id = None

    def all(self, campaign_id, get_all=False, **queryparams):
        """
        Get a summary of Google Analytics reports for a specific campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams:  The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.campaign_id = campaign_id
        if get_all:
            return self._iterate(url=self._build_path(campaign_id, 'google-analytics'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(campaign_id, 'google-analytics'), **queryparams)

    def get(self, campaign_id, profile_id, **queryparams):
        """
        Get information about a specific Google Analytics report for a campaign.

        :param campaign_id: The unique id for the campaign
        :type campaign_id: :py:class:`str`
        :param profile_id: The Google Analytics View ID
        :type campaign_id: :py:class:`str`
        :param queryparams:
        :param queryparams:  The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.campaign_id = campaign_id
        self.profile_id = profile_id

        return self._mc_client._get(url=self._build_path(campaign_id, 'google-analytics', profile_id), **queryparams)



