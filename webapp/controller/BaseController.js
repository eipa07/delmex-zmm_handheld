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
            let oModel = new JSONModel({
                Header: {
                    claseMov: "",
                    claveMov: "",
                    textClaseMov: "",
                    fecha_doc: "",
                    fecha_cont: "",
                    referencia: "",
                    texto_cabecera: "",
                    cantidad_disponible: "",
                    esAnulacion: false,
                    MaterialDocumentYear: "",
                    esEntrega: false,
                    GoodsMovementRefDocType: ""
                },
                DataPosition: {
                    material: "",
                    txt_material: "",
                    cantidad: "",
                    um: "",
                    lote: "", // Batch
                    centro: "", //Planta
                    IssuingOrReceivingPlant: "", // Planta que recibe
                    almacen: "",
                    IssuingOrReceivingStorageLoc: "", // Almacen que recibe
                    IssgOrRcvgMaterial: "",     // Material que recibe
                    ceco: "",
                    motivo: "",
                    DescMotivo: "",
                    txt_posicion: "",
                    txt_posicion_historico: "",
                    cantidad_disponible: 0,
                    PurchaseOrderItem: 0,
                    GoodsMovementRefDocType: "",
                    numero_documento: "",
                    isBatchRequired: true, // true requiere lote | false no requiere lote
                    isBatchRequired_txt: '',
                    GoodsMovementType: '', // del material
                    MaterialDocumentItemText: '', // texto de posicion para mostrarlo solo en anulaciones en la orden
                    PickingStatus: '', // estatus de picking en 601
                    PickingStatus_desc: '',
                    ReferenceSDDocumentItem: '' // 601 item
                },
                Positions: [],
                posicionesTexto: "Total: 0 posiciones",
                ReferenceItems: [], // onClearReferenceItems
                ReferenceItemSelected: [] // onClearReferenceItemSelected
            });
            return oModel;
        },

        getRequestModel: function () {

            let oModel = new JSONModel({
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

        getDisplayConfiguration: function () {

            let oModel = new JSONModel(
                {
                    Header: {
                        operacion_almacen: true,
                        claseMov: false,
                        fecha_doc: true,
                        fecha_cont: true,
                        referencia: true,
                        texto_cabecera: true,
                        btnPicking: false,
                        btnContabilizar: true
                    },
                    Posiciones: {
                        material: true,
                        cantidad: true,
                        um: true,
                        lote: true,
                        centro: true,
                        almacen: true,
                        ceco: true,
                        motivo: true,
                        txt_posicion: true
                    },
                    TablaReferenciaItems: {
                        columnProcesar: true,
                        columnLote: true
                    },

                    Columna: {
                        motivo: false
                    }
                }
            )

            return oModel;

        },


        getTipoMovModel: function () {

            let oModel = new JSONModel(
                [
                    {
                        ClaseMovimiento: "0",
                        Descripcion: "",
                        GoodMovType: '',
                        ClaveMov: "000-00",
                        GoodsMovementRefDocType: ''
                    },
                    {
                        ClaseMovimiento: "201",
                        Descripcion: "Salida de mercancia cargo ceco",
                        GoodMovType: '03',
                        ClaveMov: "201-03",
                        GoodsMovementRefDocType: ''
                    },
                    {
                        ClaseMovimiento: "202",
                        Descripcion: "Anul. salida de mercancia cargo ceco",
                        GoodMovType: '03',
                        ClaveMov: "202-03",
                        GoodsMovementRefDocType: ''
                    },
                    {
                        ClaseMovimiento: "261",
                        Descripcion: "Entrada / orden de producción",
                        GoodMovType: '03',
                        ClaveMov: "261-03",
                        GoodsMovementRefDocType: ''
                    },
                    {
                        ClaseMovimiento: "262",
                        Descripcion: "Anul. / orden de producción",
                        GoodMovType: '03',
                        ClaveMov: "262-03",
                        GoodsMovementRefDocType: ''
                    },
                    {
                        ClaseMovimiento: "551",
                        Descripcion: "Desguace",
                        GoodMovType: '03',
                        ClaveMov: "551-03",
                        GoodsMovementRefDocType: ''
                    },
                    {
                        ClaseMovimiento: "552",
                        Descripcion: "Anul. desguace",
                        GoodMovType: '03',
                        ClaveMov: "552-03",
                        GoodsMovementRefDocType: ''
                    },
                    {
                        ClaseMovimiento: "601",
                        Descripcion: "Salida / ent. vs ord. venta",
                        GoodMovType: '03',
                        ClaveMov: "601-03",
                        GoodsMovementRefDocType: ''
                    },
                    /* {
                        ClaseMovimiento: "602",
                        Descripcion: "Anul. orden de venta",
                        GoodMovType: '03'
                    }, */
                    {
                        ClaseMovimiento: "101",
                        Descripcion: "Entrada / orden compra", // Purchase Order
                        GoodMovType: '01',
                        ClaveMov: "101-01",
                        GoodsMovementRefDocType: 'B'
                    },
                    {
                        ClaseMovimiento: "102",
                        Descripcion: "Anul. entrada / orden compra",
                        GoodMovType: '01',
                        ClaveMov: "102-01",
                        GoodsMovementRefDocType: ''
                    },
                    {
                        ClaseMovimiento: "101",
                        Descripcion: "Entrada / orden produccion",
                        GoodMovType: '02',
                        ClaveMov: "101-02",
                        GoodsMovementRefDocType: 'F'
                    },
                    {
                        ClaseMovimiento: "102",
                        Descripcion: "Anulación entrada / orden produccion",
                        GoodMovType: '02',
                        ClaveMov: "102-02",
                        GoodsMovementRefDocType: ''
                    },
                    {
                        ClaseMovimiento: "303",
                        Descripcion: "Entrada / traspaso 303",
                        GoodMovType: '',
                        ClaveMov: "303-04",
                        GoodsMovementRefDocType: ''
                    },
                    {
                        ClaseMovimiento: "304",
                        Descripcion: "Anul. entrada / traspaso 303",
                        GoodMovType: '',
                        ClaveMov: "304-04",
                        GoodsMovementRefDocType: ''
                    },
                    {
                        ClaseMovimiento: "309",
                        Descripcion: "Entrada / traspaso 309",
                        GoodMovType: '',
                        ClaveMov: "303-04",
                        GoodsMovementRefDocType: ''
                    },
                    {
                        ClaseMovimiento: "310",
                        Descripcion: "Anul. entrada / traspaso 309",
                        GoodMovType: '',
                        ClaveMov: "310-04",
                        GoodsMovementRefDocType: ''
                    },
                    {
                        ClaseMovimiento: "999",
                        Descripcion: "Entrada manual de movimiento",
                        GoodMovType: '',
                        ClaveMov: "999-00",
                        GoodsMovementRefDocType: ''
                    }

                ]
            );
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
            let oHistory = History.getInstance();
            let sPreviousHash = oHistory.getPreviousHash();

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
                let oResponse = JSON.parse(jqXHR.responseText);
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
        readAllPagedAjax: async function (sModelName, sEntitySet, iPageSize = 5000, sKey = '', claseMov) {
            let oModel = this.getOwnerComponent().getModel(sModelName);
            let oBundle = this.getResourceBundle();

            if (!oModel) {
                throw new Error(`Modelo '${sModelName}' no encontrado.`);
            }

            let sBaseUrl = oModel.sServiceUrl;



            /**
             * Paso 1: Obtener el total de registros usando $count
             */

            let getTotalCount = async () => {
                let sUrl = `${sBaseUrl}${sEntitySet}/$count`;
                if (sKey) {
                    if (sEntitySet === "A_ProductionOrderComponent_4") {
                        sUrl = sUrl + `?$filter=ManufacturingOrder eq '${sKey}'`;
                    } else if (sEntitySet === "A_MaterialDocumentItem" && claseMov !== '101') {
                        sUrl = sUrl + `?$filter=MaterialDocument eq '${sKey}'`;
                    }

                }
                return new Promise((resolve, reject) => {
                    $.ajax({
                        url: sUrl,
                        method: "GET",
                        success: (data) => {
                            resolve(parseInt(data, 10));
                            this.getView().setBusy(false);
                        },
                        error: (jqXHR) => {
                            let sMessage = this._getAjaxErrorMessage(jqXHR, oBundle);
                            this._showErrorMessage(sMessage, oBundle);
                            this.getView().setBusy(false);
                            reject(jqXHR);
                        }
                    });
                });
            };

            /**
             * Paso 2: Obtener un bloque de datos con $skip y $top
             */
            let fetchBlock = async () => {
                let sUrl = "";
                if (sKey) {
                    if (sEntitySet === "A_ProductionOrderComponent_4") {
                        sUrl = `${sBaseUrl}${sEntitySet}?$format=json&$filter=ManufacturingOrder eq '${sKey}'`;
                    } else if (sEntitySet === "A_MaterialDocumentItem") {
                        sUrl = `${sBaseUrl}${sEntitySet}?$format=json&$filter=MaterialDocument eq '${sKey}'`;
                    } else if (sEntitySet === "/A_OutbDeliveryItem") {
                        sUrl = `${sBaseUrl}${sEntitySet}?$format=json&$filter=DeliveryDocument eq '${sKey}'`;
                    }

                }
                return new Promise((resolve, reject) => {
                    $.ajax({
                        url: sUrl,
                        method: "GET",
                        contentType: "application/json",
                        dataType: "json",
                        success: (oData) => {
                            resolve(oData || []),
                                this.getView().setBusy(false);
                        },
                        error: (jqXHR) => {
                            console.log("fetchBlock: ", jqXHR);
                            let sMessage = this._getAjaxErrorMessage(jqXHR, oBundle);
                            this._showErrorMessage(sMessage, oBundle);
                            reject(jqXHR);
                        }
                    });
                });
            };

            // Paso 3: Loop para obtener todos los bloques
            try {
                let iTotal = await getTotalCount();
                let aResults = [];
                let iFetched = 0;
                let aBlock = await fetchBlock();
                return aBlock;

                /*  while (iFetched < iTotal) {
                     const aBlock = await fetchBlock(iFetched);
                     aResults.push(...aBlock);
                     iFetched += iPageSize;
                 } */

                //return aResults;
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
        readOneAjax: async function (sModelName, sEntitySet, sKey, sMaterial, sBatch, sPlant, sLocation, oClaseMov) {
            let oModel = this.getOwnerComponent().getModel(sModelName);
            let oBundle = this.getResourceBundle();

            if (!oModel) {
                // Usa texto i18n
                let sMessage = oBundle.getText("error_model_not_found", [sModelName]);
                throw new Error(sMessage);
            }

            let sBaseUrl = oModel.sServiceUrl;
            let oFilters = this.getFilters(sEntitySet, sKey, sMaterial, sBatch, sPlant, sLocation, oClaseMov);
            let sUrl = `${sBaseUrl}${sEntitySet}${oFilters}`;

            try {
                let oData = await $.ajax({
                    url: sUrl,
                    method: "GET",
                    contentType: "application/json",
                    dataType: "json"
                });

                if (sEntitySet === 'A_MaterialDocumentItem' && oData?.d?.results?.length === 0) {
                    // Devuelve null para que el Controller decida qué mostrar
                    return null;
                }

                console.log(sEntitySet, oData);
                return oData;

            } catch (jqXHR) {
                console.log(`Error en ${sEntitySet}:`, jqXHR);
                let sMessage = this._getAjaxErrorMessage(jqXHR, oBundle) || oBundle.getText("error_ajax_generic");
                this._showErrorMessage(sMessage, oBundle);
                throw jqXHR;
            }
        },



        /**
         * Genera la cadena de filtros OData para distintas entidades.
         *
         * - OrderItemsText: Filtra por ManufacturingOrder.
         * - A_MaterialDocumentItem: Filtra por ManufacturingOrder, Material y Batch.
         * - A_ProductionOrderComponent_4: Filtro compuesto con Material, Batch y GoodsMovementType con condición OR.
         *
         * @param {string} sEntitySet - Nombre de la entidad OData.
         * @param {string} sKey - Clave de búsqueda (ManufacturingOrder).
         * @param {string} sMaterial - Material a filtrar.
         * @param {string} sBatch - Batch a filtrar.
         * @returns {string} - String de filtro OData, con orden y top si aplica.
         */
        getFilters: function (sEntitySet, sKey, sMaterial, sBatch, sPlant, sLocation, oClaseMov) {
            let aFilters = [];
            let sFilterStr = "";
            let sUrl = "";

            if (sEntitySet === 'OrderItemsText') {
                if (sKey && (oClaseMov === '601' || oClaseMov === '602' || oClaseMov === '261' || oClaseMov === '261')) {
                    sFilterStr = `ManufacturingOrder eq '${sKey}'`;
                    sUrl = `?$format=json&$filter=${encodeURIComponent(sFilterStr)}`;

                    //aFilters.push(new Filter("ManufacturingOrder", FilterOperator.EQ, sKey));
                }
            } else if (sEntitySet === "A_MaterialDocumentItem") {
                // 🔥 Aquí armamos filtro manual para el caso especial con OR
                if (sMaterial && sBatch) {
                    sFilterStr = `Material eq '${sMaterial}' and Batch eq '${sBatch}' and (GoodsMovementType eq '101' or GoodsMovementType eq '501')`;
                    sUrl = `?$format=json&$filter=${encodeURIComponent(sFilterStr)}&$orderby=MaterialDocument desc&$top=1`;
                } else if (!sMaterial && !sBatch) {
                    sFilterStr = `(GoodsMovementType eq '102' or GoodsMovementType eq '502' or GoodsMovementType eq '602' or GoodsMovementType eq '552')`;
                    sUrl = `?$format=json&$filter=${encodeURIComponent(sFilterStr)}&$orderby=MaterialDocument desc&$top=1`;
                }
            } else if (sEntitySet === "A_MaterialDocumentItem" && oClaseMov === '101') {
                // 🔥 Aquí armamos filtro manual para el caso especial con OR
                if (sKey) {
                    sFilterStr = `ManufacturingOrder eq '${sKey}' and GoodsMovementType eq '101'`;
                    sUrl = `?$format=json&$filter=${encodeURIComponent(sFilterStr)}&$orderby=MaterialDocument desc&$top=1`;
                } else if (!sMaterial && !sBatch) {
                    sFilterStr = `(GoodsMovementType eq '102' or GoodsMovementType eq '502' or GoodsMovementType eq '602' or GoodsMovementType eq '552')`;
                    sUrl = `?$format=json&$filter=${encodeURIComponent(sFilterStr)}&$orderby=MaterialDocument desc&$top=1`;
                }
            } else if (sEntitySet === 'A_ProductionOrderComponent_4') {
                sFilterStr = `Material eq '${sMaterial}' and ProductionPlant eq '${sPlant}' and StorageLocation eq '${sLocation}'`;
                sUrl = `?$format=json&$filter=${encodeURIComponent(sFilterStr)}&$orderby=ManufacturingOrder desc&$top=1`;
            } else if (sEntitySet === 'ProductDescription') {
                //let sLang = this.getLanguageISO();
                let sLang = 'ES';
                sFilterStr = `Product eq '${sMaterial}' and Language eq '${sLang}'`;
                sUrl = `?$format=json&$filter=${encodeURIComponent(sFilterStr)}&$top=1`;
            } else if (sEntitySet === 'Product') {
                sFilterStr = `Product eq '${sMaterial}'`;
                sUrl = `?$format=json&$filter=${encodeURIComponent(sFilterStr)}&$top=1`;
            } else if (sEntitySet === 'Batch') {
                sFilterStr = `Material eq '${sMaterial}'`;
                sUrl = `?$format=json&$filter=${encodeURIComponent(sFilterStr)}`;
            } else if (sEntitySet === 'A_MaterialDocumentItem_GET') {
                sFilterStr = `Material eq '${sMaterial}'`;
                sUrl = `?$format=json&$filter=${encodeURIComponent(sFilterStr)}`;
            } else if (sEntitySet === 'A_MaterialDocumentHeader') {
                sFilterStr = `MaterialDocument eq '${sKey}'`;
                sUrl = `?$format=json&$filter=${encodeURIComponent(sFilterStr)}`;
            } else if (sEntitySet === 'A_ProductionOrderItem_2') {
                sFilterStr = `ManufacturingOrder eq '${sKey}'`;
                sUrl = `?$format=json&$filter=${encodeURIComponent(sFilterStr)}`;
            } else if (sEntitySet === 'PurchaseOrderItem') {
                sFilterStr = `PurchaseOrder eq '${sKey}'`;
                sUrl = `?$format=json&$filter=${encodeURIComponent(sFilterStr)}`;
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
            const c_261 = '261'; // Orden de producción - correcto
            const c_262 = '262'; // Anulación Orden de producción
            const c_999 = '999'; // Entrada manual de movimiento

            let oBundle = this.getResourceBundle();
            let msg = oBundle.getText("error.tipoMov");

            let oMovType = "";


            switch (iMovementType) {
                case c_601:
                    oMovType = "03";
                    break;
                case c_602:
                    oMovType = "03";
                    break;
                case c_551:
                    oMovType = "03";
                    break;
                case c_552:
                    oMovType = "03";
                    break;
                case c_201:
                    oMovType = "03";
                    break;
                case c_202:
                    oMovType = "03";
                    break;
                case c_261:
                    oMovType = "03";
                    break;
                case c_262:
                    oMovType = "03";
                    break;
                case c_999:
                    oMovType = "03";
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
            let oBundle = this.getResourceBundle();
            let oModel = this.getOwnerComponent().getModel(sModelName);

            if (!oModel) {
                throw new Error(`Modelo '${sModelName}' no encontrado.`);
            }

            let sBaseUrl = oModel.sServiceUrl;
            let sUrl = `${sBaseUrl}${sEntitySet}`;

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
                        this.getView().setBusy(false);
                    },
                    error: (jqXHR) => {
                        let sMessage = this._getAjaxErrorMessage(jqXHR, oBundle);
                        this._showErrorMessage(sMessage, oBundle);
                        this.getView().setBusy(false);
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
            let oBundle = this.getResourceBundle();
            let oModel = this.getOwnerComponent().getModel(sModelName);

            if (!oModel) {
                throw new Error(`Modelo '${sModelName}' no encontrado.`);
            }

            let sBaseUrl = oModel.sServiceUrl;
            let sUrl = `${sBaseUrl}${sEntitySet}`;

            return new Promise((resolve, reject) => {
                $.ajax({
                    url: sUrl,
                    method: "GET",
                    headers: {
                        "X-CSRF-Token": "fetch"
                    },
                    success: (data, textStatus, jqXHR) => {
                        let sToken = jqXHR.getResponseHeader("X-CSRF-Token");
                        this.getView().setBusy(false);
                        resolve(sToken);
                    },
                    error: (jqXHR) => {
                        let sMessage = this._getAjaxErrorMessage(jqXHR, oBundle);
                        this._showErrorMessage(sMessage, oBundle);
                        this.getView().setBusy(false);
                        reject(jqXHR);
                    }
                });
            });
        },

        /**
         * Obtiene el idioma abreviado (2 letras) en mayúsculas para OData.
         * Soporta locales extendidos (es-ES, en-US, pt-BR).
         *
         * @returns {string} Código de idioma ISO (ej: 'ES').
         */
        getLanguageISO: function () {
            let sLangFull = sap.ui.getCore().getConfiguration().getLanguage();
            return sLangFull.split("-")[0].toUpperCase();
        },

        /**
         * Convierte el valor ingresado en un Input a MAYÚSCULAS
         * y lo guarda en el path del modelo local.
         * 
         * @param {sap.ui.base.Event} oEvent - Evento liveChange del Input
         * @param {string} sPath - Path en el modelo local (ej: "/DataPosition/material")
         */
        onLiveChangeUpper: function (oEvent, sPath) {
            // 1️⃣ Tomar valor ingresado
            let sValue = oEvent.getParameter("value") || "";

            // 2️⃣ Convertir a mayúsculas
            let sUpper = sValue.toUpperCase();

            // 3️⃣ Actualizar visualmente el Input para evitar parpadeo
            oEvent.getSource().setValue(sUpper);

            // 4️⃣ Actualizar modelo local
            this.getOwnerComponent().getModel("localModel").setProperty(sPath, sUpper);
        },

        /**
         * 
         * @param {cabecera} sTabId 
         * @param {datos} sTabId 
         * @param {orden} sTabId 
         */
        onNavToIconTabBar: function (sTabId) {
            // Paso 1: Obtener IconTabBar por ID
            let oIconTabBar = this.byId("mainTabs");

            // Paso 2: Cambiar la pestaña activa por su key
            oIconTabBar.setSelectedKey(sTabId);
        },



        readOneAjax2: function () {

            let sUrl = "https://api.ejemplo.com/https://my413406-api.s4hana.cloud.sap/sap/opu/odata/sap/ZSB_HANDHELD_V2/$metadata";

            let sAuth = 'Basic SEFORF9IRUxEOktjOUF2ZHd2anlQaWdHZWtFZ1FKSlFhWk5nQlNxYmtxVl16bWpYa3M=';

            jQuery.ajax({
                url: sUrl,
                method: "GET",
                headers: {
                    "Authorization": sAuth,
                    "Content-Type": "application/json"
                },
                success: function (oData) {
                    console.log("Éxito:", oData);
                },
                error: function (err) {
                    console.error("Error:", err);
                }
            });


        },


        getETagAndToken: async function () {
            let oLocalData = this.getOwnerComponent().getModel("localModel").getData();
            let sKey = oLocalData.Header.referencia;
            let sItem = oLocalData.ReferenceItemSelected.ReferenceSDDocumentItem;
            let sPath = `/A_OutbDeliveryItem(DeliveryDocument='${sKey}',DeliveryDocumentItem='${sItem}')`;

            let sServiceUrl = this.getView().getModel("API_OUTBOUND_DELIVERY_SRV").sServiceUrl;
            let sFullUrl = sServiceUrl + sPath;

            let oResponse = await fetch(sFullUrl, {
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch",
                    "Accept": "application/json"
                },
                credentials: "include"
            });

            let sToken = oResponse.headers.get("x-csrf-token");
            let sETag = oResponse.headers.get("etag");

            return {
                etag: sETag,
                token: sToken
            };
        },

        /**
 * Verifica si todos los ítems tienen PickingStatus 'C' (completamente tratado)
 * y actualiza la visibilidad de un botón o propiedad de modelo en consecuencia.
 *
 * @param {string} sReferencia - Folio de referencia del documento
 * @param {string} sModelName - Nombre del modelo OData (ej: "API_OUTBOUND_DELIVERY_SRV")
 * @param {string} sEntity - Nombre de la entidad (ej: "/A_OutbDeliveryItem")
 * @param {string} sButtonId - ID del botón a mostrar/ocultar (opcional)
 * @param {string} sDisplayPath - Ruta en oDisplayModel para setProperty (opcional)
 */
        checkPickingAndToggleButton: async function (sReferencia, sModelName, sEntity, sDisplayPath) {
            try {
                let oBundle = this.getResourceBundle();
                let oView = this.getView();
                let oComponent = this.getOwnerComponent();
                let iPageSize = "5000";

                // Validar referencia
                if (!sReferencia) {
                    console.warn(oBundle.getText("error.no_referencia"));
                    return;
                }

                console.log(oBundle.getText("log.picking_check", [sReferencia]));

                // Llamada OData para obtener todos los ítems relacionados al folio
                let oResponse = await this.readAllPagedAjax(sModelName, sEntity, iPageSize, sReferencia, claseMov);
                let aItems = oResponse?.d?.results || [];

                // Validar si todos los ítems ya fueron completamente tratados ('C')
                let isAllPicked = aItems.every(item => item.PickingStatus === 'C');

                // Mostrar u ocultar botón según resultado
                if (isAllPicked) {
                    oComponent.getModel("oDisplayModel").setProperty("/Header/btnPicking", false);
                    oComponent.getModel("oDisplayModel").setProperty("/Header/btnContabilizar", true);

                } else {
                    oComponent.getModel("oDisplayModel").setProperty("/Header/btnPicking", true);
                    oComponent.getModel("oDisplayModel").setProperty("/Header/btnContabilizar", false);
                }

                // Actualizar propiedad en el modelo para visibilidad por binding
                if (sDisplayPath) {
                    oComponent.getModel("oDisplayModel").setProperty(sDisplayPath, !isAllPicked);
                }

            } catch (err) {
                console.error("Error en checkPickingAndToggleButton:", err);
                let oBundle = this.getResourceBundle();
                this._showErrorMessage(oBundle.getText("error.picking_status"));
            }
        },

        /**
         * Elimina uno o más campos específicos de un objeto dentro de un array si se cumple una condición.
         * 
         * @param {Array} aItems - Array de objetos.
         * @param {int} iIndex - Índice del objeto al que se le eliminarán los campos.
         * @param {string|string[]} vFields - Nombre del campo o arreglo de campos a eliminar.
         */
        removeFieldsIfNeeded: function (aItems, iIndex, vFields) {
            if (!aItems || !aItems[iIndex]) {
                return;
            }

            let aFields = Array.isArray(vFields) ? vFields : [vFields];

            aFields.forEach(sField => {
                if (aItems[iIndex].hasOwnProperty(sField)) {
                    delete aItems[iIndex][sField];
                }
            });
        }



















    });
});
