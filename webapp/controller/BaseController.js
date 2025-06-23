sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/core/UIComponent",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
], function (Controller, History, UIComponent, MessageToast, MessageBox, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("delmex.zmmhandheld.controller.BaseController", {


        getLocalModel: function () {
            const oModel = new JSONModel({
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
                    motivo: "",
                    txt_posicion: "",
                    txt_posicion_historico: "",
                    cantidad_disponible: 0
                },
                posicionesTexto: "Total: 0 posiciones"
            });
            return oModel;
        },

        getRequestModel() {

            const oModel = new JSONModel({
                Header: {
                    claseMov: "",
                    textClaseMov: "",
                    fecha_doc: "",
                    fecha_cont: "",
                    referencia: "",
                    texto_cabecera: "",
                    cantidad_disponible: ""
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
        },

        /**
         * Extrae mensaje legible desde el error AJAX (jQuery).
         *
         * @param {object} jqXHR - Objeto de error de la petición.
         * @param {object} oBundle - Bundle i18n para mensajes internacionalizados.
         * @returns {string} - Mensaje a mostrar al usuario.
         */
        _getAjaxErrorMessage: function (jqXHR, oBundle) {
            try {
                const oResponse = JSON.parse(jqXHR.responseText);
                return oResponse.error?.message || oBundle.getText("error.backend");
            } catch (e) {
                return oBundle.getText("error.parse");
            }
        },

        /**
         * Muestra un MessageBox de error con un mensaje personalizado.
         *
         * @param {string} sMessage - Mensaje a mostrar.
         * @param {object} oBundle - Recurso i18n para obtener textos internacionalizados.
         */
        _showErrorMessage: function (sMessage, oBundle) {
            sap.m.MessageBox.error(sMessage, {
                title: oBundle.getText("error.title")
            });
        },


        /**
         * Lee todos los registros de una entidad OData V4 en bloques de 5000 registros usando AJAX.
         * Se basa en $count para saber el total y usa $skip + $top para paginar.
         *
         * @param {string} sModelName - Nombre del modelo OData registrado (por ejemplo: "productApi").
         * @param {string} sEntitySet - Nombre del entity set (por ejemplo: "ProductPlant").
         * @param {int} [iPageSize=5000] - Tamaño de cada bloque a recuperar.
         * @returns {Promise<Array>} - Array con todos los registros concatenados.
         */
        readAllPagedAjax: async function (sModelName, sEntitySet, iPageSize = 5000) {
            const oModel = this.getOwnerComponent().getModel(sModelName);
            const oBundle = this.getResourceBundle();

            if (!oModel) {
                throw new Error(`Modelo '${sModelName}' no encontrado.`);
            }

            const sBaseUrl = oModel.sServiceUrl;

            /**
             * Paso 1: Obtener el total de registros usando $count
             */
            const getTotalCount = async () => {
                const sUrl = `${sBaseUrl}/${sEntitySet}/$count`;
                return new Promise((resolve, reject) => {
                    $.ajax({
                        url: sUrl,
                        method: "GET",
                        success: (data) => resolve(parseInt(data, 10)),
                        error: (jqXHR) => {
                            const sMessage = this._getAjaxErrorMessage(jqXHR, oBundle);
                            this._showErrorMessage(sMessage, oBundle);
                            reject(jqXHR);
                        }
                    });
                });
            };

            /**
             * Paso 2: Obtener un bloque de datos con $skip y $top
             */
            const fetchBlock = async (iSkip) => {
                const sUrl = `${sBaseUrl}/${sEntitySet}?$skip=${iSkip}&$top=${iPageSize}`;
                return new Promise((resolve, reject) => {
                    $.ajax({
                        url: sUrl,
                        method: "GET",
                        contentType: "application/json",
                        dataType: "json",
                        success: (oData) => resolve(oData.value || []),
                        error: (jqXHR) => {
                            const sMessage = this._getAjaxErrorMessage(jqXHR, oBundle);
                            this._showErrorMessage(sMessage, oBundle);
                            reject(jqXHR);
                        }
                    });
                });
            };

            // Paso 3: Loop para obtener todos los bloques
            try {
                const iTotal = await getTotalCount();
                const aResults = [];
                let iFetched = 0;

                while (iFetched < iTotal) {
                    const aBlock = await fetchBlock(iFetched);
                    aResults.push(...aBlock);
                    iFetched += iPageSize;
                }

                return aResults;
            } catch (e) {
                throw e;
            }
        },


        /**
         * Consulta un solo registro de una entidad OData V4 usando AJAX.
         *
         * @param {string} sModelName - Nombre del modelo OData registrado (por ejemplo: "productApi").
         * @param {string} sEntitySet - Nombre del entity set (por ejemplo: "ProductPlant").
         * @param {string} sKey - Clave del registro a consultar, en formato simple (ej. 'ID001') o compuesto si lo armas tú.
         * @returns {Promise<Object>} - Objeto con los datos del registro solicitado.
         */
        readOneAjax: async function (sModelName, sEntitySet, sKey, sFilter_flag = false) {
            const oModel = this.getOwnerComponent().getModel(sModelName);
            const oBundle = this.getResourceBundle();

            if (!oModel) {
                throw new Error(`Modelo '${sModelName}' no encontrado.`);
            }

            const sBaseUrl = oModel.sServiceUrl;
            let sUrl = '';
            var _filters = [];

            if (!sFilter_flag) {
                sUrl = `${sBaseUrl}${sEntitySet}('${sKey}')`;
            } else {
                
                _filters = this.getFilters(sKey);
                sUrl = `${sBaseUrl}/${sEntitySet}/${_filters}`;
            }


            return new Promise((resolve, reject) => {
                $.ajax({
                    url: sUrl,
                    filters: _filters,
                    method: "GET",
                    contentType: "application/json",
                    dataType: "json",
                    success: function (oData) {
                        resolve(oData);
                    },
                    error: (jqXHR) => {
                        const sMessage = this._getAjaxErrorMessage(jqXHR, oBundle);
                        this._showErrorMessage(sMessage, oBundle);
                        reject(jqXHR);
                    }
                });
            });
        },

        getFilters: function (sKey) {

            let aFilters = [];
            if (sKey) {
                aFilters.push(new Filter("ManufacturingOrder", FilterOperator.EQ, sKey));
            }
            //return aFilters;

            let sFilterStr = this.buildFilterString(aFilters);
            let sUrl = `?$filter=${encodeURIComponent(sFilterStr)}`;

            return sUrl;


        },

        buildFilterString: function (aFilters) {
            return aFilters.map(f => `${f.sPath} ${f.sOperator.toLowerCase()} '${f.oValue1}'`).join(" and ");
        }










    });
});
