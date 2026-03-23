# coding=utf-8
"""
Mailchimp v3 Api SDK

Documentation at http://developer.mailchimp.com/documentation/mailchimp/reference/overview/
"""
# API Client
from mailchimp3.mailchimpclient import MailChimpClient
# API Root
from mailchimp3.entities.root import Root
# Authorized Apps
from mailchimp3.entities.authorizedapps import AuthorizedApps
# Automations
from mailchimp3.entities.automations import Automations
from mailchimp3.entities.automationactions import AutomationActions
from mailchimp3.entities.automationemails import AutomationEmails
from mailchimp3.entities.automationemailactions import AutomationEmailActions
from mailchimp3.entities.automationemailqueues import AutomationEmailQueues
from mailchimp3.entities.automationremovedsubscribers import AutomationRemovedSubscribers
# Batch Operations
from mailchimp3.entities.batchoperations import BatchOperations
# Batch Webhooks
from mailchimp3.entities.batchwebhooks import BatchWebhooks
# Campaign Folders
from mailchimp3.entities.campaignfolders import CampaignFolders
# Campaigns
from mailchimp3.entities.campaigns import Campaigns
from mailchimp3.entities.campaignactions import CampaignActions
from mailchimp3.entities.campaigncontent import CampaignContent
from mailchimp3.entities.campaignfeedback import CampaignFeedback
from mailchimp3.entities.campaignsendchecklist import CampaignSendChecklist
# Conversations
from mailchimp3.entities.conversations import Conversations
from mailchimp3.entities.conversationmessages import ConversationMessages
# Customer Journeys
from mailchimp3.entities.customerjourney import CustomerJourney
# E-commerce Stores
from mailchimp3.entities.stores import Stores
from mailchimp3.entities.storecarts import StoreCarts
from mailchimp3.entities.storecartlines import StoreCartLines
from mailchimp3.entities.storecustomers import StoreCustomers
from mailchimp3.entities.storeorders import StoreOrders
from mailchimp3.entities.storeorderlines import StoreOrderLines
from mailchimp3.entities.storeproducts import StoreProducts
from mailchimp3.entities.storeproductimages import StoreProductImages
from mailchimp3.entities.storeproductvariants import StoreProductVariants
from mailchimp3.entities.storepromorules import StorePromoRules
from mailchimp3.entities.storepromocodes import StorePromoCodes
# File Manager Files
from mailchimp3.entities.filemanagerfiles import FileManagerFiles
# File Manager Folders
from mailchimp3.entities.filemanagerfolders import FileManagerFolders
# Landinge Pages
from mailchimp3.entities.landingpages import LandingPages
from mailchimp3.entities.landingpageaction import LandingPageAction
from mailchimp3.entities.landingpagecontent import LandingPageContent
# Lists
from mailchimp3.entities.lists import Lists
from mailchimp3.entities.listabusereports import ListAbuseReports
from mailchimp3.entities.listactivity import ListActivity
from mailchimp3.entities.listclients import ListClients
from mailchimp3.entities.listgrowthhistory import ListGrowthHistory
from mailchimp3.entities.listinterestcategories import ListInterestCategories
from mailchimp3.entities.listinterestcategoryinterest import ListInterestCategoryInterest
from mailchimp3.entities.listmembers import ListMembers
from mailchimp3.entities.listmemberactivity import ListMemberActivity
from mailchimp3.entities.listmemberevents import ListMemberEvents
from mailchimp3.entities.listmembergoals import ListMemberGoals
from mailchimp3.entities.listmembernotes import ListMemberNotes
from mailchimp3.entities.listmembertags import ListMemberTags
from mailchimp3.entities.listmergefields import ListMergeFields
from mailchimp3.entities.listsegments import ListSegments
from mailchimp3.entities.listsegmentmembers import ListSegmentMembers
from mailchimp3.entities.listsignupforms import ListSignupForms
from mailchimp3.entities.listwebhooks import ListWebhooks

# ping
from mailchimp3.entities.ping import Ping

# Reports
from mailchimp3.entities.reports import Reports
from mailchimp3.entities.reportcampaignabusereports import ReportCampaignAbuseReports
from mailchimp3.entities.reportcampaignadvice import ReportCampaignAdvice
from mailchimp3.entities.reportclickdetailreports import ReportClickDetailReports
from mailchimp3.entities.reportclickdetailmembers import ReportClickDetailMembers
from mailchimp3.entities.reportdomainperformance import ReportDomainPerformance
from mailchimp3.entities.reporteepurl import ReportEepURL
from mailchimp3.entities.reportemailactivity import ReportEmailActivity
from mailchimp3.entities.reportlocations import ReportLocations
from mailchimp3.entities.reportsentto import ReportSentTo
from mailchimp3.entities.reportsubreports import ReportSubReports
from mailchimp3.entities.reportunsubscribes import ReportUnsubscribes
from mailchimp3.entities.reportopendetails import ReportOpenDetails
from mailchimp3.entities.reportgoogleanalytics import ReportGoogleAnalytics

