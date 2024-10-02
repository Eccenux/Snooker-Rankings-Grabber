// ==UserScript==
// @name         Snooker Rankings Grabber
// @namespace    pl.enux.wiki
// @version      2024-10-02
// @description  Grab player data from World Snooker Ranking
// @author       Nux
// @match        https://www.wst.tv/rankings/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wst.tv
// @grant        none
// ==/UserScript==

/**
  Repo: https://github.com/Eccenux/Snooker-Rankings-Grabber
*/

(function() {
    'use strict';

	var uniquePlayers = new Map();
	const SUSPICOUS_MIN = 110; // below seems too small
	const EXPECTED_SIZE = 100; // maybe good
	
	// Function to extract player data and log unique positions
	function extractPlayerData(countElement) {
		console.log('grabbing...');

		const worldRankings = document.getElementById('world_rankings');
		const sections = worldRankings.querySelectorAll('section');

		sections.forEach(section => {
			const position = parseInt(section.querySelector('p').innerText.trim(), 10);
			const name = section.querySelector('.player-name-wrapper').textContent.trim().replace(/\s+/g, ' ');

			// Check if the position already exists in the map
			if (!uniquePlayers.has(name)) {
				uniquePlayers.set(name, position);
			}
		});

		console.log('total grabbed: ', uniquePlayers.size);
		
		countElement.textContent = uniquePlayers.size;
		if (uniquePlayers.size >= EXPECTED_SIZE) {
			countElement.style.color="darkgreen";
			countElement.style.fontWeight="bold";
		}
	}

	function dumpPlayerData(clipHolder) {
		if (uniquePlayers.size < SUSPICOUS_MIN) {
			if (!confirm(`Seems like there are only ${uniquePlayers.size} players.\nYou should probably scroll to the end and try again.\n\nOr is ${uniquePlayers.size} enough?`)) {
				return;
			}
		}
		
		//console.log(uniquePlayers);
		let output = '';
		let count = 0;
		uniquePlayers.forEach((position, name) => {
			output += `|${name}=${position}\n`;
			count++;
		});
		console.log(output);
		//clipHolder.textContent = output;
		navigator.clipboard.writeText(output)
			.then(() => alert(`WikiText with ${count} players copied to clipboard!`))
			.catch(err => console.error('Failed to copy text: ', err));
	}

	// main init
	function initOnReady() {
		const parentElement = document.getElementById('world_rankings');
		let {countElement} = initElements(parentElement);
		initGrabber(parentElement, countElement);
	}

	// grab action init
	function initGrabber(parentElement, countElement) {
		// grab stuff on next/previous
		parentElement.querySelectorAll('button').forEach((item) => {
			console.log('init:', item);
			item.addEventListener('click', () => {
				extractPlayerData(countElement)
			});
		})

		// initial grab
		extractPlayerData(countElement)
	}

	// out elements
	function initElements(parentElement) {
		// Clip helper
		const clipHolder = document.createElement('div');
		parentElement.append(clipHolder);
		
		// Create and add the button to the page
		const button = document.createElement('button');
		button.innerHTML = 'Wiki 📋 (<cnt style="color:darkred">0</cnt>)';
		button.title = 'Copy WikiText with players (Note! Scroll to the end first!)';
		button.onclick = function() {
			dumpPlayerData(clipHolder);
		};

		parentElement.append(button);
		
		let countElement = button.querySelector('cnt');
		return {countElement, button};
	}
	
	class WaitForCondition {
		/**
		 * 
		 * @param {Number} interval Interval for checking the condition.
		 * @param limit Limit of repetiotions.
		 */
		constructor(interval=200, limit=50) {
			this.interval=interval;
			this.loopLimit=limit;
		}
		/**
		 * Wait for condition (e.g. for object/function to be defined).
		 * 
		 * @param {Function} condition Wait until true.
		 * @param {Function} callback Function to run after true.
		 */
		wait(condition, callback) {
			if (condition()) {
				callback();
			} else {
				let loopCount = 0;
				let intervalId = setInterval(function() {
					//console.log('waiting...');
					loopCount++;
					if (condition()) {
						console.log('init done');
						clearInterval(intervalId);
						callback();
					} else if (loopCount > this.limit) {
						console.error('condition failed');
						clearInterval(intervalId);
					}
				}, this.interval);
			}
		}	
	}
	let waitForCondition = new WaitForCondition();
	waitForCondition.wait(function(){
		var sections = document.querySelectorAll('#world_rankings section');
		return sections && sections.length>5;
	}, function() {
		initOnReady();
	});

})();
