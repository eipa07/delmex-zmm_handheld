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

        var oPositions = [];

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


                var odisplayModel = new sap.ui.model.json.JSONModel();

                odisplayModel.loadData("./utils/DisplayConfiguration.json", false);
                //_pdfStructureModel.setData(_jsonPDF);
                this.getView().setModel(odisplayModel, "oDisplayModel");
                console.log(odisplayModel);


                try {
                    // 1. Intenta consultar la entidad con una clave de ejemplo
                    this._loadAllPlantsPaginated();
                } catch (e) {
                    // 3. El error ya fue manejado internamente con MessageBox
                }


            },

            onClaseMovChange: function (oEvent) {
                let sSelectedKey = oEvent.getParameter("selectedItem").getKey();
                let sSelectext = oEvent.getParameter("selectedItem").getText();
                this.getOwnerComponent().getModel("localModel").setProperty("/Header/claseMov", sSelectedKey);
                this.getOwnerComponent().getModel("localModel").setProperty("/Header/textClaseMov", sSelectext);

                // Deshabilitar elementos dependiendo de la seleccion
                let oSelectedKey = oEvent.getSource().getSelectedKey();
                const c_601 = '601';
                const c_602 = '602';
                const c_551 = '551';
                const c_552 = '552';
                const c_201 = '201';
                const c_202 = '202';
                const c_261 = '261';
                const c_262 = '262';
                const c_999 = "999"

                if (oSelectedKey === c_601 || oSelectedKey === c_602 || oSelectedKey === c_261 || oSelectedKey === c_262) {
                    this.getView().getModel("oDisplayModel").setProperty("/Posiciones/ceco", false);
                    this.getView().getModel("oDisplayModel").setProperty("/Posiciones/motivo", false);
                    this.getView().getModel("oDisplayModel").setProperty("/Header/referencia", true);
                }

                if (oSelectedKey === c_551 || oSelectedKey === c_552 || oSelectedKey === c_201 || oSelectedKey === c_202 || oSelectedKey === c_999) {
                    this.getView().getModel("oDisplayModel").setProperty("/Header/referencia", false);
                    this.getView().getModel("oDisplayModel").setProperty("/Posiciones/ceco", true);
                    this.getView().getModel("oDisplayModel").setProperty("/Posiciones/motivo", true);
                }

                if (oSelectedKey === c_999) {
                    this.getView().getModel("oDisplayModel").setProperty("/Posiciones/ceco", true);
                    this.getView().getModel("oDisplayModel").setProperty("/Posiciones/motivo", true);
                    this.getView().getModel("oDisplayModel").setProperty("/Header/referencia", true);

                }


            },

            /* onGuardarFormulario: function () {
                const oView = this.getView();
                let oCantidad = Fragment.byId("scanner", "cantidadInput").getValue();

                const oData = {
                    material: Fragment.byId("scanner", "materialInput").getValue(),
                    cantidad: Fragment.byId("scanner", "cantidadInput").getValue(),
                    um: Fragment.byId("scanner", "umInput").getValue(),
                    lote: Fragment.byId("scanner", "loteInput").getValue(),
                    centro: Fragment.byId("scanner", "centroInput").getValue(),
                    almacen: Fragment.byId("scanner", "almacenInput").getValue(),
                    ceco: Fragment.byId("scanner", "cecoInput").getValue(),
                    motivo: Fragment.byId("scanner", "motivoInput").getValue()
                };

                // Guardar en modelo local (puedes ajustar la ruta o el nombre si es distinto)
                let oModel = this.getModel("positionsModel");
                let odataModel = oModel.getData();
                odataModel = odataModel.concat(oData || []);

                oModel.setProperty("/positions", odataModel);
                console.log("odataModel", odataModel);

                // Mostrar confirmación
                this.showSuccess("Datos guardados correctamente");

                // Limpiar campos
                this._limpiarCamposFormulario();
            }, */

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

                let bValid = this.validateHeaderFields();
                if (!bValid) {
                    return; // Detén si no es válido
                }

                let oModel = this.getOwnerComponent().getModel("localModel").getData();
                console.log(oModel);
                let oView = this.getView();

                // Validar si material requiere batch y agregarlo al array
                let sKey = oModel.Header.referencia
                let iPageSize = '5000';
                let oBundle = this.getResourceBundle();
                const const_si = oBundle.getText("yes");
                const const_no = oBundle.getText("no");


                let oModel_RefDetail = "API_PRODUCTION_ORDER_2_SRV";
                let oEntity_RefDetail = "A_ProductionOrderComponent_4";
                //let oReferenceDetail = await this.readOneAjax(oModel_RefDetail, oEntity_RefDetail, sKey, '', '', '', '');
                let oReference = await this.readAllPagedAjax(oModel_RefDetail, oEntity_RefDetail, iPageSize, sKey);
                let oRefItems = oReference.d.results;
                console.log("A_ProductionOrderComponent_4", oRefItems);

                // Validar si material requiere batch y agregarlo al array
                let oItems = await Promise.all(
                    oRefItems.map(async (element) => {
                        let oCant_disponible = parseFloat(element.RequiredQuantity) - parseFloat(element.WithdrawnQuantity);
                        let isBatchRequired = await this.searchBatchRequired(element);
                        let sMaterialText = await this.onSearchMaterialText(element);
                        return {
                            material: element.Material,
                            txt_material: sMaterialText,
                            cantidad: oCant_disponible,
                            um: element.BaseUnitSAPCode,
                            centro: element.Plant,
                            almacen: element.StorageLocation,
                            isBatchRequired: isBatchRequired ? const_si : const_no
                        };
                    })
                );

                let oLocalModel = this.getOwnerComponent().getModel("localModel");
                oLocalModel.setProperty("/ReferenceItems", oItems);





                // Verifica si Ya existe
                if (!this.oItemsDialog) {
                    this.oItemsDialog = Fragment.load({
                        id: oView.getId(), // Usa el ID de la vista como scope
                        name: "delmex.zmmhandheld.view.fragments.ReferenceItemsDialog",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.open(); // <<< Abre el Dialog aquí!
                        oView.setBusy(false);
                        return oDialog;
                    });
                } else {
                    // Si ya existe, recuerda que es una Promise, así que espera
                    this.oItemsDialog.then(function (oDialog) {
                        oDialog.open();
                        oView.setBusy(false);
                    });
                }
            },

            searchBatchRequired: async function (element) {


                // Buscar si el Material requiere Batch para ser procesado
                let oModel_BatchRequired = "productApi";
                let oEntity_BatchRequired = "Product";
                let sMaterialBatch = await this.readOneAjax(oModel_BatchRequired, oEntity_BatchRequired, element.ManufacturingOrder, element.Material, '', '', '', '');
                let isBatchRequired = sMaterialBatch.value[0].IsBatchManagementRequired;
                return isBatchRequired;


            },

            onSearchMaterialText: async function (element) {
                // Texto de material
                let oModel_MatText = "productApi";
                let oEntity_MatText = "ProductDescription";
                let sMaterialData = await this.readOneAjax(oModel_MatText, oEntity_MatText, element.ManufacturingOrder, element.Material, '', '', '', '');
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

            onSearchBatchList: async function (element) {
                // Texto de material
                let oModel = "apiBatch";
                let oEntity = "Batch";

                let sList = await this.readOneAjax(oModel, oEntity, '', element.material, '', '', '', '');
                let sBatchList = sList.d.results;

                var oBatchModel = new sap.ui.model.json.JSONModel();
                oBatchModel.setData(sBatchList);
                this.getView().setModel(oBatchModel, "BatchList");
                console.log(sBatchList);

                return sBatchList;
            },

            onProcesarItem: function (oEvent) {

                let oModel = this.getModel("localModel");
                let sPath = oEvent.getSource().getBindingContext("localModel").getPath(); // ej: /Positions/2
                let aPositions = oModel.getProperty("/ReferenceItems");
                let iIndex = parseInt(sPath.split("/")[2], 10);

                console.log(iIndex);

                if (!isNaN(iIndex) && iIndex >= 0 && iIndex < aPositions.length) {
                    this.getOwnerComponent().getModel("localModel").setProperty("/ReferenceItemSelected", aPositions[iIndex]);
                    this.getOwnerComponent().getModel("localModel").setProperty("/ReferenceItemSelected/index", iIndex);
                    this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/material", aPositions[iIndex].material);
                    this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/lote", aPositions[iIndex].lote);

                    this.onSearchBatchList(aPositions[iIndex]);

                    // Paso 1: Obtener IconTabBar por ID
                    let oIconTabBar = this.byId("mainTabs");

                    // Paso 2: Cambiar la pestaña activa por su key
                    oIconTabBar.setSelectedKey("datos");

                    /* let oDataPosition = {
                        material: aPositions[iIndex].Material,
                        txt_material: aPositions[iIndex].txt_material,
                        cantidad: aPositions[iIndex].cantidad,
                        um: aPositions[iIndex].um,
                        lote: aPositions[iIndex].lote, // Batch
                        centro: aPositions[iIndex].centro, //Planta
                        almacen: aPositions[iIndex].almacen,
                        ceco: aPositions[iIndex].ceco,
                        motivo: aPositions[iIndex].motivo,
                        txt_posicion: aPositions[iIndex].txt_posicion,
                        txt_posicion_historico: aPositions[iIndex].txt_posicion_historico,
                        cantidad_disponible: aPositions[iIndex].cantidad_disponible,
                        PurchaseOrderItem: aPositions[iIndex].PurchaseOrderItem,
                        GoodsMovementRefDocType: aPositions[iIndex].GoodsMovementRefDocType,
                        numero_documento: aPositions[iIndex].numero_documento,
                        isBatchRequired: aPositions[iIndex].isBatchRequired, // true requiere lote | false no requiere lote
                    } */
                }

                this.onCloseItemsDialog();

            },




            onSavePosition: function () {

                if (!this.getOwnerComponent().getModel("localModel").getProperty("/DataPosition/cantidad")) {
                    let oInputCantidad = this.getView().byId("cantidadInput").getValue();
                    this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/cantidad", oInputCantidad);
                }

                let oModel = this.getOwnerComponent().getModel("localModel").getData().DataPosition;

                //let flagCantidad = this.validarCantidad(parseFloat(oModel.cantidad), parseFloat(oModel.cantidad_disponible));
                let flagCantidad = true;
                if (flagCantidad) {
                    let _position = {
                        material: oModel.material,
                        cantidad: oModel.cantidad,
                        um: oModel.um,
                        lote: oModel.lote,
                        centro: oModel.centro,
                        almacen: oModel.almacen,
                        ceco: oModel.ceco,
                        motivo: oModel.motivo,
                        txt_posicion: oModel.txt_posicion,
                        txt_material: oModel.txt_material,
                        isBatchRequired: oModel.isBatchRequired
                    }
                    oPositions.push(_position);
                    let oLocalModel = this.getOwnerComponent().getModel("localModel");
                    oLocalModel.setProperty("/Positions", oPositions);
                    this._actualizarContadorPosiciones();

                    console.log(oLocalModel.getProperty("/Positions"));
                }



            },

            onClearPosition: function () {
                this.getView().byId("materialInput").setValue();
                this.getView().byId("cantidadInput").setValue();
                this.getView().byId("umInput").setValue();
                this.getView().byId("loteInput").setValue();
                this.getView().byId("centroInput").setValue();
                this.getView().byId("almacenInput").setValue();
                this.getView().byId("cecoInput").setValue();
                this.getView().byId("motivoInput").setValue();
            },

            onEliminarPosicion: function (oEvent) {
                let oModel = this.getModel("localModel");
                let oBundle = this.getResourceBundle();

                let sPath = oEvent.getSource().getBindingContext("localModel").getPath(); // ej: /Positions/2
                let aPositions = oModel.getProperty("/Positions");
                let iIndex = parseInt(sPath.split("/")[2], 10);

                if (!isNaN(iIndex) && iIndex >= 0 && iIndex < aPositions.length) {
                    MessageBox.confirm(oBundle.getText("mensajeConfirmacionEliminar"), {
                        title: oBundle.getText("tituloConfirmacionEliminar"),
                        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                        emphasizedAction: MessageBox.Action.OK,
                        onClose: (sAction) => {
                            if (sAction === MessageBox.Action.OK) {
                                let sMaterial = aPositions[iIndex].material || "";
                                aPositions.splice(iIndex, 1);
                                oModel.setProperty("/Positions", aPositions);
                                this._actualizarContadorPosiciones();

                                MessageToast.show(oBundle.getText("mensajePosicionEliminada", [sMaterial]));
                            }
                        }
                    });
                } else {
                    this.showError(oBundle.getText("errorIndiceInvalidoEliminar"));
                }
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

            onCleanHeader: function () {
                this.getView().byId("header_input_clasemov").setValue();
                this.getView().byId("header_input_fecha_doc").setValue();
                this.getView().byId("header_input_fecha_cont").setValue();
                this.getView().byId("header_input_fecha_referencia").setValue();
                this.getView().byId("header_input_fecha_texto_cabecera").setValue();
            },

            /**
             * Carga datos desde AJAX y los imprime (o enlaza a modelo).
             */
            _loadAllPlantsPaginated: async function () {
                try {
                    let aPlants = await this.readAllPagedAjax();
                    console.log("Total cargado:", aPlants.length);
                    this.getView().getModel("localModel").setProperty("/productPlants", aPlants);
                } catch (e) {
                    // Ya está manejado visualmente
                }
            },

            onBuscarDetalle: async function () {
                let oView = this.getView();
                let oLocalModelData = this.getOwnerComponent().getModel("localModel").getData();
                let oBatchListModel = oView.getModel("BatchList");
                let oBundle = this.getResourceBundle();

                console.log("ReferenceItemSelected", oLocalModelData.ReferenceItemSelected);

                // 1️⃣ Tomar valores de Inputs
                let sMaterial = oView.byId("materialInput").getValue()?.trim().toUpperCase();
                let sBatch = oView.byId("loteInput").getValue()?.trim().toUpperCase();

                // 2️⃣ Validar campos obligatorios
                if (!sMaterial || !sBatch) {
                    MessageToast.show(oBundle.getText("position.missingFields"));
                    return;
                }

                // 3️⃣ Obtener datos del modelo BatchList
                let aBatchData = oBatchListModel.getData() || [];

                // 4️⃣ Buscar combinación material-lote
                let oMatch = aBatchData.find(item =>
                    item.Material === sMaterial && item.Batch === sBatch
                );

                if (oMatch) {
                    MessageToast.show(oBundle.getText("position.batchFound"));

                    // 5️⃣ Actualizar datos fijos de la selección
                    let oLocalModel = this.getOwnerComponent().getModel("localModel");
                    oLocalModel.setProperty("/DataPosition/cantidad", oLocalModelData.ReferenceItemSelected.cantidad);
                    oLocalModel.setProperty("/DataPosition/um", oLocalModelData.ReferenceItemSelected.um);
                    oLocalModel.setProperty("/DataPosition/centro", oLocalModelData.ReferenceItemSelected.centro);
                    oLocalModel.setProperty("/DataPosition/almacen", oLocalModelData.ReferenceItemSelected.almacen);
                    oLocalModel.setProperty("/DataPosition/txt_material", oLocalModelData.ReferenceItemSelected.txt_material);

                    // 6️⃣ Esperar texto de detalle (ahora usando await)
                    let sKey = oLocalModelData.Header.referencia;
                    let oClaseMov = oLocalModelData.Header.claseMov;
                    let sDetailText = await this.onGetDetailText(sKey, sMaterial, sBatch, oClaseMov);

                    // 7️⃣ Guardar el texto final en el modelo
                    oLocalModel.setProperty("/DataPosition/txt_posicion_historico", sDetailText);

                } else {
                    // Si no hay match y el batch es requerido: mostrar mensaje
                    if (oLocalModelData.ReferenceItemSelected.isBatchRequired) {
                        MessageToast.show(oBundle.getText("position.batchNotFound"));
                    }
                }
            },


            /*  onBuscarDetalle: async function () {
 
                 let oModelName = "API_MATERIAL_DOCUMENT_SRV";
                 let oEntity = "A_MaterialDocumentItem";
                 let olocalModel = this.getOwnerComponent().getModel("localModel").getData();
                 let sKey = olocalModel.Header.referencia; //"1000004";
                 let sMaterial = olocalModel.DataPosition.material;
                 let sBatch = olocalModel.DataPosition.lote;
                 let sPlant = '';
                 let sLocation = '';
               
 
                 try {
                     let sOrderDetail = await this.readOneAjax(oModelName, oEntity, sKey, sMaterial, sBatch, sPlant, sLocation);
                     //console.log("API_MATERIAL_DOCUMENT_SRV:", sOrderDetail);
                     this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/um", sOrderDetail.d.results[0].EntryUnit);
                     this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/centro", sOrderDetail.d.results[0].Plant);
                     this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/almacen", sOrderDetail.d.results[0].StorageLocation);
                     this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/lote", sOrderDetail.d.results[0].Batch);
                     let oDetailText = this.onGetDetailText(sKey, sMaterial, sBatch);
                     this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/txt_posicion_historico", oDetailText);
 
 
                     // Header tab Texto cabecera
                     //this.getOwnerComponent().getModel("localModel").setProperty("/Header/texto_cabecera", sOrderDetail.d.results[0].MaterialDocumentItemText);
 
                     // Cantidad Disponible
                     let oModel_MatDoc = "API_PRODUCTION_ORDER_2_SRV";
                     //let oEntity_MatDoc = "A_ProductionOrder_2";
                     let oEntity_MatDoc = "A_ProductionOrderComponent_4";
                     sPlant = sOrderDetail.d.results[0].Plant;
                     sLocation = sOrderDetail.d.results[0].StorageLocation;
                     let sQuantityDetail = await this.readOneAjax(oModel_MatDoc, oEntity_MatDoc, sKey, sMaterial, sBatch, sPlant, sLocation);
 
 
                     let oCant_disponible = parseFloat(sQuantityDetail.d.results[0].RequiredQuantity) - parseFloat(sQuantityDetail.d.results[0].WithdrawnQuantity);
                     console.log("cantidad disponible: oCant_disponible: " + oCant_disponible);
                     if (oCant_disponible > 0) {
                         this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/cantidad_disponible", oCant_disponible);
                         this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/cantidad", oCant_disponible);
                     } else {
                         const oBundle = this.getResourceBundle();
                         let sTexto = oBundle.getText("error.cantidad_no_disponible", [oCant_disponible]);
                         MessageBox.error(sTexto);
                     }
 
 
                     // Texto de material
                     let oModel_MatText = "productApi";
                     let oEntity_MatText = "ProductDescription";
                     //let sMaterialText = await this.readOneAjax(oModel_MatText, oEntity_MatText, oEmpty, sMaterial, oEmpty, oEmpty, oEmpty);
                     let sMaterialData = await this.readOneAjax(oModel_MatText, oEntity_MatText, sKey, sMaterial, sBatch, sPlant, sLocation);
                     console.log("sMaterialText", sMaterialData);
                     let sMaterialText = sMaterialData.value[0].ProductDescription;
                     this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/txt_material", sMaterialText);
 
 
                     // Material requiere Batch para ser procesado
                     let oModel_BatchRequired = "productApi";
                     let oEntity_BatchRequired = "Product";
                     //let sMaterialText = await this.readOneAjax(oModel_MatText, oEntity_MatText, oEmpty, sMaterial, oEmpty, oEmpty, oEmpty);
                     let sMaterialBatch = await this.readOneAjax(oModel_BatchRequired, oEntity_BatchRequired, sKey, sMaterial, sBatch, sPlant, sLocation);
                     let isBatchRequired = sMaterialBatch.value[0].IsBatchManagementRequired;
                     this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/txt_material", isBatchRequired);
 
                 } catch (e) {
                     // Ya está manejado visualmente
                 }
 
             }, */

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




                /* if (!iCantidad) {
                    const oBundle = this.getResourceBundle();
                    let sTexto = oBundle.getText("error.cantidad_no_valida", [iDisponible]);
                    MessageBox.warning(sTexto);

                } else if (iCantidad > iDisponible) {
                    const oBundle = this.getResourceBundle();
                    let sTexto = oBundle.getText("error.cantidad_no_disponible", [iDisponible]);
                    MessageBox.warning(sTexto);
                } else {
                    oReturn = true;
                } */

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

                try {
                    // 1️⃣ Obtener datos locales del modelo local
                    let oLocalModel = this.getOwnerComponent().getModel("localModel").getData();
                    let sModelName = "API_MATERIAL_DOCUMENT_SRV";
                    let sEntitySet = "A_MaterialDocumentHeader";
                    let oBundle = this.getResourceBundle();

                    // 2️⃣ Formatear la fecha de contabilización (ISO con hora 00:00:00)
                    let oDate = oLocalModel.Header.fecha_cont + "T00:00:00";

                    // 3️⃣ Obtener la clave del movimiento de mercancía según la lógica de negocio
                    let oGoodMovement = this.getGoodMovement(oLocalModel.Header.claseMov);

                    // 4️⃣ Validar que exista código válido
                    if (!oGoodMovement) {
                        sap.m.MessageBox.error(this.getResourceBundle().getText("error.missingMovement"));
                        return;
                    }

                    // 5️⃣ Inicializar el objeto JSON con cabecera y array vacío de ítems
                    let oRequestJson = {
                        PostingDate: oDate,
                        GoodsMovementCode: oGoodMovement,
                        MaterialDocumentHeaderText: oLocalModel.Header.texto_cabecera,
                        to_MaterialDocumentItem: [] // Lista de posiciones
                    };

                    // 6️⃣ Recorrer todos los ítems seleccionados y agregarlos al array
                    /* oLocalModel.Positions.forEach((element) => {
                        oRequestJson.to_MaterialDocumentItem.push({
                            Material: element.material,                           // Código de material
                            Plant: element.centro,                                // Planta / Centro
                            Batch: element.lote,                                  // Lote, valor default si no viene
                            StorageLocation: element.almacen,                     // Almacén
                            GoodsMovementType: oLocalModel.Header.claseMov,       // Clase de movimiento
                            MaterialDocumentItemText: element.texto || "Rollo",   // Texto de posición
                            ManufacturingOrder: oLocalModel.Header.referencia,    // Orden de fabricación
                            IsCompletelyDelivered: false,                         // Indicador de entrega
                            QuantityInEntryUnit: element.cantidad,                // Cantidad
                            CostCenter: element.ceco,                             // Centro de costo
                            MaterialDocumentItemText: element.txt_material
                        });
                    }); */

                    oRequestJson.to_MaterialDocumentItem.push({
                        Material: oLocalModel.DataPosition.material,                           // Código de material
                        Plant: oLocalModel.DataPosition.centro,                                // Planta / Centro
                        Batch: oLocalModel.DataPosition.lote,                                  // Lote, valor default si no viene
                        StorageLocation: oLocalModel.DataPosition.almacen,                     // Almacén
                        GoodsMovementType: oLocalModel.Header.claseMov,       // Clase de movimiento
                        MaterialDocumentItemText: oLocalModel.DataPosition.texto || "Rollo",   // Texto de posición
                        ManufacturingOrder: oLocalModel.Header.referencia,    // Orden de fabricación
                        IsCompletelyDelivered: false,                         // Indicador de entrega
                        QuantityInEntryUnit: oLocalModel.DataPosition.cantidad,                // Cantidad
                        CostCenter: oLocalModel.DataPosition.ceco,                             // Centro de costo
                        MaterialDocumentItemText: oLocalModel.DataPosition.txt_material
                    });

                    // 7️⃣ Mostrar payload final en consola para validación (opcional)
                    let oRequestJson_2 = {
                        "PostingDate": "2025-02-03T15:00:00",
                        "GoodsMovementCode": "03",
                        "MaterialDocumentHeaderText": "Cabecera HandHeld",
                        "to_MaterialDocumentItem": [
                            {
                                "Material": "MP50002T",
                                "Plant": "1000",
                                "Batch": "TEST1",
                                "StorageLocation": "1000",
                                "GoodsMovementType": "201",
                                "MaterialDocumentItemText": "Rollo",
                                "ManufacturingOrder": "1000140",
                                "IsCompletelyDelivered": false,
                                "QuantityInEntryUnit": "1",
                                "CostCenter": "5110101208"
                            }
                        ]
                    };
                    console.log("Payload final:", oRequestJson_2);


                    // Paso 8️⃣ Obtener CSRF Token usando helper del BaseController
                    let sToken = await this.fetchCsrfToken(sModelName, sEntitySet);
                    console.log("CSRF Token obtenido:", sToken);

                    // Paso 9 Ejecutar POST usando helper del BaseController
                    let oResponse = await this.postEntityAjax(sModelName, sEntitySet, oRequestJson, sToken);

                    sap.m.MessageToast.show(oBundle.getText("success.movCreated"));
                    console.log("Respuesta del POST:", oResponse);
                    this.PopulatePositions(oResponse.d);

                } catch (e) {
                    console.error("Error en onCreateMov:", e);
                    this._showErrorMessage(oBundle.getText("error.unexpected"), oBundle);
                }
            },

            validateHeaderFields: function () {
                let oView = this.getView();
                let oBundle = this.getResourceBundle();
                let oLocalModel = this.getOwnerComponent().getModel("localModel");
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
                        id: "header_input_fecha_referencia",
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
                }
            
                return bValid;
            },
            


            onTabChanged: function (oEvent) {
                let sKey = oEvent.getParameter("key");
                if (sKey !== "cabecera") {
                    let bValid = this.validateHeaderFields();
                    if (!bValid) {
                        // 🚩 Si no es válido, forza volver al tab Cabecera
                        this.byId("mainTabs").setSelectedKey("cabecera");
                    }
                }
            },


            resetHeaderValidation: function () {
                let oView = this.getView();
                ["header_input_clasemov", "header_input_fecha_doc", "header_input_fecha_cont", "header_input_fecha_referencia"]
                    .forEach(id => oView.byId(id).setValueState("None"));
            },


            PopulatePositions: function(oResponse){

                let oLocalModel = this.getOwnerComponent().getModel("localModel");
                let oDataPosition = oLocalModel.getData().DataPosition;

                if(oResponse.MaterialDocument){
                    let _position = {
                        material: oDataPosition.material,
                        txt_material: oDataPosition.txt_material,
                        cantidad: oDataPosition.cantidad,
                        um: oDataPosition.um,
                        lote: oDataPosition.lote,
                        centro: oDataPosition.centro,
                        almacen: oDataPosition.almacen,
                        ceco: oDataPosition.ceco,
                        motivo: oDataPosition.motivo,
                        txt_posicion: oDataPosition.txt_posicion,
                        MaterialDocument: oResponse.MaterialDocument
                    }
                    oPositions.push(_position);
                    oLocalModel.setProperty("/Positions", oPositions);
                    this._actualizarContadorPosiciones();
                }

            }




        });
    });
