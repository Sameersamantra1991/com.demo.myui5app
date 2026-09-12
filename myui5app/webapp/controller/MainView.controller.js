sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("myui5app.controller.MainView", {

        onProductsPress: function () {

            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteViewProduct");

        },

        onSampleProductPress: function () {

            this.getOwnerComponent()
                .getRouter()
                .navTo("sampleProduct");

        },

        onODataV2Press: function () {

            this.getOwnerComponent()
                .getRouter()
                .navTo("oDataV2");

        }

    });
});
