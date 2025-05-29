sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/Device"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel
     * @param {typeof sap.ui.core.Fragment} Fragment
     * @param {typeof sap.m.MessageToast} MessageToast
     * @param {typeof sap.ui.Device} 
     */

    function (Controller, JSONModel, Fragment, MessageToast, Device) {
        "use strict";

        return Controller.extend("delmex.zmmhandheld.controller.Main", {
            onInit: function () {
                var oModel = new JSONModel();
                oModel.setData({
                    currentDate: new Date().toISOString().split('T')[0]
                });
                this.getView().setModel(oModel);
            },

            onOpenScannerDialog: function () {
                const oView = this.getView();
                const _this = this;

                // Función utilitaria para esperar a que el div esté en el DOM
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

                // Cargar el fragmento si no está ya cargado
                if (!this.pScannerDialog) {
                    this.pScannerDialog = Fragment.load({
                        id: "scanner", // ID FIJO
                        name: "delmex.zmmhandheld.view.fragments.BarcodeScannerDialog",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }

                // Abrir el diálogo y esperar el render
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

                                        MessageToast.show("Código leído: " + decodedText);
                                        oDialog.close();
                                    });
                                },
                                (errorMsg) => {
                                    // error durante escaneo
                                }
                            ).catch((err) => {
                                MessageToast.show("Error al iniciar la cámara: " + err);
                                oDialog.close();
                            });
                        }).catch((err) => {
                            MessageToast.show(err);
                            oDialog.close();
                        });
                    }, 200); // espera inicial tras abrir el diálogo
                });
            },



            onCloseScannerDialog: function () {
                const oDialog = Fragment.byId("scanner", "barcodeScannerDialog");
                if (!oDialog) {
                    MessageToast.show("No se pudo cerrar el diálogo: no encontrado.");
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

                // Verifica que el div exista (solo la primera vez)
                const el = document.getElementById("qr-reader");
                if (!el) {
                    // Si aún no existe, créalo
                    const oScannerHtml = Fragment.byId("scanner", "scannerHtml");
                    oScannerHtml.setContent(`
                        <!-- Contenedor visual del escáner con estilos -->
                        <div id="qr-reader-container" style="width: 100%; height: 320px; position: relative; background-color: black; color: white; font-family: Arial, sans-serif; overflow: hidden; border-radius: 12px; box-shadow: 0 0 12px rgba(255, 0, 0, 0.6);">
                            <div id="qr-reader" style="width: 100%; height: 100%; position: relative;"></div>
                            <!-- Línea láser animada -->
                            <div id="scan-line" style="position: absolute; top: 15%; left: 0; width: 100%; height: 2px; background: red; animation: scanAnim 2s infinite linear; z-index: 10;"></div>
                            <!-- Marco verde delimitador -->
                            <div id="scan-frame" style="position: absolute; top: 15%; left: 10%; width: 80%; height: 70%; border: 2px solid lime; box-sizing: border-box; z-index: 5; border-radius: 4px;"></div>
                            <!-- Instrucción para el usuario -->
                            <div id="scan-instruction" style="position: absolute; bottom: 10px; width: 100%; text-align: center; font-size: 14px; color: white; z-index: 20; text-shadow: 1px 1px 2px black;">Alinea el código de barras dentro del recuadro</div>
                            <!-- Botón para cambiar cámara -->
                            <button id="toggle-camera" style="position: absolute; top: 10px; right: 10px; z-index: 30; background: rgba(255, 255, 255, 0.1); border: 1px solid white; border-radius: 4px; color: white; font-size: 12px; padding: 4px 8px; cursor: pointer;">Cambiar cámara</button>
                        </div>
                        <!-- Animaciones CSS -->
                        <style>
                            @keyframes scanAnim {
                                0% { top: 15%; }
                                50% { top: 85%; }
                                100% { top: 15%; }
                            }
                            @keyframes flashSuccess {
                                0% { opacity: 1; }
                                100% { opacity: 0; }
                            }
                        </style>
                    `);
                }




                // Espera un poco más para asegurar que ya se inyectó
                setTimeout(() => {
                    const elFinal = document.getElementById("qr-reader");
                    if (!elFinal) {
                        MessageToast.show("No se pudo encontrar el contenedor QR.");
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

                                MessageToast.show("Código leído: " + decodedText);
                                Fragment.byId("scanner", "barcodeScannerDialog").close();
                            });
                        },
                        (errorMsg) => {
                            // error durante escaneo
                        }
                    ).catch((err) => {
                        MessageToast.show("Error al iniciar la cámara: " + err);
                        Fragment.byId("scanner", "barcodeScannerDialog").close();
                    });
                }, 200);
            }
        

        });
    });