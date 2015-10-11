/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
	'use strict';

	// The Application View
	// ---------------

	// เป็น constructor function สำหรับสร้าง view สำหรับรัน app ทั้งหมด
	// จะไปรันใน js/app.js ด้วย new app.AppView(); เมื่อเริ่ม app
	app.AppView = Backbone.View.extend({

		// ใช้ element class .todoapp เป็น element สำหรับ view นี้ (ถ้าเราไม่กำหนด backbone จะสร้าง div ใหม่มาใช้)
		el: '.todoapp',

		// template สำหรับใส่ค่า stat ตรงนี้เป็น templating engine ของ underscore.js http://underscorejs.org/#template
		// สามารถใช้ templating engine ตัวอื่นๆ ได้หากต้องการ handlebars, mustache
		// วิธีใช้งานคร่าวๆ คือ จะสร้าง method ใหม่ขึ้นมาจากค่า html ที่เรา pass เข้าไป (อันนี้เอาค่ามาจากสิ่งที่อยู่ใน
		// <script type="text/template" id="stats-template"> ในไฟล์ html จะมีพวก <%= remaining %> อยู่
		// สมมติเมื่อเราเรียก statsTemplate({remaining: 6}) ใน html ก็จะแสดงเลข 6 แทน <%= remaining %>

		// จริงๆ แล้วไม่จำเป็นต้องเอา template ไปใส่ใน html <script> ก็ได้ ใส่ใน js ก็ได้ แต่เพื่อให้ code เข้าใจง่ายขึ้น
		statsTemplate: _.template($('#stats-template').html()),

		// กำหนด method ที่จะรันใน event ต่างๆ
		events: {
			// ถ้าพิมพ์ใน element ที่มี classs '.new-todo' (ตัว text input หลัก) ให้รัน 'createOnEnter' method
			'keypress .new-todo': 'createOnEnter',
			// ถ้าคลิก element ที่มี classs '.clear-completed' (button ที่อยู่ตรง footer ของเพจ) รัน 'clearCompleted' method
			'click .clear-completed': 'clearCompleted',
			// ถ้าคลิก element ที่มี class '.toggle-all' (ลูกศรชี้ลง เล็กๆ ข้างซ้ายของ text input) รัน 'toggleAllComplete' method
			'click .toggle-all': 'toggleAllComplete'
		},

		// At initialization we bind to the relevant events on the `Todos`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting todos that might be saved in *localStorage*.

		// initialize = function ที่รันในทุกครั้งที่ new view object นั้นๆ
		initialize: function () {
			// bind element ที่เกียวข้องทั้งหมดเพื่อง่ายต่อการเรียกใช้
			// '.toggle-all' = ลูกศรชี้ลง เล็กๆ ข้างซ้ายของ text input
			this.allCheckbox = this.$('.toggle-all')[0];
			// '.new-todo' = ตัว text input หลัก
			this.$input = this.$('.new-todo');
			// '.footer' = footer ของ app ที่เอาไว้ filter task (all, active, complete)
			this.$footer = this.$('.footer');
			// '.main' = main area ของ app เอาไว้ใส่ list และ ปุ่ม toggle all
			this.$main = this.$('.main');
			// '.todo-list' = เป็น <ul> เอาไว้ใส่ <li> ของ list
			this.$list = $('.todo-list');

			// ส่วนนี้ทั้งหมดเอาไว้ให้ view object ใช้ track เหตุการณ์ (event) ที่เกิดขึ้นใน collection apps.todos
			// syntax = object.listenTo(other, event, callback) รายละเอียด: http://backbonejs.org/#Events-listenTo

			// ถ้า collection มีการเพิ่ม model --> รัน addOne method
			this.listenTo(app.todos, 'add', this.addOne);

			// ถ้า collection มีการ reset --> รัน addAll method
			this.listenTo(app.todos, 'reset', this.addAll);

			// ถ้า model ใน collection มีการเปลี่ยนแปลงของ attribute 'completed' --> รัน filterOne method
			this.listenTo(app.todos, 'change:completed', this.filterOne);

			// ถ้ามีการ trigger custom event ชื่อ 'filter' ใน collection --> รัน filterAll method
			// event นี้ trigger มาจาก router
			this.listenTo(app.todos, 'filter', this.filterAll);

			// ในทุก event (all) ให้รัน underscore debounce method --> _.debounce(function, wait, [immediate])
			// debounce เป็น method สำหรับ limit ไม้ให้ function เดิมรันซ้ำๆ กันรัวๆ ในที่นี้คือ this.render
			// แต่ผมเองก็ไม่ค่อยเข้าใจว่าการ pass 0 คืออะไรครับ รู้แต่ถ้าไม่มี debounce มันจะ render รัวๆ มาก
			// ลอง console.log ใน render แล้วเอา debounce ออกดูครับ
			// รายละเอียด: http://underscorejs.org/#debounce

			// สรุปบรรทัดนี้ก็คือ เกิดอะไรขึ้นกับ collection ก็ตาม ให้ render
			this.listenTo(app.todos, 'all', _.debounce(this.render, 0));

			// fetch เป็น method สำหรับ model ในการเรียกค่ามา (ในที่นี้คือ local storage) สามารถใส่ option object
			// เป็น argument ได้ ส่วน reset: true ส่วนนี้ผมไม่ค่อยเข้าใจเหมือนกันครับ ลองอ่าน original comment นะครับ

			// Suppresses 'add' events with {reset: true} and prevents the app view
			// from being re-rendered for every model. Only renders when the 'reset'
			// event is triggered at the end of the fetch.
			app.todos.fetch({reset: true});
		},

		// render คือการแสดง view object นั้นใน document ส่วนนี้คือการแสดงผลในสิ่งที่เป็นโครงทั้งหมด
		// และส่วนที่เป็น stat
		render: function () {
			// มี task ที่ complete แล้วเท่าไหร่
			var completed = app.todos.completed().length;
			// มี task ที่ยังไม่ complete เท่าไหร่
			var remaining = app.todos.remaining().length;

			// ถ้ามี model ใน collection (มี task ใน task list ไม่ว่าจะ complete หรือไม่)
			if (app.todos.length) {

				// ให้ show app ออกมา
				this.$main.show();
				// ให้ show footer ออกมา
				this.$footer.show();

				// ใส่ค่า completed กับ remaining เข้าไปใน template ที่เตรียมไว้ด้านบน แล้วใส่เข้าไปใน $footer
				this.$footer.html(this.statsTemplate({
					completed: completed,
					remaining: remaining
				}));

				// ส่วน filter ตรง footer ถ้าอยู่หน้าไหนให้เพิ่ม class 'active' เข้าไปใน <a> นั้น
				this.$('.filters li a')
					.removeClass('selected')
					.filter('[href="#/' + (app.TodoFilter || '') + '"]')
					.addClass('selected');
			} else {

				// ถ้ายังไม่มี task อะไรให้ซ่อน app กับ footer ไว้
				this.$main.hide();
				this.$footer.hide();
			}

			// ถ้า task ที่ยังไม่ completed = 0 (false) --> check ตรง checkbox ด้านบนว่า completed หมดแล้ว
			this.allCheckbox.checked = !remaining;
		},

		// ถ้า collection มีการเพิ่ม model --> รัน addOne method
		// ทำงานโดยการ new view object มาจาก TodoView constructor function
		// (เอาไว้สร้าง view ของแต่ละ task ส่วน AppView นี้เอาไว้สร้างทั้ง app)
		// เมื่อสร้างแล้วก็ append เข้าไปใน el ของ AppView คือ <ul class="todo-list">

		// สรุปคือ ถ้า model เพิ่ม ให้สร้าง element แล้ว append นั้น เข้าไปใน ul
		addOne: function (todo) {
			var view = new app.TodoView({ model: todo });
			// view.render().el จะได้เป็น html element (เพราะใน render method ของ TodoView มี 'return this')
			this.$list.append(view.render().el);
		},

		// ถ้า collection มีการ reset --> รัน addAll method
		// แสดงทุก model ใน collection เข้าไปใน document
		addAll: function () {
			// $list = '.todo-list' = เป็น <ul> เอาไว้ใส่ <li> ของ list
			// ก็คือให้ลบ task เดิมที่มีอยู้ทั้งหมดออกก่อน
			this.$list.html('');
			// .each เป็น underscore.js method: http://underscorejs.org/#each
			// ให้แต่ละ model ใน todos collection รัน addOne method ใน context view object นี้ (this)
			app.todos.each(this.addOne, this);
		},

		// ถ้า model ใน collection มีการเปลี่ยนแปลงของ attribute 'completed' --> รัน filterOne method
		filterOne: function (todo) {
			// 'visible' เป็น custom event ของ todo view object ใช้คำนวณว่าจะแสดง task นั้นๆ หรือไม่
			// โดยดูจาก routing

			// ก็คือทุกครั้งที่ user คลิกตรง checkbox หน้า todo ก็จะดูว่าตอนนั้น กำลัง filter อะไรอยู่หรือเปล่า
			// ก่อนที่จะแสดงผลออกมา
			todo.trigger('visible');
		},

		// ถ้ามีการ trigger custom event ชื่อ 'filter' ใน collection --> รัน filterAll method
		// คือ filterOne กับทุก model ใน collection
		filterAll: function () {
			app.todos.each(this.filterOne, this);
		},

		// เอาไว้สร้าง attribute เวลาจะ new model เข้าไป
		newAttributes: function () {
			return {
				// เอาค่าที่อยู่ในช่อง input มา แล้ว trim ช่องว่างออก
				title: this.$input.val().trim(),
				// order ต่อจากอันล่าสุด
				order: app.todos.nextOrder(),
				completed: false
			};
		},

		// ถ้าพิมพ์ใน element ที่มี classs '.new-todo' (ตัว text input หลัก) ให้รัน 'createOnEnter' method
		// createOnEnter --> เมื่อกด enter --> สร้าง model ใหม่ โดยใช้ attribute จาก newAttributes method
		createOnEnter: function (e) {
			// .which เป็น jQuery event object จะได้ค่ามาเป็นรหัสปุ่มที่กดไป เลยเอามาเช็คว่าเป็นปุ่ม enter หรือเปล่า
			// และค่าของ input หลัง trim แล้วต้องไม่ว่าง
			if (e.which === ENTER_KEY && this.$input.val().trim()) {
				// สร้าง model ใหม่
				app.todos.create(this.newAttributes());
				// ล้างค่า input ให้ว่าง
				this.$input.val('');
			}
		},

		// ถ้าคลิก element ที่มี classs '.clear-completed' (button ที่อยู่ตรง footer ของเพจ) รัน 'clearCompleted' method
		// invoke เป็น underscore.js method จะรัน function destroy ในทุก model ที่ complete แล้ว
		clearCompleted: function () {
			_.invoke(app.todos.completed(), 'destroy');

			// อันนี้ผมไม่เข้าใจเหมือนกันว่าทำไมต้อง return false
			return false;
		},

		// ถ้าคลิก element ที่มี class '.toggle-all' (ลูกศรชี้ลง เล็กๆ ข้างซ้ายของ text input) รัน 'toggleAllComplete' method
		toggleAllComplete: function () {
			var completed = this.allCheckbox.checked;

			// ตั้งค่า attribute ให้ทุก model เป็น completed
			app.todos.each(function (todo) {
				todo.save({
					completed: completed
				});
			});
		}
	});
})(jQuery);
