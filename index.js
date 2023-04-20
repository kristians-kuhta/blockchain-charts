const { Alchemy, Network } = require('alchemy-sdk');
const Chart = require('chart.js/auto');

function main() {
  const alchemyKey = new URLSearchParams(window.location.search).get('alchemyKey');
  if (!alchemyKey) {
    alert('Please, specify alchemyKey in URL params');
    return;
  }

  const settings = {
    apiKey: alchemyKey,
    network: Network.ETH_MAINNET,
  };

  window.alchemy = new Alchemy(settings);

  initializeChartState();
  window.alchemy.ws.on('block', updateFirstChart);

  drawCharts();
}

main();

function initializeChartState() {
  window.charts = [
    {
      // LINK token address
      address: '0x514910771af9ca656af840dff83e8264ecf986ca',
      // NOTE: this is the Transfer event signature
      topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
      chart: null
    }
  ]
}

async function updateFirstChart(blockNumber) {
  const { address, topics } = window.charts[0];

  const logs = await window.alchemy.core.getLogs({
    fromBlock: blockNumber,
    toBlock: blockNumber,
    topics
  });

  window.charts[0].chart.data.labels.push(blockNumber);
  window.charts[0].chart.data.datasets.forEach(dataset => {
    dataset.data.push(logs.length);
  });

  window.charts[0].chart.update();
}


function initializeBarChart(chartIndex, canvas, label, labels, data) {
  window.charts[chartIndex].chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label, data, borderWidth: 1 }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function drawFirstChart() {
  const canvas = document.getElementById('erc20-transfers-chart');

  const { labels, data } = window.charts[0];

  initializeBarChart(0, canvas, 'LINK token transfers', labels, data);
}


function drawCharts() {
  drawFirstChart();
  // buildChart2();
  // buildChart3();
}

