sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter"
], function (
    Controller,
    MessageToast,
    Fragment,
    JSONModel,
    ODataModel,
    Filter,
    FilterOperator,
    Sorter
) {
    "use strict";

    return Controller.extend("myui5app.controller.sampleProduct", {


        


        onInit: function () {

            // ==========================================
            // OData V2 Model
            // ==========================================

            var oModel = new ODataModel(
                "/V2/Northwind/Northwind.svc/"
            );

            this.getView().setModel(
                oModel,
                "products"
            );
            console.log(oModel);


            // ==========================================
            // View Model
            // ==========================================

            this.getView().setModel(
                new JSONModel({
                    searchText: "",
                    category: "",
                    currentPage: 1,
                    pageSize: 5,
                    totalProducts: 0,
                    totalPages: 0,
                    previousEnabled: false,
                    nextEnabled: false,
                    sortDescending: false
                }),
                "viewModel"
            );


            // ==========================================
            // Selected Product
            // ==========================================

            this.getView().setModel(
                new JSONModel({}),
                "selectedProduct"
            );


            // Load first page
            this._loadProducts();
        },


        // =====================================================
        // LOAD PRODUCTS
        // =====================================================

        _loadProducts: function () {

            console.log('loadproducts started...')

            var oModel =
                this.getView().getModel("products");

            var oViewModel =
                this.getView().getModel("viewModel");


            var iPage =
                oViewModel.getProperty("/currentPage");

            var iPageSize =
                oViewModel.getProperty("/pageSize");

            var iSkip =
                (iPage - 1) * iPageSize;


            // ==========================================
            // Filters
            // ==========================================

            var aFilters = [];

            var sSearchText =
                oViewModel.getProperty("/searchText");

            var sCategory =
                oViewModel.getProperty("/category");


            // Search Product Name
            if (sSearchText) {

                aFilters.push(
                    new Filter(
                        "ProductName",
                        FilterOperator.Contains,
                        sSearchText
                    )
                );
            }


            // Category
            if (sCategory) {

                aFilters.push(
                    new Filter(
                        "Category/CategoryName",
                        FilterOperator.EQ,
                        sCategory
                    )
                );
            }


            // ==========================================
            // Sort
            // ==========================================

            var bDescending =
                oViewModel.getProperty("/sortDescending");

            var oSorter = new Sorter(
                "UnitPrice",
                bDescending
            );


            // ==========================================
            // Read OData
            // ==========================================

            oModel.read("/Products", {

                

                filters: aFilters,

                sorters: [
                    oSorter
                ],

                urlParameters: {
                    "$top": iPageSize,
                    "$skip": iSkip
                },

                success: function (oData) {

                    console.log(
                        "Products:",
                        oData.results
                    );


                    // Number of products returned
                    // for the current request
                    var aProducts =
                        oData.results || [];


                    // Put current page data
                    // into displayProducts
                    oModel.setProperty(
                        "/displayProducts",
                        aProducts
                    );


                    // Update pagination
                    this._updatePagination(
                        aProducts.length
                    );

                }.bind(this),

                error: function (oError) {

                    console.error(
                        "Error loading products",
                        oError
                    );

                    MessageToast.show(
                        "Failed to load products"
                    );
                }
            });
        },


        // =====================================================
        // SEARCH
        // =====================================================

        onSearch: function (oEvent) {

            var sSearchText =
                oEvent.getParameter("newValue");

            var oViewModel =
                this.getView().getModel("viewModel");

            oViewModel.setProperty(
                "/searchText",
                sSearchText
            );

            // Search starts from page 1
            oViewModel.setProperty(
                "/currentPage",
                1
            );

            this._loadProducts();
        },


        // =====================================================
        // CATEGORY FILTER
        // =====================================================

        onCategoryFilter: function (oEvent) {

            var sCategory =
                oEvent.getParameter("selectedKey");

            var oViewModel =
                this.getView().getModel("viewModel");

            oViewModel.setProperty(
                "/category",
                sCategory
            );

            // Start from page 1
            oViewModel.setProperty(
                "/currentPage",
                1
            );

            this._loadProducts();
        },


        // =====================================================
        // SORT
        // =====================================================

        onSortByPrice: function () {

            var oViewModel =
                this.getView().getModel("viewModel");

            var bDescending =
                oViewModel.getProperty(
                    "/sortDescending"
                );

            oViewModel.setProperty(
                "/sortDescending",
                !bDescending
            );

            this._loadProducts();
        },


        // =====================================================
        // NEXT PAGE
        // =====================================================

        onNextPage: function () {

            var oViewModel =
                this.getView().getModel("viewModel");

            var iCurrentPage =
                oViewModel.getProperty("/currentPage");

            var iTotalPages =
                oViewModel.getProperty("/totalPages");


            if (iCurrentPage < iTotalPages) {

                oViewModel.setProperty(
                    "/currentPage",
                    iCurrentPage + 1
                );

                this._loadProducts();
            }
        },


        // =====================================================
        // PREVIOUS PAGE
        // =====================================================

        onPreviousPage: function () {

            var oViewModel =
                this.getView().getModel("viewModel");

            var iCurrentPage =
                oViewModel.getProperty("/currentPage");


            if (iCurrentPage > 1) {

                oViewModel.setProperty(
                    "/currentPage",
                    iCurrentPage - 1
                );

                this._loadProducts();
            }
        },


        // =====================================================
        // PAGINATION
        // =====================================================

        _updatePagination: function (iCurrentCount) {

            var oViewModel =
                this.getView().getModel("viewModel");

            var iPage =
                oViewModel.getProperty("/currentPage");

            var iPageSize =
                oViewModel.getProperty("/pageSize");


            /*
             * Northwind returns __count when
             * $inlinecount is requested.
             */

            var oModel =
                this.getView().getModel("products");

            var oData =
                oModel.getProperty("/");

            var iTotal =
                oData.__count
                    ? parseInt(oData.__count, 10)
                    : iCurrentCount;


            var iTotalPages =
                Math.ceil(
                    iTotal / iPageSize
                );


            oViewModel.setProperty(
                "/totalProducts",
                iTotal
            );

            oViewModel.setProperty(
                "/totalPages",
                iTotalPages
            );

            oViewModel.setProperty(
                "/previousEnabled",
                iPage > 1
            );

            oViewModel.setProperty(
                "/nextEnabled",
                iPage < iTotalPages
            );
        },


        // =====================================================
        // PRODUCT CLICK
        // =====================================================

        onProductPress: function (oEvent) {

            var oItem =
                oEvent.getSource();

            var oProduct =
                oItem
                    .getBindingContext("products")
                    .getObject();


            this.getView()
                .getModel("selectedProduct")
                .setData(oProduct);


            this._openProductDialog();
        },


        // =====================================================
        // OPEN PRODUCT DIALOG
        // =====================================================

        _openProductDialog: function () {

            var oView =
                this.getView();


            if (!this.byId("productDialog")) {

                Fragment.load({

                    id: oView.getId(),

                    name:
                        "myui5app.view.ProductDialog",

                    controller: this

                }).then(function (oDialog) {

                    oView.addDependent(
                        oDialog
                    );

                    oDialog.open();

                });

            } else {

                this.byId(
                    "productDialog"
                ).open();
            }
        },


        // =====================================================
        // CLOSE PRODUCT DIALOG
        // =====================================================

        onCloseProductDialog: function () {

            this.byId(
                "productDialog"
            ).close();
        }

    });
});
