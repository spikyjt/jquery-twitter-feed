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

	/**
	 * The object that does the actual work.
	 * @todo should we use prototype to make this behave like a proper class?
	 */
	var self = {

		/**
		 * {String} The Twitter search URL
		 */
		fetchURL: 'http://search.twitter.com/search.json',

		/**
		 * {Object} Default settings
		 */
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

		/**
		 * {Object} Current settings for the instance
		 * @todo this sucks because it gets re-initialised with each instance
		 * and does not persist with the instance
		 */
		settings: { },

		/**
		 * Set up the Twitter feed on the container element
		 * @param {Object} options The conifguration options. username and count are required.
		 * @return {jQuery Object} The selector supplied, for chaining
		 */
		init: function( options ) {

			// populate settings with defaults where necessary
			self.settings = $.extend( {}, self.defaultSettings, options );

			return this.each( function() {

				self._fetch( $(this) );

			} );

		},

		/**
		 * Fetch the tweet data and trigger the parse function on AJAX return
		 * @param {jQuery Object} container The container element
		 */
		_fetch: function( container ) {

			$.getJSON( self.fetchURL + '?callback=?', {
				q: 'from:' + self.settings.username,
				rpp: self.settings.count,
				result_type: 'recent',
				include_entities: true
			}, function( data ) {
				self._parseTweets( container, data )
			} );

		},

		/**
		 * Parse each tweet and add to the container
		 * @param {jQuery Object} container The container element
		 * @param {jsonObj} data The tweet data
		 */
		_parseTweets: function( container, data ) {

			$.each( data.results, function( index, tweet ) {

				container.prepend( '<div id="tweet-' + tweet.id_str + '" class="tweet">' +
					self._parseUtils.tweetParse( tweet ) +
					'</div>' );

			} );

			self._addToolTips( container );

		},

		/**
		 * {Object} Parsing utilities
		 */
		_parseUtils: {

			/**
			 * Parse a tweet, replacing each entity with an appropriate link
			 * @param {Object} tweet The tweet
			 * @return {String} The full tweet text with entity links
			 */
			tweetParse: function( tweet ) {

				var text = '',
					entities = self._parseUtils.sortEntities( tweet.entities ),
					position = 0;

				$.each( entities, function( index, entity ) {

					text += tweet.text.substring( position, entity.indices[ 0 ] ) +
						self._parseUtils.entityParse[ entity.entityType ]( entity );
					position = entity.indices[ 1 ];

				} );
				text += tweet.text.substring( position );

				return text;

			},

			/**
			 * Sort the tweet entities, so that they are in position order and
			 * assign them a type.
			 * @param {Array} entities The tweet entities
			 * @return {Array} Sorted entities
			 */
			sortEntities: function( entities ) {

				var sorted = [];

				$.each( entities, function( type, entitiesOfType ) {

					$.each( entitiesOfType, function( index, entity ) {

						entity.entityType = type;
						sorted.push( entity );

					} );

				} );

				sorted.sort( self._parseUtils.entitiesSortLoop );

				return sorted;

			},

			/**
			 * Callback for the sortEntities Array.sort function
			 * @param {Object} current The current entity
			 * @param {Object} next The next entity
			 * @return {integer} Difference between the position of the two entities
			 */
			entitiesSortLoop: function( current, next ) {

				return current.indices[ 0 ] - next.indices[ 0 ];

			},

			/**
			 * Entity Parsing functions.
			 * One per entity type, so they can be called automatically
			 */
			entityParse: {

				/**
				 * Parse user mentions
				 * @param {Object} entity The user mention entity
				 * @return {String} Link with user mention data and screen name
				 */
				user_mentions: function( entity ) {

					return '<a class="tweet-mention" href="http://twitter.com/' + entity.screen_name + '" title="' + entity.name + '" data-screen_name="' + entity.screen_name + '"><span class="tweet-at">@</span>' + entity.screen_name + '</a>';

				},

				/**
				 * Parse urls
				 * @param {Object} entity The url entity
				 * @return {String} Link to full url, with display url shown
				 */
				urls: function( entity ) {

					return '<a class="tweet-link" href="' + entity.url + '" title="Visit ' + entity.expanded_url + '">' + entity.display_url + '</a>';

				},

				/**
				 * Parse hash tags
				 * @param {Object} entity The hashtag entity
				 * @return {String} Link with hashtag search
				 */
				hashtags: function( entity ) {

					return '<a class="tweet-hashtag" href="http://twitter.com/search/%23' + entity.text + '" title="Show Twitter search: #' + entity.text + '">' + '<span class="tweet-hash">#</span>' + entity.text + '</a>';

				},

				/**
				 * Parse media
				 * @param {Object} entity The media entity
				 * @return {String} Link to media url, with display url shown
				 */
				media: function( entity ) {

					return '<a class="tweet-media" href="' + entity.media_url + '">' + entity.display_url + '</a>';

				}

			}

		},

		/**
		 * Add a follow button if required
		 * @todo add a boolean option and check it
		 * @todo link the button to Twitter properly
		 */
		_addFollowButton: function() {

			this.after( '<a class="follow_button" href="http://twitter.com/' + self.settings.username + '"></a>' );

		},

		/**
		 * Add tooltips to tweet entities
		 * @param {jQuery Object} container The container element
		 * @todo add media tooltips with image fetching
		 * @todo add configuration settings
		 */
		_addToolTips: function ( container ) {

			if( self.settings.tooltips && 'tooltip' in $.fn ) {

				container.find( '.tweet-mention' ).tooltip( {
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

				container.find( '.tweet-hashtag, .tweet-link' ).tooltip( {
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
	 * @param {mixed} method Either the configuration settings to initialize the
	 * twitter feed, or the name of a method to execute
	 * @return {mixed} the jQuery object on which the twitter feed is applied,
	 * or the method result
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
