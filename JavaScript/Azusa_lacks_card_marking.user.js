// ==UserScript==
// @name         Azusa 缺少卡片标记
// @namespace    https://github.com/ERSTT
// @icon         https://azusa.wiki/favicon.ico
// @version      0.1
// @description  Azusa 缺少卡片标记
// @author       ERST
// @match        https://azusa.wiki/*lottery*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    var url1 = "https://azusa.wiki/lotterySettingSave.php?action=exchangeCharacterCardsPool";
    var url2 = "https://azusa.wiki/lotterySettingSave.php?action=userCharacterCards";

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
                    var ids1 = response1.response.data.map(item => item.id);
                    var cardIds2 = response2.response.data.map(item => item.card_id);
                    var idsToKeep = ids1.filter(id => !cardIds2.includes(id));
                    var result = response1.response.data.filter(item => idsToKeep.includes(item.id));

                    // 对比结果输出结果到控制台
                    console.log(result);

                    // 遍历网页上的pic改红
                    result.forEach(function(item) {
                        var elements = document.querySelectorAll('img[src="' + item.pic + '"]');
                        elements.forEach(function(element) {
                            element.parentNode.style.backgroundColor = "red";
                        });
                    });
                }
            });
        }
    });
})();
