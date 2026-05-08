import re

with open('contributions-and-review.component.ts', 'r') as f:
    content = f.read()

# Line 133
content = content.replace('@Input() activeTopicName: string;', '@Input() activeTopicName!: string;')

# Line 165, 166
content = content.replace('queuedSuggestionSummary = null;', 'queuedSuggestionSummary: any = null;')
content = content.replace('queuedSuggestion = null;', 'queuedSuggestion: any = null;')

# Line 425, 620, 628, 776, 897, 595, 481, 532
content = content.replace('this.contributions[initialSuggestionId]', '(this.contributions as Record<string, any>)[initialSuggestionId]')
content = content.replace('this.contributions[suggestionId]', '(this.contributions as Record<string, any>)[suggestionId]')

# Line 449
content = content.replace('(queuedSuggestionSummary: string) => {', '(queuedSuggestionSummary: any) => {')

# Line 461
content = content.replace('(queuedSuggestion: string) => {', '(queuedSuggestion: any) => {')

# Line 468, 476
content = content.replace('resolvedSuggestionIds.forEach(suggestionId => {', 'resolvedSuggestionIds.forEach((suggestionId: string) => {')
content = content.replace('resolvedSuggestionIds.filter(\n          suggestionId =>', 'resolvedSuggestionIds.filter(\n          (suggestionId: string) =>')

# Line 479
content = content.replace('this.queuedSuggestion.suggestion_id !== suggestionId', 'this.queuedSuggestion?.suggestion_id !== suggestionId')

# Line 494, 528, 566
content = content.replace('clearTimeout(this.commitTimeout);', 'clearTimeout(this.commitTimeout as unknown as number);')

# Line 510-516
content = content.replace('currentSuggestionSummary.', 'currentSuggestionSummary?.')

# Line 596, 608, 629
content = content.replace('suggestionIdToContribution[suggestionId]', '(suggestionIdToContribution as Record<string, any>)[suggestionId]')
content = content.replace('suggestionIdToContribution[initialSuggestionId]', '(suggestionIdToContribution as Record<string, any>)[initialSuggestionId]')

# Line 613
content = content.replace('          question,\n          () => {', '          question as any,\n          () => {')

# Line 650
content = content.replace('      return this.getQuestionContributionsSummary(suggestionIdToSuggestions);\n    }', '      return this.getQuestionContributionsSummary(suggestionIdToSuggestions);\n    }\n    return [];')

# Line 698
content = content.replace('let opportunitiesDicts = [];', 'let opportunitiesDicts: any[] = [];')

# Line 774
content = content.replace('.then(\n        response => {', '.then(\n        (response: any) => {')

# Line 911
content = content.replace('this.activeExplorationId,\n          this.activeExplorationId', '(this.activeExplorationId as string),\n          (this.activeExplorationId as string)')
content = content.replace('this.activeExplorationId\n        );', '(this.activeExplorationId as string)\n        );')

# Line 967, 973, 982, 988
content = content.replace('loadContributions(shouldResetOffset): Promise<void> {', 'loadContributions(shouldResetOffset: boolean): Promise<void> {')
content = content.replace('loadOpportunities(shouldResetOffset): Promise<void> {', 'loadOpportunities(shouldResetOffset: boolean): Promise<void> {')

# Line 992
content = content.replace('this.activeLanguageCode,\n          this.activeTopicName,', '(this.activeLanguageCode || undefined),\n          this.activeTopicName,')

with open('contributions-and-review.component.ts', 'w') as f:
    f.write(content)

