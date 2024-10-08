// ==UserScript==
// @name         Azusa 卡片标记
// @namespace    https://github.com/ERSTT
// @icon         https://azusa.wiki/favicon.ico
// @version      1.0
// @description  Azusa 卡片标记
// @author       ERST
// @match        https://azusa.wiki/*lottery*
// @match        https://zimiao.icu/*lottery*
// @grant        GM_xmlhttpRequest
// @updateURL    https://raw.githubusercontent.com/ERSTT/Files/refs/heads/main/JavaScript/Azusa_card_marking.user.js
// @downloadURL  https://raw.githubusercontent.com/ERSTT/Files/refs/heads/main/JavaScript/Azusa_card_marking.user.js
// @changelog    添加新域名
// ==/UserScript==

(function() {
    'use strict';

    var url1 = "https://azusa.wiki/lotterySettingSave.php?action=userCharacterCards";
    var url2 = "https://azusa.wiki/lotterySettingSave.php?action=specialExchangeCharacterCardsPool";
    var url3 = "https://azusa.wiki/lotterySettingSave.php?action=exchangeCharacterCardsPool";
    var url4 = "https://azusa.wiki/lotterySettingSave.php?action=lotteryCharacterCardsPool";

    var combinedResult = [];
    var ownedCardIds = [];

    GM_xmlhttpRequest({
        method: "GET",
        url: url1,
        responseType: "json",
        onload: function(response1) {
            var cardIds1 = response1.response.data.map(item => item.card_id);

            // 比对URL2的数据
            GM_xmlhttpRequest({
                method: "GET",
                url: url2,
                responseType: "json",
                onload: function(response2) {
                    setTimeout(function() {
                        var ids1 = response2.response.data.map(item => item.id);
                        var idsToKeep1 = ids1.filter(id => !cardIds1.includes(id));
                        var result1 = response2.response.data.filter(item => idsToKeep1.includes(item.id));
                        combinedResult = combinedResult.concat(result1);
                    }, 100);
                }
            });

            // 比对URL3的数据
            GM_xmlhttpRequest({
                method: "GET",
                url: url3,
                responseType: "json",
                onload: function(response3) {
                    setTimeout(function() {
                        var ids2 = response3.response.data.map(item => item.id);
                        var idsToKeep2 = ids2.filter(id => !cardIds1.includes(id));
                        var result2 = response3.response.data.filter(item => idsToKeep2.includes(item.id));
                        combinedResult = combinedResult.concat(result2);
                    }, 100);
                }
            });

            // 比对URL4的数据
            GM_xmlhttpRequest({
                method: "GET",
                url: url4,
                responseType: "json",
                onload: function(response4) {
                    setTimeout(function() {
                        var ids3 = response4.response.data.map(item => item.id);
                        var idsToKeep3 = ids3.filter(id => !cardIds1.includes(id));
                        var result3 = response4.response.data.filter(item => idsToKeep3.includes(item.id));
                        combinedResult = combinedResult.concat(result3);

                        // 输出结果到控制台
                        console.log(combinedResult);

                        // 遍历网页上的pic改红
                        combinedResult.forEach(function(item) {
                            var elements = document.querySelectorAll('img[src="' + item.pic + '"]');
                            elements.forEach(function(element) {
                                element.parentNode.style.backgroundColor = "red";
                            });
                        });
                    }, 450);
                }
            });
        }
    });
    // 获取用户已拥有的卡片数据
    GM_xmlhttpRequest({
        method: "GET",
        url: url1,
        responseType: "json",
        onload: function(response) {
            ownedCardIds = response.response.data.map(item => item.card_id);

            // 在页面上标记用户已拥有的卡片
            setTimeout(function() {
                markOwnedCards(response.response.data);
            }, 1000);
        }
    });

    // 在页面上标记用户已拥有的卡片函数
    function markOwnedCards(cards) {
        cards.forEach(function(item) {
            var elements = document.querySelectorAll('img[src="' + item.pic + '"]');
            elements.forEach(function(element) {
                element.parentNode.style.backgroundColor = "green";
            });
        });
    }
})();
