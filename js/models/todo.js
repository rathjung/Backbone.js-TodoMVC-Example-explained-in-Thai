/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Todo Model
	// ----------

	// แต่ละ Todo model มี 3 attributes คือ 'title' - ชื่อของ task นั้น, 'order' - ลำดับของ task,
	// และ 'complete' เพื่อเป็นตัวเก็บถถานะว่า task นั้น complete หรือยัง

	// สร้าง Todo constructor function ด้วย method extend ของ Backbone.Model

	app.Todo = Backbone.Model.extend({

		// เราสามารถกำหนดค่า default ให้แต่ละ model object ที่สร้างด้วย object 'defaults' ในที่นี้คือ 'title'
		// และ 'completed' ส่วน 'order' จะ generate อัตโนมัติ
		defaults: {
			title: '',
			completed: false
		},

		// method สำหรับ toggle ค่าของ completed attribute
		// เวลาใส่ method แบบนี้จะเป็น method ของ Todo.prototype (object เข้าถึงได้ แต่ไม่ใช่ method ของ object)
		toggle: function () {
			this.save({
				completed: !this.get('completed')
			});
		}
	});
})();
