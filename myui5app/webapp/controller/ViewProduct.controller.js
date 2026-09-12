sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, Fragment, JSONModel) {
    "use strict";

    return Controller.extend("myui5app.controller.ProductView", {
        onInit() {
            // const oModel = this.getView().getModel("products");
            // const oData = oModel.getData();
            console.log('oData');

            // Model for the selected product
            this.getView().setModel(
                new JSONModel({}),
                "selectedProduct"
            );
        },

        _openProductDialog: function () {

            var oView = this.getView();

            if (!this.byId("productDialog")) {

                Fragment.load({
                    id: oView.getId(),
                    name: "myui5app.view.ProductDialog",
                    controller: this
                }).then(function (oDialog) {

                    oView.addDependent(oDialog);

                    oDialog.open();

                });

            } else {

                this.byId("productDialog").open();

            }

        },


        onProductPress: function (oEvent) {

            // Get the clicked row
            var oItem = oEvent.getSource();

            // Get the selected product object
            var oProduct = oItem
                .getBindingContext("products")
                .getObject();

            // Set selected product in the popup model
            this.getView()
                .getModel("selectedProduct")
                .setData(oProduct);

            // Open popup
            this._openProductDialog();

        },



        onCloseProductDialog: function () {

            this.byId("productDialog").close();

        }


    });
});