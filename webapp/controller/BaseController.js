sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/core/UIComponent",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, History, UIComponent, MessageToast, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("delmex.zmmhandheld.controller.BaseController", {


        getLocalModel: function () {
            const oModel = new JSONModel({
                claseMov: [
                    { key: "201", value: "Reserva" },
                    { key: "261", value: "Orden" },
                    { key: "551", value: "Desguace" }
                ],

                selectedKeys: {
                    claseMov: "",
                    textClaseMov: ""
                },
                DataPosition: {
                    material: "",
                    cantidad: "",
                    um: "",
                    lote: "",
                    centro: "",
                    almacen: "",
                    ceco: "",
                    motivo: ""
                },
                posicionesTexto: "Total: 0 posiciones"
            });
            return oModel;
        },

        getRequestModel(){

            const oModel = new JSONModel({
                Header: {
                    claseMov: "",
                    textClaseMov: "",
                    fecha_doc: "",
                    fecha_cont: "",
                    referencia: "",
                    texto_cabecera: ""
                },
                Positions: []
              });
              return oModel;
        },
        

        /**
         * Devuelve el enrutador de la aplicación.
         * @returns {sap.ui.core.routing.Router} Router
         */
        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        /**
         * Obtiene un modelo de la vista actual.
         * @param {string} [sName] - Nombre del modelo (opcional).
         * @returns {sap.ui.model.Model} Modelo solicitado
         */
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Asigna un modelo a la vista actual.
         * @param {sap.ui.model.Model} oModel - Instancia del modelo.
         * @param {string} [sName] - Nombre del modelo (opcional).
         * @returns {sap.ui.core.mvc.View} Vista actual
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Obtiene el `ResourceBundle` para textos internacionalizados.
         * @returns {sap.base.i18n.ResourceBundle} ResourceBundle
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Navega a la vista anterior o al inicio si no hay historial.
         */
        onNavBack: function () {
            const oHistory = History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                history.go(-1);
            } else {
                this.getRouter().navTo("RouteMain", {}, true);
            }
        },

        /**
         * Muestra un mensaje tipo `Toast`.
         * @param {string} sMessage - Mensaje a mostrar.
         */
        showMessage: function (sMessage) {
            MessageToast.show(sMessage);
        },

        /**
         * Muestra un mensaje tipo `Error`.
         * @param {string} sMessage - Mensaje de error.
         */
        showError: function (sMessage) {
            MessageBox.error(sMessage);
        },

        /**
         * Muestra un mensaje tipo `Success`.
         * @param {string} sMessage - Mensaje de éxito.
         */
        showSuccess: function (sMessage) {
            MessageBox.success(sMessage);
        },

        /**
         * Genera un filtro tipo rango (`BT`) o GE/LE según los valores dados.
         * @param {string} sPath - Campo de la entidad.
         * @param {string} [sLow] - Valor inicial del rango.
         * @param {string} [sHigh] - Valor final del rango.
         * @returns {sap.ui.model.Filter|null} Filtro generado o `null` si no hay valores.
         */
        generateRangeFilter: function (sPath, sLow, sHigh) {
            if (sLow && sHigh) {
                return new sap.ui.model.Filter(sPath, "BT", sLow, sHigh);
            } else if (sLow) {
                return new sap.ui.model.Filter(sPath, "GE", sLow);
            } else if (sHigh) {
                return new sap.ui.model.Filter(sPath, "LE", sHigh);
            }
            return null;
        }

    });
});
