sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("myui5app.controller.NotFound", {
        onNavBackToHome: function () {
            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteMainView", {}, true);
        }
    });
});
