/*global Backbone, jQuery, _, ENTER_KEY, ESC_KEY */
var app = app || {};

(function ($) {
	'use strict';

	// Todo Item View
	// --------------

	// เป็น constructor function สำหรับสร้าง view สำหรับแต่ละ todo task
	// จะไปรันใน js/views/app.js โดย addOne method --> new app.TodoView()
	app.TodoView = Backbone.View.extend({
		// element นี้เป็น <li> ที่จะ append เข้าไปใน <ul>
		tagName:  'li',

		// หลักการเดียวกับ template สำหรับ stat-template อันนี้ก็คือเตรียม template ไว้
		// สำหรับใส่ค่า attribute จาก model เข้าไป
		template: _.template($('#item-template').html()),

		// DOM event ที่เกี่ยวข้องทั้งหมด
		events: {
			// คลิกปุ่ม toggle (ติ๊กถูกหน้า task) ให้รัน 'toggleCompleted'
			'click .toggle': 'toggleCompleted',
			// double click ที่ task ให้รัน 'edit'
			'dblclick label': 'edit',
			// คลิกปุ่มลบ ให้รัน 'clear'
			'click .destroy': 'clear',
			// พิมพ์ใน input class '.edit' ให้รัน 'updateOnEnter'
			'keypress .edit': 'updateOnEnter',
			// พิมพ์ใน input class '.edit' ให้รัน 'revertOnEscape'
			'keydown .edit': 'revertOnEscape',
			// พิมพ์อยู่แล้วเลิกพิมพ์ ให้รัน 'close'
			'blur .edit': 'close'
		},

		// เมื่อสร้าง todo view object ขึ้นมา ให้ติดตามเหตุการณ์ (event) ของ model สามอย่าง
		initialize: function () {
			// ถ้า model มีการเปลียนแปลงใดๆ ให้ 'render' ใหม่
			this.listenTo(this.model, 'change', this.render);
			// ถ้า model ถูกลบไป ให้ 'remove'
			this.listenTo(this.model, 'destroy', this.remove);
			// ถ้า model นี้ถูก trigger custome event 'visible' --> รัน 'toggleVisible'
			this.listenTo(this.model, 'visible', this.toggleVisible);
		},

		// render เป็น function สำหรับแสดงผล todo view object นั้นๆ เข้าไปใน document
		render: function () {
			// ส่วนนี้เป็นแก้ Backbone LocalStorage bug ครับ ลองอ่านดูนะครับ

			// Backbone LocalStorage is adding `id` attribute instantly after
			// creating a model.  This causes our TodoView to render twice. Once
			// after creating a model and once on `id` change.  We want to
			// filter out the second redundant render, which is caused by this
			// `id` change.  It's known Backbone LocalStorage bug, therefore
			// we've to create a workaround.
			// https://github.com/tastejs/todomvc/issues/469

			// changed เป็น property สำหรับเช็คว่า attribute ไหนมีการเปลี่ยนแปลงบ้างหลังการ set ครั้งล่าสุด
			// ก็คือเช็คว่า id ได้เปลี่ยนไปเหรือเปล่า ถ้าเปลี่ยนก็ return
			if (this.model.changed.id !== undefined) {
				return;
			}

			// this.model.toJSON() จะได้มาเป็น javascript object ปกติๆ (ถึงแม้ชื่อมันจะชวนงง)
			// เอา object นั้นไปใส่ลงใน template
			this.$el.html(this.template(this.model.toJSON()));
			// ถ้า attribue completed ใน model เป็น true ให้ใส่ class 'completed' เข้าไปใน element
			this.$el.toggleClass('completed', this.model.get('completed'));
			// ตรวจสอบว่าควรแสดงในหน้าหรือเปล่า ตัดสินจากหน้าที่อยู่ขณะนั้น (routing)
			this.toggleVisible();
			// bind <input class="edit"> ไว้เพื่อเรียกใช้ทีหลัง
			this.$input = this.$('.edit');
			// return view object นี้ไว้ เพื่อให้ง่ายต่อการเรียก element เช่น view.render().el
			return this;
		},

		// show or hide element ตาม routing ขณะนั้น
		toggleVisible: function () {
			// ถ้า isHidden === true --> add class hidden
			this.$el.toggleClass('hidden', this.isHidden());
		},

		// logic สำหรับดูว่าจะ show หรือ hide model
		isHidden: function () {

			// ถ้า model นี้ completed: true --> ให้ดูว่าอยู่หน้า active หรือเปล่า
			// ถ้าอยู่หน้า active --> return true (hide), ถ้าไม่อยู่ --> return false (show)

			// ถ้า model นี้ completed: false --> ให้ดูว่าอยู่หน้า completed หรือเปล่า
			// ถ้าอยู่หน้า complete --> return true (hide), ถ้าไม่อยู่ --> return false (show)

			return this.model.get('completed') ?
				// ถ้าอยู่ในหน้า active จะ true
				app.TodoFilter === 'active' :
				// ถ้าอยู่ในหน้า completed จะ true
				app.TodoFilter === 'completed';
		},

		// toggle 'completed' state ของ model นี้
		toggleCompleted: function () {
			this.model.toggle();
		},

		// เปลี่ยน mode ไปอยู่ editing mode (แสดง input field สำหรับแก้ไขออกมา)
		edit: function () {
			this.$el.addClass('editing');
			this.$input.focus();
		},

		// ออกจาก editing mode พร้อม save ค่า
		close: function () {
			// get ค่าที่อยู่ใน input field ณ ขณะนั้น
			var value = this.$input.val();
			var trimmedValue = value.trim();

			// ถ้าไม่ได้กำลังอยู่ใน editing mode --> return
			if (!this.$el.hasClass('editing')) {
				return;
			}

			if (trimmedValue) {
				// save ค่า title ลงไปใน model นั้น
				this.model.save({ title: trimmedValue });

				// ถ้าค่าที่ใส่เข้าไปใหม่ หลังจาก trim แล้วเปลี่ยนไปจากค่าเดิมค่อย trigger 'change' event
				if (value !== trimmedValue) {
					this.model.trigger('change');
				}
			} else {
				// ถ้าไม่ได้พิมพ์อะไรใน input ก็ destroy model ไปเลย
				this.clear();
			}

			// เอา class 'editing' ออก
			this.$el.removeClass('editing');
		},

		// พิมพ์ใน input class '.edit' ให้รัน 'updateOnEnter'
		// ถ้ากด enter ให้รัน close method
		updateOnEnter: function (e) {
			if (e.which === ENTER_KEY) {
				this.close();
			}
		},

		// พิมพ์ใน input class '.edit' ให้รัน 'revertOnEscape'
		// ถ้ากด esc ให้ออกจาก editing mode โดยไม่ต้อง save
		revertOnEscape: function (e) {
			if (e.which === ESC_KEY) {
				this.$el.removeClass('editing');
				// เอาค่าเดิมมาใส่ใน input value
				this.$input.val(this.model.get('title'));
			}
		},

		// method สำหรับลบ model นี้
		clear: function () {
			this.model.destroy();
		}
	});
})(jQuery);
