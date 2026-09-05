sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("myui5app.controller.MainView", {

        onProductsPress: function () {

            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteViewProduct");

        }

    });
});