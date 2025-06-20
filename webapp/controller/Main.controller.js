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
                this.getOwnerComponent().getModel("localModel").setProperty("/selectedKeys/claseMov", sSelectedKey);
                this.getOwnerComponent().getModel("localModel").setProperty("/selectedKeys/textClaseMov", sSelectext);

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

                if(oSelectedKey === c_601 || oSelectedKey === c_602){
                    this.getView().getModel("oDisplayModel").setProperty("/Posiciones/ceco", false);
                    this.getView().getModel("oDisplayModel").setProperty("/Posiciones/motivo", false);
                    this.getView().getModel("oDisplayModel").setProperty("/Header/referencia", true);
                }

                if(oSelectedKey === c_551 || oSelectedKey === c_552 || oSelectedKey === c_201 || oSelectedKey === c_202 || oSelectedKey === c_999){
                    this.getView().getModel("oDisplayModel").setProperty("/Header/referencia", false);
                    this.getView().getModel("oDisplayModel").setProperty("/Posiciones/ceco", true);
                    this.getView().getModel("oDisplayModel").setProperty("/Posiciones/motivo", true);
                }


            },

            onGuardarFormulario: function () {
                const oView = this.getView();

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
            },

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
                let oModel = this.getOwnerComponent().getModel("requestModel").getData();
                console.log(oModel);
            },


            onSavePosition: function () {

                let oModel = this.getOwnerComponent().getModel("localModel").getData().DataPosition;
                let _position = {
                    material: oModel.material,
                    cantidad: oModel.cantidad,
                    um: oModel.um,
                    lote: oModel.lote,
                    centro: oModel.centro,
                    almacen: oModel.almacen,
                    ceco: oModel.ceco,
                    motivo: oModel.motivo
                }
                oPositions.push(_position);
                let oLocalModel = this.getOwnerComponent().getModel("localModel");
                oLocalModel.setProperty("/Positions", oPositions);
                this._actualizarContadorPosiciones();

                console.log(oLocalModel.getProperty("/Positions"));


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
            }





        });
    });
