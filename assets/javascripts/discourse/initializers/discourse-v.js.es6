import { withPluginApi } from 'discourse/lib/plugin-api';
import loadScript from 'discourse/lib/load-script';
import VWidget from '../widget';
import { getVideo } from '../widget';

const APP_ID = 'b10b46ff-64a0-4edf-8783-3323f2564491';
const V_QR_REGEXP = /(.*)\[v-qr\]([\d\w-]*)\[\/v-qr\](.*)/;
const videos = {};
let widgets = {};

export default {
    name: "discourse-v",
    initialize() {
        withPluginApi('0.1', api => {
            // Initialize V SDK
            V.init(APP_ID);

            // Adds v-qr button to composer toolbar
            api.onToolbarCreate(toolbar => {
                toolbar.addButton({
                    id: 'v-qr',
                    group: 'extras',
                    icon: 'v',
                    title: 'v.title',
                    perform: e => e.addText(`[v-qr]${guid()}[/v-qr]`)
                });
            });

            // Creates decorator for convert of v-qr code to real widgets
            api.decorateCooked($element => {
                if (!$element) {
                    return;
                }

                const isPreview = $element.hasClass('d-editor-preview');

                $element
                    .contents()
                    .each((index, node) => {
                        if (V_QR_REGEXP.test(node.textContent)) {
                            const widgetTags = [];
                            const $node = $(node);
                            let html = $node.html();

                            while (V_QR_REGEXP.test(html)) {
                                const id = html.replace(V_QR_REGEXP, '$2');
                                const elementId = `v_widget_${id}`;

                                html = html.replace(V_QR_REGEXP, `$1<div class='v-widget' id="${elementId}" />$3`);

                                widgetTags.push({ id, elementId });
                            }

                            if (widgetTags.length) {
                                $node.html(html);

                                widgetTags.forEach(widget => {
                                    const $container = $node.find(`#${widget.elementId}`);

                                    if ($container.length) {
                                        // If it's preview then we show only placeholder
                                        if (isPreview) {
                                            $container.addClass('v-widget--placeholder');
                                            hasVideo(widget.id).then(flag => {
                                                if (flag) {
                                                    $('<div class="btn btn-danger"><i class="fa fa-remove" /> Delete video</div>')
                                                        .on('click', event => {
                                                            const $textarea = $('.d-editor-input');

                                                            $textarea
                                                                .val($textarea.val().replace(widget.id, guid()))
                                                                .trigger('change');
                                                        })
                                                        .appendTo($container);
                                                }
                                            });
                                        } else {
                                            const oldWidget = widgets[widget.id];

                                            oldWidget && oldWidget.clean();
                                            widgets[widget.id] = new VWidget($container, widget.id);
                                        }
                                    }
                                });
                            }
                        }
                    });
            });

            let currentUrl;

            api.onPageChange((url, title) => {
                // Clean up all current widgets when page has changed
                if (currentUrl && currentUrl !== url) {
                    Object.keys(widgets).forEach(id => widgets[id].clean());
                    widgets = {};
                }

                currentUrl = url;
            });
        });
    }
};


/**
 * Generate random GUID
 * @return {String} - GIUD string
 */
function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

/**
 * Check whether there is video with passed identifier
 * @param {String} - Video GUID identifier
 * @return {Boolean} - Flag
 */
function hasVideo(id) {
    return new Ember.RSVP.Promise(resolve => {
        const video = videos[id];

        if (video === undefined) {
            getVideo(id).then(video => {
                const value = !!video;

                videos[id] = value;
                resolve(value);
            });
        } else {
            resolve(video);
        }
    });
}