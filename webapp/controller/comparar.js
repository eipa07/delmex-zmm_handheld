sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/Device"
],
    function (Controller, JSONModel, Fragment, MessageToast, Device) {
        "use strict";

        return Controller.extend("delmex.zmmhandheld.controller.Main", {
            onInit: function () {
                // Crea y asigna un modelo JSON con la fecha actual
                var oModel = new JSONModel();
                oModel.setData({
                    currentDate: new Date().toISOString().split('T')[0]
                });
                this.getView().setModel(oModel);
            },

            /**
             * Función reutilizable para abrir el escáner de código de barras y vincular el resultado a un input específico
             * @param {string} sInputId - ID del control de entrada donde se colocará el valor escaneado
             */
            _openScannerFor: function (sInputId) {
                const oView = this.getView();
                const _this = this;

                // Espera hasta que el contenedor HTML esté disponible en el DOM
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

                // Cargar el fragmento del diálogo solo una vez
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
                        // Define la estructura visual del lector
                        const oScannerHtml = Fragment.byId("scanner", "scannerHtml");
                        if (oScannerHtml) {
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

                        // Espera a que se renderice el div qr-reader para inicializar el lector
                        waitForElement("qr-reader", 3000).then(() => {
                            let facingMode = "environment";
                            const html5QrCode = new Html5Qrcode("qr-reader");
                            _this._html5QrCode = html5QrCode;

                            const config = {
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
                            };

                            // Acción cuando se escanea correctamente
                            const onScanSuccess = (decodedText) => {
                                html5QrCode.stop().then(() => {
                                    html5QrCode.clear();
                                    _this._html5QrCode = null;

                                    // Reproduce beep
                                    const beep = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAABAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgA");
                                    beep.play();

                                    // Detiene láser y muestra animación de éxito
                                    const scanLine = document.getElementById("scan-line");
                                    if (scanLine) {
                                        scanLine.style.animation = "none";
                                        scanLine.style.background = "lime";
                                    }

                                    const flash = document.createElement("div");
                                    flash.style.position = "absolute";
                                    flash.style.top = 0;
                                    flash.style.left = 0;
                                    flash.style.width = "100%";
                                    flash.style.height = "100%";
                                    flash.style.background = "rgba(0, 255, 0, 0.4)";
                                    flash.style.zIndex = 50;
                                    flash.style.animation = "flashSuccess 0.4s ease-out";
                                    document.getElementById("qr-reader-container").appendChild(flash);

                                    setTimeout(() => {
                                        flash.remove();
                                    }, 400);

                                    // Asigna el valor leído al input indicado
                                    const oInput = sap.ui.getCore().byId(sInputId);
                                    if (oInput) {
                                        oInput.setValue(decodedText);
                                        oInput.focus();
                                    }
                                    MessageToast.show("Código leído: " + decodedText);
                                    Fragment.byId("scanner", "barcodeScannerDialog").close();
                                });
                            };

                            // Inicia el lector
                            html5QrCode.start({ facingMode }, config, onScanSuccess, () => {});

                            // Cambiar entre cámaras
                            const toggleButton = document.getElementById("toggle-camera");
                            if (toggleButton) {
                                toggleButton.onclick = function () {
                                    facingMode = (facingMode === "environment") ? "user" : "environment";
                                    html5QrCode.stop().then(() => {
                                        html5QrCode.start({ facingMode }, config, onScanSuccess, () => {});
                                    });
                                };
                            }
                        }).catch((err) => {
                            MessageToast.show(err);
                            Fragment.byId("scanner", "barcodeScannerDialog").close();
                        });
                    }, 200);
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

            // Acción que abre el escáner para el input de Material
            onScanMaterial: function () {
                this._openScannerFor("materialInput");
            }
        });
    });
