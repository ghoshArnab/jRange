;
(function ($, window, document, undefined) {
    'use strict';
    var sliderControl = function () {
        return this.init.apply(this, arguments);
    };
    sliderControl.prototype = {
        defaults: {
            onstatechange: function () {},
            ondragend: function () {},
            onbarclicked: function () {},
            isRange: true,
            showLabels: true,
            showScale: true,
            step: 1,
            width: 500,
            disable: false
        },
        init: function (node, options) {
            this.options = $.extend({}, this.defaults, options);
            this.sliderContainer = $('.slider-container')
            this.sliderNode = this.sliderContainer.find('.slider-main');
            this.options.value = this.sliderNode.data('value') || (this.options.isRange ? this.options.from + ',' + this.options.from : '' + this.options.from);
            this.sliderNode.on('change', this.onChange);
            this.pointers = $('.pointer', this.sliderNode);
            this.lowPointer = this.pointers.first();
            this.highPointer = this.pointers.last();
            this.labels = $('.pointer-label', this.sliderNode);
            this.lowLabel = this.labels.first();
            this.highLabel = this.labels.last();
            this.scale = $('.scale', this.sliderNode);
            this.bar = $('.selected-bar', this.sliderNode);
            this.clickableBar = this.sliderNode.find('.bar-body');
            this.decreaseSlider = this.sliderContainer.find('.left');
            this.increaseSlider = this.sliderContainer.find('.right');
            this.interval = this.options.to - this.options.from;
            this.render();
        },
        render: function () {
            this.options.width = this.options.width || this.sliderNode.width();
            this.sliderNode.width(this.options.width);
            if (!this.options.showLabels) {
                this.labels.hide();
            }
            this.attachEvents();
            if (this.options.showScale) {
                this.renderScale();
            }
            this.setValue(this.options.value);
        },
        attachEvents: function () {
            this.clickableBar.click($.proxy(this.barClicked, this));
            this.decreaseSlider.click($.proxy(this.leftClicked, this));
            this.increaseSlider.click($.proxy(this.rightClicked, this));
            this.pointers.on('mousedown touchstart', $.proxy(this.onDragStart, this));
            this.pointers.bind('dragstart', function (event) {
                event.preventDefault();
            });
        },
        onDragStart: function (e) {
            if (this.options.disable || (e.type === 'mousedown' && e.which !== 1)) {
                return;
            }
            e.stopPropagation();
            e.preventDefault();
            var pointer = $(e.target);
            this.pointers.removeClass('last-active');
            pointer.addClass('focused last-active');
            this[(pointer.hasClass('low') ? 'low' : 'high') + 'Label'].addClass('focused');
            $(document).on('mousemove.slider touchmove.slider', $.proxy(this.onDrag, this, pointer));
            $(document).on('mouseup.slider touchend.slider touchcancel.slider', $.proxy(this.onDragEnd, this));
        },
        onDrag: function (pointer, e) {
            e.stopPropagation();
            e.preventDefault();
            if (e.originalEvent.touches && e.originalEvent.touches.length) {
                e = e.originalEvent.touches[0];
            } else if (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
                e = e.originalEvent.changedTouches[0];
            }
            var position = e.clientX - this.sliderNode.offset().left;
            this.sliderNode.trigger('change', [this, pointer, position]);
        },
        onDragEnd: function (e) {
            this.pointers.removeClass('focused').trigger('rangeslideend');
            this.labels.removeClass('focused');
            $(document).off('.slider');
            this.options.ondragend.call(this, this.options.value);
        },
        barClicked: function (e) {
            if (this.options.disable) return;
            var x = e.pageX - this.clickableBar.offset().left;
            var firstLeft = Math.abs(parseFloat(this.pointers.first().css('left'), 10)),
                firstHalfWidth = this.pointers.first().width() / 2,
                lastLeft = Math.abs(parseFloat(this.pointers.last().css('left'), 10)),
                lastHalfWidth = this.pointers.first().width() / 2,
                leftSide = Math.abs(firstLeft - x + firstHalfWidth),
                rightSide = Math.abs(lastLeft - x + lastHalfWidth),
                pointer;
            if (leftSide == rightSide) {
                pointer = x < firstLeft ? this.pointers.first() : this.pointers.last();
            } else {
                pointer = leftSide < rightSide ? this.pointers.first() : this.pointers.last();
            }
            this.setPosition(pointer, x, true, true);
            this.options.onbarclicked.call(this, this.options.value);
        },
        leftClicked: function (e) {
            if (this.options.disable) return;
            var firstLeft = Math.abs(parseFloat(this.pointers.first().css('left'), 10)),
                firstHalfWidth = this.pointers.first().width() / 2,
                leftSide = Math.abs(firstLeft + firstHalfWidth);
            this.setPosition(this.pointers.first(), leftSide - 50, true, true);
            if (leftSide < this.clickableBar.offset().left) {
                alert('ss');
            }
        },
        rightClicked: function (e) {
            if (this.options.disable) return;
            var lastLeft = Math.abs(parseFloat(this.pointers.last().css('left'), 10)),
                lastHalfWidth = this.pointers.first().width() / 2,
                rightSide = Math.abs(lastLeft + lastHalfWidth);
            this.setPosition(this.pointers.last(), rightSide + 50, true, true);
            /*if(rightSide < this.clickableBar.offset().left){
                alert('ss');
            }*/
        },
        onChange: function (e, self, pointer, position) {
            var min, max;
            min = 0;
            max = self.sliderNode.width();
            min = pointer.hasClass('high') ? parseFloat(self.lowPointer.css("left")) + (self.lowPointer.width() / 2) : 0;
            max = pointer.hasClass('low') ? parseFloat(self.highPointer.css("left")) + (self.highPointer.width() / 2) : self.sliderNode.width();
            var value = Math.min(Math.max(position, min), max);
            self.setPosition(pointer, value, true);
        },
        setPosition: function (pointer, position, isPx, animate) {
            var leftPos, rightPos,
                lowPos = parseFloat(this.lowPointer.css("left")),
                highPos = parseFloat(this.highPointer.css("left")) || 0,
                circleWidth = this.highPointer.width() / 2;
            if (!isPx) {
                position = this.prcToPx(position);
            }
            if (pointer[0] === this.highPointer[0]) {
                highPos = Math.round(position - circleWidth);
            } else {
                lowPos = Math.round(position - circleWidth);
            }
            pointer[animate ? 'animate' : 'css']({
                'left': Math.round(position - circleWidth)
            });
            leftPos = lowPos + circleWidth;
            rightPos = highPos + circleWidth;
            var w = Math.round(highPos + circleWidth - leftPos);
            this.bar[animate ? 'animate' : 'css']({
                'width': Math.abs(w),
                'left': (w > 0) ? leftPos : leftPos + w
            });
            this.showPointerValue(pointer, position, animate);
            this.isReadonly();
        },
        setValue: function (value) {
            var values = value.toString().split(',');
            values[0] = Math.min(Math.max(values[0], this.options.from), this.options.to) + '';
            if (values.length > 1) {
                values[1] = Math.min(Math.max(values[1], this.options.from), this.options.to) + '';
            }
            this.options.value = value;
            var prc = this.valuesToPrc(values.length === 2 ? values : [0, values[0]]);
            this.setPosition(this.lowPointer, prc[0]);
            this.setPosition(this.highPointer, prc[1]);
        },
        renderScale: function () {
            var s = this.options.scale || [this.options.from, this.options.to];
            var prc = Math.round((100 / (s.length - 1)) * 10) / 10;
            var str = '';
            for (var i = 0; i < s.length; i++) {
                str += '<span style="left: ' + i * prc + '%">' + (s[i] != '|' ? '<ins>' + s[i] + '</ins>' : '') + '</span>';
            }
            this.scale.html(str);
            $('ins', this.scale).each(function () {
                $(this).css({
                    marginLeft: -$(this).outerWidth() / 2
                });
            });
        },
        showPointerValue: function (pointer, position, animate) {
            var label = $('.pointer-label', this.sliderNode)[pointer.hasClass('low') ? 'first' : 'last']();
            var value = this.positionToValue(position);
            var width = label.html(""+value).width(),
                left = position - width / 2;
            left = Math.min(Math.max(left, 0), this.options.width - width);
            label[animate ? 'animate' : 'css']({
                left: left
            });
            this.setInputValue(pointer, value);
        },
        valuesToPrc: function (values) {
            var lowPrc = ((parseFloat(values[0]) - parseFloat(this.options.from)) * 100 / this.interval),
                highPrc = ((parseFloat(values[1]) - parseFloat(this.options.from)) * 100 / this.interval);
            return [lowPrc, highPrc];
        },
        prcToPx: function (prc) {
            return (this.sliderNode.width() * prc) / 100;
        },
        isDecimal: function () {
            return ((this.options.value + this.options.from + this.options.to).indexOf(".") === -1) ? false : true;
        },
        positionToValue: function (pos) {
            var value = (pos / this.sliderNode.width()) * this.interval;
            value = parseFloat(value, 10) + parseFloat(this.options.from, 10);
            if (this.isDecimal()) {
                var final = Math.round(Math.round(value / this.options.step) * this.options.step * 100) / 100;
                if (final !== 0.0) {
                    final = '' + final;
                    if (final.indexOf(".") === -1) {
                        final = final + ".";
                    }
                    while (final.length - final.indexOf('.') < 3) {
                        final = final + "0";
                    }
                } else {
                    final = "0.00";
                }
                return final;
            } else {
                return Math.round(value / this.options.step) * this.options.step;
            }
        },
        setInputValue: function (pointer, v) {
            var values = this.options.value.split(',');
            if (pointer.hasClass('low')) {
                this.options.value = v + ',' + values[1];
            } else {
                this.options.value = values[0] + ',' + v;
            }
            if (this.sliderNode.data('value') !== this.options.value) {
                this.sliderNode.data('value', this.options.value);
                this.options.onstatechange.call(this, this.options.value);
            }
        },
        isReadonly: function () {
            this.sliderNode.toggleClass('slider-readonly', this.options.disable);
        },
        disable: function () {
            this.options.disable = true;
            this.isReadonly();
        }
    };
    $.fn.sliderControl = function (option) {
        $(this).data(new sliderControl(this, option));
    };
})(jQuery, window, document);
