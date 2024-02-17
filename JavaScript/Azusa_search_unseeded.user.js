// ==UserScript==
// @name         Azusa查找未做种
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Azusa查找未做种带自动翻页
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

    // 处理空内容并翻页
    var torrentsTable = document.querySelector('table.torrents');
    if(torrentsTable) {
        var rows = torrentsTable.querySelectorAll('tbody > tr');
        if(rows.length === 1) {
            var messageNode = document.createTextNode('当前页面无未做种种子，将自动翻页');
            var messageDiv = document.createElement('div');
            messageDiv.style.padding = '10px';
            messageDiv.style.background = '#f2f2f2';
            messageDiv.style.border = '1px solid #ccc';
            messageDiv.style.textAlign = 'center';
            messageDiv.appendChild(messageNode);
            torrentsTable.parentNode.insertBefore(messageDiv, torrentsTable.nextSibling);

            setTimeout(function() {
                var nextPageLink = document.querySelector('p:nth-child(2) > a:nth-child(2) > b');
                if(nextPageLink) {
                    nextPageLink.click();
                }
            }, 3000); // 3秒延迟
        }
    }
})();
