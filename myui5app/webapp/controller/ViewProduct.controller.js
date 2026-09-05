sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("myui5app.controller.ProductView", {
        onInit() {

            // const oModel = this.getView().getModel("products");

            // const oData = oModel.getData();

            console.log('oData');

        }
    });
});