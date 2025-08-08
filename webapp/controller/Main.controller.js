sap.ui.define([
    "delmex/zmmhandheld/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/Device",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
],
    /**
     * @param {typeof delmex.zmmhandheld.controller.BaseController} BaseController
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel
     * @param {typeof sap.ui.core.Fragment} Fragment
     * @param {typeof sap.ui.Device} Device
     * @param {typeof sap.m.MessageBox} MessageBox
     * @param {sap.m.MessageToast} MessageToast
     */
    function (BaseController, JSONModel, Fragment, Device, MessageBox, MessageToast) {
        "use strict";


        const c_601 = '601-03'; // Orden de venta
        const c_602 = '602-03'; // Anulación orden de venta
        const c_551 = '551-03'; // desguace
        const c_552 = '552-03'; // Anulación desguace
        const c_201 = '201-03'; // salida de mercancia cargo ceco
        const c_202 = '202-03'; // Anulación salida de mercancia cargo ceco
        const c_261 = '261-03'; // Orden de producción - correcto
        const c_262 = '262-03'; // Anulación Orden de producción
        const c_101_01 = '101-01'; // Entrada / orden compra o Purchase Order
        const c_102_01 = '102-01'; // Anul. entrada / orden compra
        const c_101_02 = '101_02'; // Entrada / orden produccion
        const c_102_02 = '102-02'; // Anulación entrada / orden produccion
        const c_303 = '303-04'; // Pendiente
        const c_309 = '309-04'; // Pendiente

        const c_999 = '999'; // Entrada manual de movimiento


        return BaseController.extend("delmex.zmmhandheld.controller.Main", {
            onInit: function () {
                let oModel = new JSONModel({
                    currentDate: new Date().toISOString().split('T')[0]
                });
                this.setModel(oModel); // usando BaseController

                let oLocalModel = this.getLocalModel();
                this.getOwnerComponent().setModel(oLocalModel, "localModel");

                let oRequestModel = this.getRequestModel();
                this.getOwnerComponent().setModel(oRequestModel, "requestModel");

                //var odisplayModel = new sap.ui.model.json.JSONModel();
                //odisplayModel.loadData("./utils/DisplayConfiguration.json", false);
                //_pdfStructureModel.setData(_jsonPDF);

                let oTipoMov = this.getTipoMovModel();
                this.getOwnerComponent().setModel(oTipoMov, "ClaseMovList");


                let odisplayModel = this.getDisplayConfiguration();
                this.getOwnerComponent().setModel(odisplayModel, "oDisplayModel");
                console.log(odisplayModel);


                console.log(this.getOwnerComponent().getManifestEntry("/sap.app/id"));


            },

            onGetClaseMovList: async function () {
                this.getView().setBusy(true);
                let oModel_handheld = "ZSB_HANDHELD_V2";
                let oEntity_clasemov = "/ClaseMov";
                if (!this.getOwnerComponent().getModel("ClaseMovList")) {
                    let oClaseMov = await this.readOneAjax(oModel_handheld, oEntity_clasemov, '', '', '', '', '', '');
                    //oClaseMov = await this.readOneAjax2();
                    let oClaseMovList = oClaseMov.d.results;


                    let oLocalClaseMovList = new JSONModel();
                    oLocalClaseMovList.setData(oClaseMovList);
                    this.getOwnerComponent().setModel(oLocalClaseMovList, "ClaseMovList_backend");


                    /* console.log(this.getOwnerComponent().getModel("ClaseMovList_backend").getData("ClaseMovList"));
                    console.log(this.getOwnerComponent().getModel("ClaseMovList_2").getData("ClaseMovList")); */
                }


                this.getView().setBusy(false);

            },

            onGetMotivoList: async function () {
                this.getView().setBusy(true);
                let oModel_handheld = "ZSB_HANDHELD_V2";
                let oEntity_clasemov = "/Motivos";
                if (!this.getOwnerComponent().getModel("MotivoList")) {
                    let oMotivos = await this.readOneAjax(oModel_handheld, oEntity_clasemov, '', '', '', '', '', '');
                    //oClaseMov = await this.readOneAjax2();
                    let oMotivosList = oMotivos.d.results;


                    let oLocalMotivoList = new JSONModel();
                    oLocalMotivoList.setData(oMotivosList);
                    this.getOwnerComponent().setModel(oLocalMotivoList, "MotivoList");
                    console.log(this.getOwnerComponent().getModel("MotivoList").getData());
                }


                this.getView().setBusy(false);

            },

            onClaseMovChange: async function (oEvent) {
                //await this.onRestartProcess();

                let sSelectedKey = oEvent.getParameter("selectedItem").getKey();
                let sSelectext = oEvent.getParameter("selectedItem").getText();
                let oClaseMovModel = this.getOwnerComponent().getModel("ClaseMovList").getData();

                let oData = sSelectedKey.split("-");
                let oClaseMov = oData[0];
                let oClaveMov = oData[1];

                let oMatch = oClaseMovModel.find(item =>
                    item.ClaveMov === sSelectedKey
                );

                this.getOwnerComponent().getModel("localModel").setProperty("/Header/claseMov", oClaseMov);
                this.getOwnerComponent().getModel("localModel").setProperty("/Header/GoodsMovementRefDocType", oMatch.GoodsMovementRefDocType);
                this.getOwnerComponent().getModel("localModel").setProperty("/Header/textClaseMov", sSelectext);
                this.getOwnerComponent().getModel("localModel").setProperty("/Header/claveMov", sSelectedKey);

                // Deshabilitar elementos dependiendo de la seleccion
                //let oSelectedKey = oEvent.getSource().getSelectedKey(); 
                //let oSelectedKey = oClaseMov;


                if (sSelectedKey === c_601 || sSelectedKey === c_602 || sSelectedKey === c_261 || sSelectedKey === c_262) {
                    this.getOwnerComponent().getModel("oDisplayModel").setProperty("/Posiciones/ceco", false);
                    this.getOwnerComponent().getModel("oDisplayModel").setProperty("/Header/referencia", true);
                }

                if (sSelectedKey === c_551 || sSelectedKey === c_201 || sSelectedKey === c_999) {
                    this.getOwnerComponent().getModel("oDisplayModel").setProperty("/Header/referencia", false);
                    this.getOwnerComponent().getModel("oDisplayModel").setProperty("/Posiciones/ceco", true);
                }

                if (sSelectedKey === c_999) {
                    this.getOwnerComponent().getModel("oDisplayModel").setProperty("/Posiciones/ceco", true);
                    this.getOwnerComponent().getModel("oDisplayModel").setProperty("/Header/referencia", true);

                }

                if (sSelectedKey === c_552 || sSelectedKey === c_202) {
                    this.getOwnerComponent().getModel("oDisplayModel").setProperty("/Header/referencia", true);
                    this.getOwnerComponent().getModel("oDisplayModel").setProperty("/Posiciones/ceco", true);
                }

                // Motivo
                if (sSelectedKey === c_551 || sSelectedKey === c_552 || sSelectedKey === c_601) {
                    this.getOwnerComponent().getModel("oDisplayModel").setProperty("/Posiciones/motivo", true);
                    this.getOwnerComponent().getModel("oDisplayModel").setProperty("/Columna/motivo", true);
                } else {
                    this.getOwnerComponent().getModel("oDisplayModel").setProperty("/Posiciones/motivo", false);
                    this.getOwnerComponent().getModel("oDisplayModel").setProperty("/Columna/motivo", false);
                }

                if (sSelectedKey === c_303 || sSelectedKey === c_309) {
                    this.getOwnerComponent().getModel("oDisplayModel").setProperty("/Header/referencia", false);
                }


                const oToday = new Date();
                const sYear = oToday.getFullYear();
                const sMonth = String(oToday.getMonth() + 1).padStart(2, "0");
                const sDay = String(oToday.getDate()).padStart(2, "0");
                const sToday = `${sYear}-${sMonth}-${sDay}`;

                this.getOwnerComponent().getModel("localModel").setProperty("/Header/fecha_doc", sToday);
                this.getOwnerComponent().getModel("localModel").setProperty("/Header/fecha_cont", sToday);



                // Validar tipo de movimiento Anulacion o normal (se asigna el valor en el la funcion)
                this.getAnnulmentType(sSelectedKey);
            },

            onCancelarFormulario: function () {
                this._limpiarCamposFormulario();
                this.showMessage("Formulario cancelado");
            },

            _limpiarCamposFormulario: function () {
                let aIds = [
                    "materialInput",
                    "cantidadInput",
                    "umInput",
                    "loteInput",
                    "centroInput",
                    "almacenInput",
                    "cecoInput",
                    "motivoInput"
                ];

                aIds.forEach((sId) => {
                    let oInput = Fragment.byId("scanner", sId);
                    if (oInput) {
                        oInput.setValue("");
                    }
                });
            },

            onContinueHeader: async function () {
                this.getView().setBusy(true);
                this.onClearPosition();
                this.onClearReferenceItemSelected();
                this.onClearReferenceItems();

                let isBatchRequired = false;
                let sMaterialText = "";
                let oItems = [];
                let iPageSize = '5000';
                let oBundle = this.getResourceBundle();
                const const_si = oBundle.getText("yes");
                const const_no = oBundle.getText("no");

                let oDisplayModel = this.getOwnerComponent().getModel("oDisplayModel").getData();
                let oModel = this.getOwnerComponent().getModel("localModel").getData();


                if (!oDisplayModel.Header.referencia) {
                    this.onClearReferenceItems();


                    this.onNavToIconTabBar("datos");
                    this.getView().setBusy(false);


                    return;
                }


                let oView = this.getView();

                // Determinar servicio y entidad según clase de movimiento
                let sKey = oModel.Header.referencia;
                let oModel_RefDetail = "";
                let oEntity_RefDetail = "";
                let oEmptyValue = '';
                let oModel_ProductionOrder = "";
                let oEntity_ProductionOrder = "";
                let oModel_PurchaseOrder = "";
                let oEntity_PurchaseOrder = "";
                let oProductionOrder = [];
                let oProdOrderItems = [];
                let oAnulacion_flag = this.getAnnulmentType(oModel.Header.claveMov);
                this.getOwnerComponent().getModel("localModel").setProperty("/Header/esAnulacion", oAnulacion_flag);

                if (oAnulacion_flag) {
                    oModel_RefDetail = "API_MATERIAL_DOCUMENT_SRV";
                    oEntity_RefDetail = "A_MaterialDocumentItem";
                    this.getOwnerComponent().getModel("oDisplayModel").setProperty("/TablaReferenciaItems/columnProcesar", false);
                    this.getOwnerComponent().getModel("oDisplayModel").setProperty("/TablaReferenciaItems/btnContabilizar", false);
                } else if (oModel.Header.claveMov === c_601) {
                    oModel_RefDetail = "API_OUTBOUND_DELIVERY_SRV";
                    oEntity_RefDetail = "/A_OutbDeliveryItem";
                    this.getOwnerComponent().getModel("localModel").setProperty("/Header/esEntrega", true);
                    this.setVisibleBtnPicking();
                } else if (oModel.Header.claveMov === c_101_02) {  // orden produccion 
                    //oModel_RefDetail = "API_MATERIAL_DOCUMENT_SRV";
                    //oEntity_RefDetail = "A_MaterialDocumentItem";
                    oModel_ProductionOrder = "API_PRODUCTION_ORDER_2_SRV";
                    oEntity_ProductionOrder = "A_ProductionOrderItem_2";
                } else if (oModel.Header.claveMov === c_101_01) { // Purchase Order - orden compra
                    oModel_PurchaseOrder = "api_purchaseorder_2";
                    oEntity_PurchaseOrder = "PurchaseOrderItem";
                } else {
                    oModel_RefDetail = "API_PRODUCTION_ORDER_2_SRV";
                    oEntity_RefDetail = "A_ProductionOrderComponent_4";
                    this.getOwnerComponent().getModel("oDisplayModel").setProperty("/TablaReferenciaItems/columnProcesar", true);
                }

                let oReference = [];

                if (oModel.Header.claveMov === c_101_02) { // orden produccion 
                    //oReference = await this.readOneAjax(oModel_RefDetail, oEntity_RefDetail, sKey, oEmptyValue, oEmptyValue, oEmptyValue, oEmptyValue, oModel.Header.claseMov);
                    //oProductionOrder = await this.readOneAjax(oModel_ProductionOrder, oEntity_ProductionOrder, sKey, oEmptyValue, oEmptyValue, oEmptyValue, oEmptyValue, oModel.Header.claseMov);
                    oReference = await this.readOneAjax(oModel_ProductionOrder, oEntity_ProductionOrder, sKey, oEmptyValue, oEmptyValue, oEmptyValue, oEmptyValue, oModel.Header.claseMov);
                } else if (oModel.Header.claveMov === c_101_01) { // Purchase Order - orden compra
                    oReference = await this.readOneAjax(oModel_PurchaseOrder, oEntity_PurchaseOrder, sKey, oEmptyValue, oEmptyValue, oEmptyValue, oEmptyValue, oModel.Header.claseMov);
                } else {
                    oReference = await this.readAllPagedAjax(oModel_RefDetail, oEntity_RefDetail, iPageSize, sKey, oModel.Header.claseMov);
                }

                let oRefItems = oReference.d?.results || oReference.value;

                oItems = await Promise.all(
                    oRefItems.map(async (element) => {
                        try {
                            let oCant_disponible = 0;
                            let oPickingStatus = '';
                            let sMaterialText = '';
                            let isBatchRequired = false;
                            let oProductDetails = {};

                            if (oAnulacion_flag) {
                                oCant_disponible = element.QuantityInEntryUnit;
                            } else if (oModel.Header.claseMov === c_601) {
                                oCant_disponible = element.OriginalDeliveryQuantity;

                                switch (element.PickingStatus) {
                                    case '':
                                        oPickingStatus = "No relevante"; break;
                                    case 'A':
                                        oPickingStatus = "No tratado"; break;
                                    case 'B':
                                        oPickingStatus = "Tratado parcialmente"; break;
                                    case 'C':
                                        oPickingStatus = "Tratado completamente"; break;
                                }
                            } else if (oModel.Header.claveMov === c_101_02) {
                                //oCant_disponible = parseFloat(oProdOrderItems.MfgOrderItemPlannedTotalQty) - parseFloat(oProdOrderItems.MfgOrderItemGoodsReceiptQty);
                                oCant_disponible = parseFloat(element.MfgOrderItemPlannedTotalQty) - parseFloat(element.MfgOrderItemGoodsReceiptQty);
                            } else if (oModel.Header.claveMov === c_101_01) {
                                oCant_disponible = parseFloat(element.OrderQuantity);
                                isBatchRequired = false;
                            } else {
                                oCant_disponible = parseFloat(element.RequiredQuantity) - parseFloat(element.WithdrawnQuantity);
                            }

                            oProductDetails = await this.searchBatchRequired(element.Material) || {};
                            sMaterialText = await this.onSearchMaterialText(element.Material);
                            if (oModel.Header.claveMov === c_101_02) {
                                isBatchRequired = false;
                                this.getOwnerComponent().getModel("oDisplayModel").setProperty("/TablaReferenciaItems/columnLote", false);
                            } else {
                                isBatchRequired = oProductDetails?.isBatchRequired || false;
                                this.getOwnerComponent().getModel("oDisplayModel").setProperty("/TablaReferenciaItems/columnLote", true);
                            }

                            return {
                                material: element.Material,
                                Item: element.PurchaseOrderItem || 'xxx', // Colocar el correcto de cada clase de movimiento
                                txt_material: sMaterialText,
                                cantidad: oCant_disponible,
                                um: element.BaseUnitSAPCode || element.EntryUnit || element.DeliveryQuantityUnit || element.ProductionUnit || element.PurchaseOrderQuantityUnit,
                                centro: element.Plant,
                                almacen: element.StorageLocation,
                                isBatchRequired_txt: isBatchRequired ? const_si : const_no,
                                GoodsMovementType: element.GoodsMovementType,
                                isBatchRequired: isBatchRequired,
                                Reservation: element.Reservation,
                                ReservationItem: element.ReservationItem,
                                ReservationItemRecordType: element.ReservationItemRecordType,
                                WeightUnit: oProductDetails?.WeightUnit || '',
                                Plant: element.Plant,
                                StorageLocation: element.StorageLocation,
                                lote: element.Batch,
                                ceco: element.CostCenter,
                                MaterialDocumentItemText: element.MaterialDocumentItemText,
                                GoodsMovementReasonCode: element.GoodsMovementReasonCode,
                                PickingStatus: element.PickingStatus || '',
                                PickingStatus_desc: oPickingStatus,
                                ReferenceSDDocumentItem: element.ReferenceSDDocumentItem || '',
                                ActualDeliveryQuantity: element.ActualDeliveryQuantity || '',
                                GoodsMovementRefDocType: oModel.Header.GoodsMovementRefDocType, // ClaveMov: "102-01" F y purchase order B
                                PurchaseOrderItem: element.PurchaseOrderItem || ''
                            };
                        } catch (error) {
                            console.error("Error procesando item", element, error);
                            return null;
                        }
                    })
                );

                oItems = oItems.filter(Boolean); // Elimina elementos nulos si hubo errores

                this.getOwnerComponent().getModel("localModel").setProperty("/ReferenceItems", oItems);

                // Obtener el año del documento de material
                let oModelDocYear = "API_MATERIAL_DOCUMENT_SRV";
                let oEntity_DocYear = `A_MaterialDocumentHeader`;
                let oEmpty = '';
                let oMaterialDocumentHeader = await this.readOneAjax(oModelDocYear, oEntity_DocYear, oModel.Header.referencia, oEmpty, oEmpty, oEmpty, oEmpty, oEmpty);
                let oMatDocYear = oMaterialDocumentHeader?.d?.results?.[0]?.MaterialDocumentYear || '';
                this.getOwnerComponent().getModel("localModel").setProperty("/Header/MaterialDocumentYear", oMatDocYear);

                // Mostrar el dialog de ítems
                if (!this.oItemsDialog) {
                    this.oItemsDialog = Fragment.load({
                        id: oView.getId(),
                        name: "delmex.zmmhandheld.view.fragments.ReferenceItemsDialog",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.open();
                        oView.setBusy(false);
                        return oDialog;
                    });
                } else {
                    this.oItemsDialog.then(function (oDialog) {
                        oDialog.open();
                        oView.setBusy(false);
                    });
                }

                this.onNavToIconTabBar("datos");
                this.getView().setBusy(false);
            },


            searchBatchRequired: async function (eMaterial) {
                let oModel_BatchRequired = "productApi";
                let oEntity_BatchRequired = "Product";

                let oLocalModel = this.getOwnerComponent().getModel("localModel").getProperty("/Header/claveMov");
                if (oLocalModel === "101-02") {
                    return {
                        isBatchRequired: false,
                        WeightUnit: '',
                        Plant: '',
                        StorageLocation: '',
                        Batch: ''
                    };
                }

                let sMaterialBatch = await this.readOneAjax(oModel_BatchRequired, oEntity_BatchRequired, '', eMaterial, '', '', '', '');

                if (!sMaterialBatch || !sMaterialBatch.value || sMaterialBatch.value.length === 0) {
                    console.warn("No se encontró el material en productApi:", eMaterial);
                    return {
                        isBatchRequired: false,
                        WeightUnit: '',
                        Plant: '',
                        StorageLocation: '',
                        Batch: ''
                    };
                }

                let oProduct = sMaterialBatch.value[0];

                return {
                    isBatchRequired: oProduct.IsBatchManagementRequired,
                    WeightUnit: oProduct.WeightUnit,
                    Plant: oProduct.Plant,
                    StorageLocation: oProduct.StorageLocation,
                    Batch: oProduct.Batch
                };
            },


            onSearchMaterialText: async function (eMaterial) {
                // Texto de material
                let oModel_MatText = "productApi";
                let oEntity_MatText = "ProductDescription";
                const oEmpty = '';
                let sMaterialData = await this.readOneAjax(oModel_MatText, oEntity_MatText, oEmpty, eMaterial, oEmpty, oEmpty, oEmpty, oEmpty);
                console.log("sMaterialText", sMaterialData);
                let sMaterialText = sMaterialData.value[0].ProductDescription;
                return sMaterialText;
            },

            onCloseItemsDialog: function () {
                if (this.oItemsDialog) {
                    this.oItemsDialog.then(function (oDialog) {
                        oDialog.close();
                    });
                }
            },

            onSearchBatchList: async function (eMaterial) {
                let oModel = "apiBatch";
                let oEntity = "Batch";

                try {
                    let sList = await this.readOneAjax(oModel, oEntity, '', eMaterial, '', '', '', '');
                    let sBatchList = sList?.d?.results || [];

                    // Setear modelo
                    var oBatchModel = new sap.ui.model.json.JSONModel();
                    oBatchModel.setData(sBatchList);
                    this.getView().setModel(oBatchModel, "BatchList");

                    return sBatchList;
                } catch (error) {
                    console.error("Error al buscar lote:", error);

                    // Devolver arreglo vacío si hubo error
                    return [];
                }
            },


            onProcesarItem: function (oEvent) {

                this.onClearPosition();

                let oModel = this.getModel("localModel");
                let sPath = oEvent.getSource().getBindingContext("localModel").getPath(); // ej: /Positions/2
                let aPositions = oModel.getProperty("/ReferenceItems");
                let iIndex = parseInt(sPath.split("/")[2], 10);

                console.log(iIndex);

                if (!isNaN(iIndex) && iIndex >= 0 && iIndex < aPositions.length) {
                    this.getOwnerComponent().getModel("localModel").setProperty("/ReferenceItemSelected", aPositions[iIndex]);
                    this.getOwnerComponent().getModel("localModel").setProperty("/ReferenceItemSelected/index", iIndex);
                    this.getOwnerComponent().getModel("localModel").setProperty("/ReferenceItemSelected/material", aPositions[iIndex].material);
                    //this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/material", aPositions[iIndex].material);
                    //this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/lote", aPositions[iIndex].lote);

                    this.onSearchBatchList(aPositions[iIndex].material);


                    // Paso 2: Cambiar la pestaña activa por su key
                    this.onNavToIconTabBar("datos");
                }

                this.onCloseItemsDialog();

            },

            onClearPosition: async function (oMaterial_Flag = true) {

                if (oMaterial_Flag) {
                    this.getView().byId("materialInput").setValue();
                }

                this.getView().byId("cantidadInput").setValue();
                this.getView().byId("umInput").setValue();
                this.getView().byId("loteInput").setValue();
                this.getView().byId("centroInput").setValue();
                this.getView().byId("almacenInput").setValue();
                this.getView().byId("cecoInput").setValue();
                this.getView().byId("motivoInput").setValue();
                this.getView().byId("txtPosicionArea").setValue();
                this.getView().byId("txtPosicionArea_historico").setValue();

                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/material", "");
                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/txt_material", "");
                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/cantidad", "");
                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/um", "");
                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/lote", "");
                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/centro", "");
                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/almacen", "");
                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/ceco", "");
                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/motivo", "");
                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/txt_posicion", "");
                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/txt_posicion_historico", "");
                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/cantidad_disponible", 0);
                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/PurchaseOrderItem", 0);
                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/GoodsMovementRefDocType", "");
                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/isBatchRequired", true);
                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/isBatchRequired_txt", "");
                this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/GoodsMovementType", "");

                if (this.getView().getModel("BatchList")) {
                    this.getView().getModel("BatchList").setData([]);
                }



            },

            onClearHeader: async function () {
                this.getView().byId("header_select_clasemov").setSelectedKey("000-00");
                this.getView().byId("header_input_clasemov").setValue();
                this.getView().byId("header_input_fecha_doc").setValue();
                this.getView().byId("header_input_fecha_cont").setValue();
                this.getView().byId("header_input_referencia").setValue();
                this.getView().byId("header_input_fecha_texto_cabecera").setValue();
                this.getOwnerComponent().getModel("localModel").setProperty("/Header/esAnulacion", false);

            },

            onClearOrden: async function () {
                if (this.getView().getModel("localModel")) {
                    this.getView().getModel("localModel").setProperty("/Positions", null);
                    //oPositions = []; // Variable Global
                }
            },

            onRestartProcess: async function () {
                await this.onClearPosition();
                await this.onClearHeader();
                await this.onClearOrden();

                this.onNavToIconTabBar("cabecera");

            },

            _actualizarContadorPosiciones: function () {
                let oModel = this.getModel("localModel");
                let aPos = oModel.getProperty("/Positions") || [];
                let iCantidad = aPos.length;
                let oEmpty = '';

                let oBundle = this.getResourceBundle();
                let sTexto = oBundle.getText("contadorPosiciones", [iCantidad]);

                oModel.setProperty("/posicionesTexto", sTexto);
            },



            onBuscarDetalle: async function () {
                let oView = this.getView();
                oView.setBusy(true);
                let oLocalModel = this.getOwnerComponent().getModel("localModel");
                let oLocalModelData = oLocalModel.getData();
                let isBatchRequired = false;
                let sMaterialText = "";
                let oBundle = this.getResourceBundle();

                const const_si = oBundle.getText("yes");
                const const_no = oBundle.getText("no");




                console.log("ReferenceItemSelected", oLocalModelData.ReferenceItemSelected);


                // ✅ Tomar partes
                let sMaterial = this.getView().byId("materialInput").getValue();
                let sBatch = this.getView().byId("loteInput").getValue();

                let oProduct = await this.searchBatchRequired(sMaterial);
                isBatchRequired = oProduct.isBatchRequired;
                sMaterialText = await this.onSearchMaterialText(sMaterial);


                let componentMaterial = oLocalModelData.ReferenceItemSelected.material;

                if (oLocalModelData.Header.claseMov === '261') {
                    if (sMaterial !== componentMaterial) {
                        let sMessage = oBundle.getText("position.noMatch", [
                            sMaterial,
                            componentMaterial
                        ]);
                        MessageBox.alert(sMessage);
                        oView.setBusy(false);
                        return;
                    }
                } else if (oLocalModelData.Header.claseMov === '201' || oLocalModelData.Header.claseMov === '551') {

                    let oItems = {
                        material: sMaterial,
                        txt_material: sMaterialText,
                        cantidad: "",
                        um: "",
                        centro: "",
                        almacen: "",
                        isBatchRequired_txt: isBatchRequired ? const_si : const_no,
                        GoodsMovementType: oLocalModelData.Header.claseMov,
                        isBatchRequired: isBatchRequired,
                        Reservation: "",
                        ReservationItem: "",
                        ReservationItemRecordType: ""
                    }
                    oLocalModel.setProperty("/ReferenceItems", oItems);
                }

                this.getOwnerComponent().getModel("oDisplayModel").setProperty("/Posiciones/lote", isBatchRequired);


                if (isBatchRequired && oLocalModelData.Header.claveMov !== '101-02') {




                    // 2️⃣ Validar campos obligatorios
                    if (!sMaterial || !sBatch) {
                        let oMessage = oBundle.getText("position.missingFields");
                        MessageToast.show(oMessage, {
                            duration: 8000 // milisegundos (8 segundos)
                        });


                        if (!sBatch) {
                            this.getView().byId("loteInput").focus();
                        }

                        oView.setBusy(false);
                        return;
                    }

                    // 3️⃣ Obtener datos del modelo BatchList
                    //let aBatchData = oBatchListModel.getData() || [];
                    let aBatchData = await this.onSearchBatchList(sMaterial); // ✅ ahora sí esperas la promesa

                    // 4️⃣ Buscar combinación material-lote
                    let oMatch = aBatchData.find(item =>
                        item.Material === sMaterial && item.Batch === sBatch
                    );

                    if (oMatch) {
                        let oMessage = oBundle.getText("position.batchFound");

                        MessageToast.show(oMessage, {
                            duration: 8000 // milisegundos (8 segundos)
                        });


                        /**
                         * 5️⃣ Actualizar datos fijos de la selección
                         * 6️⃣ Esperar texto de detalle (ahora usando await)
                         * 7️⃣ Guardar el texto final en el modelo
                         */

                        await this.setPositionValue();


                    } else {
                        // Si no hay match y el batch es requerido: mostrar mensaje
                        if (isBatchRequired) {
                            let oMessage = oBundle.getText("position.batchNotFound");
                            MessageToast.show(oMessage, {
                                duration: 8000 // milisegundos (8 segundos)
                            });
                            let oMatrial_flag = false;
                            this.onClearPosition(oMatrial_flag);
                            oView.setBusy(false);

                        }
                    }
                } else {
                    console.log("dataposition => " + oLocalModelData.DataPosition.material);
                    console.log("escaneado => " + this.getView().byId("materialInput").getValue());

                    let sInputValue = this.getView().byId("materialInput").getValue().trim();
                    let sModelValue = oLocalModelData.DataPosition.material?.trim();

                    this.getView().byId("loteInput").setValue();

                    // 📌 Comparar usando includes()
                    if (sInputValue.toUpperCase().includes(sModelValue.toUpperCase())) {
                        console.log("✅ El valor del modelo SÍ se encuentra dentro del input");
                        /**
                         * 5️⃣ Actualizar datos fijos de la selección
                         * 6️⃣ Esperar texto de detalle (ahora usando await)
                         * 7️⃣ Guardar el texto final en el modelo
                         */

                        await this.setPositionValue();
                    } else {
                        console.log("❌ El valor del modelo NO se encuentra dentro del input");
                    }


                }

                oView.setBusy(false);
            },

            setPositionValue: async function () {

                // 5️⃣ Actualizar datos fijos de la selección
                let oLocalModel = this.getOwnerComponent().getModel("localModel");
                let oLocalModelData = oLocalModel.getData();
                oLocalModel.setProperty("/DataPosition/cantidad", oLocalModelData.ReferenceItemSelected.cantidad);
                oLocalModel.setProperty("/DataPosition/um", oLocalModelData.ReferenceItemSelected.um);
                oLocalModel.setProperty("/DataPosition/centro", oLocalModelData.ReferenceItemSelected.centro);
                oLocalModel.setProperty("/DataPosition/almacen", oLocalModelData.ReferenceItemSelected.almacen);
                oLocalModel.setProperty("/DataPosition/txt_material", oLocalModelData.ReferenceItemSelected.txt_material);

                // 6️⃣ Esperar texto de detalle (ahora usando await)
                let sKey = oLocalModelData.Header.referencia;
                let oClaseMov = oLocalModelData.Header.claseMov;
                let sMaterial = oLocalModelData.ReferenceItemSelected.material;
                let sBatch = oLocalModelData.ReferenceItemSelected.lote;
                let sDetailText = await this.onGetDetailText(sKey, sMaterial, sBatch, oClaseMov);

                // 7️⃣ Guardar el texto final en el modelo
                oLocalModel.setProperty("/DataPosition/txt_posicion_historico", sDetailText);


            },

            onGetDetailText: async function (sKey, sMaterial, sBatch, oClaseMov) {
                let oModelName = "ZSB_HANDHELD_V2";
                let oEntity = "/OrderItemsText";
                let sPlant = "";
                let sLocation = "";

                try {
                    // 1️⃣ Llamar a la lectura Ajax y esperar respuesta
                    let oDetailText = await this.readOneAjax(oModelName, oEntity, sKey, sMaterial, sBatch, sPlant, sLocation, oClaseMov);

                    // 2️⃣ Tomar resultados
                    let aResults = oDetailText.d.results;

                    // 3️⃣ Convertir a texto formateado
                    let sTextoFinal = aResults
                        .map(obj => {
                            let sConf = obj.MfgOrderConfirmation;
                            let sTexto = obj.DetailText || "";
                            return `#${sConf}: ${sTexto}`;
                        })
                        .join("\n");

                    // 4️⃣ Devolver el texto formateado
                    return sTextoFinal;

                } catch (e) {
                    console.error("Error onGetDetailText:", e);
                    return ""; // Devuelve string vacío si hay error
                }
            },

            guardarTextoEditado: function () {
                let oLocalModel = this.getView().getModel("localModel");
                let sTexto = oLocalModel.getProperty("/DataPosition/txt_posicion");

                // Separamos por línea y convertimos en array de objetos
                let aPosiciones = sTexto.split("\n").map(linea => {
                    let match = linea.match(/^#(\d+):\s?(.*)$/); // patrón tipo "#2: texto"
                    return {
                        MfgOrderConfirmation: match ? match[1] : "",
                        DetailText: match ? match[2] : ""
                    };
                });

                console.log("Texto convertido a array:", aPosiciones);

                // Aquí podrías hacer un loop para actualizar cada posición por separado en el backend
            },

            validarCantidad: function (iCantidad, iDisponible) {
                if (!iDisponible) {
                    iDisponible = this.getOwnerComponent().getModel("localModel").getProperty("/DataPosition/cantidad_disponible");
                }

                let oReturn = false;

                oReturn = true;

                return oReturn;
            },

            /**
             * Evento principal para crear movimiento de mercancía.
             * Construye el payload JSON con la cabecera y todos los ítems seleccionados,
             * y ejecuta la petición de creación contra el servicio OData.
             *
             * @param {sap.ui.base.Event} oEvent - Evento de UI5 (botón u otro disparador).
             */
            onCreateMov: async function () {

                this.getView().setBusy(true);
                let oBundle = this.getResourceBundle();

                try {


                    // 1️⃣ Obtener datos locales del modelo local
                    let oLocalModel = this.getOwnerComponent().getModel("localModel").getData();

                    let esEntrega = oLocalModel.Header.esEntrega;
                    let oGoodsMovementType = '';

                    if (oLocalModel.Header.claveMov === c_303 || oLocalModel.Header.claveMov === c_309) {
                        this.onShowReceiver();
                        return;
                    }


                    // Procesar Entregas
                    if (esEntrega) {
                        this.onContabilizarEntrega();
                        return;
                    } else {




                        // 3️⃣ Obtener la clave del movimiento de mercancía según la lógica de negocio
                        let oGoodMovement = this.getGoodMovement();



                        // 4️⃣ Validar que exista código válido
                        if (!oGoodMovement) {
                            sap.m.MessageBox.error(this.getResourceBundle().getText("error.missingMovement"));
                            this.getView().setBusy(false);
                            return;
                        }

                        if (oLocalModel.Header.claveMov === '101-02') {
                            oGoodsMovementType = oLocalModel.Header.claseMov;
                        } else {
                            oGoodsMovementType = oLocalModel.ReferenceItemSelected.GoodsMovementType || oLocalModel.Header.claseMov;
                        }


                        let oRequestJson = this.onBuildRequest();

                        if(!oRequestJson){
                            MessageBox.warning("Selecciona un motivo");
                            return;
                        }




                        // Paso 8️⃣ Obtener CSRF Token usando helper del BaseController
                        let sModelName = "";
                        let sEntitySet = "";
                        let sEntitySetToken = "A_MaterialDocumentHeader";
                        if (oLocalModel.Header.esAnulacion) {

                            sEntitySet = `Cancel?MaterialDocumentYear='${oLocalModel.Header.MaterialDocumentYear}'&MaterialDocument='${oLocalModel.Header.referencia}'&PostingDate=datetime'${oLocalModel.Header.fecha_cont}T00:00'`;
                            sModelName = "API_MATERIAL_DOCUMENT_SRV";

                           /*  if (oLocalModel.Header.claveMov === "202-03") { borrar en caso de requerir fecha para todos
                                sEntitySet = `Cancel?MaterialDocumentYear='${oLocalModel.Header.MaterialDocumentYear}'&MaterialDocument='${oLocalModel.Header.referencia}'`;
                            } else if (oLocalModel.Header.claveMov === "102-01") {
                                sEntitySet = `Cancel?MaterialDocumentYear='${oLocalModel.Header.MaterialDocumentYear}'&MaterialDocument='${oLocalModel.Header.referencia}'&PostingDate=datetime'${oLocalModel.Header.fecha_cont}T00:00'`;
                            } */


                            //API_MATERIAL_DOCUMENT_SRV/Cancel?
                            // MaterialDocumentYear='2017'&
                            // MaterialDocument='5000021255'
                            // &PostingDate=datetime'2017-07-02T00:00:00'
                        } else {
                            sModelName = "API_MATERIAL_DOCUMENT_SRV";
                            sEntitySet = "A_MaterialDocumentHeader?";
                        }

                        // Manejo de Motivo para cada movimiento

                        /*   const c_601 = '601'; // entrega de material
                          const c_602 = '602'; // Anulacion entrega de material
                          const c_551 = '551'; // Desguace
                          const c_552 = '552'; // Anulacion desguace
                          const c_201 = '201'; // salida de mercancia con cargo a ceco
                          const c_202 = '202'; // anulacion salida de mercancia con cargo a ceco
                          const c_261 = '261'; // Orden de produccion
                          const c_262 = '262'; // anulacion orden de produccion
                          const c_999 = "999"; */

                        let oMovType = oRequestJson.to_MaterialDocumentItem[0].GoodsMovementType;
                        if (oMovType === c_261 || oMovType === c_262 || oMovType === c_201 || oMovType === c_202) {
                            oRequestJson.to_MaterialDocumentItem[0].GoodsMovementReasonCode = '';
                        }

                        let sToken = await this.fetchCsrfToken(sModelName, sEntitySetToken);
                        console.log("CSRF Token obtenido:", sToken);

                        // Paso 9 Ejecutar POST usando helper del BaseController
                        let oResponse = [];
                        if (oLocalModel.Header.esAnulacion) {
                            oResponse = await this.postEntityAjax(sModelName, sEntitySet, oRequestJson, sToken);
                        } else {
                            oResponse = await this.postEntityAjax(sModelName, sEntitySet, oRequestJson, sToken);
                        }

                        let oMessage = oBundle.getText("success.movCreated");
                        MessageToast.show(oMessage, {
                            duration: 8000 // milisegundos (8 segundos)
                        });
                        console.log("Respuesta del POST:", oResponse);
                        this.PopulatePositions(oResponse.d);






                    }





                    this.getView().setBusy(false);

                } catch (e) {
                    console.error("Error en onCreateMov:", e);
                    this._showErrorMessage(oBundle.getText("error.unexpected"), oBundle);
                    this.getView().setBusy(false);
                    this.onCloseItemsDialog();
                }

                this.getView().setBusy(false);
            },

            validateHeaderFields: function () {
                let oView = this.getView();
                let oBundle = this.getResourceBundle();
                let oLocalModel = this.getOwnerComponent().getModel("localModel");
                let oDisplayModel = this.getOwnerComponent().getModel("oDisplayModel").getData();
                let bValid = true;
                let aMissingFields = [];

                // 🚩 Campos a validar
                let aFields = [
                    {
                        id: "header_select_clasemov",
                        prop: "Header/claseMov",
                        label: oBundle.getText("header.operacion_almacen")
                    },
                    {
                        id: "header_input_fecha_doc",
                        prop: "Header/fecha_doc",
                        label: oBundle.getText("header.fecha_documento")
                    },
                    {
                        id: "header_input_fecha_cont",
                        prop: "Header/fecha_cont",
                        label: oBundle.getText("header.fecha_contabilizacion")
                    },
                    {
                        id: "header_input_referencia",
                        prop: "Header/referencia",
                        label: oBundle.getText("header.referencia")
                    }
                ];

                aFields.forEach(oField => {
                    let oControl = oView.byId(oField.id);
                    let sValue = oLocalModel.getProperty("/" + oField.prop);

                    // 🚩 Para el Select reforzamos que '0' cuente como vacío
                    let bIsEmpty = !sValue || sValue.trim() === "";

                    if (oField.id === "header_select_clasemov") {
                        let sSelectedKey = oControl.getSelectedKey();

                        // Si el modelo trae '0' o el key real es '0' => inválido
                        if (!sSelectedKey || sSelectedKey.trim() === "" || sSelectedKey === "0" || sValue === "0") {
                            bIsEmpty = true;
                        }
                    }

                    if (oField.id === "header_input_referencia") {
                        if (!oDisplayModel.Header.referencia);
                        bIsEmpty = false;
                    }

                    if (bIsEmpty) {
                        bValid = false;
                        aMissingFields.push(oField.label);

                        oControl.setValueState("Error");
                        oControl.setValueStateText(oBundle.getText("validation.fieldRequired", [oField.label]));
                    } else {
                        oControl.setValueState("None");
                    }
                });

                if (!bValid) {
                    MessageBox.error(
                        oBundle.getText("validation.missingFields", [aMissingFields.join(", ")])
                    );
                    oView.setBusy(false);
                }

                return bValid;
            },



            onTabChanged: function (oEvent) {
                let sKey = oEvent.getParameter("key");
                /* if (sKey !== "cabecera") {
                    let bValid = this.validateHeaderFields();
                    if (!bValid) {
                        // 🚩 Si no es válido, forza volver al tab Cabecera
                        this.byId("mainTabs").setSelectedKey("cabecera");
                    }
                } */
            },


            resetHeaderValidation: function () {
                let oView = this.getView();
                ["header_input_clasemov", "header_input_fecha_doc", "header_input_fecha_cont", "header_input_referencia"]
                    .forEach(id => oView.byId(id).setValueState("None"));
            },


            PopulatePositions: async function (oResponse) {

                let oLocalModel = this.getOwnerComponent().getModel("localModel");
                let oLocalModelData = oLocalModel.getData();
                let oDataPosition = oLocalModelData.DataPosition;
                let _position = [];
                let iPageSize = '5000';
                let oModel_RefDetail = "API_MATERIAL_DOCUMENT_SRV";
                let oEntity_RefDetail = "A_MaterialDocumentItem";
                let oItems = [];
                var oPositions = [];
                let sMaterialText = "";
                let oMotivo = "";

                console.log("Llenar tabla: ", oResponse);

                let oDocumentDetails = await this.readAllPagedAjax(oModel_RefDetail, oEntity_RefDetail, iPageSize, oResponse.MaterialDocument, oLocalModelData.Header.claseMov);
                let oDetails = oDocumentDetails.d.results;
                let oMotivoModel = "";




                if (oResponse.MaterialDocument) {
                    //if (oLocalModelData.Header.esAnulacion) {


                    //let oRefItems = oLocalModelData.ReferenceItems;

                    if (oLocalModelData.Header.claveMov === "551-03") {
                        oMotivoModel = this.getOwnerComponent().getModel("MotivoList").getData();
                    }

                    console.log("PopulatePositions > oDetails: ", oDetails);
                    for (let i = 0; i < oDetails.length; i++) {
                        sMaterialText = await this.onSearchMaterialText(oDetails[i].Material);

                        if (oLocalModelData.Header.claveMov === "551-03") {
                            oMotivoModel = this.getOwnerComponent().getModel("MotivoList").getData();
                            oMotivo = oMotivoModel.find(item =>
                                item.Motivo === oDetails[0].GoodsMovementReasonCode
                            );
                        }



                        _position = {
                            material: oDetails[0].Material,
                            txt_material: sMaterialText,
                            cantidad: oDetails[0].QuantityInEntryUnit,
                            um: oDetails[0].EntryUnit,
                            lote: oDetails[0].Batch, // Lote
                            centro: oDetails[0].Plant, // Centro/Planta
                            almacen: oDetails[0].StorageLocation,
                            ceco: oDetails[0].CostCenter,
                            motivo: oMotivo?.Motivo || '', // Motivo
                            DescMotivo: oMotivo.DescMotivo || '', // Motivo
                            txt_posicion: oDetails[0].MaterialDocumentItemText,
                            MaterialDocument: oResponse.MaterialDocument,
                            //MaterialDocumentItemText: oDetails[i].MaterialDocumentItemText,
                            motivo: oDetails[i].GoodsMovementReasonCode || ''

                        }
                        oPositions.push(_position);
                        _position = {};
                    }

                    /*}  else {
                        console.log("no es anulación");

                        sMaterialText = await this.onSearchMaterialText(oDataPosition.material);
                        _position = {
                            material: oDetails[0].Material,
                            txt_material: sMaterialText,
                            cantidad: oDetails[0].QuantityInEntryUnit,
                            um: oDetails[0].EntryUnit,
                            lote: oDetails[0].Batch, // Lote
                            centro: oDetails[0].Plant, // Centro/Planta
                            almacen: oDetails[0].StorageLocation,
                            ceco: oDetails[0].CostCenter,
                            motivo: oDetails[0].GoodsMovementReasonCode || '', // Motivo
                            txt_posicion: oDetails[0].MaterialDocumentItemText,
                            MaterialDocument: oResponse.MaterialDocument,
                            MaterialDocumentItemText: oDetails[i].MaterialDocumentItemText,
                            motivo: oDetails[i].GoodsMovementReasonCode || ''
                        }
                        oPositions.push(_position);
                        _position = {};
                    } */

                    console.log("oPositions: ", oPositions);

                    oLocalModel.setProperty("/Positions", oPositions);
                    this._actualizarContadorPosiciones();
                }





                // Paso 2: Cambiar la pestaña activa por su key
                this.onCloseItemsDialog();
                this.onNavToIconTabBar("orden");

            },

            onLiveChangeMaterial: function (oEvent) {
                this.onLiveChangeUpper(oEvent, "/DataPosition/material");
            },

            onLiveChangeLote: function (oEvent) {
                this.onLiveChangeUpper(oEvent, "/DataPosition/lote");
            },

            onLiveChangeUM: function (oEvent) {
                this.onLiveChangeUpper(oEvent, "/DataPosition/um");
            },

            inputSubmit: function () {
                console.log("inputSubmit");
            },

            getAnnulmentType: function (eClaveMov) {


                /* const c_602 = '602';
                const c_552 = '552-03';
                const c_202 = '202-03';
                const c_262 = '262-03';
                const c_102_01 = '102-01';
                const c_102_02 = '102-02'; */
                let _return

                if (eClaveMov === c_602 || eClaveMov === c_552 || eClaveMov === c_202 || eClaveMov === c_262 || eClaveMov === c_102_01 || eClaveMov === c_102_02) {
                    _return = true;
                } else {
                    _return = false
                }

                this.getOwnerComponent().getModel("localModel").setProperty("/Header/esAnulacion", _return);

                return _return
            },

            onClearReferenceItemSelected: function () {
                this.getOwnerComponent().getModel("localModel").getProperty("/ReferenceItemSelected", null);
            },

            onClearReferenceItems: function () {
                this.getOwnerComponent().getModel("localModel").getProperty("/ReferenceItems", null);
            },

            onPicking: async function () {
                this.getView().setBusy(true);

                // ✅ Tomar partes
                let sMaterial = this.getView().byId("materialInput").getValue();
                let sBatch = this.getView().byId("loteInput").getValue();
                let oBundle = this.getResourceBundle(); // solo si lo estás usando abajo


                // 2️⃣ Validar campos obligatorios
                if (!sMaterial) {
                    let oMessage = oBundle.getText("position.missingFields");
                    MessageToast.show(oMessage, {
                        duration: 8000 // milisegundos (8 segundos)
                    });




                    this.getView().setBusy(false);
                    return;
                }

                this.onBuscarDetalle();




                let oLocalModel = this.getOwnerComponent().getModel("localModel").getData();
                let oDisplayModel = this.getOwnerComponent().getModel("oDisplayModel").getData();

                this.getView().setBusy(false);
                this.getETagAndToken().then((oHeaders) => {
                    let sKey = oLocalModel.Header.referencia;
                    let sItem = oLocalModel.ReferenceItemSelected.ReferenceSDDocumentItem;
                    //let sCantidad = oLocalModel.DataPosition.cantidad;
                    let sCantidad = parseFloat(oLocalModel.DataPosition.cantidad).toFixed(3);
                    let sUM = oLocalModel.DataPosition.um;
                    let sBatch = oLocalModel.DataPosition.lote;
                    let sUrl = '';
                    let isBatchRequired = oDisplayModel.Posiciones.lote;
                    if (isBatchRequired) {
                        sUrl = `/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/PickAndBatchSplitOneItem?DeliveryDocument='${sKey}'&DeliveryDocumentItem='${sItem}'&Batch='${sBatch}'&SplitQuantity=${sCantidad}m&SplitQuantityUnit='${sUM}'`;
                    } else {
                        sUrl = `/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/PickOneItemWithSalesQuantity?DeliveryDocument='${sKey}'&DeliveryDocumentItem='${sItem}'&ActualDeliveryQuantity=${sCantidad}m&DeliveryQuantityUnit='${sUM}'`;
                    }





                    let sModelName = "API_OUTBOUND_DELIVERY_SRV";
                    let sEntitySetToken = "?";

                    console.log("Picking: " + sUrl);

                    this.fetchCsrfToken(sModelName, sEntitySetToken).then((sToken) => {

                        $.ajax({
                            url: sUrl,
                            method: "POST",
                            headers: {
                                "X-CSRF-Token": sToken,
                                "If-Match": oHeaders.etag
                            },
                            contentType: "application/json",
                            dataType: "json",
                            success: (oData) => {
                                MessageToast.show("Picking exitoso", oData);
                                this.getView().setBusy(false);
                            },
                            error: (jqXHR) => {
                                console.log("error en picking:", jqXHR)
                                let sMessage = this._getAjaxErrorMessage(jqXHR, oBundle);
                                this._showErrorMessage(sMessage, oBundle);
                                this.getView().setBusy(false);
                            }
                        });
                    }).catch((oError) => {
                        this.getView().setBusy(false);
                        this._showErrorMessage("No se pudo obtener el Token", this.getResourceBundle());
                        console.error("Error en fetchCsrfToken", oError);
                    });




                }).catch((oError) => {
                    this.getView().setBusy(false);
                    this._showErrorMessage("No se pudo obtener el ETag o Token", this.getResourceBundle());
                    console.error("Error en getETagAndToken", oError);
                });
            },

            onContabilizarEntrega: async function () {

                let oLocalModel = this.getOwnerComponent().getModel("localModel").getData();
                let oBundle = this.getResourceBundle();

                this.getETagAndToken().then((oHeaders) => {
                    let sKey = oLocalModel.Header.referencia;
                    let sItem = oLocalModel.ReferenceItemSelected.ReferenceSDDocumentItem;
                    let sUrl = `/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/PostGoodsIssue?DeliveryDocument='${sKey}'`;


                    let sModelName = "API_OUTBOUND_DELIVERY_SRV";
                    let sEntitySetToken = "?";

                    this.fetchCsrfToken(sModelName, sEntitySetToken).then((sToken) => {

                        $.ajax({
                            url: sUrl,
                            method: "POST",
                            headers: {
                                "X-CSRF-Token": sToken,
                                "If-Match": oHeaders.etag
                            },
                            contentType: "application/json",
                            dataType: "json",
                            success: (oData) => {
                                MessageToast.show("Delivery Completed");
                                this.getView().setBusy(false);
                            },
                            error: (jqXHR) => {
                                let sMessage = this._getAjaxErrorMessage(jqXHR, oBundle);
                                this._showErrorMessage(sMessage, oBundle);
                                this.getView().setBusy(false);
                            }
                        });
                    }).catch((oError) => {
                        this.getView().setBusy(false);
                        this._showErrorMessage("No se pudo obtener el Token", this.getResourceBundle());
                        console.error("Error en fetchCsrfToken", oError);
                    });




                }).catch((oError) => {
                    this.getView().setBusy(false);
                    this._showErrorMessage("No se pudo obtener el ETag o Token", this.getResourceBundle());
                    console.error("Error en getETagAndToken", oError);
                });

            },


            /**
             * Controla la visibilidad del botón "Picking" basado en el estado de los ítems de entrega.
             * Oculta el botón si todos los ítems están con PickingStatus 'C' (completo).
             */
            setVisibleBtnPicking: async function () {
                const oLocalModel = this.getOwnerComponent().getModel("localModel").getData();

                this.checkPickingAndToggleButton(
                    oLocalModel.Header.referencia,
                    "API_OUTBOUND_DELIVERY_SRV",
                    "/A_OutbDeliveryItem",                    // ID del botón en la vista
                    "/Header/btnPicking"              // Propiedad del oDisplayModel usada en binding
                );
            },


            /**
             * Controla la visibilidad del botón "Contabilizar" usando binding.
             * Oculta el botón si todos los ítems están con PickingStatus 'C'.
             */
            setVisibleBtnContinuar: async function () {
                const oLocalModel = this.getOwnerComponent().getModel("localModel").getData();

                this.checkPickingAndToggleButton(
                    oLocalModel.Header.referencia,
                    "API_OUTBOUND_DELIVERY_SRV",
                    "/A_OutbDeliveryItem",
                    "/Header/btnContabilizar"         // Propiedad del oDisplayModel
                );
            },

            onShowReceiver: function () {

                // Mostrar el dialog de ítems
                let oView = this.getView();
                if (!this.oReceiverDialog) {
                    this.oReceiverDialog = Fragment.load({
                        id: oView.getId(),
                        name: "delmex.zmmhandheld.view.fragments.ReceiverDataDialog",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.open();
                        oView.setBusy(false);
                        return oDialog;
                    });
                } else {
                    this.oReceiverDialog.then(function (oDialog) {
                        oDialog.open();
                        oView.setBusy(false);
                    });
                }


            },

            onCloseReceiverDialog: function () {
                if (this.oReceiverDialog) {
                    this.oReceiverDialog.then(function (oDialog) {
                        oDialog.close();
                    });
                }
            },

            onBuildRequest: function () {
                let oLocalModel = this.getOwnerComponent().getModel("localModel").getData();
                let oDisplayModel = this.getOwnerComponent().getModel("oDisplayModel").getData();
                let oPostingDate = oLocalModel.Header.fecha_cont + "T00:00:00";
                let oDocDate = oLocalModel.Header.fecha_doc + "T00:00:00";
                let oGoodMovement = this.getGoodMovement();
                let sClaveMov = oLocalModel.Header.claveMov;
                let oGoodsMovementType = oLocalModel.ReferenceItems.GoodsMovementType ||  oLocalModel.ReferenceItemSelected.GoodsMovementType;
                let oManufacturingOrder = oDisplayModel.Header.referencia ? oLocalModel.Header.referencia : '';

                // 1️⃣ Crear base del JSON de request
                let oRequestJson = {
                    PostingDate: oPostingDate,
                    DocumentDate: oDocDate,
                    GoodsMovementCode: oGoodMovement,
                    MaterialDocumentHeaderText: oLocalModel.Header.texto_cabecera,
                    to_MaterialDocumentItem: []
                };

                // 2️⃣ Crear item completo con todos los posibles campos
                let oItem = {
                    Material: oLocalModel.DataPosition.material,
                    Plant: oLocalModel.DataPosition.centro,
                    Batch: oLocalModel.DataPosition.lote,
                    StorageLocation: oLocalModel.DataPosition.almacen,
                    GoodsMovementType: oGoodsMovementType,
                    IsCompletelyDelivered: false,
                    QuantityInEntryUnit: parseFloat(oLocalModel.DataPosition.cantidad).toFixed(3),
                    EntryUnit: oLocalModel.DataPosition.um,
                    CostCenter: oLocalModel.DataPosition.ceco,
                    MaterialDocumentItemText: oLocalModel.DataPosition.txt_posicion, // 201, 261, 551, 303 y 309
                    GoodsMovementReasonCode: oLocalModel.DataPosition.motivo, //551, 201, 601 (diferente catalogo de motivo)


                    ManufacturingOrder: oManufacturingOrder,
                    Reservation: oLocalModel.ReferenceItemSelected.Reservation || '',
                    ReservationItem: oLocalModel.ReferenceItemSelected.ReservationItem || '',
                    ReservationItemRecordType: oLocalModel.ReferenceItemSelected.ReservationItemRecordType || '',


                    
                    Delivery: sClaveMov === '601-03' ? oLocalModel.Header.referencia : '',
                    DeliveryItem: oLocalModel.ReferenceItemSelected.ReferenceSDDocumentItem,
                    GoodsMovementRefDocType: oLocalModel.ReferenceItemSelected.GoodsMovementRefDocType || '',
                    PurchaseOrder: sClaveMov === '101-01' ? oLocalModel.Header.referencia : '',
                    PurchaseOrderItem: sClaveMov === '101-01' ? oLocalModel.ReferenceItemSelected.PurchaseOrderItem : '',
                    IssgOrRcvgMaterial: oLocalModel.DataPosition.IssgOrRcvgMaterial,
                    IssuingOrReceivingPlant: oLocalModel.DataPosition.IssuingOrReceivingPlant,
                    IssuingOrReceivingStorageLoc: oLocalModel.DataPosition.IssuingOrReceivingStorageLoc
                };

                






                // 3️⃣ Agregar el item al array
                oRequestJson.to_MaterialDocumentItem.push(oItem);

                // 4️⃣ Eliminar campos no requeridos según clave de movimiento
                let iLastIndex = oRequestJson.to_MaterialDocumentItem.length - 1;

                switch (sClaveMov) {
                    case c_303:
                        this.removeFieldsIfNeeded(
                            oRequestJson.to_MaterialDocumentItem,
                            iLastIndex,
                            ["IssgOrRcvgMaterial", "ManufacturingOrder", "Reservation", "ReservationItem", "ReservationItemRecordType", "GoodsMovementReasonCode",
                                "Delivery", "DeliveryItem", "GoodsMovementRefDocType", "PurchaseOrder", "PurchaseOrderItem", "IssuingOrReceivingPlant",
                                "IssuingOrReceivingStorageLoc"]
                        );
                        break;
                    case c_309:
                        this.removeFieldsIfNeeded(
                            oRequestJson.to_MaterialDocumentItem,
                            iLastIndex,
                            ["ManufacturingOrder", "Reservation", "ReservationItem", "ReservationItemRecordType", "GoodsMovementReasonCode",
                                "Delivery", "DeliveryItem", "GoodsMovementRefDocType", "PurchaseOrder", "PurchaseOrderItem", "IssuingOrReceivingPlant",
                                "IssuingOrReceivingStorageLoc"]
                        );
                        break;

                    case c_101_01:
                        this.removeFieldsIfNeeded(
                            oRequestJson.to_MaterialDocumentItem,
                            iLastIndex,
                            ["ManufacturingOrder", "Reservation", "ReservationItem", "ReservationItemRecordType", "GoodsMovementReasonCode", "Delivery", "DeliveryItem",
                                "GoodsMovementRefDocType", "IssuingOrReceivingPlant", "IssuingOrReceivingStorageLoc"]
                        );
                        break;

                    case c_101_02:

                        this.removeFieldsIfNeeded(
                            oRequestJson.to_MaterialDocumentItem,
                            iLastIndex,
                            ["Batch", "IssgOrRcvgMaterial", "Reservation", "ReservationItem", "ReservationItemRecordType", "GoodsMovementReasonCode",
                                "Delivery", "DeliveryItem", "PurchaseOrder", "PurchaseOrderItem", "IssuingOrReceivingPlant",
                                "IssuingOrReceivingStorageLoc"]
                        );
                        break;

                    case c_601:
                        this.removeFieldsIfNeeded(
                            oRequestJson.to_MaterialDocumentItem,
                            iLastIndex,
                            ["PurchaseOrder", "PurchaseOrderItem"]
                        );
                        break;

                    case c_201:
                    case c_551:

                        if(!oLocalModel.DataPosition.motivo || oLocalModel.DataPosition.motivo === '0'){
                            this.getView().setBusy(false);
                            return false;
                        }

                        this.removeFieldsIfNeeded(
                            oRequestJson.to_MaterialDocumentItem,
                            iLastIndex,
                            ["GoodsMovementReasonCode", "Delivery", "DeliveryItem", "GoodsMovementRefDocType", "PurchaseOrder", "PurchaseOrderItem",
                                "IssuingOrReceivingPlant", "IssuingOrReceivingStorageLoc", "IssgOrRcvgMaterial"]
                        );
                        break;

                    case c_202: // y 552
                    case c_261:

                        this.removeFieldsIfNeeded(
                            oRequestJson.to_MaterialDocumentItem,
                            iLastIndex,
                            ["CostCenter", "GoodsMovementReasonCode", "Delivery", "DeliveryItem", "GoodsMovementRefDocType", "PurchaseOrder", "PurchaseOrderItem",
                                "IssuingOrReceivingPlant", "IssuingOrReceivingStorageLoc", "IssgOrRcvgMaterial"]
                        );
                        break;

                    case c_262:

                    case c_552:
                    case c_602:
                    case c_102_01:
                    case c_102_02:
                    case c_304:
                    case c_310:
                        // Aquí podrías eliminar campos si aplica
                        break;

                    default:
                        // Podrías registrar un warning si el movimiento es inesperado
                        break;
                }

                // 5️⃣ Validar cantidad contra el máximo permitido
                let oInputTotal = parseFloat(oLocalModel.DataPosition.cantidad);
                let oTotalMaterial = parseFloat(oLocalModel.ReferenceItemSelected.cantidad);

                if (oInputTotal > oTotalMaterial) {
                    MessageBox.alert(this.getResourceBundle().getText("failed.quantity", [oTotalMaterial]));
                    this.getView().setBusy(false);
                    return;
                }

                console.log("Payload final:", oRequestJson);
                return oRequestJson;
            },



            getGoodMovement: function () {

                let oReurn = false;
                let oLocalModel = this.getOwnerComponent().getModel("localModel").getData();

                let oClaseMovModel = this.getOwnerComponent().getModel("ClaseMovList").getData();
                let oGoodMovementItem = oClaseMovModel.find(item =>
                    item.ClaveMov === oLocalModel.Header.claveMov
                );

                if (oGoodMovementItem) {
                    oReurn = oGoodMovementItem.GoodMovType;
                }
                return oReurn;

            }


        });
    });
