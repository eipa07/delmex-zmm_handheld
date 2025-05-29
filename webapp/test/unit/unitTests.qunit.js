/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"delmex/zmmhandheld/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
