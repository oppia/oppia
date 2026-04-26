import os
import re

files_list = """core/templates/pages/admin-page/activities-tab/admin-dev-mode-activities-tab.component.html
core/templates/pages/admin-page/activities-tab/admin-prod-mode-activities-tab.component.html
core/templates/pages/admin-page/admin-page.component.html
core/templates/pages/admin-page/misc-tab/admin-misc-tab.component.html
core/templates/pages/admin-page/navbar/admin-navbar.component.html
core/templates/pages/admin-page/platform-parameters-tab/admin-platform-parameters-tab.component.html
core/templates/pages/admin-page/roles-tab/admin-roles-tab.component.html
core/templates/pages/admin-page/roles-tab/roles-and-actions-visualizer.component.html
core/templates/pages/admin-page/roles-tab/topic-manager-role-editor-modal.component.html
core/templates/pages/admin-page/roles-tab/translation-coordinator-role-editor-modal.component.html
core/templates/pages/blog-admin-page/blog-admin-page.component.html
core/templates/pages/blog-admin-page/navbar/blog-admin-navbar.component.html
core/templates/pages/blog-dashboard-page/blog-card/blog-card.component.html
core/templates/pages/blog-dashboard-page/blog-dashboard-page-root.component.html
core/templates/pages/blog-dashboard-page/blog-dashboard-page.component.html
core/templates/pages/blog-dashboard-page/blog-dashboard-tile/blog-dashboard-tile.component.html
core/templates/pages/blog-dashboard-page/blog-post-editor/blog-post-editor.component.html
core/templates/pages/blog-dashboard-page/modal-templates/author-detail-editor-modal.component.html
core/templates/pages/blog-dashboard-page/modal-templates/blog-card-preview-modal.component.html
core/templates/pages/blog-dashboard-page/modal-templates/upload-blog-post-thumbnail-modal.component.html
core/templates/pages/blog-dashboard-page/modal-templates/upload-blog-post-thumbnail.component.html
core/templates/pages/blog-dashboard-page/navbar/navbar-breadcrumb/blog-dashboard-navbar-breadcrumb.component.html
core/templates/pages/blog-dashboard-page/navbar/navbar-pre-logo-action/blog-post-editor-pre-logo-action.component.html
core/templates/pages/classroom-admin-page/classroom-admin-page.component.html
core/templates/pages/classroom-admin-page/modals/create-new-classroom-modal.component.html
core/templates/pages/classroom-admin-page/modals/topic-dependency-graph-viz-modal.component.html
core/templates/pages/classroom-admin-page/modals/update-classrooms-order-modal.component.html
core/templates/pages/classroom-admin-page/navbar/classroom-admin-navbar.component.html
core/templates/pages/classrooms-page/classroom-tile/classroom-summary-tile.component.html
core/templates/pages/classrooms-page/classrooms-page.component.html
core/templates/pages/collection-editor-page/editor-tab/collection-editor-tab.component.html
core/templates/pages/collection-editor-page/editor-tab/collection-node-creator.component.html
core/templates/pages/collection-editor-page/editor-tab/collection-node-editor.component.html
core/templates/pages/collection-editor-page/navbar/collection-editor-navbar-breadcrumb.component.html
core/templates/pages/collection-editor-page/navbar/collection-editor-navbar.component.html
core/templates/pages/collection-editor-page/settings-tab/collection-details-editor.component.html
core/templates/pages/collection-editor-page/settings-tab/collection-settings-tab.component.html
core/templates/pages/collection-player-page/collection-local-nav/collection-local-nav.component.html
core/templates/pages/contact-page/contact-page.component.html
core/templates/pages/contributor-dashboard-admin-page/contributor-dashboard-admin-page.component.html
core/templates/pages/contributor-dashboard-admin-page/contributor-dashboard-tables/contributor-admin-stats-table.component.html
core/templates/pages/contributor-dashboard-admin-page/navbar/contributor-dashboard-admin-navbar.component.html
core/templates/pages/contributor-dashboard-admin-page/question-role-editor-modal/cd-admin-question-role-editor-modal.component.html
core/templates/pages/contributor-dashboard-admin-page/translation-role-editor-modal/cd-admin-translation-role-editor-modal.component.html
core/templates/pages/contributor-dashboard-admin-page/username-input-modal/username-input-modal.component.html
core/templates/pages/contributor-dashboard-page/badge/badge.component.html
core/templates/pages/contributor-dashboard-page/contributions-and-review/contributions-and-review.component.html
core/templates/pages/contributor-dashboard-page/contributor-badges/contributor-badges.component.html
core/templates/pages/contributor-dashboard-page/contributor-dashboard-page-root.component.html
core/templates/pages/contributor-dashboard-page/contributor-dashboard-page.component.html
core/templates/pages/contributor-dashboard-page/contributor-stats/contributor-stats.component.html
core/templates/pages/contributor-dashboard-page/login-required-message/login-required-message.component.html
core/templates/pages/contributor-dashboard-page/modal-templates/certificate-download-modal.component.html
core/templates/pages/contributor-dashboard-page/modal-templates/question-suggestion-editor-modal.component.html
core/templates/pages/contributor-dashboard-page/modal-templates/question-suggestion-review.component.html
core/templates/pages/contributor-dashboard-page/modal-templates/translation-modal.component.html
core/templates/pages/contributor-dashboard-page/modal-templates/translation-suggestion-review-modal.component.html
core/templates/pages/contributor-dashboard-page/opportunities-list-item/opportunities-list-item.component.html
core/templates/pages/contributor-dashboard-page/opportunities-list/opportunities-list.component.html
core/templates/pages/contributor-dashboard-page/translation-language-selector/review-translation-language-selector.component.html
core/templates/pages/contributor-dashboard-page/translation-language-selector/translation-language-selector.component.html
core/templates/pages/contributor-dashboard-page/translation-opportunities/translation-opportunities.component.html
core/templates/pages/contributor-dashboard-page/translation-topic-selector/translation-topic-selector.component.html
core/templates/pages/creator-dashboard-page/creator-dashboard-page.component.html
core/templates/pages/creator-dashboard-page/modal-templates/create-activity-modal.component.html
core/templates/pages/delete-account-page/delete-account-page.component.html
core/templates/pages/diagnostic-test-player-page/diagnostic-test-player.component.html
core/templates/pages/donate-page/donate-page.component.html
core/templates/pages/donate-page/donation-box/donation-box-modal.component.html
core/templates/pages/donate-page/thanks-for-donating-modal.component.html
core/templates/pages/email-dashboard-pages/email-dashboard-page-root.component.html
core/templates/pages/error-pages/error-404/error-404-page.component.html
core/templates/pages/error-pages/error-iframed-page/error-iframed-root.component.html
core/templates/pages/error-pages/error-page.component.html
core/templates/pages/exploration-editor-page/editor-navigation/editor-navbar-breadcrumb.component.html
core/templates/pages/exploration-editor-page/editor-navigation/editor-navigation.component.html
core/templates/pages/exploration-editor-page/editor-tab/exploration-editor-tab.component.html
core/templates/pages/exploration-editor-page/editor-tab/graph-directives/exploration-graph.component.html
core/templates/pages/exploration-editor-page/editor-tab/graph-directives/state-graph-visualization.component.html
core/templates/pages/exploration-editor-page/editor-tab/state-name-editor/state-name-editor.component.html
core/templates/pages/exploration-editor-page/editor-tab/state-param-changes-editor/state-param-changes-editor.component.html
core/templates/pages/exploration-editor-page/editor-tab/state-version-history/state-version-history.component.html
core/templates/pages/exploration-editor-page/editor-tab/templates/modal-templates/add-answer-group-modal.component.html
core/templates/pages/exploration-editor-page/editor-tab/templates/modal-templates/add-hint-modal.component.html
core/templates/pages/exploration-editor-page/editor-tab/templates/modal-templates/add-or-update-solution-modal.component.html
core/templates/pages/exploration-editor-page/editor-tab/templates/modal-templates/add-outcome-modal.component.html
core/templates/pages/exploration-editor-page/editor-tab/templates/modal-templates/customize-interaction-modal.component.html
core/templates/pages/exploration-editor-page/editor-tab/templates/modal-templates/exploration-graph-modal.component.html
core/templates/pages/exploration-editor-page/editor-tab/templates/modal-templates/teach-oppia-modal.component.html
core/templates/pages/exploration-editor-page/editor-tab/test-interaction-panel/test-interaction-panel.component.html
core/templates/pages/exploration-editor-page/editor-tab/training-panel/training-data-editor-panel-modal.component.html
core/templates/pages/exploration-editor-page/editor-tab/training-panel/training-panel.component.html
core/templates/pages/exploration-editor-page/editor-tab/unresolved-answers-overview/unresolved-answers-overview.component.html
core/templates/pages/exploration-editor-page/exploration-editor-page-root.component.html
core/templates/pages/exploration-editor-page/exploration-editor-page.component.html
core/templates/pages/exploration-editor-page/exploration-objective-editor/exploration-objective-editor.component.html
core/templates/pages/exploration-editor-page/exploration-save-and-publish-buttons/exploration-save-and-publish-buttons.component.html
core/templates/pages/exploration-editor-page/exploration-title-editor/exploration-title-editor.component.html
core/templates/pages/exploration-editor-page/feedback-tab/feedback-tab.component.html
core/templates/pages/exploration-editor-page/feedback-tab/templates/create-feedback-thread-modal.component.html
core/templates/pages/exploration-editor-page/feedback-tab/thread-table/thread-table.component.html
core/templates/pages/exploration-editor-page/history-tab/history-tab.component.html
core/templates/pages/exploration-editor-page/improvements-tab/improvements-tab.component.html
core/templates/pages/exploration-editor-page/modal-templates/editor-reloading-modal.component.html
core/templates/pages/exploration-editor-page/modal-templates/exploration-metadata-diff-modal.component.html
core/templates/pages/exploration-editor-page/modal-templates/exploration-metadata-modal.component.html
core/templates/pages/exploration-editor-page/modal-templates/exploration-modify-translations-modal.component.html
core/templates/pages/exploration-editor-page/modal-templates/exploration-save-modal.component.html
core/templates/pages/exploration-editor-page/modal-templates/help-modal.component.html
core/templates/pages/exploration-editor-page/modal-templates/metadata-version-history-modal.component.html
core/templates/pages/exploration-editor-page/modal-templates/post-publish-modal.component.html
core/templates/pages/exploration-editor-page/modal-templates/state-diff-modal.component.html
core/templates/pages/exploration-editor-page/modal-templates/state-version-history-modal.component.html
core/templates/pages/exploration-editor-page/param-changes-editor/param-changes-editor.component.html
core/templates/pages/exploration-editor-page/preview-tab/preview-tab.component.html
core/templates/pages/exploration-editor-page/preview-tab/templates/preview-set-parameters-modal.component.html
core/templates/pages/exploration-editor-page/settings-tab/settings-tab.component.html
core/templates/pages/exploration-editor-page/settings-tab/templates/reassign-role-confirmation-modal.component.html
core/templates/pages/exploration-editor-page/settings-tab/templates/remove-role-confirmation-modal.component.html
core/templates/pages/exploration-editor-page/statistics-tab/templates/state-stats-modal.component.html
core/templates/pages/exploration-editor-page/translation-tab/modal-templates/add-audio-translation-modal.component.html
core/templates/pages/exploration-editor-page/translation-tab/modal-templates/welcome-translation-modal.component.html
core/templates/pages/exploration-editor-page/translation-tab/state-translation-editor/state-translation-editor.component.html
core/templates/pages/exploration-editor-page/translation-tab/state-translation-status-graph/state-translation-status-graph.component.html
core/templates/pages/exploration-editor-page/translation-tab/state-translation/state-translation.component.html
core/templates/pages/exploration-editor-page/translation-tab/translator-overview/translator-overview.component.html
core/templates/pages/exploration-editor-page/translation-tab/voiceover-card/voiceover-card.component.html
core/templates/pages/exploration-player-page/current-lesson-player/exploration-player-page-root.component.html
core/templates/pages/exploration-player-page/current-lesson-player/exploration-player-page.component.html
core/templates/pages/exploration-player-page/current-lesson-player/layout-directives/audio-bar.component.html
core/templates/pages/exploration-player-page/current-lesson-player/layout-directives/correctness-footer.component.html
core/templates/pages/exploration-player-page/current-lesson-player/layout-directives/exploration-footer.component.html
core/templates/pages/exploration-player-page/current-lesson-player/layout-directives/feedback-popup.component.html
core/templates/pages/exploration-player-page/current-lesson-player/layout-directives/learner-local-nav.component.html
core/templates/pages/exploration-player-page/current-lesson-player/learner-experience/continue-button.component.html
core/templates/pages/exploration-player-page/current-lesson-player/learner-experience/end-chapter-check-mark.component.html
core/templates/pages/exploration-player-page/current-lesson-player/learner-experience/end-chapter-confetti.component.html
core/templates/pages/exploration-player-page/current-lesson-player/learner-experience/learner-answer-info-card.component.html
core/templates/pages/exploration-player-page/current-lesson-player/learner-experience/ratings-and-recommendations.component.html
core/templates/pages/exploration-player-page/current-lesson-player/modals/display-hint-modal.component.html
core/templates/pages/exploration-player-page/current-lesson-player/modals/display-solution-interstitial-modal.component.html
core/templates/pages/exploration-player-page/current-lesson-player/modals/display-solution-modal.component.html
core/templates/pages/exploration-player-page/current-lesson-player/modals/flag-exploration-modal.component.html
core/templates/pages/exploration-player-page/current-lesson-player/modals/refresher-exploration-confirmation-modal.component.html
core/templates/pages/exploration-player-page/current-lesson-player/modals/switch-content-language-refresh-required-modal.component.html
core/templates/pages/exploration-player-page/new-lesson-player/conversation-skin-components/conversation-display-components/take-break-modal.component.html
core/templates/pages/feedback-updates-page/feedback-updates-page.component.html
core/templates/pages/landing-pages/topic-landing-page/topic-landing-page.component.html
core/templates/pages/learner-dashboard-page/add-goals-modal/add-goals-modal.component.html
core/templates/pages/learner-dashboard-page/card-display/card-display.component.html
core/templates/pages/learner-dashboard-page/classroom-button/classroom-button.component.html
core/templates/pages/learner-dashboard-page/content-toggle-button/content-toggle-button.component.html
core/templates/pages/learner-dashboard-page/goal-list/goal-list.component.html
core/templates/pages/learner-dashboard-page/learner-dashboard-icons.component.html
core/templates/pages/learner-dashboard-page/learner-dashboard-page.component.html
core/templates/pages/learner-dashboard-page/modal-templates/decline-invitation-modal.component.html
core/templates/pages/learner-dashboard-page/modal-templates/view-learner-group-details-modal.component.html
core/templates/pages/learner-dashboard-page/modal-templates/view-learner-group-invitation-modal.component.html
core/templates/pages/learner-dashboard-page/old-progress-tab.component.html
core/templates/pages/learner-dashboard-page/skill-card/skill-card.component.html
core/templates/pages/learner-dashboard-page/suggestion-modal/learner-dashboard-suggestion-modal.component.html
core/templates/pages/learner-group-pages/templates/delete-learner-group-modal.component.html
core/templates/pages/learner-group-pages/templates/exit-learner-group-modal.component.html
core/templates/pages/learner-group-pages/templates/invite-learners-modal.component.html
core/templates/pages/learner-group-pages/templates/invite-successful-modal.component.html
core/templates/pages/learner-group-pages/templates/learner-group-preferences-modal.component.html
core/templates/pages/learner-group-pages/templates/remove-item-modal.component.html
core/templates/pages/learner-group-pages/templates/syllabus-addition-success-modal.component.html
core/templates/pages/library-page/classroom-card/classroom-card.component.html
core/templates/pages/library-page/search-bar/search-bar.component.html
core/templates/pages/library-page/search-results/activity-tiles-infinity-grid.component.html
core/templates/pages/library-page/search-results/search-results.component.html
core/templates/pages/license-page/license-page.component.html
core/templates/pages/login-page/login-page.component.html
core/templates/pages/maintenance-page/maintenance-page.component.html
core/templates/pages/moderator-page/moderator-page.component.html
core/templates/pages/partnerships-page/partnerships-page.component.html
core/templates/pages/practice-session-page/practice-session-page.component.html
core/templates/pages/preferences-page/form-fields/preferred-language-selector.component.html
core/templates/pages/preferences-page/form-fields/preferred-languages.component.html
core/templates/pages/preferences-page/form-fields/subject-interests.component.html
core/templates/pages/preferences-page/modal-templates/edit-profile-picture-modal.component.html
core/templates/pages/privacy-page/privacy-page.component.html
core/templates/pages/release-coordinator-page/beam-jobs-tab/beam-jobs-tab.component.html
core/templates/pages/release-coordinator-page/components/cancel-beam-job-dialog.component.html
core/templates/pages/release-coordinator-page/components/start-new-beam-job-dialog.component.html
core/templates/pages/release-coordinator-page/components/view-beam-job-output-dialog.component.html
core/templates/pages/release-coordinator-page/features-tab/features-tab.component.html
core/templates/pages/release-coordinator-page/navbar/release-coordinator-navbar.component.html
core/templates/pages/release-coordinator-page/release-coordinator-page.component.html
core/templates/pages/review-test-page/review-test-page.component.html
core/templates/pages/signup-page/modals/license-explanation-modal.component.html
core/templates/pages/signup-page/signup-page.component.html
core/templates/pages/skill-editor-page/editor-tab/skill-concept-card-editor/skill-concept-card-editor.component.html
core/templates/pages/skill-editor-page/editor-tab/skill-description-editor/skill-description-editor.component.html
core/templates/pages/skill-editor-page/editor-tab/skill-editor-main-tab.component.html
core/templates/pages/skill-editor-page/editor-tab/skill-misconceptions-editor/misconception-editor.component.html
core/templates/pages/skill-editor-page/editor-tab/skill-misconceptions-editor/skill-misconceptions-editor.component.html
core/templates/pages/skill-editor-page/editor-tab/skill-prerequisite-skills-editor/skill-prerequisite-skills-editor.component.html
core/templates/pages/skill-editor-page/editor-tab/skill-preview-modal.component.html
core/templates/pages/skill-editor-page/editor-tab/skill-rubrics-editor/skill-rubrics-editor.component.html
core/templates/pages/skill-editor-page/modal-templates/add-misconception-modal.component.html
core/templates/pages/skill-editor-page/navbar/skill-editor-navbar.component.html
core/templates/pages/skill-editor-page/questions-tab/skill-questions-tab.component.html
core/templates/pages/skill-editor-page/skill-editor-page.component.html
core/templates/pages/skill-editor-page/skill-preview-tab/skill-preview-tab.component.html
core/templates/pages/story-editor-page/chapter-editor/chapter-editor-tab.component.html
core/templates/pages/story-editor-page/editor-tab/story-editor.component.html
core/templates/pages/story-editor-page/editor-tab/story-node-editor.component.html
core/templates/pages/story-editor-page/modal-templates/new-chapter-title-modal.component.html
core/templates/pages/story-editor-page/modal-templates/story-editor-unpublish-modal.component.html
core/templates/pages/story-editor-page/navbar/story-editor-navbar.component.html
core/templates/pages/story-editor-page/story-editor-page.component.html
core/templates/pages/story-editor-page/story-preview-tab/story-preview-tab.component.html
core/templates/pages/story-viewer-page/navbar-breadcrumb/story-viewer-navbar-breadcrumb.component.html
core/templates/pages/story-viewer-page/navbar-pre-logo-action/story-viewer-navbar-pre-logo-action.component.html
core/templates/pages/subtopic-viewer-page/subtopic-viewer-page.component.html
core/templates/pages/subtopic-viewer-page/navbar-breadcrumb/subtopic-viewer-navbar-breadcrumb.component.html
core/templates/pages/terms-page/terms-page.component.html
core/templates/pages/thanks-page/thanks-page.component.html
core/templates/pages/topic-editor-page/editor-tab/topic-editor-stories-list.component.html
core/templates/pages/topic-editor-page/editor-tab/topic-editor-tab.component.html
core/templates/pages/topic-editor-page/modal-templates/change-subtopic-assignment-modal.component.html
core/templates/pages/topic-editor-page/modal-templates/create-new-story-modal.component.html
core/templates/pages/topic-editor-page/modal-templates/create-new-subtopic-modal.component.html
core/templates/pages/topic-editor-page/modal-templates/preview-thumbnail.component.html
core/templates/pages/topic-editor-page/modal-templates/questions-list-select-skill-and-difficulty-modal.component.html
core/templates/pages/topic-editor-page/modal-templates/questions-opportunities-select-difficulty-modal.component.html
core/templates/pages/topic-editor-page/modal-templates/rearrange-skills-in-subtopics-modal.component.html
core/templates/pages/topic-editor-page/navbar/topic-editor-navbar-breadcrumb.component.html
core/templates/pages/topic-editor-page/navbar/topic-editor-navbar.component.html
core/templates/pages/topic-editor-page/preview-tab/topic-preview-tab.component.html
core/templates/pages/topic-editor-page/questions-tab/topic-questions-tab.component.html
core/templates/pages/topic-editor-page/subtopic-editor/add-study-guide-section.component.html
core/templates/pages/topic-editor-page/subtopic-editor/study-guide-section-editor.component.html
core/templates/pages/topic-editor-page/subtopic-editor/subtopic-editor-tab.component.html
core/templates/pages/topic-editor-page/subtopic-editor/subtopic-preview-tab.component.html
core/templates/pages/topic-editor-page/topic-editor-page-root.component.html
core/templates/pages/topic-editor-page/topic-editor-page.component.html
core/templates/pages/topic-viewer-page/modals/practice-session-confirmation-modal.component.html
core/templates/pages/topics-and-skills-dashboard-page/modals/assign-skill-to-topic-modal.component.html
core/templates/pages/topics-and-skills-dashboard-page/modals/create-new-skill-modal.component.html
core/templates/pages/topics-and-skills-dashboard-page/modals/create-new-topic-modal.component.html
core/templates/pages/topics-and-skills-dashboard-page/modals/delete-skill-modal.component.html
core/templates/pages/topics-and-skills-dashboard-page/modals/delete-topic-modal.component.html
core/templates/pages/topics-and-skills-dashboard-page/modals/unassign-skill-from-topics-modal.component.html
core/templates/pages/topics-and-skills-dashboard-page/skills-list/skills-list.component.html
core/templates/pages/topics-and-skills-dashboard-page/topic-selector/select-topics.component.html
core/templates/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.component.html
core/templates/pages/topics-and-skills-dashboard-page/topics-list/topics-list.component.html
core/templates/pages/voiceover-admin-page/modals/autogenerated-voiceover-run-info-modal.component.html
core/templates/pages/voiceover-admin-page/navbar/voiceover-admin-navbar.component.html
core/templates/pages/voiceover-admin-page/voiceover-admin-page.component.html
core/templates/services/rte-helper-modal.component.html"""

