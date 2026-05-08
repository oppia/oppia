import sys

with open('contributions-and-review.component.ts', 'r') as f:
    lines = f.readlines()

def replace_in_line(line_num, old, new):
    idx = line_num - 1
    lines[idx] = lines[idx].replace(old, new)

# 165, 166
replace_in_line(165, 'any', 'unknown')
replace_in_line(166, 'any', 'unknown')

# 425
replace_in_line(425, 'any', 'SuggestionDetails')

# 450
replace_in_line(450, 'any', 'unknown')

# 462
replace_in_line(462, 'any', 'unknown')

# 483
replace_in_line(483, 'any', 'SuggestionDetails')

# 534
replace_in_line(534, 'any', 'SuggestionDetails')

# 599
replace_in_line(599, 'any', 'SuggestionDetails')

# 602
replace_in_line(602, 'any', 'ActiveContributionDict')

# 613
replace_in_line(613, 'any', 'unknown')

# 620
replace_in_line(620, 'any', 'unknown')

# 627
replace_in_line(627, 'any', 'SuggestionDetails')

# 636
replace_in_line(636, 'any', 'ActiveContributionDict')

# 639
replace_in_line(639, 'any', 'SuggestionDetails')

# 710
replace_in_line(710, 'any', 'unknown')

# 786
replace_in_line(786, 'any', 'unknown')

# 788
replace_in_line(788, 'any', 'SuggestionDetails')

# 910
replace_in_line(910, 'any', 'unknown')

with open('contributions-and-review.component.ts', 'w') as f:
    f.writelines(lines)

