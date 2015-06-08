/*global $:false*/
/*global console:false*/
/*global window:false*/
/*global ace:false*/
/*global sessionStorage:false*/
/*global localStorage:false*/


var dumpToJSON;
var restoreFromJSON;

$(function(){
    "use strict";

    var widgetContainerResize_lastSize = 0, widgetContainerResize,
        editorResize, requestEditor, responseEditor, sendRequest,
        actionsContainer = $('#actions-container'),
        requestMethodSelect = actionsContainer.find('select#action'),
        targetTextBox = actionsContainer.find('input[type=text]#target'),
        widgetContainer = $('#widget-container'), editorResizeHandle = $('#editor-resize-handle'),
        save, restoreWidget, restoreAllWidgets, remove, lastSaveTime,
        storageType;

    storageType = localStorage;
    lastSaveTime = -1;

    window.setInterval(function(){
        var date = new Date().getTime();

        if(date - lastSaveTime > 30 * 1000){
            /*jslint unparam: true*/
            widgetContainer.find('.searchContainer').each(function(k, v){
                save($(v));
            });
            /*jslint unparam: false*/
        }

        lastSaveTime = new Date().getTime();

    }, 2 * 1000);

    function newSearchContainer(x, y, title){
        var widget = $('<div>').searchContainer();
        $('#widget-container').append(widget);

        widget.css({
            left: x - (widget.width() / 2),
            top: y - (widget.height() / 2),
            position: 'absolute'
        });

        if(title !== undefined){
            widget.searchContainer('title', title);
        }

        if(widgetContainer.find('.search-container').length === 1){
            widget.addClass('active');
        }

        return widget;
    }

    remove = function(widget){
        storageType.removeItem(widget.searchContainer('option', 'id'));
    };

    save = function(widget){
        console.log(widget);
        var options = widget.searchContainer().data()['ui-searchContainer'].options;
        console.log('saving', options);
        storageType.setItem(options.id, JSON.stringify(options));
        lastSaveTime = new Date().getTime();
    };

    restoreAllWidgets = function(){

    };

    restoreWidget = function(id){
        if(storageType.getItem(id) === undefined){
            console.log('No search container with the id '+id);
            return;
        }
    };

    $('input[type=text]#target').on('keyup', function(){
        var container = widgetContainer.find('.search-container.active');
        container.searchContainer('option', 'target', $(this).val());
        save(container);
    });

    $('select#action').on('change', function(){
        var container = widgetContainer.find('.search-container.active');
        container.searchContainer('option', 'action', $(this).find('option:selected').text());
        save(container);
    });

    requestEditor = ace.edit('request-editor');
    requestEditor.getSession().setMode('ace/mode/javascript');
    requestEditor.on('change', function(e){
        var container = widgetContainer.find('search-container.active');

        container.searchContainer('option', 'lastChanged', new Date().getTime());
        if(e.action === 'insertLines' || (e.action === 'insertText' && e.text.length > 10)){
            save(container);
            return;
        }
    });

    $.re = requestEditor;

    responseEditor = ace.edit('response-editor');
    responseEditor.getSession().setMode('ace/mode/javascript');


    if(window.location.search.contains('allowDeletions')){
        requestMethodSelect.append($('<option id="delete">').text('DELETE'));
    }

    sendRequest = function(widget){
        console.log(JSON.stringify(widget.data()['ui-searchContainer'].options), null, " ");

    };

    /*jslint unparam: true*/
    widgetContainerResize = function(e, v){
        if(v.position.top < 100){
            v.position.top = widgetContainerResize_lastSize;
            return;
        }

        widgetContainerResize_lastSize = v.position.top;
        $('#js-container').css('top', v.position.top + 2 + $('#widget-container-resize').height());
        $('#widget-container').height(v.position.top);
    };
    /*jslint unparam: false*/

    $('#widget-container-resize').draggable({
        axis: 'y',
        drag: widgetContainerResize,
        stop: widgetContainerResize
    });

    widgetContainerResize(undefined, { position: { top: 100 }});



    widgetContainer.dblclick(function(e){
        console.log(e.pageX+' '+ e.pageY);
        newSearchContainer(e.pageX, e.pageY);
    });

    /*jslint unparam: true*/
    editorResize = function(e, v) {
        if(v.position.left < 450 || v.position.left > widgetContainer.width() - 200 - 25){
            v.position.left = editorResizeHandle.data('left-pos');
            return;
        }

        editorResizeHandle.data('left-pos', v.position.left).css('left', v.position.left);
        $('#request-editor-container').width(v.position.left);
        $('#response-editor').width($('#widget-container').width() - v.position.left - 1 - editorResizeHandle.width());
    };
    /*jslint unparam: false*/

    editorResizeHandle.draggable({
        axis: 'x',
        drag: editorResize,
        stop: editorResize
    });


    editorResize(null, { position: { left : (widgetContainer.width() / 2) - (editorResizeHandle.width() / 2), top :0 }});

    $(window).on('resize', function(){
        var windowSize = widgetContainer.width(),
            currentLeft = editorResizeHandle.position().left;

        $('#js-container').width(widgetContainer.width());
        $('#widget-container-resize').width(widgetContainer.width());
        if(currentLeft > windowSize - 200){
            editorResize(null, { position: {left: windowSize - 200 - editorResizeHandle.width()}});
            return;
        }

        editorResize(null, { position: { left : editorResizeHandle.position().left, top :0 }});
    });

    dumpToJSON = function(){
        var data = [];
        /*jslint unparam: true*/
        $('.search-container').each(function(k, v){
            data.push($(v).data()['ui-searchContainer'].options);
        });
        /*jslint unparam: false*/

        return data;
    };

    restoreFromJSON = function(json){
        var array;
        if(Array.isArray(json) === false){
            array = [json];
        }else{
            array = json;
        }

        /*jslint unparam: true*/
        $.each(array, function(k, v){
            newSearchContainer(v.left, v.top, v.title);
        });
        /*jslint unparam: false*/
    };

    $('#request-editor').find('textarea.ace_text-input').on('keypress', function(e){
        if(e.ctrlKey === true && e.keyCode === 13){
            sendRequest($('#widget-container').find('.search-container.active').searchContainer());
        }
    });

    $.widget('ui.searchContainer', {
        options : {
            left: 0,
            top: 0,
            title: 'New Search',
            query: '',
            results: '',
            target: '',
            action: '',
            id: '',
            lastChanged: new Date()
        },

        update : function(json){
            var me = this;

            me.options = json;

            me.title(me.options.title);
            me.element.css({
                top: me.options.top,
                left: me.options.left
            });

            if(me.element.hasClass('active')){
                requestEditor.getSession().getDocument().setValue(me.options.query);

            }
        },

        //fromSerialized : function(data){
        //    var me = this;
        //
        //    me.element.css({
        //        left: data.left,
        //        top: data.top
        //    });
        //
        //    me.title(data.title);
        //},

        title: function(title){
            var me = this;

            if(title === undefined){
                return me.options.title;
            }

            if(title !== '') {
                me.options.title = title;
                me.element.find('.search-container-text').text(title).attr('title', title);
            }

            return me;
        },

        _create : function(){
            var me = this;


            me.options.id = new Date().getTime();
            me.element.data('my-id', me.options.id);

            me.element.click(function(){
                if(me.element.hasClass('active') === false) {
                    save(widgetContainer.find('.search-container.active'));
                    targetTextBox.val(me.options.target);

                    requestMethodSelect.find('option').filter(function(){
                        return $(this).text() === me.options.action;
                    }).prop('selected', true);



                    $(me.element).parent().append(me);
                    $(me.element).addClass('active');

                    /*jslint unparam: true*/
                    $('#widget-container').find('.search-container').each(function (k, v) {
                        if ($(v).data('my-id') !== $(me.element).data('my-id')) {
                            $(v).removeClass('active');
                        }
                    });
                    /*jslint unparam: false*/
                }
            });

            me.element.dblclick(function(e){
                e.preventDefault();
                e.stopPropagation();
            });

            me.element.addClass('search-container');
            me.element.append($('<div class="search-container-buttons">').append(
                $('<i class="fa fa-times" title="Delete">').click(function(){
                    $('<div title="Delete the search named \"'+me.options.title+'\"">')
                        .append($('<span class="ui-icon ui-icon-alert" style="float: left; margin:0 7px 20px 0;">'))
                        .text('Are you sure you want to delete the search named \"'+me.options.title+'\"?')
                        .dialog({
                            resizable: false,
                            modal: true,
                            buttons: {
                                Delete: function () {
                                    me.element.remove();
                                    remove(me.element);
                                    $(this).dialog('destroy').remove();
                                },
                                Cancel: function () {
                                    $(this).dialog('destroy').remove();
                                }
                            },
                            close: function(){
                                $(this).dialog('destroy').remove();
                            }
                        });
                })
            ).append(
                $('<i class="fa fa-font" title="Change Title">').click(function(){
                    $('<div title="Change search title">')
                        .append($('<form>')
                            .append($('<fieldset style="padding: 0; border:0; margin: 25px 0;">')
                                .append($('<label for="name" style="display: block">').text('Title'))
                                .append($('<input type="text" name="name" id="name" class="text ui-widget-content ui-corner-all" style=" margin-bottom: 12px; width: 95%; padding: .4em">').val(me.title()))
                                .append($('<input type="submit" tabindex="-1" style="position: absolute; left: 0; top: -1000px">').val('Change Title'))))
                        .dialog({
                            modal: true,
                            width: 350,
                            buttons : {
                                Cancel: function(){
                                    $(this).dialog('destroy').remove();
                                },
                                "Change": function(){
                                    var newName = $(this).find('#name').val();
                                    me.title(newName);

                                    $(this).dialog('destroy').remove();
                                }
                            },
                            close: function(){
                                $(this).dialog('destroy').remove();
                            },
                            open: function(){
                                $(this).find('form').on('submit', function(e){
                                    e.preventDefault();
                                });

                                $(this).find('#name').val('').val(me.title());

                                $(this).find('#name').keypress(function(e){
                                    if(e.keyCode === 13){
                                        $(this).parents('.ui-dialog').find('span.ui-button-text:contains("Change")').parent().click();
                                    }
                                });
                            }
                        });


                    //var newName = prompt('New Title', me.options.text);
                    //
                    //if(newName !== '' && newName !== null){
                    //    console.log('new name', newName);
                    //    me.element.find('.search-container-text').text(newName);
                    //    me.options.text = newName;
                    //}

                })
            ));

            me.element.append($('<div class="search-container-text-parent">').append($('<div class="search-container-text">').attr('title', me.options.title).text(me.options.title)));

            /*jslint unparam: true*/
            me.element.draggable({
                containment: $('#widget-container'),
                stop: function(e, v){
                    me.options.left = v.position.left;
                    me.options.top = v.position.top;
                    $(this).css('opacity', 1);
                },
                start: function(){
                    $(this).parent().append(this);
                    $(this).css('opacity', 0.5);
                }
            });
            /*jslint unparam: false*/
        }
    });

    newSearchContainer();
});
