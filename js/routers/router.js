/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Todo Router
	// ----------
	var TodoRouter = Backbone.Router.extend({
		routes: {
			// เอาคำอะไรก็ตามใส่ไปหลัง # ใน url คำนั้นจะกลายเป็น argument ใน 'setFilter'
			'*filter': 'setFilter'
		},

		setFilter: function (param) {
			// ตั้งค่า filter ให้เป็นค่าตามที่ป้อนมาใน url
			app.TodoFilter = param || '';

			// ทุกครั้งที่ url เปลี่ยน จะ trigger ไปที่ filter event เพื่อ show/hide todo  view item
			app.todos.trigger('filter');
		}
	});

	app.TodoRouter = new TodoRouter();
	Backbone.history.start();
})();
