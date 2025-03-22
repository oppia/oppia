Changes in
1 . classroom-navigation-link.components.html line number 13
2 . classroom-navigation-link.components.ts line number aftet line 84
3 . top-navigation-bar.component.css changes made is class - .oppia-top-navigation-bar .classroom-enabled - 2 classes added
.oppia-top-navigation-bar .two-classrooms {
min-width: 855px;
}
.oppia-top-navigation-bar .one-classrooms {
min-width: 610px;
} - added media query after 542 - 560
4 . top-navigation-bar.component.html changes made added ngClass 104 and 115
5 . top-navigation-bar.component.ts changes made at 92 in ngAfterViewChecked() , function added getClassroomSummariesLength() at 412,changes in getDropdownOffset()
