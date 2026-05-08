import re

with open('contributions-and-review.component.ts', 'r') as f:
    content = f.read()

content = content.replace('delete this.contributions[currentSuggestionSummary?.suggestion_id];', 'delete (this.contributions as Record<string, any>)[currentSuggestionSummary?.suggestion_id];')
content = content.replace('suggestionIdToContribution[initialSuggestionId]', '(suggestionIdToContribution as Record<string, any>)[initialSuggestionId]')
content = content.replace('          question,\n          () => {', '          question as any,\n          () => {')
content = content.replace('let opportunitiesDicts = [];', 'let opportunitiesDicts: any[] = [];')
content = content.replace('const details = this.contributions[suggestionId]', 'const details = (this.contributions as Record<string, any>)[suggestionId]')
content = content.replace('this.activeExplorationId,\n          this.activeExplorationId', '(this.activeExplorationId as string),\n          (this.activeExplorationId as string)')
content = content.replace('this.activeExplorationId\n        );', '(this.activeExplorationId as string)\n        );')
content = content.replace('loadContributions(shouldResetOffset): Promise<void> {', 'loadContributions(shouldResetOffset: boolean): Promise<void> {')
content = content.replace('loadOpportunities(shouldResetOffset): Promise<void> {', 'loadOpportunities(shouldResetOffset: boolean): Promise<void> {')
content = content.replace('this.activeLanguageCode,\n          this.activeTopicName,', '(this.activeLanguageCode || undefined),\n          this.activeTopicName,')

with open('contributions-and-review.component.ts', 'w') as f:
    f.write(content)

