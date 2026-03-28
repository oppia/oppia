# coding=utf-8
"""
The Reports API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/reports/
Schema: https://api.mailchimp.com/schema/3.0/Reports/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.entities.reportcampaignabusereports import ReportCampaignAbuseReports
from mailchimp3.entities.reportcampaignadvice import ReportCampaignAdvice
from mailchimp3.entities.reportclickdetailreports import ReportClickDetailReports
from mailchimp3.entities.reportdomainperformance import ReportDomainPerformance
from mailchimp3.entities.reporteepurl import ReportEepURL
from mailchimp3.entities.reportemailactivity import ReportEmailActivity
from mailchimp3.entities.reportlocations import ReportLocations
from mailchimp3.entities.reportsentto import ReportSentTo
from mailchimp3.entities.reportsubreports import ReportSubReports
from mailchimp3.entities.reportunsubscribes import ReportUnsubscribes


class Reports(BaseApi):
    """
    Manage campaign reports for your MailChimp account. All Reports endpoints
    are read-only. MailChimp’s campaign and Automation reports analyze clicks,
    opens, subscribers’ social activity, e-commerce data, and more.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(Reports, self).__init__(*args, **kwargs)
        self.endpoint = 'reports'
        self.campaign_id = None
        self.abuse_reports = ReportCampaignAbuseReports(self)
        self.advice = ReportCampaignAdvice(self)
        self.click_details = ReportClickDetailReports(self)
        self.domain_performance = ReportDomainPerformance(self)
        self.eepurl = ReportEepURL(self)
        self.email_activity = ReportEmailActivity(self)
        self.locations = ReportLocations(self)
        self.sent_to = ReportSentTo(self)
        self.subreports = ReportSubReports(self)
        self.unsubscribes = ReportUnsubscribes(self)


    def all(self, get_all=False, **queryparams):
        """
        Get campaign reports.

        .. note::
            The before_send_time and since_send_time queryparams expect times
            to be listed in the ISO 8601 format in UTC (ex.
            2015-10-21T15:41:36+00:00).

        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        queryparams['type'] = []
        queryparams['before_send_time'] = string
        queryparams['since_send_time'] = string
        """
        self.campaign_id = None
        if get_all:
            return self._iterate(url=self._build_path(), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(), **queryparams)


    def get(self, campaign_id, **queryparams):
        """
        Get report details for a specific sent campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.campaign_id = campaign_id
        return self._mc_client._get(url=self._build_path(campaign_id), **queryparams)
