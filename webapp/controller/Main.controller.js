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
                const oModel = new JSONModel({
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

            onOpenScannerDialog: function () {
                const oView = this.getView();
                const _this = this;

                function waitForElement(id, timeout = 3000) {
                    return new Promise((resolve, reject) => {
                        const interval = 100;
                        let elapsed = 0;

                        const check = () => {
                            const el = document.getElementById(id);
                            if (el) {
                                resolve(el);
                            } else {
                                elapsed += interval;
                                if (elapsed >= timeout) {
                                    reject("No se encontró el contenedor QR en el tiempo esperado.");
                                } else {
                                    setTimeout(check, interval);
                                }
                            }
                        };

                        check();
                    });
                }

                if (!this.pScannerDialog) {
                    this.pScannerDialog = Fragment.load({
                        id: "scanner",
                        name: "delmex.zmmhandheld.view.fragments.BarcodeScannerDialog",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }

                this.pScannerDialog.then(function (oDialog) {
                    oDialog.open();

                    setTimeout(() => {
                        const oScannerHtml = _this.byId("scannerHtml");
                        if (oScannerHtml) {
                            oScannerHtml.setContent("<div id='qr-reader' style='width:100%;'></div>");
                        }

                        waitForElement("qr-reader", 3000).then(() => {
                            const html5QrCode = new Html5Qrcode("qr-reader");
                            _this._html5QrCode = html5QrCode;

                            html5QrCode.start(
                                { facingMode: "environment" },
                                {
                                    fps: 10,
                                    qrbox: { width: 350, height: 100 },
                                    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
                                },
                                (decodedText) => {
                                    html5QrCode.stop().then(() => {
                                        html5QrCode.clear();
                                        _this._html5QrCode = null;

                                        sap.ui.getCore().byId("materialInput").setValue(decodedText);
                                        sap.ui.getCore().byId("materialInput").focus();

                                        _this.showMessage("Código leído: " + decodedText);
                                        oDialog.close();
                                    });
                                },
                                (errorMsg) => {
                                    // error de escaneo
                                }
                            ).catch((err) => {
                                _this.showError("Error al iniciar la cámara: " + err);
                                oDialog.close();
                            });
                        }).catch((err) => {
                            _this.showError(err);
                            oDialog.close();
                        });
                    }, 200);
                });
            },

            onCloseScannerDialog: function () {
                const oDialog = Fragment.byId("scanner", "barcodeScannerDialog");
                if (!oDialog) {
                    this.showMessage("No se pudo cerrar el diálogo: no encontrado.");
                    return;
                }

                if (this._html5QrCode) {
                    this._html5QrCode.stop().then(() => {
                        this._html5QrCode.clear();
                        this._html5QrCode = null;
                        oDialog.close();
                    });
                } else {
                    oDialog.close();
                }
            },

            onScannerDialogClosed: function () {
                if (this._html5QrCode) {
                    this._html5QrCode.clear();
                    this._html5QrCode = null;
                }
            },

            onScannerHtmlRendered: function () {
                const _this = this;

                const el = document.getElementById("qr-reader");
                if (!el) {
                    const oScannerHtml = Fragment.byId("scanner", "scannerHtml");
                    oScannerHtml.setContent(/* HTML omitido para brevedad */);
                }

                setTimeout(() => {
                    const elFinal = document.getElementById("qr-reader");
                    if (!elFinal) {
                        _this.showMessage("No se pudo encontrar el contenedor QR.");
                        return;
                    }

                    const html5QrCode = new Html5QrCode("qr-reader");
                    _this._html5QrCode = html5QrCode;

                    html5QrCode.start(
                        { facingMode: "environment" },
                        {
                            fps: 10,
                            qrbox: { width: 350, height: 100 },
                            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
                            formatsToSupport: [
                                Html5QrcodeSupportedFormats.CODE_128,
                                Html5QrcodeSupportedFormats.EAN_13,
                                Html5QrcodeSupportedFormats.UPC_A,
                                Html5QrcodeSupportedFormats.UPC_E,
                                Html5QrcodeSupportedFormats.CODE_39,
                                Html5QrcodeSupportedFormats.CODE_93,
                                Html5QrcodeSupportedFormats.CODABAR,
                                Html5QrcodeSupportedFormats.ITF,
                                Html5QrcodeSupportedFormats.AZTEC,
                                Html5QrcodeSupportedFormats.DATA_MATRIX
                            ]
                        },
                        (decodedText) => {
                            html5QrCode.stop().then(() => {
                                html5QrCode.clear();
                                _this._html5QrCode = null;

                                sap.ui.getCore().byId("materialInput").setValue(decodedText);
                                sap.ui.getCore().byId("materialInput").focus();

                                _this.showMessage("Código leído: " + decodedText);
                                Fragment.byId("scanner", "barcodeScannerDialog").close();
                            });
                        },
                        (errorMsg) => {
                            // error escaneando
                        }
                    ).catch((err) => {
                        _this.showError("Error al iniciar la cámara: " + err);
                        Fragment.byId("scanner", "barcodeScannerDialog").close();
                    });
                }, 200);
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

                if (oSelectedKey === c_601 || oSelectedKey === c_602) {
                    this.getView().getModel("oDisplayModel").setProperty("/Posiciones/ceco", false);
                    this.getView().getModel("oDisplayModel").setProperty("/Posiciones/motivo", false);
                    this.getView().getModel("oDisplayModel").setProperty("/Header/referencia", true);
                }

                if (oSelectedKey === c_551 || oSelectedKey === c_552 || oSelectedKey === c_201 || oSelectedKey === c_202 || oSelectedKey === c_999) {
                    this.getView().getModel("oDisplayModel").setProperty("/Header/referencia", false);
                    this.getView().getModel("oDisplayModel").setProperty("/Posiciones/ceco", true);
                    this.getView().getModel("oDisplayModel").setProperty("/Posiciones/motivo", true);
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
                const aIds = [
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
                    const oInput = Fragment.byId("scanner", sId);
                    if (oInput) {
                        oInput.setValue("");
                    }
                });
            },

            onSaveHeader: function () {
                let oModel = this.getOwnerComponent().getModel("localModel").getData();
                console.log(oModel);
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
                        txt_posicion: oModel.txt_posicion
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
                const oModel = this.getModel("localModel");
                const oBundle = this.getResourceBundle();

                const sPath = oEvent.getSource().getBindingContext("localModel").getPath(); // ej: /Positions/2
                const aPositions = oModel.getProperty("/Positions");
                const iIndex = parseInt(sPath.split("/")[2], 10);

                if (!isNaN(iIndex) && iIndex >= 0 && iIndex < aPositions.length) {
                    MessageBox.confirm(oBundle.getText("mensajeConfirmacionEliminar"), {
                        title: oBundle.getText("tituloConfirmacionEliminar"),
                        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                        emphasizedAction: MessageBox.Action.OK,
                        onClose: (sAction) => {
                            if (sAction === MessageBox.Action.OK) {
                                const sMaterial = aPositions[iIndex].material || "";
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
                const oModel = this.getModel("localModel");
                const aPos = oModel.getProperty("/Positions") || [];
                const iCantidad = aPos.length;

                const oBundle = this.getResourceBundle();
                const sTexto = oBundle.getText("contadorPosiciones", [iCantidad]);

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
                    const aPlants = await this.readAllPagedAjax();
                    console.log("Total cargado:", aPlants.length);
                    this.getView().getModel("localModel").setProperty("/productPlants", aPlants);
                } catch (e) {
                    // Ya está manejado visualmente
                }
            },

            onBuscarDetalle: async function () {

                let oModelName = "API_MATERIAL_DOCUMENT_SRV";
                let oEntity = "A_MaterialDocumentItem";
                let olocalModel = this.getOwnerComponent().getModel("localModel").getData();
                let sKey = olocalModel.Header.referencia; //"1000004";
                let sMaterial = olocalModel.DataPosition.material;
                let sBatch = olocalModel.DataPosition.lote;
                let sPlant = '';
                let sLocation = '';
                let sFilter_flag = true;
                //sKey.padStart(12, '0');

                /*
                "https://my413406-api.s4hana.cloud.sap/sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV
                /A_MaterialDocumentItem(
                    MaterialDocumentYear='2025',
                    MaterialDocument='4900000203',
                    MaterialDocumentItem='1')",

                */

                try {
                    let sOrderDetail = await this.readOneAjax(oModelName, oEntity, sKey, sMaterial, sBatch, sPlant, sLocation, sFilter_flag);
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
                    let oEntity_MatDoc = "A_ProductionOrder_2";
                    sPlant = sOrderDetail.d.results[0].Plant;
                    sLocation = sOrderDetail.d.results[0].StorageLocation;
                    let sQuantityDetail = await this.readOneAjax(oModel_MatDoc, oEntity_MatDoc, sKey, sMaterial, sBatch, sPlant, sLocation, sFilter_flag);


                    let oCant_disponible = parseFloat(sQuantityDetail.d.results[0].TotalQuantity) - parseFloat(sQuantityDetail.d.results[0].MfgOrderConfirmedYieldQty);
                    console.log("cantidad disponible: oCant_disponible: " + oCant_disponible);
                    /* if (oCant_disponible > 0) {
                        this.getOwnerComponent().getModel("localModel").setProperty("/DataPosition/cantidad_disponible", oCant_disponible);
                    } else {
                        const oBundle = this.getResourceBundle();
                        let sTexto = oBundle.getText("error.cantidad_no_disponible", [oCant_disponible]);
                    } */

                    let oCantidad = parseFloat(this.getOwnerComponent().getModel("localModel").getProperty("/DataPosition/cantidad"));
                    //this.validarCantidad(oCantidad, oCant_disponible);



                } catch (e) {
                    // Ya está manejado visualmente
                }

            },

            onGetDetailText: async function (sKey, sMaterial, sBatch) {

                const oModelName = "ZSB_HANDHELD_V2";
                const oEntity = "OrderItemsText";
                let sPlant = '';
                //sKey = sKey.padStart(12, '0');; //"1000004";
                const sFilter_flag = true;

                try {
                    let oDetailText = await this.readOneAjax(oModelName, oEntity, sKey, sMaterial, sBatch, sPlant, sLocation, sFilter_flag);

                    const aResults = oDetailText.d.results;

                    // Convertimos cada posición a una línea de texto
                    const sTextoFinal = aResults
                        .map(obj => {
                            const sConf = obj.MfgOrderConfirmation;
                            const sTexto = obj.DetailText || "";
                            return `#${sConf}: ${sTexto}`;
                        })
                        .join("\n");

                    // Regresamos el texto formateado para guardarlo en el modelo local para el TextArea

                    return sTextoFinal;
                } catch (e) {
                    // Ya está manejado visualmente
                }

            },


            guardarTextoEditado: function () {
                const oLocalModel = this.getView().getModel("localModel");
                const sTexto = oLocalModel.getProperty("/DataPosition/txt_posicion");

                // Separamos por línea y convertimos en array de objetos
                const aPosiciones = sTexto.split("\n").map(linea => {
                    const match = linea.match(/^#(\d+):\s?(.*)$/); // patrón tipo "#2: texto"
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
                    oLocalModel.Positions.forEach((element) => {
                        oRequestJson.to_MaterialDocumentItem.push({
                            Material: element.material,                           // Código de material
                            Plant: element.centro,                                // Planta / Centro
                            Batch: element.lote,                                  // Lote, valor default si no viene
                            StorageLocation: element.almacen,                     // Almacén
                            GoodsMovementType: oLocalModel.Header.claseMov,       // Clase de movimiento
                            MaterialDocumentItemText: element.texto || "Rollo",   // Texto de posición
                            ManufacturingOrder: oLocalModel.Header.referencia,       // Orden de fabricación
                            IsCompletelyDelivered: false,                         // Indicador de entrega
                            QuantityInEntryUnit: element.cantidad,                // Cantidad
                            CostCenter: element.ceco                              // Centro de costo
                        });
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
                          "IsCompletelyDelivered" : false,
                          "QuantityInEntryUnit": "1",
                          "CostCenter": "5110101208"
                          }
                        ]
                      };
                    console.log("Payload final:", oRequestJson_2);


                    // Paso 8️⃣ Obtener CSRF Token usando helper del BaseController
                    const sToken = await this.fetchCsrfToken(sModelName, sEntitySet);
                    console.log("CSRF Token obtenido:", sToken);

                    // Paso 9 Ejecutar POST usando helper del BaseController
                    const oResponse = await this.postEntityAjax(sModelName, sEntitySet, oRequestJson, sToken);

                    sap.m.MessageToast.show(oBundle.getText("success.movCreated"));
                    console.log("Respuesta del POST:", oResponse);

                } catch (e) {
                    console.error("Error en onCreateMov:", e);
                    this._showErrorMessage(oBundle.getText("error.unexpected"), oBundle);
                }
            }







        });
    });
