// This file should contain extra properties which are missing in
// JQueryUI type defintion.
declare namespace JQueryUI {
    interface DraggableOptions {
        tolerance?: string;
    }
    interface DroppableOptions {
        containment?: string;
    }
    interface UI {
        ddmanager?: any;
    }
}
