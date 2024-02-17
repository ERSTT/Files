// ==UserScript==
// @name         Azusa 种子页删除已做种种子
// @namespace    https://github.com/ERSTT
// @icon         https://azusa.wiki/favicon.ico
// @version      0.1
// @description  Azusa 种子页删除已做种种子
// @author       ERST
// @match        https://azusa.wiki/*torrents*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 删除已做种种子
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
