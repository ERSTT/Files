// ==UserScript==
// @name         Azusa 卡片标记未拥有
// @namespace    https://github.com/ERSTT
// @icon         https://azusa.wiki/favicon.ico
// @version      3.0
// @description  Azusa 卡片标记未拥有
// @author       ERST
// @match        https://azusa.wiki/*lottery.php*action=lottery*
// @match        https://zimiao.icu/*lottery.php*action=lottery*
// @grant        GM_xmlhttpRequest
// @updateURL    https://raw.githubusercontent.com/ERSTT/Files/refs/heads/main/JavaScript/Azusa_card_marking_not_owned.user.js
// @downloadURL  https://raw.githubusercontent.com/ERSTT/Files/refs/heads/main/JavaScript/Azusa_card_marking_not_owned.user.js
// @changelog    初始发布
// ==/UserScript==

(function() {
    'use strict';

    var currentDomain = window.location.hostname;
    var urlParams = new URLSearchParams(window.location.search);
    var csrfToken = urlParams.get('csrf_token');

    var url1 = `https://${currentDomain}/lotterySettingSave.php?csrf_token=${csrfToken}&action=userCharacterCards`;
    var url2 = `https://${currentDomain}/lotterySettingSave.php?csrf_token=${csrfToken}&action=specialExchangeCharacterCardsPool`;
    var url3 = `https://${currentDomain}/lotterySettingSave.php?csrf_token=${csrfToken}&action=exchangeCharacterCardsPool`;
    var url4 = `https://${currentDomain}/lotterySettingSave.php?csrf_token=${csrfToken}&action=lotteryCharacterCardsPool`;

    var combinedResult = [];
    var ownedCardIds = [];

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

                        setInterval(() => {
                            markCards(combinedResult, "red");
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

    function markCards(cards) {
        cards.forEach(function(item) {
            var elements = document.querySelectorAll('img[src="' + item.pic + '"]');
            elements.forEach(function(element) {
                var elImage = element.closest('.el-image');

                if (elImage) {
                    if (!elImage.parentNode.querySelector('.remove-to-hide-tag-for-erst-script')) {
                        var span = document.createElement('span');
                        span.className = "remove-to-hide-tag-for-erst-script el-tag el-tag--danger el-tag--small el-tag--light";
                        span.style.cssText = "position: absolute; top: 10px; right: 10px; z-index: 10;";
                        span.textContent = "未拥有";

                        elImage.parentNode.insertBefore(span, elImage);
                    }
                }
            });
        });
    }

    document.addEventListener('click', function (event) {
        const target = event.target;

        if (target.closest('.el-button--danger.is-circle') && !target.id) {
            refreshData();
        }

        if (target.closest('.exchange_btn .el-button') && !target.id) {
            refreshData();
        }
    });

    function refreshData() {
        fetchDataAndMark();
    }

    fetchDataAndMark();
})();
