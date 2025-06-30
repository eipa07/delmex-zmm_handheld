sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/core/UIComponent",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, History, UIComponent, MessageToast, MessageBox, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("delmex.zmmhandheld.controller.BaseController", {


        getLocalModel: function () {
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
                DataPosition: {
                    material: "",
                    cantidad: "",
                    um: "",
                    lote: "", // Batch
                    centro: "", //Planta
                    almacen: "",
                    ceco: "",
                    motivo: "",
                    txt_posicion: "",
                    txt_posicion_historico: "",
                    cantidad_disponible: 0,
                    PurchaseOrderItem: 0,
                    GoodsMovementRefDocType: ""
                },
                Positions: [],
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
                return oResponse.error?.message?.value || oBundle.getText("error.backend");
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
                            console.log("fetchBlock: ", jqXHR);
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
        readOneAjax: async function (sModelName, sEntitySet, sKey, sMaterial, sBatch, sPlant, sLocation, sFilter_flag = false) {
            const oModel = this.getOwnerComponent().getModel(sModelName);
            const oBundle = this.getResourceBundle();

            if (!oModel) {
                throw new Error(`Modelo '${sModelName}' no encontrado.`);
            }

            const sBaseUrl = oModel.sServiceUrl;
            let sUrl = '';
            var oFilters = [];
            const oEmpty = '';

            if (!sFilter_flag) {
                sUrl = `${sBaseUrl}${sEntitySet}('${sKey}')`;
            } else {

                if (sEntitySet === "A_MaterialDocumentItem" || sEntitySet === 'A_ProductionOrder_2') {
                    oFilters = this.getFilters(sEntitySet, sKey, sMaterial, sBatch, sPlant, sLocation);
                    sUrl = `${sBaseUrl}${sEntitySet}/${oFilters}`; // &$top=1
                } else if (sEntitySet === 'OrderItemsText') {
                    oFilters = this.getFilters(sEntitySet, sKey, oEmpty, oEmpty, sPlant, sLocation);
                    sUrl = `${sBaseUrl}/${sEntitySet}/${oFilters}`;
                }


            }


            return new Promise((resolve, reject) => {
                $.ajax({
                    url: sUrl,
                    filters: oFilters,
                    method: "GET",
                    contentType: "application/json",
                    dataType: "json",
                    success: function (oData) {

                        console.log(sEntitySet, oData);
                        resolve(oData);
                    },
                    error: (jqXHR) => {
                        console.log("Error: " + sEntitySet + ":", jqXHR);
                        const sMessage = this._getAjaxErrorMessage(jqXHR, oBundle);
                        this._showErrorMessage(sMessage, oBundle);
                        reject(jqXHR);
                    }
                });
            });
        },

        /**
 * Genera la cadena de filtros OData para distintas entidades.
 *
 * - OrderItemsText: Filtra por ManufacturingOrder.
 * - A_MaterialDocumentItem: Filtra por ManufacturingOrder, Material y Batch.
 * - A_ProductionOrder_2: Filtro compuesto con Material, Batch y GoodsMovementType con condición OR.
 *
 * @param {string} sEntitySet - Nombre de la entidad OData.
 * @param {string} sKey - Clave de búsqueda (ManufacturingOrder).
 * @param {string} sMaterial - Material a filtrar.
 * @param {string} sBatch - Batch a filtrar.
 * @returns {string} - String de filtro OData, con orden y top si aplica.
 */
        getFilters: function (sEntitySet, sKey, sMaterial, sBatch, sPlant, sLocation) {
            let aFilters = [];
            let sFilterStr = "";
            let sUrl = "";

            if (sEntitySet === 'OrderItemsText') {
                if (sKey && (oTipoMov === '601' || oTipoMov === '602' || oTipoMov === '261' || oTipoMov === '261')) {
                    sFilterStr = `ManufacturingOrder eq '${sKey}'`;
                    sUrl = `?$format=json&$filter=${encodeURIComponent(sFilterStr)}`;
                    
                    //aFilters.push(new Filter("ManufacturingOrder", FilterOperator.EQ, sKey));
                }
            } else if (sEntitySet === "A_MaterialDocumentItem") {
                // 🔥 Aquí armamos filtro manual para el caso especial con OR
                if (sMaterial && sBatch) {
                    sFilterStr = `Material eq '${sMaterial}' and Batch eq '${sBatch}' and (GoodsMovementType eq '101' or GoodsMovementType eq '501')`;
                    sUrl = `?$format=json&$filter=${encodeURIComponent(sFilterStr)}&$orderby=MaterialDocument desc&$top=1`;
                }
            } else if (sEntitySet === 'A_ProductionOrder_2') {
                sFilterStr = `Material eq '${sMaterial}' and ProductionPlant eq '${sPlant}' and StorageLocation eq '${sLocation}'`;
                sUrl = `?$format=json&$filter=${encodeURIComponent(sFilterStr)}&$orderby=ManufacturingOrder desc&$top=1`;
            }

            // Para entidades normales, construir con Filter UI5
            /* if (aFilters.length > 0) {
                sFilterStr = this.buildFilterString(aFilters);
                sUrl = `?$filter=${encodeURIComponent(sFilterStr)}`;
            } */

            return sUrl;
        },


        /* buildFilterString: function (aFilters) {
            return aFilters.map(f => `${f.sPath} ${f.sOperator.toLowerCase()} '${f.oValue1}'`).join(" and ");
        }, */

        /**
         * 
         * @param {string} iMovementType 
         * @returns {Promise<Object>} - GoodsMovementCode.
         * 03 - Goods Issue
         */

        getGoodMovement: function (iMovementType) {

            const c_601 = '601'; // Orden de venta
            const c_602 = '602'; // Anulación orden de venta
            const c_551 = '551'; // desguace
            const c_552 = '552'; // Anulación desguace
            const c_201 = '201'; // salida de mercancia cargo ceco
            const c_202 = '202'; // Anulación salida de mercancia cargo ceco
            const c_261 = '261'; // Orden de producción
            const c_262 = '262'; // Anulación Orden de producción
            const c_999 = '999'; // Entrada manual de movimiento

            const oBundle = this.getResourceBundle();
            let msg = oBundle.getText("error.tipoMov");

            let oMovType = "";


            switch (iMovementType) {
                case c_601:
                    oMovType = "00";
                    break;
                case c_602:
                    oMovType = "00";
                    break;
                case c_551:
                    oMovType = "03";
                    break;
                case c_552:
                    oMovType = "00";
                    break;
                case c_201:
                    oMovType = "03";
                    break;
                case c_202:
                    oMovType = "00";
                    break;
                case c_261:
                    oMovType = "03";
                    break;
                case c_262:
                    oMovType = "00";
                    break;
                case c_999:
                    oMovType = "00";
                    break;
                default:
                    oMovType = false;
                    break;
            }

            if (!oMovType) {
                oMovType = false;
                MessageBox.error(msg);
            }

            return oMovType;

        },


        /**
         * Envía un POST a una entidad OData V2 usando AJAX y CSRF Token.
         * 
         * @param {string} sModelName - Nombre del modelo registrado (ej. "API_MATERIAL_DOCUMENT_SRV").
         * @param {string} sEntitySet - Entity set de destino (ej. "A_MaterialDocumentHeader").
         * @param {Object} oPayload - Objeto JSON con los datos a enviar.
         * @param {string} sToken - Token CSRF válido obtenido previamente.
         * @returns {Promise<Object>} - Promesa que resuelve con la respuesta del backend.
         */
        postEntityAjax: async function (sModelName, sEntitySet, oPayload, sToken) {
            const oBundle = this.getResourceBundle();
            const oModel = this.getOwnerComponent().getModel(sModelName);

            if (!oModel) {
                throw new Error(`Modelo '${sModelName}' no encontrado.`);
            }

            const sBaseUrl = oModel.sServiceUrl;
            const sUrl = `${sBaseUrl}${sEntitySet}?`;

            return new Promise((resolve, reject) => {
                $.ajax({
                    url: sUrl,
                    method: "POST",
                    headers: {
                        "X-CSRF-Token": sToken
                    },
                    contentType: "application/json",
                    dataType: "json",
                    data: JSON.stringify(oPayload),
                    success: (oData) => {
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

        /**
        * Obtiene dinámicamente el token CSRF para un modelo OData V2.
        * 
        * @param {string} sModelName - Nombre del modelo registrado en manifest.json (ej. "API_MATERIAL_DOCUMENT_SRV").
        * @param {string} sEntitySet - Nombre del entity set principal (ej. "A_MaterialDocumentHeader").
        * @returns {Promise<string>} - Promesa que resuelve con el token CSRF.
        */
        fetchCsrfToken: async function (sModelName, sEntitySet) {
            const oBundle = this.getResourceBundle();
            const oModel = this.getOwnerComponent().getModel(sModelName);

            if (!oModel) {
                throw new Error(`Modelo '${sModelName}' no encontrado.`);
            }

            const sBaseUrl = oModel.sServiceUrl;
            const sUrl = `${sBaseUrl}${sEntitySet}`;

            return new Promise((resolve, reject) => {
                $.ajax({
                    url: sUrl,
                    method: "GET",
                    headers: {
                        "X-CSRF-Token": "fetch"
                    },
                    success: (data, textStatus, jqXHR) => {
                        const sToken = jqXHR.getResponseHeader("X-CSRF-Token");
                        resolve(sToken);
                    },
                    error: (jqXHR) => {
                        const sMessage = this._getAjaxErrorMessage(jqXHR, oBundle);
                        this._showErrorMessage(sMessage, oBundle);
                        reject(jqXHR);
                    }
                });
            });
        }












    });
});
