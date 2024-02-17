// ==UserScript==
// @name         Azusa 种子页删除已做种条例
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Azusa 种子页删除已做种条例
// @author       ERST
// @match        https://azusa.wiki/torrents*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 删除已做种条例
    let divElements = document.querySelectorAll('div[title="seeding 100%"]');
    divElements.forEach(divElement => {
        let trElement = divElement.closest('tr');
        if (trElement) {
            let parentTrElement = trElement.parentNode.closest('tr');
            if (parentTrElement) {
                parentTrElement.remove();
            }
            trElement.remove();
        }
    });
})();
