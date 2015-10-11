/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Todo Collection
	// ---------------

	// สร้าง 'Todos' collection constructor function เพื่อไว้สร้าง collection ของ todo ในตอนท้ายของไฟล์
	var Todos = Backbone.Collection.extend({

		// reference ไปยัง model app.Todo ที่เราสร้างไว้ใน models/todo.js
		model: app.Todo,

		// บันทึกไว้ใน local storage ผ่าน 'todos-backbone' namespace
		localStorage: new Backbone.LocalStorage('todos-backbone'),

		// method สำหรับ filter เฉพาะ model ที่ complete แล้ว
		completed: function () {
			// .where เป็น method ของ underscore.js ดูรายละเอียดที่ http://underscorejs.org/#where
			return this.where({completed: true});
		},

		// เหมือน method ด้านบน แต่เปลี่ยนเป็น model ที่ยังไม่ complete
		remaining: function () {
			return this.where({completed: false});
		},

		// สำหรับ generate order number ให้ model
		nextOrder: function () {
			// ถ้าใน collection มี model อยู่แล้วให้ get ค่า attribute 'order' ของ model อันสุดท้ายมา แล้วบวก 1
			// ถ้ายังไม่มีให้เริ่มจาก 1
			return this.length ? this.last().get('order') + 1 : 1;
		},

		// เป็น property สำหรับบอกว่า collection นี้จะเรียงลำดับ model ภายใน collection อย่างไร
		// รายละเอียดเพิ่มเติม http://backbonejs.org/#Collection-comparator
		comparator: 'order'
	});

	// สร้าง collection ชื่อ todos จาก Todos constructor function
	app.todos = new Todos();

})();