ROOT_DIR = "/Users/moutaz/Documents/projects/SW-projects/oppia"

import sys

def main():
    missing_html = []
    no_style = []
    missing_ts = []
    
    for html_file_rel in files_list.splitlines():
        html_file_rel = html_file_rel.strip()
        if not html_file_rel:
            continue
            
        html_file = os.path.join(ROOT_DIR, html_file_rel)
        
        if not os.path.exists(html_file):
            print(f"HTML file not found: {html_file}")
            missing_html.append(html_file)
            continue
            
        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
            
        style_pattern = re.compile(r'<style[^>]*>(.*?)</style>', re.DOTALL)
        matches = style_pattern.findall(html_content)
        
        if not matches:
            print(f"No <style> block found in {html_file_rel}")
            no_style.append(html_file_rel)
            continue
            
        new_html_content = re.sub(r'[\r\n]*\s*<style[^>]*>.*?</style>[\r\n]*', '\n', html_content, flags=re.DOTALL)
        # trim trailing whitespace or duplicate newlines that regex might leave at end of file
        # actually Oppia's prettier might require trailing newline, so let's just make sure it ends with \n
        if not new_html_content.endswith('\n'):
            new_html_content += '\n'
            
        css_content = "\n".join([m.strip() for m in matches if m.strip()])
        
        # Save HTML
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(new_html_content)
            
        # Write CSS
        css_file_rel = html_file_rel.replace('.component.html', '.component.css')
        css_file = os.path.join(ROOT_DIR, css_file_rel)
        
        with open(css_file, 'w', encoding='utf-8') as f:
            f.write(css_content + '\n')
            
        # Update TS
        ts_file_rel = html_file_rel.replace('.component.html', '.component.ts')
        ts_file = os.path.join(ROOT_DIR, ts_file_rel)
        
        # some might have a different name, e.g. .controller.ts, wait for this error to check
        if not os.path.exists(ts_file):
            # check if it's named differently
            base_name = os.path.basename(ts_file_rel)
            dir_name = os.path.dirname(ts_file)
            print(f"TS file not found: {ts_file_rel}. Listing directory {dir_name}:")
            if os.path.exists(dir_name):
                print(os.listdir(dir_name))
            missing_ts.append(ts_file_rel)
            # wait, if TS file doesn't exist, we can't update it right here, continue
            continue
            
        with open(ts_file, 'r', encoding='utf-8') as f:
            ts_content = f.read()
            
        css_filename = os.path.basename(css_file_rel)
        css_relative_path = f"'./{css_filename}'"
        
        if re.search(r'styleUrls:\s*\[([^\]]*)\]', ts_content):
            def add_style(match):
                inner = match.group(1).strip()
                if css_relative_path in inner or f'"./{css_filename}"' in inner:
                    return match.group(0)
                if inner:
                    if inner.endswith(','):
                        return f"styleUrls: [{inner} {css_relative_path}]"
                    else:
                        return f"styleUrls: [{inner}, {css_relative_path}]"
                else:
                    return f"styleUrls: [{css_relative_path}]"
            
            new_ts_content = re.sub(r'styleUrls:\s*\[([^\]]*)\]', add_style, ts_content)
        else:
            # find templateUrl line. Could be single quote or double quote. Might have trailing comma.
            pattern = re.compile(r"(templateUrl:\s*['\"][^'\"]+['\"])(,?)")
            
            def replace_fn(match):
                return f"{match.group(1)},\n  styleUrls: [{css_relative_path}]"
                
            new_ts_content, count = pattern.subn(replace_fn, ts_content, count=1)
            
            if count == 0:
                print(f"FAILED to find templateUrl in {ts_file_rel}")
                continue
                
        with open(ts_file, 'w', encoding='utf-8') as f:
            f.write(new_ts_content)

    print("\n--- Summary ---")
    print(f"Missing HTML: {len(missing_html)}")
    print(f"No style tag: {len(no_style)}")
    print(f"Missing TS: {len(missing_ts)}")

if __name__ == '__main__':
    main()
