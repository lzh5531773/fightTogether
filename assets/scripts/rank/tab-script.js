const MenuSidebar = require('sidebar-script')

cc.Class({
	extends: cc.Component,

	properties: {
		sidebar: MenuSidebar,
	},

	onPressed (e, customEventData) {
		console.log('onPressed this.sidebar', this.sidebar)
		this.sidebar.tabPressed(customEventData);
	},

});