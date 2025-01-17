// ==UserScript==
// @name         Azusa 卡片标记未拥有
// @namespace    https://github.com/ERSTT
// @icon         https://azusa.wiki/favicon.ico
// @version      3.1
// @description  Azusa 卡片标记未拥有
// @author       ERST
// @match        https://azusa.wiki/*lottery.php*action=lottery*
// @match        https://zimiao.icu/*lottery.php*action=lottery*
// @grant        GM_xmlhttpRequest
// @updateURL    https://raw.githubusercontent.com/ERSTT/Files/refs/heads/main/JavaScript/Azusa_card_marking_not_owned.user.js
// @downloadURL  https://raw.githubusercontent.com/ERSTT/Files/refs/heads/main/JavaScript/Azusa_card_marking_not_owned.user.js
// @changelog    解决已知问题,适配新安全参数
// ==/UserScript==

(function() {
    'use strict';

    // 获取当前页面的域名
    var currentDomain = window.location.hostname;

    // 获取URL中的csrf_token参数
    var urlParams = new URLSearchParams(window.location.search);
    var csrfToken = urlParams.get('csrf_token');

    // 动态构建 URL
    var url1 = `https://${currentDomain}/lotterySettingSave.php?csrf_token=${csrfToken}&action=userCharacterCards`;
    var url2 = `https://${currentDomain}/lotterySettingSave.php?csrf_token=${csrfToken}&action=specialExchangeCharacterCardsPool`;
    var url3 = `https://${currentDomain}/lotterySettingSave.php?csrf_token=${csrfToken}&action=exchangeCharacterCardsPool`;
    var url4 = `https://${currentDomain}/lotterySettingSave.php?csrf_token=${csrfToken}&action=lotteryCharacterCardsPool`;

    var combinedResult = [];
    var ownedCardIds = [];

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

                        // 定期渲染标记
                        setInterval(() => {
                            markCards(combinedResult);  // 只使用缓存数据
                            markCards(response1.response.data); // 只使用缓存数据
                        }, 500);
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
    function markCards(cards) {
        cards.forEach(function(item) {
            var elements = document.querySelectorAll('img[src="' + item.pic + '"]');
            elements.forEach(function(element) {
                var elImage = element.closest('.el-image'); // 获取 el-image 容器
                var elImageParent = elImage ? elImage.parentNode : null; // 获取 .el-image 的父级节点

                // 检查父级是否是 .card_body
                if (elImageParent && elImageParent.classList.contains('card_body')) {
                    // 检查是否已经有标记的 span，避免重复添加
                    if (!elImageParent.querySelector('.remove-to-hide-tag-for-erst-script')) {
                        // 创建新的 span 元素
                        var span = document.createElement('span');
                        span.className = "remove-to-hide-tag-for-erst-script el-tag el-tag--danger el-tag--small el-tag--light";
                        span.style.cssText = "position: absolute; top: 10px; right: 10px; z-index: 10;";
                        span.textContent = "未拥有";

                        // 将 span 插入到 .el-image 的父级节点
                        elImageParent.style.position = 'relative'; // 确保父级有相对定位
                        elImageParent.appendChild(span); // 插入 span
                    }
                }
            });
        });
    }

    // 动态监听按钮点击事件
    document.addEventListener('click', function (event) {
        const target = event.target;

        // 检查是否点击了特定的 class 和不包含 id
        if ((target.closest('.el-button--danger.is-circle') || target.closest('.exchange_btn .el-button')) && !target.id) {
            // 在这里避免多次调用 refreshData()，比如加入防抖等机制
            refreshData();
        }
    });

    // 刷新数据并重新标记
    function refreshData() {
        // 清除之前添加的标记
        removePreviousMarks();

        // 重新调用 fetchDataAndMark() 更新缓存数据和重新标记
        fetchDataAndMark();
    }

    // 移除已存在的标记
    function removePreviousMarks() {
        const markedCards = document.querySelectorAll('.remove-to-hide-tag-for-erst-script.el-tag.el-tag--danger.el-tag--small.el-tag--light');
        markedCards.forEach(function(mark) {
            mark.remove(); // 移除符合条件的标记
        });
    }

    // 初始化时获取数据并进行渲染
    fetchDataAndMark();
})();
