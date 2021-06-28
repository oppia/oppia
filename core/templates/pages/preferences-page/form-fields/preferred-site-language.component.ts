
import { Component, EventEmitter, Input, Output } from '@angular/core';

interface Language {
  id: string,
  text: string,
  dir: string
}

@Component({
  selector: 'oppia-preferred-language',
  templateUrl: './preferred-site-language.component.html'
})
export class PreferredSiteLanguage {
  @Input() preferredLanguageCode: string;
  @Output() preferredLanguageCodeChange: EventEmitter<string> = (
    new EventEmitter());
  @Input() choices: Language[];
  filteredChoices: Language[];

  ngOnInit(): void {
    this.filteredChoices = this.choices;
  }

  filterChoices(searchTerm: string): void {
    this.filteredChoices = this.choices.filter(
      lang => lang.text.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1);
  }

  updateLanguage(code: string): void {
    this.preferredLanguageCode = code;
    this.preferredLanguageCodeChange.emit(this.preferredLanguageCode);
  }
}
