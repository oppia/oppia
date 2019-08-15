// Any property defined on scope used in link function needs to be specified
// in this typing file and the scope needs to be typed as ICustomScope.
interface ICustomScope extends ng.IScope {
    // ck-editor-4.directive.ts
    uiConfig?: any;

    // alert-message.directive.ts
    getMessage?: (() => any);
    toastr?: any;
    AlertsService?: any;

    // custom-forms-directives/audio-file-uploader.directive.ts
    inputFieldClassName?: string;
    inputFieldFormId?: string;
    onFileCleared?: (() => void);
    droppedFile?: any;

    // custom-forms-directives/audio-file-uploader.directive.ts, image-uploader.directive.ts
    errorMessage?: string;
    onFileChanged?: ((file: any, fileName?: string) => void);

    // image-uploader.directive.ts
    fileInputClassName?: string;

    // FormBuilder.ts
    validators?: any;

    // object-editor.directive.ts, value-generator-editor.directive.ts
    objType?: string;
    initArgs?: any;
    getInitArgs?: (() => any);

    // object-editor.directive.ts
    alwaysEditable?: boolean;
    isEditable?: boolean;
    getAlwaysEditable?: (() => boolean);
    getIsEditable?: (() => boolean);

    // value-generator-editor.directive.ts, CopierDirective.ts, RandomSelectorDirective.ts
    generatorId?: string;

    // value-generator-editor.directive.ts
    getObjType?: (() => string);
    getGeneratorId?: (() => string);

    // audio-translation-bar.directive.ts
    showDropArea?: boolean;
    getVoiceoverRecorder?: (() => void);
    openAddAudioTranslationModal?: ((files: any) => void);
    userIsGuest?: boolean;
    dropAreaIsAccessible?: boolean;

    // conversation-skin.directive.ts
    directiveTemplate?: string;

    // CopierDirective.ts, RandomSelectorDirective.ts
    getTemplateUrl?: (() => string);

    // OppiaInteractiveMusicNotesInputDirective.ts
    CONTAINER_HEIGHT?: number;
    CONTAINER_WIDTH?: number;
    HORIZONTAL_GRID_SPACING?: number;
    SOUNDFONT_URL?: string;
    VERTICAL_GRID_SPACING?: number;
    _addNoteToNoteSequence?: ((note: any) => void);
    _currentNoteId?: any;
    _removeNotesFromNoteSequenceWithId?: ((noteId: string) => void);
    _sortNoteSequence?: (() => void);
    clearSequence?: (() => void);
    generateNoteId?: (() => string);
    getLastAnswer?: (() => string);
    init?: (() => void);
    initialSequence?: string;
    interactionIsActive?: boolean;
    noteSequence?: any;
    playCurrentSequence?: (() => void);
    playSequenceToGuess?: (() => void);
    reinitStaff?: (() => void);
    sequenceToGuess?: any;
    staffBottom?: number;
    staffTop?: number;
    submitAnswer?: (() => void);
    topPositionForCenterOfTopStaffLine?: number;

    // apply-validation.directive.ts
    $ctrl: any;
}
