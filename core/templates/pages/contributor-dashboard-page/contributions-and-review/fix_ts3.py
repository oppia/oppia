import re

with open('contributions-and-review.component.ts', 'r') as f:
    content = f.read()

# Line 532
content = content.replace('delete this.contributions[currentSuggestionSummary?.suggestion_id];', 'delete (this.contributions as Record<string, any>)[currentSuggestionSummary?.suggestion_id as string];')

# Line 608
content = content.replace('suggestionIdToContribution[initialSuggestionId]', '(suggestionIdToContribution as Record<string, any>)[initialSuggestionId]')

# Line 613
content = content.replace('question,', 'question as any,')

# Line 699, 711, 713
content = content.replace('let opportunitiesDicts = [];', 'let opportunitiesDicts: any[] = [];')

# Line 775
content = content.replace('        response => {', '        (response: any) => {')

# Line 777
content = content.replace('const details = this.contributions[suggestionId]', 'const details = (this.contributions as Record<string, any>)[suggestionId]')

# Line 912, 914, 917
content = content.replace('this.activeExplorationId,\n          this.activeExplorationId', '(this.activeExplorationId as string),\n          (this.activeExplorationId as string)')
content = content.replace('this.activeExplorationId\n        );', '(this.activeExplorationId as string)\n        );')

# Line 968, 974, 983, 989
content = content.replace('loadContributions(shouldResetOffset): Promise<void> {', 'loadContributions(shouldResetOffset: boolean): Promise<void> {')
content = content.replace('loadOpportunities(shouldResetOffset): Promise<void> {', 'loadOpportunities(shouldResetOffset: boolean): Promise<void> {')

# Line 993
content = content.replace('          this.activeLanguageCode,\n          this.activeTopicName,\n          shouldResetOffset', '          (this.activeLanguageCode as string),\n          this.activeTopicName,\n          shouldResetOffset')

with open('contributions-and-review.component.ts', 'w') as f:
    f.write(content)

