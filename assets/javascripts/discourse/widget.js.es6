const GROUP_ID = '5afd7e0b-83e0-452f-8e16-d6b4510e70bb';

export function getVideo(id) {
    return V.videos.search({
        group_ids: [GROUP_ID],
        meta_data: { id },
        sort_order: 'desc'
    }).then(data => (data || [])[0]);
}

export default class VWidget {
    constructor($element, id) {
        this.id = id;
        this.$element = $element;

        getVideo(id).then(video => video ? this.showVideo(video) : this.showQR());
    }

    showVideo(video) {
        if (video) {
    		this.clean();

    		V.ui('player', this.$element[0], {
    			video: video,
    			size: 'auto',
    			playOnFocus: true,
    			modules: ['progress'],
    			loop: true
    		});
    	}
    }

    showQR() {
        const videoParams = {
            group_id: GROUP_ID,
            meta_data: { id: this.id }
        };

        this.clean();

        V.ui('qrcode', this.$element[0], { video: videoParams });
        this.unsubscribe = V.notifications.subscribeOnNewVideo(videoParams, video => this.showVideo(video));
    }

    clean() {
        this.$element.find('.v-player, .v-qrcode').each((index, element) => V.ui.getInstance(element).destroy());
        this.$element.html('');
        this.unsubscribe && this.unsubscribe();
    }
}