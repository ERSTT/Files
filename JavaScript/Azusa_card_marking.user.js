// ==UserScript==
// @name         Azusa 卡片标记
// @namespace    https://github.com/ERSTT
// @icon         https://azusa.wiki/favicon.ico
// @version      1.6
// @description  Azusa 卡片标记
// @author       ERST
// @match        https://azusa.wiki/*lottery*
// @match        https://zimiao.icu/*lottery*
// @grant        GM_xmlhttpRequest
// @updateURL    https://raw.githubusercontent.com/ERSTT/Files/refs/heads/main/JavaScript/Azusa_card_marking.user.js
// @downloadURL  https://raw.githubusercontent.com/ERSTT/Files/refs/heads/main/JavaScript/Azusa_card_marking.user.js
// @changelog    抽卡后自动更新新抽到的卡牌背景为绿
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
    var intervalId = null;  // 用于保存定时器的 ID

    // 初次获取数据并进行对比
    function fetchDataAndMark() {
        GM_xmlhttpRequest({
            method: "GET",
            url: url1,
            responseType: "json",
            onload: function(response1) {
                ownedCardIds = response1.response.data.map(item => item.card_id);

                Promise.all([fetchCards(url2, ownedCardIds), fetchCards(url3, ownedCardIds), fetchCards(url4, ownedCardIds)])
                    .then(results => {
                        combinedResult = results.flat();

                        // 开始定时渲染标记
                        startMarkingInterval(response1.response.data);
                    });
            }
        });
    }

    // 获取其他卡片数据并排除已拥有的卡片
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

    // 标记卡片
    function markCards(cards, color) {
        cards.forEach(function(item) {
            var elements = document.querySelectorAll('img[src="' + item.pic + '"]');
            elements.forEach(function(element) {
                element.parentNode.style.backgroundColor = color;
            });
        });
    }

    // 启动定时器定期标记卡片
    function startMarkingInterval(greenCards) {
        if (intervalId) {
            clearInterval(intervalId);  // 如果已有定时器，先清除
        }

        // 设置新的定时器来标记红绿卡片
        intervalId = setInterval(() => {
            markCards(combinedResult, "red");  // 只使用缓存数据
            markCards(greenCards, "green");   // 只使用缓存数据
        }, 500);
    }

    // 动态监听按钮点击事件
    document.addEventListener('click', function (event) {
        const target = event.target;

        // 检查按钮的 class 或其他属性
        if (target.closest('.el-button--danger.is-circle') && !target.id) {
            markGreenCards(); // 按钮触发后标记绿卡
        }
    });

    // 只访问标绿的URL并重新标绿
    function markGreenCards() {
        // 清除定时器，防止继续标红
        if (intervalId) {
            clearInterval(intervalId);
        }

        // 只访问标记为“绿”的 URL
        GM_xmlhttpRequest({
            method: "GET",
            url: url1,
            responseType: "json",
            onload: function(response1) {
                // 标记所有卡片为绿
                markCards(response1.response.data, "green");
            }
        });
    }

    // 初始化时获取数据并进行渲染
    fetchDataAndMark();
})();
