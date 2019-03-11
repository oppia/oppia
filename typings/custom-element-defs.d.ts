interface HTMLElement {
    // This is needed in order for the scope to be retrievable during Karma
    // unit testing. See http://stackoverflow.com/a/29833832 for more
    // details.
    getControllerScope?: (() => ng.IScope)
}
