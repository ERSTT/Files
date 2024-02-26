// ==UserScript==
// @name         Azusa 缺少卡片标记
// @namespace    https://github.com/ERSTT
// @icon         https://azusa.wiki/favicon.ico
// @version      0.3
// @description  Azusa 缺少卡片标记
// @author       ERST
// @match        https://azusa.wiki/*lottery*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    var url1 = "https://azusa.wiki/lotterySettingSave.php?action=exchangeCharacterCardsPool";
    var url2 = "https://azusa.wiki/lotterySettingSave.php?action=userCharacterCards";
    var url3 = "https://azusa.wiki/lotterySettingSave.php?action=specialExchangeCharacterCardsPool";
    var url4 = "https://azusa.wiki/lotterySettingSave.php?action=lotteryCharacterCardsPool";

    var combinedResult = [];

    GM_xmlhttpRequest({
        method: "GET",
        url: url1,
        responseType: "json",
        onload: function(response1) {
            GM_xmlhttpRequest({
                method: "GET",
                url: url2,
                responseType: "json",
                onload: function(response2) {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: url3,
                        responseType: "json",
                        onload: function(response3) {
                            GM_xmlhttpRequest({
                                method: "GET",
                                url: url4,
                                responseType: "json",
                                onload: function(response4) {
                                    var ids1 = response1.response.data.map(item => item.id);
                                    var cardIds2 = response2.response.data.map(item => item.card_id);
                                    var cardIds3 = response3.response.data.map(item => item.card_id);
                                    var cardIds4 = response4.response.data.map(item => item.card_id);
                                    var idsToKeep = ids1.filter(id => !cardIds2.includes(id) && !cardIds3.includes(id) && !cardIds4.includes(id));
                                    var result1 = response1.response.data.filter(item => idsToKeep.includes(item.id));
                                    var result2 = response3.response.data.filter(item => idsToKeep.includes(item.id));
                                    var result3 = response4.response.data.filter(item => idsToKeep.includes(item.id));

                                    combinedResult = combinedResult.concat(result1, result2, result3);

                                    // 输出结果到控制台
                                    console.log(combinedResult);

                                    // 遍历网页上的pic改红
                                    combinedResult.forEach(function(item) {
                                        var elements = document.querySelectorAll('img[src="' + item.pic + '"]');
                                        elements.forEach(function(element) {
                                            element.parentNode.style.backgroundColor = "red";
                                        });
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
})();
