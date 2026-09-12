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

    // CategoryName -> CategoryID fallback (Northwind fixed IDs 1-8).
    // Used when the Select still yields a name instead of an ID.
    var mCategoryNameToId = {
        "Beverages": 1,
        "Condiments": 2,
        "Confections": 3,
        "Dairy Products": 4,
        "Grains/Cereals": 5,
        "Meat/Poultry": 6,
        "Produce": 7,
        "Seafood": 8
    };

    return Controller.extend("myui5app.controller.sampleProduct", {

        onInit: function () {

            // ==========================================
            // OData V2 Model (server data, read-only here)
            // ==========================================

            var oODataModel = new ODataModel(
                "/V2/Northwind/Northwind.svc/",
                {
                    json: true,
                    useBatch: false
                }
            );

            this.getView().setModel(
                oODataModel,
                "products"
            );

            // ==========================================
            // Display Model (plain JSON for the table)
            // Never call setProperty("/displayProducts")
            // on an ODataModel - it cannot hold ad-hoc
            // client-side paths. Keep paging results here.
            // ==========================================

            this.getView().setModel(
                new JSONModel({
                    products: []
                }),
                "display"
            );

            // ==========================================
            // View Model (paging / filter / sort state)
            // ==========================================

            this.getView().setModel(
                new JSONModel({
                    searchText: "",
                    categoryId: "",
                    currentPage: 1,
                    pageSize: 5,
                    totalProducts: 0,
                    totalPages: 1,
                    previousEnabled: false,
                    nextEnabled: false,
                    sortDescending: false,
                    busy: false
                }),
                "viewModel"
            );

            // ==========================================
            // Categories Model (Select dropdown)
            // ==========================================

            this.getView().setModel(
                new JSONModel({
                    items: []
                }),
                "categories"
            );

            // ==========================================
            // Selected Product (dialog)
            // ==========================================

            this.getView().setModel(
                new JSONModel({}),
                "selectedProduct"
            );

            // Load categories first, then first page
            this._loadCategories();
            this._loadProducts();
        },

        // =====================================================
        // LOAD CATEGORIES (for the Select filter)
        // =====================================================

        _loadCategories: function () {
            var oODataModel = this.getView().getModel("products");
            var oCategoriesModel = this.getView().getModel("categories");

            oODataModel.read("/Categories", {
                urlParameters: {
                    "$select": "CategoryID,CategoryName"
                },
                success: function (oData) {
                    oCategoriesModel.setProperty(
                        "/items",
                        oData.results || []
                    );
                }.bind(this),
                error: function () {
                    // Keep hardcoded Select items as fallback.
                    // Do not toast - categories are non-critical.
                }
            });
        },

        // =====================================================
        // LOAD PRODUCTS
        // =====================================================

        _loadProducts: function () {

            var oODataModel =
                this.getView().getModel("products");

            var oDisplayModel =
                this.getView().getModel("display");

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

            var sCategoryId =
                oViewModel.getProperty("/categoryId");

            // Search Product Name (server-side Contains -> startswith/substring)
            if (sSearchText) {
                aFilters.push(
                    new Filter(
                        "ProductName",
                        FilterOperator.Contains,
                        sSearchText
                    )
                );
            }

            // Category: Northwind V2 does NOT support filtering
            // on expanded "Category/CategoryName".
            // Always filter on the FK "CategoryID".
            if (sCategoryId !== "" && sCategoryId !== null && sCategoryId !== undefined) {
                var iCategoryId = parseInt(sCategoryId, 10);
                if (!isNaN(iCategoryId)) {
                    aFilters.push(
                        new Filter(
                            "CategoryID",
                            FilterOperator.EQ,
                            iCategoryId
                        )
                    );
                }
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
            // Read OData (expand Supplier + Category so
            // CompanyName / CategoryName are populated)
            // ==========================================

            oViewModel.setProperty("/busy", true);

            oODataModel.read("/Products", {
                filters: aFilters,

                sorters: [
                    oSorter
                ],

                urlParameters: {
                    "$top": iPageSize,
                    "$skip": iSkip,
                    "$expand": "Category,Supplier",
                    "$select": "ProductID,ProductName,UnitPrice,UnitsInStock,UnitsOnOrder,Discontinued,CategoryID,SupplierID,Category/CategoryName,Category/CategoryID,Supplier/CompanyName",
                    "$inlinecount": "allpages"
                },

                success: function (oData) {
                    var aProducts =
                        oData.results || [];

                    // Total comes from __count when $inlinecount=allpages
                    var iTotal = aProducts.length;
                    if (oData.__count !== undefined && oData.__count !== null) {
                        iTotal = parseInt(oData.__count, 10);
                    }

                    oDisplayModel.setProperty(
                        "/products",
                        aProducts
                    );

                    oViewModel.setProperty("/busy", false);

                    // Update pagination with the SERVER total
                    this._updatePagination(iTotal);

                }.bind(this),

                error: function (oError) {
                    oViewModel.setProperty("/busy", false);

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
                oEvent.getParameter("newValue") || "";

            // SearchField clear button fires with undefined
            if (oEvent.getParameter("clearButtonPressed")) {
                sSearchText = "";
            }

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
        // Handles both CategoryID keys (fixed view) and legacy
        // CategoryName keys (maps name -> ID).
        // =====================================================

        onCategoryFilter: function (oEvent) {
            var sKey = oEvent.getParameter("selectedKey");
            if (sKey === undefined || sKey === null) {
                var oSelect = oEvent.getSource();
                sKey = oSelect.getSelectedKey();
            }

            // Backward compat: old view sent CategoryName
            if (sKey && isNaN(parseInt(sKey, 10)) && mCategoryNameToId[sKey]) {
                sKey = String(mCategoryNameToId[sKey]);
            }

            // "All Categories" sends ""
            var oViewModel =
                this.getView().getModel("viewModel");

            oViewModel.setProperty(
                "/categoryId",
                sKey || ""
            );

            // Also keep /category in sync for any old bindings
            oViewModel.setProperty(
                "/category",
                sKey || ""
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

            MessageToast.show(
                !bDescending ? "Sorted by price: high to low" : "Sorted by price: low to high"
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
        // PAGINATION (server total driven)
        // =====================================================

        _updatePagination: function (iTotal) {
            var oViewModel =
                this.getView().getModel("viewModel");

            var iPage =
                oViewModel.getProperty("/currentPage");

            var iPageSize =
                oViewModel.getProperty("/pageSize");

            iTotal = parseInt(iTotal, 10);
            if (isNaN(iTotal) || iTotal < 0) {
                iTotal = 0;
            }

            var iTotalPages =
                Math.ceil(
                    iTotal / iPageSize
                );

            // Always show at least page 1 of 1 for empty sets
            // so the "Page X of Y" label never shows "1 of 0".
            if (iTotalPages < 1) {
                iTotalPages = 1;
            }

            // Clamp current page if filter shrank the result
            if (iPage > iTotalPages) {
                iPage = iTotalPages;
                oViewModel.setProperty("/currentPage", iPage);
            }

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
        // Table#itemPress passes the row as "listItem" param,
        // NOT as event source. Handle both shapes.
        // =====================================================

        onProductPress: function (oEvent) {
            var oItem =
                oEvent.getParameter("listItem") || oEvent.getSource();

            if (!oItem || !oItem.getBindingContext) {
                return;
            }

            var oContext = oItem.getBindingContext("display");
            if (!oContext) {
                // Fallback for any leftover products> binding
                oContext = oItem.getBindingContext("products");
            }

            if (!oContext) {
                return;
            }

            var oProduct = oContext.getObject();

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
                }.bind(this)).catch(function (oErr) {
                    console.error("Failed to load ProductDialog", oErr);
                    MessageToast.show("Failed to open product details");
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
