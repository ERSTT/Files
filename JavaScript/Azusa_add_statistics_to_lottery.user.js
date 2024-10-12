// ==UserScript==
// @name         Azusa 抽卡界面添加统计
// @namespace    https://github.com/ERSTT
// @icon         https://azusa.wiki/favicon.ico
// @version      1.9
// @description  Azusa 抽卡界面添加统计
// @author       ERST
// @match        https://azusa.wiki/*lottery*lottery
// @match        https://zimiao.icu/*lottery*lottery
// @grant        none
// @updateURL    https://raw.githubusercontent.com/ERSTT/Files/refs/heads/main/JavaScript/Azusa_add_statistics_to_lottery.user.js
// @downloadURL  https://raw.githubusercontent.com/ERSTT/Files/refs/heads/main/JavaScript/Azusa_add_statistics_to_lottery.user.js
// @require      https://cdn.jsdelivr.net/npm/chart.js
// @changelog    添加部分描述
// ==/UserScript==

(function() {
    'use strict';

    const observer = new MutationObserver(function(mutations, me) {
        const ruleHeader = Array.from(document.getElementsByTagName('h2')).find(el => el.innerText.includes('游戏规则'));

        if (ruleHeader) {
            me.disconnect();
            ruleHeader.innerText = "抽卡统计 (不含未中奖次数)";

            const ruleTable = ruleHeader ? ruleHeader.nextElementSibling : null;
            if (ruleTable && ruleTable.tagName === 'TABLE') {
                let xhr = new XMLHttpRequest();
                let url = 'https://azusa.wiki/lotterySettingSave.php?action=userLotteryLogs&size=99999999999&page=1';

                xhr.open("GET", url, true);
                xhr.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200) {
                        let data = JSON.parse(this.responseText)['data'];
                        let item_map = {};
                        let character = 0;
                        let cnum = 0;

                        for (let aa in data['logs']) {
                            let log = data['logs'][aa];
                            cnum++;
                            item_map[log['card_id']] = (item_map[log['card_id']] || 0) + 1;
                            if (log['type'] === 2) {
                                character++;
                            }
                        }

                        let statsHtml = `
                            <tbody>
                                <tr>
                                    <td align="center" class="text">
                                        <div class="px-10" style="display: flex; align-items: flex-start;">
                                            <div style="flex: 1; padding-right: 20px;">
                                                <p class="content">抽到奖励次数: ${cnum || 0} 次（消耗 ${cnum * 5000 || 0} 魔力）</p>
                                                <p class="content">抽到角色: ${character || 0} 个（抽到概率为 ${(character / cnum * 100).toFixed(2) || 0}% ）</p>
                                                <p class="content">邀请卡: ${item_map[1] || 0} 个</p>
                                                <p class="content">彩虹ID 7天卡: ${item_map[28] || 0} 次（${item_map[28] * 7 || 0} 天）</p>
                                                <p class="content">1G 上传卡: ${item_map[31] || 0} 次（${item_map[31] * 1 || 0} G）</p>
                                                <p class="content">2G 上传卡: ${item_map[4] || 0} 次（${item_map[4] * 2 || 0} G）</p>
                                                <p class="content">3G 上传卡: ${item_map[32] || 0} 次（${item_map[32] * 3 || 0} G）</p>
                                                <p class="content">1000 魔力卡: ${item_map[2] || 0} 次（${item_map[2] * 1000 || 0} 魔力）</p>
                                                <p class="content">5000 魔力卡: ${item_map[29] || 0} 次（${item_map[29] * 5000 || 0} 魔力）</p>
                                                <p class="content">10000 魔力卡: ${item_map[30] || 0} 次（${item_map[30] * 10000 || 0} 魔力）</p>
                                            </div>
                                            <div style="flex: 0 0 auto; width: 400px; height: 400px;">
                                                <canvas id="lotteryChart" width="400" height="400"></canvas>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        `;

                        ruleTable.innerHTML = statsHtml;

                        const ctx = document.getElementById('lotteryChart').getContext('2d');
                        const chartData = {
                            labels: [
                                '邀请卡',
                                '彩虹ID7天卡',
                                '1000 魔力卡',
                                '5000 魔力卡',
                                '10000 魔力卡',
                                '1G 上传卡',
                                '2G 上传卡',
                                '3G 上传卡'
                            ],
                            datasets: [{
                                label: '抽卡统计/次',
                                data: [
                                    item_map[1] || 0,
                                    item_map[28] || 0,
                                    item_map[2] || 0,
                                    item_map[29] || 0,
                                    item_map[30] || 0,
                                    item_map[31] || 0,
                                    item_map[4] || 0,
                                    item_map[32] || 0
                                ],
                                backgroundColor: [
                                    '#FF6384',
                                    '#36A2EB',
                                    '#FFCE56',
                                    '#4BC0C0',
                                    '#9966FF',
                                    '#FF9F40',
                                    '#FF5733',
                                    '#33FF57'
                                ],
                                hoverOffset: 4
                            }]
                        };

                        const lotteryChart = new Chart(ctx, {
                            type: 'pie',
                            data: chartData,
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                    },
                                    title: {
                                        display: true,
                                        text: '抽卡统计'
                                    }
                                }
                            }
                        });
                    }
                };
                xhr.send();
            } else {
                console.log("未找到游戏规则的表格部分");
            }
        }
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });
})();
