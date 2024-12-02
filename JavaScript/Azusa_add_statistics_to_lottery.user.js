// ==UserScript==
// @name         Azusa 抽卡界面添加统计
// @namespace    https://github.com/ERSTT
// @icon         https://azusa.wiki/favicon.ico
// @version      4.2
// @description  Azusa 抽卡界面添加统计
// @author       ERST
// @match        https://azusa.wiki/*lottery*lottery
// @match        https://zimiao.icu/*lottery*lottery
// @grant        GM_xmlhttpRequest
// @updateURL    https://raw.githubusercontent.com/ERSTT/Files/refs/heads/main/JavaScript/Azusa_add_statistics_to_lottery.user.js
// @downloadURL  https://raw.githubusercontent.com/ERSTT/Files/refs/heads/main/JavaScript/Azusa_add_statistics_to_lottery.user.js
// @require      https://cdn.jsdelivr.net/npm/chart.js
// @changelog    更新准确数据源，添加简洁/详细模式切换,适配新域名
// ==/UserScript==

(function () {
    'use strict';

    // 根据当前页面的域名动态设置统计 URL
    const statisticsUrl = window.location.host.includes('zimiao.icu')
        ? "https://zimiao.icu/lotterySettingSave.php?action=userLotteryStatistics"
        : "https://azusa.wiki/lotterySettingSave.php?action=userLotteryStatistics";

    let isDetailedMode = false; // 默认是简洁模式
    let stats = {}; // 全局存储 stats 数据

    new MutationObserver((_, me) => {
        const ruleHeader = Array.from(document.getElementsByTagName('h2')).find(el => el.innerText.includes('游戏规则'));
        if (ruleHeader) {
            me.disconnect();
            ruleHeader.innerText = "抽卡统计";
            const button = document.createElement('button');
            button.innerText = "详细模式";
            button.style.marginLeft = '10px';
            button.addEventListener('click', toggleMode);

            ruleHeader.appendChild(button);

            const ruleTable = ruleHeader.nextElementSibling;
            if (ruleTable?.tagName === 'TABLE') fetchData(ruleTable);
        }
    }).observe(document, { childList: true, subtree: true });

    function fetchData(ruleTable) {
        GM_xmlhttpRequest({
            method: "GET",
            url: statisticsUrl,
            responseType: "json",
            onload: response => {
                if (response.status === 200) {
                    const { data } = response.response;
                    stats = processStatsData(data); // 保存 stats 数据
                    updateStatsHtml(stats, ruleTable); // 更新 HTML
                } else console.error('Error fetching statistics:', response.status);
            },
            onerror: () => console.error('Statistics request failed')
        });
    }

    function processStatsData(data) {
        const unluckyCount = data["1"]?.[0] || 0; // 抛弃次数
        const characterCount = data["2"]?.[""] || 0; // 角色数量
        const inviteCount = data["3"]?.["1"] || 0; // 邀请卡数量
        const magicCards = data["4"] || {};
        const uploadCards = data["5"] || {};
        const rainbowCards = data["6"] || {};

        const magic1000 = magicCards["1000"] || 0;
        const magic5000 = magicCards["5000"] || 0;
        const magic10000 = magicCards["10000"] || 0;
        const upload1G = uploadCards["1"] || 0;
        const upload2G = uploadCards["2"] || 0;
        const upload3G = uploadCards["3"] || 0;
        const upload10G = uploadCards["10"] || 0;
        const rainbow7days = rainbowCards["7"] || 0;

        const totalLotteryCount = unluckyCount + characterCount + magic1000 + magic5000 + magic10000 + upload1G + upload2G + upload3G + upload10G + rainbow7days;
        const rewardCount = totalLotteryCount - unluckyCount;

        return {
            totalLotteryCount,
            rewardCount,
            unluckyCount,
            characterCount,
            inviteCount,
            magic1000,
            magic5000,
            magic10000,
            upload1G,
            upload2G,
            upload3G,
            upload10G,
            rainbow7days
        };
    }

    function updateStatsHtml(stats, ruleTable) {
        const { totalLotteryCount, rewardCount, unluckyCount, characterCount, inviteCount, magic1000, magic5000, magic10000, upload1G, upload2G, upload3G, upload10G, rainbow7days } = stats;

        // 简洁模式 HTML
        const simpleHtml = `
            <tbody>
                <tr>
                    <td align="center" class="text">
                        <div class="px-10" style="display: flex; align-items: flex-start;">
                            <div style="flex: 1; padding-right: 20px;">
                                <p class="content">总抽卡次数: ${totalLotteryCount} 次</p>
                                <p class="content">抽到奖励次数: ${rewardCount} 次</p>
                                <p class="content">梓喵娘抛弃次数: ${unluckyCount} 次</p>
                                <p class="content">角色数量: ${characterCount} 个（抽到概率为 ${(characterCount / totalLotteryCount * 100).toFixed(2)}% ）</p>
                                <p class="content">1000 魔力卡: ${magic1000} 次</p>
                                <p class="content">5000 魔力卡: ${magic5000} 次</p>
                                <p class="content">10000 魔力卡: ${magic10000} 次</p>
                                <p class="content">1G 上传卡: ${upload1G} 次</p>
                                <p class="content">2G 上传卡: ${upload2G} 次</p>
                                <p class="content">3G 上传卡: ${upload3G} 次</p>
                                <p class="content">彩虹ID 7天卡: ${rainbow7days} 张</p>
                            </div>
                            <div style="flex: 0 0 auto; width: 470px; height: 470px;">
                                <canvas id="lotteryChart" width="470" height="470"></canvas>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        `;

        // 详细模式 HTML
        const detailedHtml = `
            <tbody>
                <tr>
                    <td align="center" class="text">
                        <div class="px-10" style="display: flex; align-items: flex-start;">
                            <div style="flex: 1; padding-right: 20px;">
                                <p class="content">总抽卡次数: ${totalLotteryCount} 次（消耗了 ${totalLotteryCount * 5000} 魔力）</p>
                                <p class="content">抽到奖励次数: ${rewardCount} 次（消耗了 ${rewardCount * 5000} 魔力）</p>
                                <p class="content">梓喵娘抛弃次数: ${unluckyCount} 次（消耗了 ${unluckyCount * 5000} 魔力）</p>
                                <p class="content">角色数量: ${characterCount} 个（抽到角色概率为 ${(characterCount / totalLotteryCount * 100).toFixed(2)}% ）</p>
                                <p class="content">1000 魔力卡: ${magic1000} 次（获得了 ${magic1000 * 1000} 魔力）</p>
                                <p class="content">5000 魔力卡: ${magic5000} 次（获得了 ${magic5000 * 5000} 魔力）</p>
                                <p class="content">10000 魔力卡: ${magic10000} 次（获得了 ${magic10000 * 10000} 魔力）</p>
                                <p class="content">1G 上传卡: ${upload1G} 次（获得了 ${upload1G * 1} G 上传）</p>
                                <p class="content">2G 上传卡: ${upload2G} 次（获得了 ${upload2G * 2} G 上传）</p>
                                <p class="content">3G 上传卡: ${upload3G} 次（获得了 ${upload3G * 3} G 上传）</p>
                                <p class="content">10G 上传卡: ${upload10G} 次（获得了 ${upload10G * 10} G 上传）</p>
                                <p class="content">彩虹ID 7天卡: ${rainbow7days} 张（获得了 ${rainbow7days * 7} 天 彩虹ID）</p>
                                <p class="content">邀请卡: ${inviteCount} 张（获得了 ${inviteCount} 个 邀请）</p>
                            </div>
                            <div style="flex: 0 0 auto; width: 550px; height: 550px;">
                                <canvas id="lotteryChart" width="550" height="550"></canvas>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        `;

        // 切换显示内容
        ruleTable.innerHTML = isDetailedMode ? detailedHtml : simpleHtml;

       initializeChart(stats)

    }

    let currentChart = null;

    function initializeChart(stats) {
        const { unluckyCount, characterCount, magic1000, magic5000, magic10000, upload1G, upload2G, upload3G, upload10G, rainbow7days } = stats;

        const ctx = document.getElementById('lotteryChart').getContext('2d');

        if (currentChart) {
            currentChart.destroy();  // 销毁现有图表
        }

        currentChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['角色', '1000 魔力卡', '5000 魔力卡', '10000 魔力卡', '1G 上传卡', '2G 上传卡', '3G 上传卡', '10G 上传卡', '7天彩虹ID', '抛弃次数'],
                datasets: [{
                    label: '抽到次数',
                    data: [
                        characterCount,
                        magic1000,
                        magic5000,
                        magic10000,
                        upload1G,
                        upload2G,
                        upload3G,
                        upload10G,
                        rainbow7days,
                        unluckyCount,
                    ],
                    backgroundColor: ['#FF6384', '#36A2EB', '#4BC0C0', '#9966FF', '#FF9F40', '#FF1493', '#7FFF00', '#8A2BE2', '#FFCE56', '#000000'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: '抽卡统计/次' }
                }
            }
        });
    }

    function toggleMode(event) {
        isDetailedMode = !isDetailedMode;
        const button = event.target;
        button.innerText = isDetailedMode ? "简洁模式" : "详细模式";
        const ruleTable = button.closest('h2').nextElementSibling;
        updateStatsHtml(stats, ruleTable);
    }

})();
