/**
* Carousel is a UI-Component.
* @name Carousel
* @class Carousel
* @augments ch.Object
* @requires ch.List   
* @memberOf ch
* @param {Configuration Object} conf Object with configuration properties
* @returns {Chico-UI Object}
*/
 
ch.carousel = function (conf) {
	
	/**
	* Reference to a internal component instance, saves all the information and configuration properties.	* @private
	* @name that
	* @type {Object}
	* @memberOf ch.Carousel
	*/	
	var that = this;
	
	conf = ch.clon(conf);
	
	// Configurable pagination
	conf.pagination = conf.pagination || false;
	
	// Configuration for continue carousel
	// TODO: Rolling is forced to be false. Use this instead:
	// if (ch.utils.hasOwn(conf, "rolling")) { conf.rolling = conf.rolling; } else { conf.rolling = true; };
	conf.rolling = false;
	
	// Configurable arrows
	conf.arrows = (ch.utils.hasOwn(conf, "arrows")) ? conf.arrows : true;
	
	// Configurable efects
	conf.fx = (ch.utils.hasOwn(conf, "fx")) ? conf.fx : true;
	
	that.conf = conf;
	
/**
*  Inheritance
*/

	that = ch.object.call(that);
	that.parent = ch.clon(that);

/**
*  Private Members
*/
	
	/**
	* Creates the necesary structure to carousel operation.
	* @private
	* @function
	* @name createLayout
	* @memberOf ch.Carousel
	*/
	var createLayout = function () {

		// Create carousel's content
		that.$content = $("<div class=\"ch-carousel-content\">").append(that.$collection);

		// Create carousel's mask
		that.$container = $("<div class=\"ch-carousel-container\" style=\"height:" + that.itemSize.height + "px;\">")
			.append(that.$content)
			.appendTo(that.$element);

		// Visual configuration
		if (ch.utils.hasOwn(conf, "width")) { that.$element.css("width", conf.width); }
		if (ch.utils.hasOwn(conf, "height")) { that.$element.css("height", conf.height); }
		if (!conf.fx && ch.features.transition) { that.$content.addClass("ch-carousel-nofx"); }
	},
	
	/**
	* Creates Previous and Next arrows.
	* @private
	* @function
	* @name createArrows
	* @memberOf ch.Carousel
	*/
	createArrows = function () {
		
		// Previous arrow
		that.prevArrow = $("<p class=\"ch-prev-arrow\"><span>Previous</span></p>").bind("click", that.prev);
		
		// Next arrow
		that.nextArrow = $("<p class=\"ch-next-arrow\"><span>Next</span></p>").bind("click", that.next);
		
		// Continue carousel arrows behavior
		if (!conf.rolling) { that.prevArrow.addClass("ch-hide") }
		
		// Append arrows to carousel
		that.$element.prepend(that.prevArrow).append(that.nextArrow);
		
		// Positions arrows vertically inside carousel
		var arrowsPosition = (that.$element.outerHeight() - that.nextArrow.outerHeight()) / 2;
		$(that.prevArrow).css("top", arrowsPosition);
		$(that.nextArrow).css("top", arrowsPosition);
	},
	
	/**
	* Manages arrows turning it on and off when non-continue carousel is on first or last page.
	* @private
	* @function
	* @name toggleArrows
	* @param {Number} page Page to be moved
	* @memberOf ch.Carousel
	*/
	toggleArrows = function (page) {
		
		// Both arrows shown on carousel's middle
		if (page > 1 && page < that.pages) {
			that.prevArrow.removeClass("ch-hide");
			that.nextArrow.removeClass("ch-hide");
		} else {
			// Previous arrow hidden on first page
			if (page == 1) { that.prevArrow.addClass("ch-hide"); that.nextArrow.removeClass("ch-hide"); }
			
			// Next arrow hidden on last page
			if (page == that.pages) { that.prevArrow.removeClass("ch-hide"); that.nextArrow.addClass("ch-hide"); }
		}
	},
	
	/**
	* Creates carousel pagination.
	* @private
	* @function
	* @name createPagination
	* @memberOf ch.Carousel
	*/
	createPagination = function () {
		
		// Deletes pagination if already exists
		that.$element.find(".ch-carousel-pages").remove();
		
		// Create an list of elements for new pagination
		that.$pagination = $("<ul class=\"ch-carousel-pages\">");

		// Create each mini thumbnail
		for (var i = 1; i <= that.pages; i += 1) {
			// Thumbnail <li>
			var thumb = $("<li>" + i + "</li>");
			
			// Mark as actived if thumbnail is the same that current page
			if (i == that.currentPage) { thumb.addClass("ch-carousel-pages-on"); }
			
			// Append thumbnail to list
			that.$pagination.append(thumb);
		};

		// Bind each thumbnail behavior
		$.each(that.$pagination.children(), function (i, e) {
			$(e).bind("click", function () {
				that.goTo(i + 1);
			});
		});
		
		// Append list to carousel
		that.$element.append(that.$pagination);
		
		// Positions list
		that.$pagination.css("left", (that.$element.outerWidth() - that.$pagination.outerWidth()) / 2);
		
		// Save each generated thumb into an array
		$itemsPagination = that.$pagination.children();
	},
	
	/**
	* Calculates items amount on each page.
	* @private
	* @function
	* @name getItemsPerPage
	* @memberOf ch.Carousel
	* @returns {Number} Items amount on each page
	*/
	getItemsPerPage = function () {
		// Space to be distributed among all items
		var widthDiff = that.$element.outerWidth() - that.itemSize.width;
		
		// If there are space to be distributed, calculate pages
		return (widthDiff > that.itemSize.width) ? ~~(widthDiff / that.itemSize.width) : 1;
	},
	
	/**
	* Calculates total amount of pages.
	* @private
	* @function
	* @name getPages
	* @memberOf ch.Carousel
	* @returns {Number} Total amount of pages
	*/
	getPages = function () {
		// (Total amount of items) / (items amount on each page)
		return  Math.ceil(that.items.children.length / that.itemsPerPage);
	},

	/**
	* Calculates all necesary data to draw carousel correctly.
	* @private
	* @function
	* @name draw
	* @memberOf ch.Carousel
	*/
	draw = function () {
		
		// Reset size of carousel mask
		maskWidth = that.$container.outerWidth();

		// Recalculate items amount on each page
		that.itemsPerPage = getItemsPerPage();
		
		// Recalculate total amount of pages
		that.pages = getPages();
		
		// Calculate variable margin between each item
		var itemMargin = Math.ceil(((maskWidth - (that.itemSize.width * that.itemsPerPage)) / that.itemsPerPage) / 2);
		
		// Modify sizes only if new items margin are positive numbers
		if (itemMargin < 0) { return; }
		
		// Detach content from DOM for make a few changes
		that.$content.detach();
		
		// Move carousel to first page for reset initial position
		that.goTo(1);
		
		// Sets new margin to each item
		$.each(that.items.children, function (i, e) {
			e.style.marginLeft = e.style.marginRight = itemMargin + "px";
		});
		
		// Change content size and append it to DOM again
		that.$content
			.css("width", ((that.itemSize.width + (itemMargin * 2)) * that.items.size() + extraWidth))
			.appendTo(that.$container);
		
		// Create pagination if there are more than one page on total amount of pages
		if (conf.pagination && that.pages > 1) { createPagination(); }
	},
	
	/**
	* Size of carousel mask.
	* @private
	* @name maskWidth
	* @type {Number}
	* @memberOf ch.Carousel
	*/
	maskWidth,
	
	/**
	* List of pagination thumbnails.
	* @private
	* @name $itemsPagination
	* @type {Array}
	* @memberOf ch.Carousel
	*/
	$itemsPagination,
	
	/**
	* Extra size calculated on content
	* @private
	* @name extraWidth
	* @type {Number}
	* @memberOf ch.Carousel
	*/
	extraWidth,
	
	/**
	* Resize status of Window.
	* @private
	* @name resizing
	* @type {Boolean}
	* @memberOf ch.Carousel
	*/
	resizing = false;

/**
*  Protected Members
*/

	/**
	* UL list of items.
	* @private
	* @name $collection
	* @type {Array}
	* @memberOf ch.Carousel
	*/
	that.$collection = that.$element.children();
	
	/**
	* List object created from each item.
	* @private
	* @name items
	* @type {Object}
	* @memberOf ch.Carousel
	*/
	that.items = ch.list(that.$collection.children().toArray());
	
	/**
	* Width and height of first item.
	* @private
	* @name itemSize
	* @type {Object}
	* @memberOf ch.Carousel
	*/
	that.itemSize = {
		width: $(that.items.children[0]).outerWidth(),
		height: $(that.items.children[0]).outerHeight()
	};

	/**
	* Page selected.
	* @private
	* @name currentPage
	* @type {Number}
	* @memberOf ch.Carousel
	*/
	that.currentPage = 1;

	that.goTo = function (page) {
		
		// Validation of page parameter
		if (page == that.currentPage || page > that.pages || page < 1 || isNaN(page)) { return that; }
		
		// Coordinates to next movement
		var movement = -(maskWidth * (page - 1));

		// TODO: review this conditional
		// Movement with CSS transition
		if (conf.fx && ch.features.transition) {
			that.$content.css("left", movement);
		// Movement with jQuery animate
		} else if (conf.fx) {
			that.$content.animate({ left: movement });
		// Movement without transition or jQuery
		} else {
			that.$content.css("left", movement);
		}

		// Manage arrows
		if (!conf.rolling && conf.arrows) { toggleArrows(page); }
		
		// Refresh selected page
		that.currentPage = page;
		
		// TODO: Use toggleClass() instead remove and add.
		// Select thumbnail on pagination
		if (conf.pagination) {
			$itemsPagination
				.removeClass("ch-carousel-pages-on")
				.eq(page - 1)
				.addClass("ch-carousel-pages-on");
		}
		
		/**
		* Callback function
		* @name onMove
		* @type {Function}
		* @memberOf ch.Carousel
		*/
		that.callbacks("onMove");
		// new callback
		that.trigger("move");
		
		return that;
	};

	that.prev = function () {
		that.goTo(that.currentPage - 1);

		/**
		* Callback function
		* @name onPrev
		* @type {Function}
		* @memberOf ch.Carousel
		*/

		that.callbacks("onPrev");
		// new callback
		that.trigger("prev");
		
		return that;
	};
	
	that.next = function () {
		that.goTo(that.currentPage + 1);

		/**
		* Callback function
		* @name onNext
		* @type {Function}
		* @memberOf ch.Carousel
		*/

		that.callbacks("onNext");
		// new callback
		that.trigger("next");
		
		return that;
	};


/**
*  Public Members
*/

	/**
	* The component's instance unique identifier.
	* @public
	* @name uid
	* @type {Number}
	* @memberOf ch.Carousel
	*/ 
	that["public"].uid = that.uid;
	
	/**
	* The element reference.
	* @public
	* @name element
	* @type {HTMLElement}
	* @memberOf ch.Carousel
	*/
	that["public"].element = that.element;

	/**
	* The component's type.
	* @public
	* @name type
	* @type {String}
	* @memberOf ch.Carousel
	*/
	that["public"].type = that.type;

	/**
	* Get the items amount of each page.
	* @public
	* @name getItemsPerPage
	* @returns {Number}
	* @memberOf ch.Carousel
	*/
	that["public"].getItemsPerPage = function () { return that.itemsPerPage; };
	
	/**
	* Get the total amount of pages.
	* @public
	* @name getPage
	* @returns {Number}
	* @memberOf ch.Carousel
	*/
	that["public"].getPage = function () { return that.currentPage; };
	
	/**
	* Moves to a defined page.
	* @public
	* @function
	* @name goTo
	* @returns {Chico-UI Object}
	* @param {Number} page Page to be moved
	* @memberOf ch.Carousel
	* @example
	* // Create a carousel
	* var foo = $("bar").carousel();
	* 
	* // Go to second page
	* foo.goTo(2);
	*/
	that["public"].goTo = function (page) {
		that.goTo(page);

  		return that["public"];
	};
	
	/**
	* Moves to the next page.
	* @public
	* @name next
	* @returns {Chico-UI Object}
	* @memberOf ch.Carousel
	* @example
	* // Create a carousel
	* var foo = $("bar").carousel();
	* 
	* // Go to next page
	* foo.next();
	*/
	that["public"].next = function () {
		that.next();

		return that["public"];
	};

	/**
	* Moves to the previous page.
	* @public
	* @name prev
	* @returns {Chico-UI Object}
	* @memberOf ch.Carousel
	* @example
	* // Create a carousel
	* var foo = $("bar").carousel();
	* 
	* // Go to previous page
	* foo.prev();
	*/
	that["public"].prev = function () {
		that.prev();

		return that["public"];
	};

	/**
	* Re-calculate positioning, sizing, paging, and re-draw.
	* @public
	* @name redraw
	* @returns {Chico-UI Object}
	* @memberOf ch.Carousel
	* @example
	* // Create a carousel
	* var foo = $("bar").carousel();
	* 
	* // Re-draw carousel
	* foo.redraw();
	*/
	that["public"].redraw = function () {
		draw();
		
		return that["public"];
	};


/**
*  Default event delegation
*/
	
	// Add class name to carousel container
	that.$element.addClass("ch-carousel");

	// Add class name to collection and its children
	that.$collection
		.detach()
		.addClass("ch-carousel-list")
		.children()
			.addClass("ch-carousel-item");

	// Creates the necesary structure to carousel operation
	createLayout();

	// Calculate extra width for content before draw carousel
	extraWidth = (ch.utils.html.hasClass("ie6")) ? that.itemSize.width : 0;
	
	// Calculates all necesary data to draw carousel correctly
	draw();

	// Creates Previous and Next arrows
	if (conf.arrows && that.pages > 1) { createArrows(); }

	// Elastic behavior	
	if (!conf.hasOwnProperty("width")) {
		
		// Change resize status on Window resize event
		ch.utils.window.bind("resize", function () {
			resizing = true;
		});
		
		// Limit resize execution to a quarter of second
		setInterval(function () {
			
			if (!resizing) { return; }
			
			resizing = false;
			
			draw();
			
		}, 250);
	}

	return that;
}
