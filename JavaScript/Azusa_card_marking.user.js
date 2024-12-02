// ==UserScript==
// @name         Azusa 卡片标记
// @namespace    https://github.com/ERSTT
// @icon         https://azusa.wiki/favicon.ico
// @version      1.3
// @description  Azusa 卡片标记
// @author       ERST
// @match        https://azusa.wiki/*lottery*
// @match        https://zimiao.icu/*lottery*
// @grant        GM_xmlhttpRequest
// @updateURL    https://raw.githubusercontent.com/ERSTT/Files/refs/heads/main/JavaScript/Azusa_card_marking.user.js
// @downloadURL  https://raw.githubusercontent.com/ERSTT/Files/refs/heads/main/JavaScript/Azusa_card_marking.user.js
// @changelog    优化了代码，适配了新域名
// ==/UserScript==

(function() {
    'use strict';

    var url1 = "https://azusa.wiki/lotterySettingSave.php?action=userCharacterCards";
    var url2 = "https://azusa.wiki/lotterySettingSave.php?action=specialExchangeCharacterCardsPool";
    var url3 = "https://azusa.wiki/lotterySettingSave.php?action=exchangeCharacterCardsPool";
    var url4 = "https://azusa.wiki/lotterySettingSave.php?action=lotteryCharacterCardsPool";

    var currentDomain = window.location.hostname;
    if (currentDomain === "zimiao.icu") {
        url1 = url1.replace("azusa.wiki", "zimiao.icu");
        url2 = url2.replace("azusa.wiki", "zimiao.icu");
        url3 = url3.replace("azusa.wiki", "zimiao.icu");
        url4 = url4.replace("azusa.wiki", "zimiao.icu");
    }

    var combinedResult = [];
    var ownedCardIds = [];

    function fetchDataAndMark() {
        GM_xmlhttpRequest({
            method: "GET",
            url: url1,
            responseType: "json",
            onload: function(response1) {
                ownedCardIds = response1.response.data.map(item => item.card_id);

                Promise.all([
                    fetchCards(url2, ownedCardIds),
                    fetchCards(url3, ownedCardIds),
                    fetchCards(url4, ownedCardIds)
                ]).then(results => {
                    combinedResult = results.flat();

                    // 定期标记图片
                    setInterval(() => {
                        markCards(combinedResult, "red");
                        markCards(response1.response.data, "green");
                    }, 500);
                });
            }
        });
    }

    function fetchCards(url, excludeIds) {
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                responseType: "json",
                onload: function(response) {
                    var data = response.response.data;
                    var ids = data.map(item => item.id || item.card_id);
                    var idsToKeep = ids.filter(id => !excludeIds.includes(id));
                    var filteredData = data.filter(item => idsToKeep.includes(item.id || item.card_id));
                    resolve(filteredData);
                }
            });
        });
    }

    function markCards(cards, color) {
        cards.forEach(function(item) {
            var elements = document.querySelectorAll('img[src="' + item.pic + '"]');
            elements.forEach(function(element) {
                element.parentNode.style.backgroundColor = color;
            });
        });
    }

    // 初始化观察器
    var observer = new MutationObserver(function(mutations) {
        fetchDataAndMark();
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
