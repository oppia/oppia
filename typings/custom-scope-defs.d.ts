interface ICustomScope extends ng.IScope {
	// CkEditorRteDirective.ts
    uiConfig?: any;

    // AlertMessageDirective.ts
    getMessage?: any;
    toastr?: any;
    AlertsService?: any;

    // AudioFileUploaderDirective.ts
    inputFieldClassName?: any;
    onFileCleared?: any;
    droppedFile?: any;

    // AudioFileUploaderDirective.ts, ImageUploaderDirective.ts
    errorMessage?: any;
    onFileChanged?: any;

    // ImageUploaderDirective.ts
    fileInputClassName?: any;

    // FormBuilder.ts
    validators?: any;

    // ObjectEditorDirective.ts, ValueGeneratorEditorDirective.ts
    objType?: any;
    initArgs?: any;
    getInitArgs?: any;

    // ObjectEditorDirective.ts
    alwaysEditable?: any;
    isEditable?: any;
    getAlwaysEditable?: any;
    getIsEditable?: any;

    // ValueGeneratorEditorDirective.ts, Copier.ts, RandomSelector.ts
    generatorId?: any;

    // ValueGeneratorEditorDirective.ts
    getObjType?: any;
    getGeneratorId?: any;

    // AudioTranslationBarDirective.ts
    showDropArea?: any;
    getRecorderController?: any;
    openAddAudioTranslationModal?: any;

    // ConversationSkinDirective.ts
    directiveTemplate?: any;

    // Copier.ts, RandomSelector.ts
    getTemplateUrl?: any;

    // OppiaInteractiveMusicNotesInputDirective.ts
    SOUNDFONT_URL?: any;
    sequenceToGuess?: any;
    interactionIsActive?: any;
    getLastAnswer?: any;
    initialSequence?: any;
    reinitStaff?: any;
    noteSequence?: any;
    _currentNoteId?: any;
    generateNoteId?: any;
    init?: any;
    CONTAINER_WIDTH?: any;
    CONTAINER_HEIGHT?: any;
    HORIZONTAL_GRID_SPACING?: any;
    VERTICAL_GRID_SPACING?: any;
    submitAnswer?: any;
    staffBottom?: any;
    staffTop?: any;
    playSequenceToGuess?: any;
    playCurrentSequence?: any;
    clearSequence?: any;
    topPositionForCenterOfTopStaffLine?: any;
}