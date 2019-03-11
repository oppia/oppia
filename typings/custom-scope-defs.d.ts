interface ICustomScope extends ng.IScope {
    // CkEditorRteDirective.ts
    uiConfig?: any;

    // AlertMessageDirective.ts
    getMessage?: (() => any);
    toastr?: any;
    AlertsService?: any;

    // AudioFileUploaderDirective.ts
    inputFieldClassName?: string;
    inputFieldFormId?: string;
    onFileCleared?: (() => void);
    droppedFile?: any;

    // AudioFileUploaderDirective.ts, ImageUploaderDirective.ts
    errorMessage?: string;
    onFileChanged?: ((file: any, fileName?: string) => void);

    // ImageUploaderDirective.ts
    fileInputClassName?: string;

    // FormBuilder.ts
    validators?: any;

    // ObjectEditorDirective.ts, ValueGeneratorEditorDirective.ts
    objType?: string;
    initArgs?: any;
    getInitArgs?: (() => any);

    // ObjectEditorDirective.ts
    alwaysEditable?: boolean;
    isEditable?: boolean;
    getAlwaysEditable?: (() => boolean);
    getIsEditable?: (() => boolean);

    // ValueGeneratorEditorDirective.ts, Copier.ts, RandomSelector.ts
    generatorId?: string;

    // ValueGeneratorEditorDirective.ts
    getObjType?: (() => string);
    getGeneratorId?: (() => string);

    // AudioTranslationBarDirective.ts
    showDropArea?: boolean;
    getRecorderController?: (() => void);
    openAddAudioTranslationModal?: ((files: any) => void);

    // ConversationSkinDirective.ts
    directiveTemplate?: string;

    // Copier.ts, RandomSelector.ts
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
}
