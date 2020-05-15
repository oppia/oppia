// This file should contain extra properties which are missing in
// JQueryUI type defintion. This can be removed once this issue is fixed:
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/34474
declare namespace JQueryUI {
    interface DraggableOptions {
        tolerance?: string;
    }
    interface DroppableOptions {
        containment?: string;
    }
    interface UI {
        ddmanager?: {
            current?: {
                cancelHelperRemoval?: boolean;
            }
        };
    }
}
