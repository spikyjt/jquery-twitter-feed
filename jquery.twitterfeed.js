/*
 * jQuery Twitter Feed v0.1 - https://github.com/spikyjt/jquery-twitter-feed
 *
 * A jQuery plugin for Twitter feeds with complete entities and actions
 *
 * Copyright © 2012 JT
 * Released under the MIT License.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies
 * or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

( function( $ ){

	var self = {

		fetchURL: 'http://search.twitter.com/search.json',

		defaultSettings: {

			count: null,
			username: null,
			autoRefresh: null,
			interval: null,
			dataCountAttr: 'data-count',
			dataUsernameAttr: 'data-username',
			dataIntervalAttr: 'data-interval',
			tooltips: true

		},

		settings: { },

		init: function( options ) {

			self.settings = $.extend( self.defaultSettings, options );

			return this.each( function() {

				self._fetch();

			} );

		},

		_fetch: function() {

			$.getJSON( self.fetchURL + '?callback=?', {
				q: 'from:' + self.settings.username,
				rpp: self.settings.count,
				result_type: 'recent',
				include_entities: true
			}, self._parseTweets( data ) );

		},

		_parseTweets: function( data ){

			$.each( data.results, function( index, tweet ) {
				var text = '',
					entities = self._parseUtils.sortEntities( tweet.entities ),
					position = 0;

				$.each( entities, function( index, entity ) {
					text += tweet.text.substring( position, entity.indices[ 0 ] ) + self._parseUtils.entityParse[ entity.entityType ]( entity );
					position = entity.indices[ 1 ];
				} );
				text += tweet.text.substring( position );
				t.prepend( '<div id="tweet-' + tweet.id_str + '" class="tweet">' + text + '</div>');
			} );

			self.addTooltips();

		},

		_parseUtils: {

			sortEntities: function( entities ) {

				var sorted=[];

				$.each( entities, function( type, entitiesOfType ) {

					$.each( entitiesOfType, function( index, entity ) {

						entity.entityType = type;
						sorted.push( entity );

					} );

				} );

				sorted.sort( self._parseUtils.entitiesSortLoop );

			},

			entitiesSortLoop: function( current, next ) {

				return current.indices[ 0 ] - next.indices[ 0 ];

			},

			entityParse: {

				user_mentions: function( entity ) {

					return '<a class="tweet-mention" href="http://twitter.com/' + entity.screen_name + '" title="' + entity.name + '" data-screen_name="' + entity.screen_name + '"><span class="tweet-at">@</span>' + entity.screen_name + '</a>';

				},

				urls: function( entity ) {

					return '<a class="tweet-link" href="' + entity.url + '" title="Visit ' + entity.expanded_url + '">' + entity.display_url + '</a>';

				},

				hashtags: function( entity ) {

					return '<a class="tweet-hashtag" href="http://twitter.com/search/%23' + entity.text + '" title="Show Twitter search: #' + entity.text + '">' + '<span class="tweet-hash">#</span>' + entity.text + '</a>';

				},

				media: function( entity ) {

					return '<a class="tweet-media" href="' + entity.media_url + '">' + entity.display_url + '</a>';

				}

			}

		},

		_addFollowButton: function( username ) {

			this.after( '<a class="follow_button" href="http://twitter.com/' + username + '"></a>' );

		},

		_addToolTips: function () {

			if( self.settings.tooltips && 'tooltip' in $ ) {

				$( '.tweet-mention' ).tooltip( {
					position: 'top center',
					offset: [8,0],
					opacity: 0.9,
					effect: 'slide',
					tipClass: 'tooltip tweet-mention-tooltip',
					layout: '<div><span class="tweet-mention-img"></span></div>',
					onBeforeShow: function() {
						var tmi = this.getTip().find( '.tweet-mention-img' ),
							screenName = this.getTrigger().attr('data-screen_name' );
						$.getJSON( 'http://api.twitter.com/1/users/show.json?callback=?', {
							screen_name: screenName,
							size: 'normal'
						}, function( data ){
							tmi.html( '<img src="' + data.profile_image_url + '"/>' );
						} );
					}
				} );

				$( '.tweet-hashtag, .tweet-link' ).tooltip( {
					position: 'top center',
					offset: [8,0],
					opacity: 0.9,
					effect: 'slide',
					tipClass: 'tooltip tweet-link-tooltip'
				} );

			}

		}

	}

	/**
	 * Fetch Tweets and populate target after parsing them.
	 * Mentions, links, hashtags and media have appropriate anchor tags and
	 * tooltips. Tweets are followed by timestamps and actions (retweet etc.)
	 * If auto refresh is enabled, new tweets will be added when they become
	 * available and timestamps will be updated. Follow button can also be
	 * added at the bottom of the target.
	 */
	$.fn.twitterFeed = function( method ) {

		if ( self[ method ] ) {

			return self[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ) );

		} else if ( typeof method === 'object' || ! method ) {

			return self.init.apply( this, arguments );

		} else {

			$.error( 'Method ' +  method + ' does not exist on jQuery.twitterFeed' );

		}

	}

} )( jQuery );