# Search Campaigns
from mailchimp3.entities.searchcampaigns import SearchCampaigns
# Search Members
from mailchimp3.entities.searchmembers import SearchMembers
# Template Folders
from mailchimp3.entities.templatefolders import TemplateFolders
# Templates
from mailchimp3.entities.templates import Templates
from mailchimp3.entities.templatedefaultcontent import TemplateDefaultContent


class MailChimp(MailChimpClient):
    """
    MailChimp class to communicate with the v3 API
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the class with your api_key and user_id and attach all of
        the endpoints
        """
        super(MailChimp, self).__init__(*args, **kwargs)
        # API Root
        self.root = self.api_root = Root(self)
        # Authorized Apps
        self.authorized_apps = AuthorizedApps(self)
        # Automations - Paid feature
        self.automations = Automations(self)
        self.automations.actions = AutomationActions(self)
        self.automations.emails = AutomationEmails(self)
        self.automations.emails.actions = AutomationEmailActions(self)
        self.automations.emails.queues = AutomationEmailQueues(self)
        self.automations.removed_subscribers = AutomationRemovedSubscribers(self)
        # Batch Operations
        self.batches = self.batch_operations = BatchOperations(self)
        # Batch Webhooks
        self.batch_webhooks = BatchWebhooks(self)
        # Campaign Folders
        self.campaign_folders = CampaignFolders(self)
        # Campaigns
        self.campaigns = Campaigns(self)
        self.campaigns.actions = CampaignActions(self)
        self.campaigns.content = CampaignContent(self)
        self.campaigns.feedback = CampaignFeedback(self)
        self.campaigns.send_checklist = CampaignSendChecklist(self)
        # Conversations - Paid feature
        self.conversations = Conversations(self)
        self.conversations.messages = ConversationMessages(self)
        # Customer Journey
        self.journeys = self.customer_journeys = CustomerJourney(self)
        # E-commerce Stores
        self.stores = self.ecommerce = Stores(self)
        self.stores.carts = StoreCarts(self)
        self.stores.carts.lines = StoreCartLines(self)
        self.stores.customers = StoreCustomers(self)
        self.stores.orders = StoreOrders(self)
        self.stores.orders.lines = StoreOrderLines(self)
        self.stores.products = StoreProducts(self)
        self.stores.products.images = StoreProductImages(self)
        self.stores.products.variants = StoreProductVariants(self)
        self.stores.promo_rules = StorePromoRules(self)
        self.stores.promo_codes = StorePromoCodes(self)
        # File Manager Files
        self.files = FileManagerFiles(self)
        # File Manager Folders
        self.folders = FileManagerFolders(self)
        # Landinge Pages
        self.landing_pages = LandingPages(self)
        self.landing_pages.actions = LandingPageAction(self)
        self.landing_pages.content = LandingPageContent(self)
        # Lists
        self.lists = Lists(self)
        self.lists.abuse_reports = ListAbuseReports(self)
        self.lists.activity = ListActivity(self)
        self.lists.clients = ListClients(self)
        self.lists.growth_history = ListGrowthHistory(self)
        self.lists.interest_categories = ListInterestCategories(self)
        self.lists.interest_categories.interests = ListInterestCategoryInterest(self)
        self.lists.members = ListMembers(self)
        self.lists.members.activity = ListMemberActivity(self)
        self.lists.members.events = ListMemberEvents(self)
        self.lists.members.goals = ListMemberGoals(self)
        self.lists.members.notes = ListMemberNotes(self)
        self.lists.members.tags = ListMemberTags(self)
        self.lists.merge_fields = ListMergeFields(self)
        self.lists.segments = ListSegments(self)
        self.lists.segments.members = ListSegmentMembers(self)
        self.lists.signup_forms = ListSignupForms(self)
        self.lists.webhooks = ListWebhooks(self)
        # Ping
        self.ping = Ping(self)
        # Reports
        self.reports = Reports(self)
        self.reports.abuse_reports = ReportCampaignAbuseReports(self)
        self.reports.advice = ReportCampaignAdvice(self)
        self.reports.click_details = ReportClickDetailReports(self)
        self.reports.click_details.members = ReportClickDetailMembers(self)
        self.reports.domain_performance = ReportDomainPerformance(self)
        self.reports.eepurl = ReportEepURL(self)
        self.reports.email_activity = ReportEmailActivity(self)
        self.reports.locations = ReportLocations(self)
        self.reports.sent_to = ReportSentTo(self)
        self.reports.subreports = ReportSubReports(self)
        self.reports.unsubscribes = ReportUnsubscribes(self)
        self.reports.open_details = ReportOpenDetails(self)
        self.reports.google_analytics = ReportGoogleAnalytics(self)
        # Search Campaigns
        self.search_campaigns = SearchCampaigns(self)
        # Search Members
        self.search_members = SearchMembers(self)
        # Template Folders
        self.template_folders = TemplateFolders(self)
        # Templates
        self.templates = Templates(self)
        self.templates.default_content = TemplateDefaultContent(self)
