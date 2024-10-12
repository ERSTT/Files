// ==UserScript==
// @name         Azusa 抽卡界面添加统计
// @namespace    https://github.com/ERSTT
// @icon         https://azusa.wiki/favicon.ico
// @version      3.2
// @description  Azusa 抽卡界面添加统计
// @author       ERST
// @match        https://azusa.wiki/*lottery*lottery
// @match        https://zimiao.icu/*lottery*lottery
// @grant        GM_xmlhttpRequest
// @updateURL    https://raw.githubusercontent.com/ERSTT/Files/refs/heads/main/JavaScript/Azusa_add_statistics_to_lottery.user.js
// @downloadURL  https://raw.githubusercontent.com/ERSTT/Files/refs/heads/main/JavaScript/Azusa_add_statistics_to_lottery.user.js
// @require      https://cdn.jsdelivr.net/npm/chart.js
// @changelog    调整概率计算和修改部分描述
// ==/UserScript==

(function () {
    'use strict';

    const characterCardsUrl = "https://azusa.wiki/lotterySettingSave.php?action=userCharacterCards";
    const lotteryInfoUrl = "https://azusa.wiki/lotterySettingSave.php?action=userLotteryInfo";

    new MutationObserver((_, me) => {
        const ruleHeader = Array.from(document.getElementsByTagName('h2')).find(el => el.innerText.includes('游戏规则'));
        if (ruleHeader) {
            me.disconnect();
            ruleHeader.innerText = "抽卡统计 (含大部分未中奖次数)";
            const ruleTable = ruleHeader.nextElementSibling;
            if (ruleTable?.tagName === 'TABLE') fetchData(ruleTable);
        }
    }).observe(document, { childList: true, subtree: true });

    function fetchData(ruleTable) {
        GM_xmlhttpRequest({
            method: "GET",
            url: characterCardsUrl,
            responseType: "json",
            onload: response => {
                if (response.status === 200) {
                    const processedItems = processData(response.response.data);
                    const totalValue = processedItems.reduce((sum, { value }) => sum + value, 0);
                    fetchLotteryInfo(totalValue, ruleTable);
                } else console.error('Error fetching character cards:', response.status);
            },
            onerror: () => console.error('Character cards request failed')
        });
    }

    function processData(items) {
        return items.filter(item => item.from_type === 2).map(item => {
            item.value = (item.level === 5) ? (new Date(item.created_at) < new Date('2023-07-30') ? 400 : 500) : 200;
            return item;
        });
    }

    function fetchLotteryInfo(currentTotal, ruleTable) {
        GM_xmlhttpRequest({
            method: "GET",
            url: lotteryInfoUrl,
            responseType: "json",
            onload: response => {
                if (response.status === 200) {
                    const lotteryPoint = parseInt(response.response.data.lottery_point) || 0;
                    updateStats(currentTotal + lotteryPoint, ruleTable);
                } else console.error('Error fetching lottery info:', response.status);
            },
            onerror: () => console.error('Lottery info request failed')
        });
    }

    function updateStats(minDrawCount, ruleTable) {
        let drawCount = 0;  // 初始化抽到奖励次数的变量
        let characterCount = 0;  // 初始化角色计数变量
        let item_map = {};  // 初始化物品映射

        const xhr = new XMLHttpRequest();
        xhr.open("GET", 'https://azusa.wiki/lotterySettingSave.php?action=userLotteryLogs&size=99999999999&page=1', true);
        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                const { logs } = JSON.parse(this.responseText)['data'];
                characterCount = logs.reduce((count, log) => {
                    item_map[log.card_id] = (item_map[log.card_id] || 0) + 1;
                    return count + (log.type === 2 ? 1 : 0);
                }, 0);
                drawCount = logs.length; // 更新抽到奖励次数
                updateStatsHtml(minDrawCount, drawCount, characterCount, item_map, ruleTable);
            }
        };
        xhr.send();
    }

    function updateStatsHtml(minDrawCount, drawCount, characterCount, item_map, ruleTable) {
        ruleTable.innerHTML = `
            <tbody>
                <tr>
                    <td align="center" class="text">
                        <div class="px-10" style="display: flex; align-items: flex-start;">
                            <div style="flex: 1; padding-right: 20px;">
                                <label><input type="checkbox" id="checkbox400"> 购买过400点彩虹ID</label>
                                <label><input type="checkbox" id="checkbox1000"> 购买过1000点彩虹ID</label><br>
                                <p class="content" id="minDrawCountDisplay">至少抽卡次数: ${minDrawCount || 0} 次（消耗 ${minDrawCount * 5000 || 0} 魔力）</p>
                                <p class="content">抽到奖励次数: ${drawCount || 0} 次（消耗 ${drawCount * 5000 || 0} 魔力）</p>
                                <p class="content" id="unluckyCountDisplay">梓喵娘抛弃次数: ${Math.max(0, (minDrawCount - drawCount))} 次（消耗 ${Math.max(0, (minDrawCount - drawCount)) * 5000 || 0} 魔力）</p>
                                <p class="content" id="WinningProbability">角色: ${characterCount || 0} 个（抽到概率为 ${(characterCount / minDrawCount * 100).toFixed(2) || 0}% ）</p>
                                <p class="content">彩虹ID 7天卡: ${item_map[28] || 0} 次（${item_map[28] * 7 || 0} 天）</p>
                                <p class="content">1G 上传卡: ${item_map[31] || 0} 次（${item_map[31] * 1 || 0} G）</p>
                                <p class="content">2G 上传卡: ${item_map[4] || 0} 次（${item_map[4] * 2 || 0} G）</p>
                                <p class="content">3G 上传卡: ${item_map[32] || 0} 次（${item_map[32] * 3 || 0} G）</p>
                                <p class="content">1000 魔力卡: ${item_map[2] || 0} 次（${item_map[2] * 1000 || 0} 魔力）</p>
                                <p class="content">5000 魔力卡: ${item_map[29] || 0} 次（${item_map[29] * 5000 || 0} 魔力）</p>
                                <p class="content">10000 魔力卡: ${item_map[30] || 0} 次（${item_map[30] * 10000 || 0} 魔力）</p>
                                <p class="content">邀请卡: ${item_map[1] || 0} 个</p>
                            </div>
                            <div style="flex: 0 0 auto; width: 400px; height: 400px;">
                                <canvas id="lotteryChart" width="400" height="400"></canvas>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        `;

        // 绑定复选框事件
        bindCheckboxEvents(ruleTable, minDrawCount, drawCount, characterCount, item_map);

        // 初始化图表
        initializeChart(minDrawCount, drawCount, item_map);
    }

    function bindCheckboxEvents(ruleTable, initialMinDrawCount, initialDrawCount, characterCount, item_map) {
        let updatedMinDrawCount = initialMinDrawCount; // 使用初始的最小抽卡次数
        let drawCount = initialDrawCount; // 使用初始的抽到奖励次数

        document.getElementById('checkbox400').addEventListener('change', function () {
            if (this.checked) {
                updatedMinDrawCount += 400;  // 增加 400
            } else {
                updatedMinDrawCount -= 400;  // 减少 400
            }
            updateMinDrawCountDisplay(updatedMinDrawCount, drawCount, characterCount, ruleTable, item_map);
        });

        document.getElementById('checkbox1000').addEventListener('change', function () {
            if (this.checked) {
                updatedMinDrawCount += 1000; // 增加 1000
            } else {
                updatedMinDrawCount -= 1000; // 减少 1000
            }
            updateMinDrawCountDisplay(updatedMinDrawCount, drawCount, characterCount, ruleTable, item_map);
        });
    }

    function updateMinDrawCountDisplay(minDrawCount, drawCount, characterCount, ruleTable, item_map) {
        const unluckyCount = Math.max(0, (minDrawCount - drawCount)); // 计算未中奖次数
        const WinningProbability = Math.max(0, (characterCount / minDrawCount)); // 用角色数除以至少抽卡次数计算概率

        ruleTable.querySelector('#minDrawCountDisplay').innerText = `至少抽卡次数: ${minDrawCount || 0} 次（消耗 ${minDrawCount * 5000 || 0} 魔力）`;
        ruleTable.querySelector('#unluckyCountDisplay').innerText = `梓喵娘抛弃次数: ${unluckyCount} 次（消耗 ${unluckyCount * 5000 || 0} 魔力）`;
        ruleTable.querySelector('#WinningProbability').innerText = `角色: ${characterCount || 0} 个（抽到概率为 ${(WinningProbability * 100).toFixed(2) || 0}% ）`;

        // 更新图表
        initializeChart(minDrawCount, drawCount, item_map); // 只传入最新的参数
    }

    let currentChart; // 存储当前图表的引用

    function initializeChart(minDrawCount, drawCount, item_map) {
        const unluckyCount = Math.max(0, (minDrawCount - drawCount)); // 计算未中奖次数
        const ctx = document.getElementById('lotteryChart').getContext('2d');

        // 如果当前图表存在，销毁它
        if (currentChart) {
            currentChart.destroy();
        }

        // 创建新的图表
        currentChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['角色', '彩虹ID 7天卡', '1000 魔力卡', '5000 魔力卡', '10000 魔力卡', '1G 上传卡', '2G 上传卡', '3G 上传卡', '梓喵娘抛弃次数'],
                datasets: [{
                    label: '抽卡统计/次',
                    data: [
                        item_map[32] || 0, // 角色
                        item_map[28] || 0, // 彩虹ID 7天卡
                        item_map[2] || 0,  // 1000 魔力卡
                        item_map[29] || 0, // 5000 魔力卡
                        item_map[30] || 0, // 10000 魔力卡
                        item_map[31] || 0, // 1G 上传卡
                        item_map[4] || 0,  // 2G 上传卡
                        item_map[32] || 0, // 3G 上传卡
                        unluckyCount // 添加未中奖次数
                    ],
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF1493', '#7FFF00', '#000000'], // 将未中奖设置为黑色
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: '抽卡统计' }
                }
            }
        });
    }
})();
