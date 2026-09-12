sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
     "sap/ui/model/Sorter"
], function (
    Controller,
    ODataModel,
    Filter,
    FilterOperator,
    Sorter
) {
    "use strict";

    return Controller.extend("myui5app.controller.oDataV2", {

        onInit: function () {

            var oModel = new ODataModel(
                "/V2/Northwind/Northwind.svc/"
            );

            this.getView().setModel(oModel, "v2");

            console.log("OData Model:", oModel);
        },

        onFilterPress: function () {

            console.log("Filter pressed!");

            // Get the table
            var oTable = this.byId("productsTable");

            // Get table binding
            var oBinding = oTable.getBinding("items");

             // $select
            // oBinding.changeParameters({
            //     "$select": "ProductID,ProductName,UnitPrice"
            // });

            // Create filter: UnitPrice > 10
            var oFilter = new Filter(
                "UnitPrice",
                FilterOperator.GT,
                20
            );

            // Apply filter
            oBinding.filter([oFilter]);

            var oSorter = new Sorter(
                "UnitPrice",
                true
            );

            oBinding.sort(oSorter);

            console.log("Filter applied: UnitPrice > 10");
        }

    });
});